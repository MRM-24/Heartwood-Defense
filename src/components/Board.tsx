import { useCallback, useEffect, useRef, useState } from 'react';
import { ENEMIES, FLORA } from '../game/data';
import type { PlaceResult } from '../game/engine';
import { COLS, LANES, type EnemyEnt, type FloraEnt, type Fx, type GameState } from '../game/types';
import { EnemySprite, FloraSprite, HeartTree, ProjSprite, SnareGlyph } from './sprites';

export const STAGE_W = 1080;
export const STAGE_H = 600;
export const GRID_X = 150;
export const GRID_Y = 22;
export const CELL_W = 100;
export const CELL_H = 106;

const px = (x: number) => GRID_X + x * CELL_W;
const laneY = (l: number) => GRID_Y + l * CELL_H;

const ENEMY_GLOW: Record<string, string> = {
  gnat: 'rgba(190,140,255,.5)',
  beetle: 'rgba(150,110,200,.45)',
  skitter: 'rgba(255,120,200,.45)',
  warden: 'rgba(110,240,205,.4)',
  drifter: 'rgba(215,140,255,.55)',
  brute: 'rgba(255,110,140,.5)',
  colossus: 'rgba(255,90,110,.6)',
};
const FLORA_GLOW: Record<string, string> = {
  thornvine: 'rgba(125,255,176,.4)',
  glowbulb: 'rgba(255,215,106,.55)',
  bramble: 'rgba(160,220,130,.3)',
  cactus: 'rgba(110,230,180,.4)',
  frostcap: 'rgba(140,215,255,.5)',
  sentinel: 'rgba(255,207,77,.5)',
};

interface Props {
  s: GameState;
  alpha: number;
  onCell: (lane: number, col: number) => PlaceResult | 'shovel' | 'none';
}

