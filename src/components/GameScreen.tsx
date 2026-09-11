import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BACK_PRIORITY, useBackHandler } from '../game/backstack';
import { createGame, placeFlora, shovelAt, stepGame, type PlaceResult } from '../game/engine';
import { haptic } from '../game/uiSound';
import { setSfxMuted, sfxEvent } from '../game/sfx';
import { starsForLevel, TICK, type FloraKey, type GameState, type LevelDef } from '../game/types';
import Board, { STAGE_H, STAGE_W } from './Board';
import Hud from './Hud';
import { GuideModal, LoseOverlay, PauseOverlay, WinOverlay } from './Screens';
import type { EnemyKey } from '../game/types';

/** Desktop breakpoint: below this the HUD splits and the board stands alone. */
const COMPACT = '(max-width: 899px)';

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
  const [compact, setCompact] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(COMPACT).matches,
  );
  const reported = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const guideRef = useRef(guide);
  guideRef.current = guide;
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const resolved = gs.status !== 'playing';

  useEffect(() => {
    setSfxMuted(muted);
  }, [muted]);

  // Compact (phone/tablet) vs roomy (desktop) HUD arrangement.
  useEffect(() => {
    const mq = window.matchMedia(COMPACT);
    const on = () => setCompact(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Scale the board to whatever room the layout gives it.
  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      // In the compact layout the tray shares this column, so take its height
      // out of the board's budget before scaling.
      const tray = compact ? (trayRef.current?.getBoundingClientRect().height ?? 0) + 12 : 0;
      const room = Math.max(60, r.height - (compact ? 0 : 116) - tray);
      setScale(Math.max(0.15, Math.min(r.width / STAGE_W, room / STAGE_H, 1.35)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [compact]);

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
  const hudTop = <Hud s={gs} speed={speed} muted={muted} compact interactive={gs.status === 'playing' && !paused} part="top" {...hudProps} />;
  const hudTray = <Hud s={gs} speed={speed} muted={muted} compact interactive={gs.status === 'playing' && !paused} part="tray" {...hudProps} />;

  const hud = (
    <Hud
      s={gs}
      speed={speed}
      muted={muted}
      compact={compact}
      interactive={gs.status === 'playing' && !paused}
      onSelect={(k) => {
        if (gs.status !== 'playing' || paused) return;
        gs.selected = gs.selected === k ? null : k;
        gs.shovelArmed = false;
      }}
      onShovel={() => {
        if (gs.status !== 'playing' || paused) return;
        gs.shovelArmed = !gs.shovelArmed;
        gs.selected = null;
      }}
      onSpeed={() => setSpeed((v) => (v === 1 ? 2 : 1))}
      onPause={() => setPaused(true)}
      onMute={onMute}
    />
  );

  const board = (
    <div
      className="stage-viewport relative shrink-0"
      style={{ width: STAGE_W * scale, height: STAGE_H * scale }}
      onPointerDown={(e) => {
        if (e.button === 2) cancelArmed();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})`, width: STAGE_W, height: STAGE_H }}>
        <Board s={gs} alpha={alphaRef.current} onCell={handleCell} />
      </div>
    </div>
  );

  return (
    /* note: `stage-viewport` (touch-action: none) sits on the board only — the
       HUD must keep native touch-action so the seed tray can scroll sideways. */
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#070c08]">
      {/* ambient page glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(90% 70% at 50% 0%, #122117 0%, transparent 60%)' }}
      />
      {compact ? (
        /* ── phone layout: status bar on top, then the board and the seed tray
              as one centred cluster — extra height is shared above and below
              rather than left as a hole between them. ── */
        <div className="safe-mx relative flex min-h-0 flex-1 flex-col">
          <div className="safe-pad-t shrink-0 px-2 pt-2">{hudTop}</div>
          <div ref={boardAreaRef} className="flex min-h-0 flex-1 flex-col justify-center gap-2 px-1 py-2">
            <div className="flex shrink-0 justify-center">{board}</div>
            <div ref={trayRef} className="shrink-0">
              {hudTray}
            </div>
          </div>
        </div>
      ) : (
        /* ── desktop layout: one uniformly scaled stage, as originally framed ── */
        <div ref={boardAreaRef} className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className="shrink-0" style={{ width: STAGE_W * scale, height: (STAGE_H + 116) * scale }}>
            <div className="origin-top-left" style={{ transform: `scale(${scale})`, width: STAGE_W }}>
              <div className="flex flex-col gap-3">
                {hud}
                {board}
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
