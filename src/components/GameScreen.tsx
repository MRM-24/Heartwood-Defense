import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { BACK_PRIORITY, useBackHandler } from '../game/backstack';
import { createGame, placeFlora, shovelAt, stepGame, type PlaceResult } from '../game/engine';
import { ENEMIES, FLORA } from '../game/data';
import { haptic } from '../game/uiSound';
import { setSfxMuted, sfxEvent } from '../game/sfx';
import { starsForLevel, TICK, type FloraKey, type GameState, type LevelDef } from '../game/types';
import Board from './Board';
import Hud, { BossBar } from './Hud';
import { GuideModal, LoseOverlay, PauseOverlay, WinOverlay } from './Screens';
import { IDLE_FIT, STAGE_GAP, fitStage, sameFit, type StageFit } from '../utils/stageFit';
import type { EnemyKey } from '../game/types';

/** Portrait phones/tablets: stacked HUD — status strip above, seed tray below. */
const COMPACT = '(max-width: 899px)';
/**
 * Landscape phones (and very short windows): side-rail HUD. Checked *before*
 * COMPACT because a landscape phone is wider than 899 CSS px more often than
 * not — width alone can't tell it apart from a desktop, height can.
 */
const LANDSCAPE = '(orientation: landscape) and (max-height: 520px)';

/** How the HUD is arranged around the board for the current viewport. */
type LayoutMode = 'desktop' | 'stacked' | 'landscape';

/**
 * Every layout lives inside this inset: the notch, the home indicator and the
 * rounded corners keep whatever margin they ask for, and no margin at all is
 * wasted on a plain desktop window (skill §5 safe-area-awareness).
 */
const SAFE_INSET = {
  paddingTop: 'max(6px, var(--safe-top))',
  paddingRight: 'max(6px, var(--safe-right))',
  paddingBottom: 'max(6px, var(--safe-bottom))',
  paddingLeft: 'max(6px, var(--safe-left))',
} as const;

/**
 * The page behind the stage. It is the same gradient the board frame opens
 * with, so where the two meet — a rounded corner, a sub-pixel seam after a
 * resize — the join is invisible instead of reading as a black edge.
 */
const VALE_BG = 'radial-gradient(120% 90% at 50% 0%, #16281a 0%, #0c1710 45%, #070d09 100%)';

function layoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'desktop';
  try {
    if (window.matchMedia(LANDSCAPE).matches) return 'landscape';
    return window.matchMedia(COMPACT).matches ? 'stacked' : 'desktop';
  } catch {
    return 'desktop';
  }
}

interface Props {
  level: LevelDef;
  loadout: FloraKey[];
  muted: boolean;
  /** Field Guide entries the player has catalogued — the rest render as silhouettes. */
  guideFlora: Set<FloraKey>;
  guideEnemies: Set<EnemyKey>;
  onMute: () => void;
  onWin: (snaresLeft: number) => void;
  onExit: () => void;
  onNext: (() => void) | null;
}

/** Keeps the screen awake while a battle is running (no-op where unsupported). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
    if (!nav.wakeLock) return;
    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;
    const grab = async () => {
      try {
        const s = await nav.wakeLock!.request('screen');
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {
        /* user moved away, battery saver, unsupported — fine */
      }
    };
    const onVis = () => {
      if (!document.hidden && !sentinel) void grab();
    };
    void grab();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}