export default function Board({ s, alpha, onCell }: Props) {
  const [hover, setHover] = useState<{ lane: number; col: number } | null>(null);
  const [reject, setReject] = useState<{ lane: number; col: number; msg: string; n: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const cellFromEvent = useCallback((e: React.PointerEvent): { lane: number; col: number } | null => {
    const el = stageRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * STAGE_W;
    const sy = ((e.clientY - r.top) / r.height) * STAGE_H;
    const col = Math.floor((sx - GRID_X) / CELL_W);
    const lane = Math.floor((sy - GRID_Y) / CELL_H);
    if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return null;
    return { lane, col };
  }, []);

  useEffect(() => {
    if (!reject) return;
    const t = setTimeout(() => setReject(null), 700);
    return () => clearTimeout(t);
  }, [reject]);

  const handleMove = (e: React.PointerEvent) => setHover(cellFromEvent(e));
  const handleLeave = () => setHover(null);
  const handleDown = (e: React.PointerEvent) => {
    if (e.button === 2) return;
    const c = cellFromEvent(e);
    if (!c) return;
    const res = onCell(c.lane, c.col);
    if (res !== 'ok' && res !== 'shovel' && res !== 'none') {
      const msg =
        res === 'occupied' ? 'Occupied!'
        : res === 'poor' ? 'Not enough Nectar'
        : res === 'cooldown' ? 'Still recharging'
        : 'Cannot plant here';
      setReject({ lane: c.lane, col: c.col, msg, n: Date.now() });
    }
  };

  const armed = s.selected !== null || s.shovelArmed;
  const hoverValid = (() => {
    if (!hover || !armed || s.status !== 'playing') return null;
    if (s.shovelArmed) return !!s.grid[hover.lane][hover.col];
    if (!s.selected) return null;
    const def = FLORA[s.selected];
    return !s.grid[hover.lane][hover.col] && s.nectar >= def.cost && (s.trayCd[s.selected] ?? 0) <= 0;
  })();

  const shakeX = s.shake > 0 ? Math.sin(s.tick * 3.1) * s.shake * 14 : 0;
  const shakeY = s.shake > 0 ? Math.cos(s.tick * 2.3) * s.shake * 9 : 0;

  return (
    <div
      ref={stageRef}
      className={`relative touch-none select-none ${armed ? 'cursor-crosshair' : ''}`}
      style={{ width: STAGE_W, height: STAGE_H }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onPointerDown={handleDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ambient backdrop */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-[#2b4430] bg-[#0c1710]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 20% 0%, #16281a 0%, #0c1710 45%, #070d09 100%)' }} />
        {/* blight glow from the east */}
        <div className="absolute inset-y-0 right-0 w-[220px]" style={{ background: 'linear-gradient(to left, rgba(150,60,130,.22), transparent)' }} />
        {/* drifting spores */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="anim-drift absolute rounded-full"
            style={{
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              left: `${(i * 137) % 100}%`,
              top: `${(i * 61) % 100}%`,
              background: i % 3 === 0 ? 'rgba(255,190,240,.35)' : 'rgba(190,255,205,.3)',
              animationDuration: `${14 + i * 3}s`,
              animationDelay: `${-i * 2.7}s`,
            }}
          />
        ))}
      </div>

      {/* inner shaken world */}
      <div className="absolute inset-0" style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {/* heart tree */}
        <div className="absolute" style={{ left: -6, top: -4, width: 168, height: 612 }}>
          <HeartTree />
        </div>

        {/* grid cells */}
        {Array.from({ length: LANES }).map((_, l) =>
          Array.from({ length: COLS }).map((_, c) => {
            const isHover = hover?.lane === l && hover?.col === c;
            const rejected = reject?.lane === l && reject?.col === c;
            return (
              <div
                key={`${l}-${c}`}
                className={`absolute rounded-[10px] transition-colors duration-75 ${rejected ? 'anim-cellshake' : ''}`}
                style={{
                  left: px(c) + 3,
                  top: laneY(l) + 3,
                  width: CELL_W - 6,
                  height: CELL_H - 6,
                  background:
                    (l + c) % 2 === 0
                      ? 'linear-gradient(180deg, rgba(46,74,50,.34), rgba(30,52,36,.34))'
                      : 'linear-gradient(180deg, rgba(38,64,44,.34), rgba(25,44,30,.34))',
                  boxShadow: isHover && armed
                    ? `inset 0 0 0 2px ${hoverValid ? 'rgba(163,242,160,.9)' : 'rgba(255,110,130,.85)'}, inset 0 0 24px ${hoverValid ? 'rgba(125,255,176,.18)' : 'rgba(255,110,130,.14)'}`
                    : 'inset 0 0 0 1px rgba(120,190,130,.10)',
                }}
              />
            );
          }),
        )}

        {/* lane root separators */}
        {Array.from({ length: LANES - 1 }).map((_, i) => (
          <div key={i} className="absolute" style={{ left: GRID_X + 4, top: laneY(i + 1) - 1, width: COLS * CELL_W - 8, height: 2, background: 'linear-gradient(90deg, rgba(127,215,127,.16), rgba(127,215,127,.05))' }} />
        ))}

        {/* snare glyphs per lane */}
        {Array.from({ length: LANES }).map((_, l) => (
          <div key={l} className="absolute" style={{ left: GRID_X - 34, top: laneY(l) + CELL_H / 2 - 24, width: 48, height: 48, zIndex: 30 }} title="Root Snare">
            <SnareGlyph active={s.snares[l]} flash={s.snareFx[l] > 0.9} />
          </div>
        ))}

        {/* hover ghost preview */}
        {hover && armed && !s.shovelArmed && s.selected && hoverValid !== null && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: px(hover.col) + 6,
              top: laneY(hover.lane) + CELL_H - 98,
              width: 88,
              height: 96,
              opacity: hoverValid ? 0.55 : 0.35,
              filter: hoverValid ? 'none' : 'grayscale(.8) brightness(.7)',
              zIndex: 40,
            }}
          >
            <FloraSprite k={s.selected} />
          </div>
        )}
        {hover && s.shovelArmed && (
          <div
            className="pointer-events-none absolute flex items-center justify-center"
            style={{ left: px(hover.col), top: laneY(hover.lane), width: CELL_W, height: CELL_H, zIndex: 40 }}
          >
            <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke={s.grid[hover.lane][hover.col] ? '#ffd7a8' : '#7a6a55'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 22l9-9" /><path d="M11 13l3.5 3.5a2.1 2.1 0 003-3L14 10" /><path d="M14 10l6-6 2 2-6 6" />
            </svg>
          </div>
        )}

        {/* flora */}
        {s.grid.map((row) => row.map((f) => (f ? <FloraView key={f.id} f={f} /> : null)))}

        {/* enemies */}
        {s.enemies.map((e) => (
          <EnemyView key={e.id} e={e} alpha={alpha} />
        ))}

        {/* projectiles */}
        {s.projs.map((p) => {
          const x = p.prevX + (p.x - p.prevX) * alpha;
          const w = p.kind === 'frost' ? 20 : p.kind === 'ray' ? 34 : 30;
          const h = p.kind === 'frost' ? 20 : 12;
          return (
            <div
              key={p.id}
              className="pointer-events-none absolute"
              style={{
                left: px(x) - w / 2,
                top: laneY(p.lane) + CELL_H / 2 - h / 2 - 6,
                width: w,
                height: h,
                zIndex: 60,
                filter: `drop-shadow(0 0 6px ${p.kind === 'frost' ? '#9fdcff' : p.kind === 'ray' ? '#ffd76a' : '#a4ffb8'})`,
              }}
            >
              <ProjSprite kind={p.kind} />
            </div>
          );
        })}

        {/* fx */}
        {s.fx.map((fx) => (
          <FxView key={fx.id} fx={fx} />
        ))}

        {/* reject message */}
        {reject && (
          <div
            key={reject.n}
            className="anim-floatup pointer-events-none absolute z-[80] whitespace-nowrap rounded-md bg-[#3a1622]/95 px-2.5 py-1 font-ui text-[16px] font-bold text-[#ff9db1] shadow-lg"
            style={{ left: px(reject.col) + CELL_W / 2 - 40, top: laneY(reject.lane) + 18 }}
          >
            {reject.msg}
          </div>
        )}

        {/* wave incoming banner */}
        {s.waveAlertT > 0 && s.status === 'playing' && s.warnWave >= 0 && (
          <WaveBanner final={s.warnWave === s.waveTotal - 1} wave={s.warnWave} total={s.waveTotal} t={s.waveAlertT} />
        )}
      </div>
    </div>
  );
}

