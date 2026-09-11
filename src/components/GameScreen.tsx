import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { BACK_PRIORITY, useBackHandler } from '../game/backstack';
import { createGame, placeFlora, shovelAt, stepGame, type PlaceResult } from '../game/engine';
import { ENEMIES, FLORA } from '../game/data';
import { haptic } from '../game/uiSound';
import { setSfxMuted, sfxEvent } from '../game/sfx';
import { starsForLevel, TICK, type FloraKey, type GameState, type LevelDef } from '../game/types';
import Board, { STAGE_H, STAGE_W } from './Board';
import Hud, { BossBar } from './Hud';
import { GuideModal, LoseOverlay, PauseOverlay, WinOverlay } from './Screens';
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
  const [scale, setScale] = useState(0.5);
  /** Height of the unscaled desktop stage (HUD + gap + board), measured live. */
  const [stageH, setStageH] = useState(STAGE_H + 118);
  const [mode, setMode] = useState<LayoutMode>(() => layoutMode());
  const reported = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const guideRef = useRef(guide);
  guideRef.current = guide;
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  /** The unscaled desktop stage column (HUD + board) — measured for the fit. */
  const stageRef = useRef<HTMLDivElement>(null);
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

  // Scale the board to whatever room the layout gives it.
  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (mode === 'landscape') {
        // The HUD lives in a strip above and a rail beside the board, both
        // outside this element — the board gets the whole box to itself.
        setScale(Math.max(0.15, Math.min(r.width / STAGE_W, r.height / STAGE_H, 1.35)));
        return;
      }
      if (mode === 'stacked') {
        // In the stacked layout the tray shares this column, so take its
        // height (plus the row gap and the column's padding) out of the
        // board's budget before scaling.
        const tray = trayRef.current?.getBoundingClientRect().height ?? 0;
        const room = Math.max(60, r.height - tray - 26);
        setScale(Math.max(0.15, Math.min(r.width / STAGE_W, room / STAGE_H, 1.35)));
        return;
      }
      // Desktop: HUD + board form one uniformly scaled stage. The stage
      // column's offsetHeight ignores the transform, so it reports the true
      // unscaled frame height — the whole stage then fits, never overflows.
      const frameH = stageRef.current?.offsetHeight ?? 0;
      const H = frameH > 64 ? frameH : STAGE_H + 118;
      setStageH(H);
      setScale(Math.max(0.15, Math.min(r.width / STAGE_W, (r.height - 16) / H, 1.35)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (stageRef.current) ro.observe(stageRef.current);
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

  // Phone layouts scale the board on its own (the HUD is unscaled around it).
  const boardScaled = (
    <div
      className="stage-viewport relative shrink-0"
      style={{ width: STAGE_W * scale, height: STAGE_H * scale }}
      {...stagePointer}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})`, width: STAGE_W, height: STAGE_H }}>
        <Board s={gs} alpha={alphaRef.current} onCell={handleCell} />
      </div>
    </div>
  );

  // Desktop scales HUD + board as one stage, so the board element itself must
  // stay unscaled — the wrapper below applies the single shared transform.
  const boardRaw = (
    <div className="stage-viewport relative shrink-0" {...stagePointer}>
      <Board s={gs} alpha={alphaRef.current} onCell={handleCell} />
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
    /* note: `stage-viewport` (touch-action: none) sits on the board only — the
       HUD must keep native touch-action so the seed tray can scroll. */
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#070c08]">
      {/* ambient page glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(90% 70% at 50% 0%, #122117 0%, transparent 60%)' }}
      />
      {mode === 'stacked' ? (
        /* ── phone portrait: status strip on top, then the board and the seed
              tray as one centred cluster — extra height is shared above and
              below rather than left as a hole between them. ── */
        <div
          className="relative flex min-h-0 flex-1 flex-col"
          style={{ marginLeft: 'var(--safe-left)', marginRight: 'var(--safe-right)' }}
        >
          <div className="shrink-0 px-2 pt-[max(0.5rem,var(--safe-top))]">{hudTop}</div>
          <div ref={boardAreaRef} className="flex min-h-0 flex-1 flex-col justify-center gap-2 px-1 py-2">
            <div className="flex shrink-0 justify-center">{boardScaled}</div>
            <div ref={trayRef} className="shrink-0">
              {hudTray}
            </div>
          </div>
        </div>
      ) : mode === 'landscape' ? (
        /* ── phone landscape: the tray becomes a side rail (real 76–92px touch
              targets, unscaled) so the board keeps the full height, which is
              the scarce dimension sideways. Status strip stays on top; the
              boss banner overlays the field instead of eating its height. ── */
        <div
          className="relative flex min-h-0 flex-1 flex-col"
          style={{ marginLeft: 'var(--safe-left)', marginRight: 'var(--safe-right)' }}
        >
          <div className="shrink-0 px-2 pb-1 pt-[max(0.5rem,var(--safe-top))]">{hudTop}</div>
          <div className="flex min-h-0 flex-1 gap-2 px-1 pb-[max(0.5rem,var(--safe-bottom))]">
            <div ref={boardAreaRef} className="relative flex min-h-0 flex-1 items-center justify-center">
              {boardScaled}
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
            <div className="flex w-[104px] shrink-0 flex-col pt-1">{hudRail}</div>
          </div>
        </div>
      ) : (
        /* ── desktop: one uniformly scaled stage, exactly as framed — the
              reserved box matches the scaled content, so the field can never
              overflow the viewport (the old layout scaled the board twice). ── */
        <div ref={boardAreaRef} className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className="shrink-0" style={{ width: STAGE_W * scale, height: stageH * scale }}>
            <div className="origin-top-left" style={{ transform: `scale(${scale})`, width: STAGE_W }}>
              <div ref={stageRef} className="flex flex-col gap-3">
                {hud}
                {boardRaw}
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