export default function GameScreen({ level, loadout, muted, guideFlora, guideEnemies, onMute, onWin, onExit, onNext }: Props) {
  const [attempt, setAttempt] = useState(0);
  const gs = useMemo<GameState>(() => createGame(level, loadout), [level, loadout, attempt]);
  const gsRef = useRef(gs);
  gsRef.current = gs;

  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [guide, setGuide] = useState(false);
  const [speed, setSpeed] = useState(1);
  /**
   * How the stage covers the room it is given: one uniform scale, the frame
   * size that scale implies, and the forest margin that keeps the frame the
   * same aspect as the viewport (see utils/stageFit).
   */
  const [fit, setFit] = useState<StageFit>(IDLE_FIT);
  const [mode, setMode] = useState<LayoutMode>(() => layoutMode());
  const reported = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const guideRef = useRef(guide);
  guideRef.current = guide;
  /** The box the stage has to cover — the viewport, minus safe areas and HUD. */
  const areaRef = useRef<HTMLDivElement>(null);
  /** Desktop only: the HUD row that shares the stage's single transform. */
  const hudRef = useRef<HTMLDivElement>(null);
  const resolved = gs.status !== 'playing';

  useEffect(() => {
    setSfxMuted(muted);
  }, [muted]);

  // Watch both breakpoints so rotating a phone (or dragging a window across
  // the desktop threshold) re-arranges the HUD live.
  useEffect(() => {
    const queries = [LANDSCAPE, COMPACT].map((q) => window.matchMedia(q));
    const on = () => setMode(layoutMode());
    queries.forEach((mq) => mq.addEventListener('change', on));
    return () => queries.forEach((mq) => mq.removeEventListener('change', on));
  }, []);

  /**
   * Fit the stage to whatever room the layout gives it — measured, never
   * guessed, and re-measured on every resize, rotation or HUD change (a boss
   * banner landing in the portrait status strip costs the board height, so the
   * board hears about it).
   */
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      // clientWidth/Height: the content box, i.e. the room inside the safe
      // areas. Deliberately not the scaled stage's own size — measuring the
      // thing we resize would be a feedback loop.
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 8 || h < 8) return;
      // Desktop scales HUD + field as one stage, so the HUD's height is part of
      // the budget. On phones the HUD sits outside the transform and the board
      // gets its whole box.
      const chrome = mode === 'desktop' ? (hudRef.current?.offsetHeight ?? 0) + STAGE_GAP : 0;
      const next = fitStage(w, h, chrome);
      setFit((prev) => (sameFit(prev, next) ? prev : next));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (hudRef.current) ro.observe(hudRef.current);
    measure();
    return () => ro.disconnect();
  }, [mode]);

  // win reporting (once)
  useEffect(() => {
    if (gs.status === 'won' && !reported.current) {
      reported.current = true;
      onWin(gs.snares.filter(Boolean).length);
    }
  }, [gs.status, gs.snares, onWin]);

  // main loop — fixed-tick accumulator, interpolated rendering
  const accRef = useRef(0);
  const alphaRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const s = gsRef.current;
      if (!pausedRef.current && s.status === 'playing') {
        accRef.current += dt * speedRef.current;
        let guard = 0;
        while (accRef.current >= TICK && guard++ < 8) {
          accRef.current -= TICK;
          stepGame(s);
        }
      }
      for (const ev of s.events) sfxEvent(ev);
      s.events.length = 0;
      alphaRef.current = Math.min(1, accRef.current / TICK);
      setFrame((f) => f + 1);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gs]);

  // auto-pause when the app is backgrounded / the phone is locked
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useWakeLock(!paused && gs.status === 'playing');

  const cancelArmed = useCallback(() => {
    const s = gsRef.current;
    s.selected = null;
    s.shovelArmed = false;
  }, []);

  /** Restart the current level from the pause / result screens. */
  const restart = useCallback(() => {
    setPaused(false);
    setAttempt((a) => a + 1);
    reported.current = false;
  }, []);

  // ── keyboard ──────────────────────────────────────────────────────────────
  // Escape is handled by the app-wide back stack (pause menu, then the game
  // screen's exit route), so this listener only owns the play-field shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (guideRef.current) return;
      const s = gsRef.current;
      const k = e.key.toLowerCase();
      const playing = s.status === 'playing' && !pausedRef.current;
      if (k >= '1' && k <= '6') {
        const key = s.loadout[Number(k) - 1];
        if (key && playing) {
          s.selected = s.selected === key ? null : key;
          s.shovelArmed = false;
        }
      } else if (k === 'x') {
        if (playing) {
          s.shovelArmed = !s.shovelArmed;
          s.selected = null;
        }
      } else if (k === 'f') {
        setSpeed((v) => (v === 1 ? 2 : 1));
      } else if (k === 'r') {
        if (e.metaKey || e.ctrlKey) return; // don't eat browser reload
        restart();
      } else if (k === 'm') {
        onMute();
      } else if (k === 'g') {
        setGuide((g) => !g);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onMute, restart]);

  /**
   * Back / Escape inside a battle: drop an armed Flora or shovel first, then
   * pause. It deliberately never abandons the level — leaving is an explicit
   * choice on the pause menu, so a stray back press can't cost a run.
   */
  const onBack = useCallback(() => {
    const s = gsRef.current;
    if (s.selected !== null || s.shovelArmed) {
      s.selected = null;
      s.shovelArmed = false;
      return;
    }
    setPaused(true);
  }, []);
  useBackHandler(onBack, {
    active: gs.status === 'playing' && !paused && !guide,
    priority: BACK_PRIORITY.overlay,
  });

  const handleCell = useCallback(
    (lane: number, col: number): PlaceResult | 'shovel' | 'none' => {
      const s = gsRef.current;
      if (s.status !== 'playing' || pausedRef.current) return 'none';
      if (s.shovelArmed) {
        const had = !!s.grid[lane][col];
        shovelAt(s, lane, col);
        if (had) haptic(12);
        return 'shovel';
      }
      if (!s.selected) return 'none';
      const res = placeFlora(s, s.selected, lane, col);
      if (res === 'ok') {
        s.selected = null;
        haptic(14);
      } else {
        haptic([8, 40, 8]);
      }
      return res;
    },
    [],
  );

  const snaresLeft = gs.snares.filter(Boolean).length;
  const stars = starsForLevel(level, snaresLeft);

  const hudProps = {
    onSelect: (k: FloraKey) => {
      if (gs.status !== 'playing' || paused) return;
      gs.selected = gs.selected === k ? null : k;
      gs.shovelArmed = false;
    },
    onShovel: () => {
      if (gs.status !== 'playing' || paused) return;
      gs.shovelArmed = !gs.shovelArmed;
      gs.selected = null;
    },
    onSpeed: () => setSpeed((v) => (v === 1 ? 2 : 1)),
    onPause: () => setPaused(true),
    onMute,
  };
  const touch = gs.status === 'playing' && !paused;
  const hudTop = (
    <Hud s={gs} speed={speed} muted={muted} compact interactive={touch} part="top" landscape={mode === 'landscape'} {...hudProps} />
  );
  const hudTray = <Hud s={gs} speed={speed} muted={muted} compact interactive={touch} part="tray" {...hudProps} />;
  const hudRail = <Hud s={gs} speed={speed} muted={muted} compact interactive={touch} part="rail" {...hudProps} />;

  const hud = (
    <Hud
      s={gs}
      speed={speed}
      muted={muted}
      interactive={touch}
      onSelect={hudProps.onSelect}
      onShovel={hudProps.onShovel}
      onSpeed={hudProps.onSpeed}
      onPause={hudProps.onPause}
      onMute={onMute}
    />
  );

  /** Right-click disarms the armed Flora/shovel without opening a menu. */
  const stagePointer = {
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.button === 2) cancelArmed();
    },
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
  };

  /* Phone layouts scale the board on their own (the HUD stays unscaled around
     it). The reserved box is exactly the scaled frame, so the field can never
     overflow the viewport — and because the frame is grown to the box's aspect
     before it is scaled, there is no letterbox left over either. */
  const boardScaled = (
    <div data-stage-box className="relative shrink-0" style={{ width: fit.boxW, height: fit.boxH }} {...stagePointer}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${fit.scale})` }}>
        <Board s={gs} alpha={alphaRef.current} onCell={handleCell} pad={fit.pad} />
      </div>
    </div>
  );

  // Desktop scales HUD + board as one stage, so the board element itself must
  // stay unscaled — the wrapper below applies the single shared transform.
  const boardRaw = (
    <div className="relative shrink-0" {...stagePointer}>
      <Board s={gs} alpha={alphaRef.current} onCell={handleCell} pad={fit.pad} />
    </div>
  );

  const boss = gs.enemies.find((e) => ENEMIES[e.key].boss);
  const hint =
    touch && (gs.selected || gs.shovelArmed)
      ? gs.selected
        ? `TAP A TILE TO PLANT ${FLORA[gs.selected].name.toUpperCase()}`
        : 'TAP A FLORA TO DIG IT UP'
      : null;

  return (
    /* note: `stage-viewport` (touch-action: none) sits on the board frame only
       — the HUD keeps native touch-action so the seed rack can scroll. */
    <div className="relative h-dvh w-full overflow-hidden" style={{ background: VALE_BG }}>
      {mode === 'stacked' ? (
        /* ── phone portrait: status strip on top, seed rack at the bottom, and
              the battlefield covering every pixel between them. Portrait is
              width-bound, so the spare height goes into the frame's canopy and
              undergrowth rather than into a gap. ── */
        <div className="absolute inset-0 flex flex-col gap-1.5" style={SAFE_INSET}>
          <div className="shrink-0">{hudTop}</div>
          <div ref={areaRef} data-fit-area className="relative min-h-0 flex-1">
            <div className="absolute inset-0 flex items-center justify-center">{boardScaled}</div>
          </div>
          {/* The rack gets a slice of the spare height (capped, and back to
              content size once it fits on one row at ≥560px): portrait is
              width-bound, so this costs the field nothing and buys bigger
              thumb targets. */}
          <div className="h-[clamp(168px,26dvh,236px)] shrink-0 min-[560px]:h-auto">{hudTray}</div>
        </div>
      ) : mode === 'landscape' ? (
        /* ── phone landscape: the rack becomes a two-column rail beside the
              board (every seed visible, nothing to scroll) and the status strip
              goes slim, because sideways the scarce dimension is height and
              every pixel of chrome comes off the field. The boss banner floats
              over the frame instead of eating more of it. ── */
        <div className="absolute inset-0 flex flex-col gap-1.5" style={SAFE_INSET}>
          <div className="shrink-0">{hudTop}</div>
          <div className="flex min-h-0 flex-1 gap-1.5">
            <div ref={areaRef} data-fit-area className="relative min-h-0 min-w-0 flex-1">
              <div className="absolute inset-0 flex items-center justify-center">{boardScaled}</div>
              {boss && (
                <div className="pointer-events-none absolute inset-x-0 top-1 z-10 flex justify-center px-2">
                  <BossBar s={gs} />
                </div>
              )}
              {hint && (
                <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex justify-center px-2">
                  <span className="rounded-lg border border-[#3a5a3f] bg-[#0c1710]/90 px-3 py-1 text-center font-ui text-[11px] font-bold tracking-[0.2em] text-[#9db08f]">
                    {hint}
                  </span>
                </div>
              )}
            </div>
            <div className="w-[128px] shrink-0 sm:w-[140px]">{hudRail}</div>
          </div>
        </div>
      ) : (
        /* ── desktop: HUD + field as one uniformly scaled stage that covers the
              window edge to edge. The frame is grown to the window's aspect
              first, so the stage is never letterboxed, and the reserved box
              matches the scaled content exactly, so it can never overflow. ── */
        <div className="absolute inset-0" style={SAFE_INSET}>
          <div ref={areaRef} data-fit-area className="relative h-full w-full">
            <div data-stage-box className="absolute left-0 top-0" style={{ width: fit.boxW, height: fit.boxH }}>
              <div className="origin-top-left" style={{ transform: `scale(${fit.scale})`, width: fit.frameW }}>
                <div className="flex flex-col" style={{ gap: STAGE_GAP }}>
                  <div ref={hudRef} data-fit-chrome className="w-full shrink-0">
                    {hud}
                  </div>
                  <div className="relative shrink-0">
                    {boardRaw}
                    {boss && (
                      <div className="pointer-events-none absolute inset-x-0 top-2 z-[95] flex justify-center px-3">
                        <BossBar s={gs} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlays live outside the scaled/transformed stage so `fixed`
          positioning (and the phone bottom-sheet layout) behaves. */}
      {paused && gs.status === 'playing' && (
        <PauseOverlay
          onGuide={() => setGuide(true)}
          onResume={() => setPaused(false)}
          onRestart={restart}
          onQuit={onExit}
        />
      )}
      {gs.status === 'won' && (
        <WinOverlay
          stars={stars}
          snaresLeft={snaresLeft}
          isLast={!onNext}
          onNext={() => onNext?.()}
          onReplay={restart}
          onMap={onExit}
        />
      )}
      {gs.status === 'lost' && <LoseOverlay lane={gs.lostLane} onRetry={restart} onMap={onExit} />}
      {guide && (
        <GuideModal unlockedFlora={guideFlora} unlockedEnemies={guideEnemies} onClose={() => setGuide(false)} />
      )}
      {resolved && !guide && (
        <span className="sr-only" role="status">
          {gs.status === 'won' ? 'Level cleared' : 'Level lost'}
        </span>
      )}
    </div>
  );
}