// ── subviews ─────────────────────────────────────────────────────────────────
function FloraView({ f }: { f: FloraEnt }) {
  const hurt = f.hp < f.maxHp;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: px(f.col) + 6,
        top: laneY(f.lane) + CELL_H - 98,
        width: 88,
        height: 96,
        zIndex: 20 + f.lane,
        filter: `drop-shadow(0 0 7px ${FLORA_GLOW[f.key]}) ${f.flash > 0 ? 'brightness(1.8) saturate(1.4)' : ''} ${f.prod > 0 ? 'brightness(1.5)' : ''}`,
        transform: f.fired > 0 ? 'translateX(-3px)' : f.eatenBy !== null ? `translateX(${Math.sin(f.id * 7 + f.hp) * 1.5}px)` : undefined,
      }}
    >
      <FloraSprite k={f.key} hpFrac={f.hp / f.maxHp} />
      {/* muzzle flash */}
      {f.fired > 0 && (
        <div className="anim-pop absolute rounded-full" style={{ right: -4, top: f.key === 'sentinel' ? 18 : 16, width: 14, height: 14, background: f.key === 'frostcap' ? '#bfe9ff' : '#e5ff9d', filter: 'blur(1px)', boxShadow: '0 0 10px 4px rgba(220,255,160,.7)' }} />
      )}
      {/* production halo */}
      {f.prod > 0 && <div className="anim-ringburst absolute rounded-full border-2 border-[#ffd76a]" style={{ left: 6, top: 4, width: 76, height: 76 }} />}
      {/* hp bar */}
      {hurt && (
        <div className="absolute" style={{ left: 12, bottom: -4, width: 64, height: 5, background: 'rgba(10,16,12,.8)', borderRadius: 3, border: '1px solid rgba(0,0,0,.5)' }}>
          <div
            className="h-full rounded-[2px] transition-all duration-150"
            style={{
              width: `${(f.hp / f.maxHp) * 100}%`,
              background: f.hp / f.maxHp > 0.5 ? '#7ee787' : f.hp / f.maxHp > 0.25 ? '#ffcf4d' : '#ff6b6b',
            }}
          />
        </div>
      )}
    </div>
  );
}

