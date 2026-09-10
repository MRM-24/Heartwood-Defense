import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGame, placeFlora, shovelAt, stepGame, type PlaceResult } from '../game/engine';
import { setSfxMuted, sfxEvent } from '../game/sfx';
import { TICK, type FloraKey, type GameState, type LevelDef } from '../game/types';
import Board, { STAGE_H, STAGE_W } from './Board';
import Hud from './Hud';
import { LoseOverlay, PauseOverlay, WinOverlay } from './Screens';

const TOTAL_H = 116 + STAGE_H; // hud + board

interface Props {
  level: LevelDef;
  loadout: FloraKey[];
  muted: boolean;
  onMute: () => void;
  onWin: (snaresLeft: number) => void;
  onExit: () => void;
  onNext: (() => void) | null;
}

export default function GameScreen({ level, loadout, muted, onMute, onWin, onExit, onNext }: Props) {
  const [attempt, setAttempt] = useState(0);
  const gs = useMemo<GameState>(() => createGame(level, loadout), [level, loadout, attempt]);
  const gsRef = useRef(gs);
  gsRef.current = gs;

  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [scale, setScale] = useState(1);
  const reported = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSfxMuted(muted);
  }, [muted]);

  // stage scaling
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setScale(Math.min(r.width / STAGE_W, r.height / TOTAL_H, 1.35));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  // auto-pause when tab hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const cancelArmed = useCallback(() => {
    const s = gsRef.current;
    s.selected = null;
    s.shovelArmed = false;
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = gsRef.current;
      const k = e.key.toLowerCase();
      if (k >= '1' && k <= '6') {
        const idx = Number(k) - 1;
        const key = s.loadout[idx];
        if (key && s.status === 'playing' && !pausedRef.current) {
          s.selected = s.selected === key ? null : key;
          s.shovelArmed = false;
        }
      } else if (k === 'x') {
        if (s.status === 'playing' && !pausedRef.current) {
          s.shovelArmed = !s.shovelArmed;
          s.selected = null;
        }
      } else if (k === 'escape') {
        if (s.selected !== null || s.shovelArmed) cancelArmed();
        else if (s.status === 'playing') setPaused((p) => !p);
      } else if (k === 'f') {
        setSpeed((v) => (v === 1 ? 2 : 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelArmed]);

  const handleCell = useCallback(
    (lane: number, col: number): PlaceResult | 'shovel' | 'none' => {
      const s = gsRef.current;
      if (s.status !== 'playing' || pausedRef.current) return 'none';
      if (s.shovelArmed) {
        shovelAt(s, lane, col);
        return 'shovel';
      }
      if (!s.selected) return 'none';
      const res = placeFlora(s, s.selected, lane, col);
      if (res === 'ok') s.selected = null;
      return res;
    },
    [],
  );

  const snaresLeft = gs.snares.filter(Boolean).length;
  const stars = snaresLeft >= 5 ? 3 : snaresLeft >= 3 ? 2 : 1;

  return (
    <div ref={outerRef} className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#070c08]">
      {/* ambient page glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(90% 70% at 50% 0%, #122117 0%, transparent 60%)' }} />
      <div
        className="relative shrink-0"
        style={{ width: STAGE_W * scale, height: TOTAL_H * scale }}
        onPointerDown={(e) => {
          if (e.button === 2) cancelArmed();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})`, width: STAGE_W }}>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Hud
                s={gs}
                speed={speed}
                muted={muted}
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
            </div>
            <Board s={gs} alpha={alphaRef.current} onCell={handleCell} />
          </div>
          {paused && gs.status === 'playing' && (
            <PauseOverlay
              onResume={() => setPaused(false)}
              onRestart={() => {
                setPaused(false);
                setAttempt((a) => a + 1);
                reported.current = false;
              }}
              onQuit={onExit}
            />
          )}
          {gs.status === 'won' && (
            <WinOverlay
              stars={stars}
              isLast={!onNext}
              onNext={() => onNext?.()}
              onReplay={() => {
                setAttempt((a) => a + 1);
                reported.current = false;
              }}
              onMap={onExit}
            />
          )}
          {gs.status === 'lost' && (
            <LoseOverlay
              lane={gs.lostLane}
              onRetry={() => {
                setAttempt((a) => a + 1);
                reported.current = false;
              }}
              onMap={onExit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