function EnemyView({ e, alpha }: { e: EnemyEnt; alpha: number }) {
  const def = ENEMIES[e.key];
  const ex = e.prevX + (e.x - e.prevX) * alpha;
  const scale = def.scale;
  const w = 80 * (e.key === 'colossus' ? 2.2 : scale);
  const flyLift = def.flying ? 36 : 0;
  const slowed = e.slowPct > 0; // engine clears slowUntil, but tint is fine while flagged
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: px(ex) - w / 2,
        top: laneY(e.lane) + CELL_H - 6 - w - flyLift,
        width: w,
        height: w,
        zIndex: 24 + e.lane + (def.flying ? 30 : 0),
        filter: `drop-shadow(0 0 8px ${ENEMY_GLOW[e.key]}) ${e.hitFlash > 0 ? 'brightness(2) saturate(1.6)' : ''} ${slowed ? 'drop-shadow(0 0 6px rgba(140,215,255,.8)) hue-rotate(-12deg)' : ''}`,
        transform: `${e.chewing ? 'translateX(-2px) rotate(-1.5deg)' : ''}`,
      }}
    >
      {/* spawn fade-in */}
      <div className="h-full w-full anim-fadein" style={{ animationDuration: '0.35s' }}>
        <EnemySprite k={e.key} shellFrac={e.maxShell ? e.shell / e.maxShell : 0} phase={e.phase} />
      </div>
      {/* shell pips */}
      {e.maxShell > 0 && e.shell > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -8, width: 46, height: 5, background: 'rgba(8,16,14,.85)', borderRadius: 3, border: '1px solid rgba(103,224,198,.4)' }}>
          <div className="h-full rounded-[2px]" style={{ width: `${(e.shell / e.maxShell) * 100}%`, background: 'linear-gradient(90deg,#67e0c6,#a8fff0)' }} />
        </div>
      )}
      {/* hp bar for damaged enemies (kept slim to avoid clutter) */}
      {!def.boss && e.hp < e.maxHp && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: e.maxShell > 0 && e.shell > 0 ? -15 : -8, width: 40, height: 4, background: 'rgba(8,16,14,.85)', borderRadius: 2 }}>
          <div className="h-full rounded-[2px]" style={{ width: `${(e.hp / e.maxHp) * 100}%`, background: '#ff7d95' }} />
        </div>
      )}
    </div>
  );
}

function FxView({ fx }: { fx: Fx }) {
  const prog = 1 - fx.ttl / fx.max;
  if (fx.kind === 'nectar' || fx.kind === 'income') {
    const left = fx.kind === 'income' ? 100 : px(fx.x) - 20;
    return (
      <div
        className="anim-floatup pointer-events-none absolute z-[70] font-ui text-[20px] font-extrabold"
        style={{
          left,
          top: fx.kind === 'income' ? laneY(2) + 20 : laneY(fx.lane) + 26,
          color: '#ffd76a',
          textShadow: '0 0 8px rgba(255,183,77,.9), 0 2px 2px rgba(0,0,0,.6)',
        }}
      >
        {fx.text}
      </div>
    );
  }
  if (fx.kind === 'sporeburst') {
    return (
      <div className="pointer-events-none absolute z-[65]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H / 2 - 34 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <div
              key={i}
              className="anim-burst absolute rounded-full"
              style={{
                width: 8 + (i % 3) * 3,
                height: 8 + (i % 3) * 3,
                left: 26,
                top: 26,
                background: i % 2 ? '#cf8bf7' : '#ff9ad6',
                ['--bx' as string]: `${Math.cos(a) * 44}px`,
                ['--by' as string]: `${Math.sin(a) * 34}px`,
              }}
            />
          );
        })}
      </div>
    );
  }
  if (fx.kind === 'snare') {
    return (
      <div className="pointer-events-none absolute z-[62]" style={{ left: GRID_X, top: laneY(fx.lane), width: COLS * CELL_W, height: CELL_H }}>
        <div className="anim-flashwhite absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(90deg, rgba(217,255,176,.5), rgba(163,242,160,.15))' }} />
        {Array.from({ length: 9 }).map((_, i) => (
          <svg key={i} viewBox="0 0 30 60" className="anim-snareup absolute" style={{ left: 14 + i * 104, bottom: 6, width: 34, height: 66, animationDelay: `${i * 0.04}s` }}>
            <path d="M15 60 C 8 44 6 28 15 4 C 24 28 22 44 15 60 Z" fill="#8fe07c" stroke="#0a140f" strokeWidth="2.6" />
            <path d="M15 52 l -6 -8 M15 40 l 6 -8 M15 28 l -5 -7" stroke="#0a140f" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ))}
      </div>
    );
  }
  if (fx.kind === 'splash') {
    return (
      <div
        className="anim-ringburst pointer-events-none absolute z-[64] rounded-full border-[3px] border-[#9fdcff]"
        style={{ left: px(fx.x) - 24, top: laneY(fx.lane) + CELL_H / 2 - 30, width: 48, height: 48, opacity: 1 - prog }}
      />
    );
  }
  if (fx.kind === 'shockwave') {
    return (
      <div className="pointer-events-none absolute z-[64]" style={{ left: px(fx.x) - 70, top: laneY(fx.lane) + CELL_H / 2 - 76 }}>
        <div className="anim-shockwave rounded-full border-4 border-[#ff9a3d]" style={{ width: 140, height: 140 }} />
      </div>
    );
  }
  // place / shovel puffs
  const color = fx.kind === 'shovel' ? '#9a7a4f' : '#a3f2a0';
  return (
    <div className="pointer-events-none absolute z-[63]" style={{ left: px(fx.x) - 24, top: laneY(fx.lane) + CELL_H / 2 - 30 }}>
      <div className="anim-puff rounded-full" style={{ width: 48, height: 48, background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }} />
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.6;
        return (
          <div
            key={i}
            className="anim-burst absolute rounded-full"
            style={{ width: 6, height: 6, left: 21, top: 21, background: color, ['--bx' as string]: `${Math.cos(a) * 26}px`, ['--by' as string]: `${Math.sin(a) * 22 - 8}px` }}
          />
        );
      })}
    </div>
  );
}

function WaveBanner({ wave, final, total, t }: { wave: number; final: boolean; total: number; t: number }) {
  const show = wave + 1;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[254px] z-[90] flex justify-center">
      <div className={`anim-banner flex flex-col items-center rounded-2xl border px-10 py-3 ${final ? 'border-[#ff5d7c]/70 bg-[#2a0e18]/90' : 'border-[#c98436]/60 bg-[#20140a]/90'}`} style={{ opacity: Math.min(1, t / 0.4) }}>
        <div className={`font-display text-[30px] font-black tracking-[0.2em] ${final ? 'text-[#ff7d95]' : 'text-[#ffc46b]'}`}>
          {final ? 'FINAL WAVE' : `WAVE ${show} OF ${total}`}
        </div>
        <div className="mt-0.5 font-ui text-[15px] font-semibold tracking-[0.32em] text-[#c9b08a]">
          {final ? 'THE BLIGHT THROWS EVERYTHING' : 'THE BLIGHT STIRS'}
        </div>
      </div>
    </div>
  );
}
