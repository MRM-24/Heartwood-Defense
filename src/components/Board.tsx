import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ENEMIES, FLORA } from '../game/data';
import type { PlaceResult } from '../game/engine';
import { COLS, LANES, type EnemyEnt, type FloraEnt, type Fx, type GameState } from '../game/types';
import { NO_PAD, STAGE_H, STAGE_W, type StagePad } from '../utils/stageFit';
import StageDecor from './StageDecor';
import { EnemySprite, EProjSprite, FloraSprite, HeartTree, ProjSprite, SnareGlyph } from './sprites';

/* The playfield's authored size lives in utils/stageFit (so the fit maths and
   the renderer can never disagree); re-exported here for existing callers. */
export { STAGE_H, STAGE_W };
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
  vaulter: 'rgba(200,240,90,.45)',
  grub: 'rgba(180,175,160,.5)',
  larva: 'rgba(130,210,185,.4)',
  ranger: 'rgba(220,190,100,.45)',
  imp: 'rgba(255,130,230,.5)',
  husk: 'rgba(255,150,70,.45)',
  thief: 'rgba(150,190,240,.5)',
  // ── Enemy Batch 2 ──
  wisp: 'rgba(255,200,110,.55)',
  slug: 'rgba(140,220,150,.5)',
  chitter: 'rgba(255,140,190,.5)',
  marauder: 'rgba(200,160,100,.5)',
  nightcap: 'rgba(150,120,255,.55)',
  wretch: 'rgba(190,225,110,.5)',
  hollowking: 'rgba(210,160,255,.6)',
  // ── Enemy Batch 3 ──
  regrow: 'rgba(150,235,140,.5)',
  golem: 'rgba(255,130,60,.55)',
  roach: 'rgba(200,175,120,.45)',
  toad: 'rgba(180,175,160,.45)',
  nightstalker: 'rgba(190,200,220,.6)',
  wardshell: 'rgba(216,180,255,.55)',
};
const FLORA_GLOW: Record<string, string> = {
  thornvine: 'rgba(125,255,176,.4)',
  glowbulb: 'rgba(255,215,106,.55)',
  bramble: 'rgba(160,220,130,.3)',
  cactus: 'rgba(110,230,180,.4)',
  frostcap: 'rgba(140,215,255,.5)',
  sentinel: 'rgba(255,207,77,.5)',
  // ── Flora Batch 1 ──
  cinderpod: 'rgba(255,140,60,.5)',
  deeproot: 'rgba(160,240,200,.45)',
  bulwark: 'rgba(180,210,120,.35)',
  snaptrap: 'rgba(255,110,150,.45)',
  watchvine: 'rgba(150,255,200,.45)',
  bindweed: 'rgba(130,230,200,.45)',
  lotus: 'rgba(255,190,225,.5)',
  // ── Flora Batch 2 ──
  ironbark: 'rgba(190,200,215,.45)',
  emberlash: 'rgba(255,150,60,.55)',
  needlereed: 'rgba(210,235,150,.45)',
  gale: 'rgba(170,225,245,.5)',
  sentinelbloom: 'rgba(200,170,255,.5)',
  ambush: 'rgba(150,220,130,.4)',
  prism: 'rgba(160,225,255,.5)',
};

interface Props {
  s: GameState;
  alpha: number;
  onCell: (lane: number, col: number) => PlaceResult | 'shovel' | 'none';
  /**
   * Decorative margin around the playfield, in stage px. The frame grows to
   * `1080 + left + right` by `600 + top + bottom` so the stage can cover a
   * viewport of any aspect without letterboxing; `StageDecor` paints that extra
   * room as forest. Every game coordinate stays inside the 1080×600 playfield.
   */
  pad?: StagePad;
}

export default function Board({ s, alpha, onCell, pad = NO_PAD }: Props) {
  const [hover, setHover] = useState<{ lane: number; col: number } | null>(null);
  const [reject, setReject] = useState<{ lane: number; col: number; msg: string; n: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const frameW = STAGE_W + pad.left + pad.right;
  const frameH = STAGE_H + pad.top + pad.bottom;
  /**
   * Built once per pad size: the element's identity is stable between resizes,
   * so React skips this whole decorative subtree on each of the 60fps renders.
   */
  const decor = useMemo(() => {
    if (pad.left < 6 && pad.right < 6 && pad.top < 6 && pad.bottom < 6) return null;
    return <StageDecor pad={pad} frameH={frameH} />;
  }, [pad, frameH]);

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
      className="stage-viewport relative touch-none select-none overflow-hidden rounded-2xl border border-[#2b4430] bg-[#0c1710]"
      style={{ width: frameW, height: frameH }}
    >
      {/* ambient backdrop — spans the whole frame, padding included, so the
          stage never shows a seam where the playfield ends */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 20% 0%, #16281a 0%, #0c1710 45%, #070d09 100%)' }} />
        {/* blight glow from the east, anchored to the frame's edge, not the grid's */}
        <div
          className="absolute inset-y-0 right-0"
          style={{ width: 220 + pad.right, background: 'linear-gradient(to left, rgba(150,60,130,.22), transparent)' }}
        />
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

      {/* the forest that fills any margin around the playfield */}
      {decor}

      {/* vignette: holds the eye on the clearing, over the decor only */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 110px rgba(4,9,6,.6), inset 0 0 34px rgba(4,9,6,.45)' }}
      />

      {/* the clearing reads a touch brighter than the trees around it */}
      {decor && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: pad.left,
            top: pad.top,
            width: STAGE_W,
            height: STAGE_H,
            background: 'radial-gradient(68% 62% at 42% 46%, rgba(150,225,160,.075), transparent 72%)',
          }}
        />
      )}

      {/* ── the playfield: every game coordinate lives in this 1080×600 box ── */}
      <div
        ref={stageRef}
        className={`absolute ${armed ? 'cursor-crosshair' : ''}`}
        style={{ left: pad.left, top: pad.top, width: STAGE_W, height: STAGE_H }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onPointerDown={handleDown}
        onContextMenu={(e) => e.preventDefault()}
      >
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

        {/* Tunnel Larva no-go zone: columns the burrowers ignore (cols 6–8) */}
        {s.level.waves.some((w) => w.groups.some((g) => g.type === 'larva')) && (
          <div
            className="pointer-events-none absolute z-[8]"
            style={{ left: px(6), top: GRID_Y, width: CELL_W * 3, height: CELL_H * LANES }}
            title="Tunnel Larva burrow beneath these columns — plants here won't stop them"
          >
            <div
              className="h-full w-full opacity-[.16]"
              style={{
                background:
                  'repeating-linear-gradient(135deg, #6b5433 0 10px, transparent 10px 22px)',
                maskImage: 'linear-gradient(180deg, transparent, black 30%)',
                WebkitMaskImage: 'linear-gradient(180deg, transparent, black 30%)',
              }}
            />
            <div className="absolute -top-[1px] left-1 rounded bg-[#33270f]/90 px-1.5 font-ui text-[10px] font-bold tracking-wider text-[#c9a86a]">
              BURROWED
            </div>
          </div>
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
          <EnemyView key={e.id} e={e} alpha={alpha} now={s.t} />
        ))}

        {/* Emberlash beams — a held line of fire, not a volley */}
        <svg
          className="pointer-events-none absolute z-[58] overflow-visible"
          style={{ left: 0, top: 0, width: STAGE_W, height: STAGE_H }}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
        >
          {s.grid.flat().flatMap((f) => {
            if (!f || f.beamId === null) return [];
            const target = s.enemies.find((e) => e.id === f.beamId);
            if (!target) return [];
            const ex = target.prevX + (target.x - target.prevX) * alpha;
            const x1 = px(f.col) + 66;
            const y1 = laneY(f.lane) + CELL_H / 2 - 20;
            const x2 = px(ex);
            const y2 = laneY(target.lane) + CELL_H / 2 - 10;
            return [
              <line key={`b1-${f.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff6a1f" strokeWidth="7" strokeLinecap="round" opacity="0.55" />,
              <line key={`b2-${f.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff9a3d" strokeWidth="4" strokeLinecap="round" opacity="0.9" />,
              <line key={`b3-${f.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff3c4" strokeWidth="1.8" strokeLinecap="round" />,
            ];
          })}
        </svg>

        {/* projectiles */}
        {s.projs.map((p) => {
          const x = p.prevX + (p.x - p.prevX) * alpha;
          const w =
            p.kind === 'frost' ? 20 : p.kind === 'ray' ? 34 : p.kind === 'cinder' ? 30 : p.kind === 'bind' ? 32
            : p.kind === 'bolt' ? 40 : p.kind === 'needle' ? 24 : p.kind === 'gale' ? 44 : 30;
          const h =
            p.kind === 'frost' ? 20 : p.kind === 'cinder' ? 24 : p.kind === 'bind' ? 18
            : p.kind === 'bolt' ? 22 : p.kind === 'needle' ? 10 : p.kind === 'gale' ? 30 : 12;
          const glow =
            p.kind === 'frost' ? '#9fdcff'
            : p.kind === 'ray' ? '#ffd76a'
            : p.kind === 'cinder' ? '#ff9a3d'
            : p.kind === 'root' ? '#c9a86a'
            : p.kind === 'bind' ? '#7fe0c0'
            : p.kind === 'bolt' ? '#cdd6de'
            : p.kind === 'needle' ? '#e8f0c8'
            : p.kind === 'gale' ? '#dff5ff'
            : '#a4ffb8';
          // Deeproot rounds travel beneath the turf; Watchvine/Bindweed can fire west.
          const sink = p.underground ? 34 : 0;
          return (
            <div
              key={p.id}
              className="pointer-events-none absolute"
              style={{
                left: px(x) - w / 2,
                top: laneY(p.lane) + CELL_H / 2 - h / 2 - 6 + sink,
                width: w,
                height: h,
                zIndex: p.underground ? 14 : 60,
                opacity: p.underground ? 0.9 : 1,
                transform: p.dir === -1 ? 'scaleX(-1)' : undefined,
                filter: `drop-shadow(0 0 6px ${glow})`,
              }}
            >
              <ProjSprite kind={p.kind} />
            </div>
          );
        })}

        {/* enemy spines (Locust Rangers) */}
        {s.eprojs.map((p) => {
          const x = p.prevX + (p.x - p.prevX) * alpha;
          return (
            <div
              key={p.id}
              className="pointer-events-none absolute"
              style={{
                left: px(x) - 15,
                top: laneY(p.lane) + CELL_H / 2 - 16,
                width: 30,
                height: 12,
                zIndex: 58,
                filter: 'drop-shadow(0 0 6px rgba(255,207,107,.8))',
              }}
            >
              <EProjSprite />
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

        {/* Blight fog over the east margin. Enemies are born just past the
            playfield's right edge (x = 9.4 columns), so when the frame is
            wider than the field they would otherwise pop into view in open
            ground; the murk turns that into an entrance. Above the world
            (z-75) but under the wave banner's own layer. */}
        {pad.right > 12 && (
          <div
            className="pointer-events-none absolute z-[75]"
            style={{ left: STAGE_W - 96, top: -pad.top, width: pad.right + 96, height: frameH }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(150,60,130,0) 0%, rgba(150,60,130,.12) 58%, rgba(112,42,104,.38) 100%)' }}
            />
            <div
              className="anim-mist absolute inset-y-0 right-0 w-2/3"
              style={{ background: 'radial-gradient(60% 42% at 68% 46%, rgba(195,143,184,.16), transparent 72%)' }}
            />
            <div
              className="anim-mist absolute inset-y-0 right-0 w-1/3"
              style={{
                background: 'radial-gradient(50% 30% at 70% 68%, rgba(255,150,220,.1), transparent 70%)',
                animationDelay: '-1.6s',
              }}
            />
          </div>
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
        filter: `drop-shadow(0 0 7px ${FLORA_GLOW[f.key]}) ${f.flash > 0 ? 'brightness(1.8) saturate(1.4)' : ''} ${f.prod > 0 ? 'brightness(1.5)' : ''} ${f.withered ? 'saturate(.45) brightness(.78) drop-shadow(0 0 8px rgba(168,208,122,.75))' : ''}`,
        transform: f.fired > 0 ? 'translateX(-3px)' : f.eatenBy !== null ? `translateX(${Math.sin(f.id * 7 + f.hp) * 1.5}px)` : undefined,
      }}
    >
      <FloraSprite
        k={f.key}
        hpFrac={f.hp / f.maxHp}
        beamOn={f.beamId !== null}
        armed={f.ambushT <= 0}
        fire={f.shotIdx % 2 === 1}
        riposteFlash={f.fired}
      />
      {/* muzzle flash */}
      {f.fired > 0 && (
        <div className="anim-pop absolute rounded-full" style={{ right: -4, top: f.key === 'sentinel' ? 18 : 16, width: 14, height: 14, background: f.key === 'frostcap' ? '#bfe9ff' : '#e5ff9d', filter: 'blur(1px)', boxShadow: '0 0 10px 4px rgba(220,255,160,.7)' }} />
      )}
      {/* Fen Wretch drain: this lane's harvest is being halved */}
      {f.withered && (
        <div className="pointer-events-none absolute" style={{ left: 8, top: 2, width: 72, height: 88 }}>
          <div className="anim-mist absolute inset-0 rounded-full border-2 border-[#a8d07a]/70" />
          <div className="anim-floatup absolute left-1/2 -translate-x-1/2 font-ui text-[13px] font-black" style={{ top: -12, color: '#c8e88a', textShadow: '0 0 8px rgba(90,122,58,.95), 0 2px 2px #000' }}>
            −50%
          </div>
        </div>
      )}
      {/* production halo */}
      {f.prod > 0 && <div className="anim-ringburst absolute rounded-full border-2 border-[#ffd76a]" style={{ left: 6, top: 4, width: 76, height: 76 }} />}
      {/* Ambush Fern: pale while folded and armed, dim while it recharges */}
      {f.key === 'ambush' && (
        <div
          className={`absolute rounded-full border ${f.ambushT <= 0 ? 'anim-breathe border-[#ffd76a]/60' : 'border-[#4a5a3a]/50'}`}
          style={{ left: 10, top: 4, width: 68, height: 84 }}
        />
      )}
      {/* snaptrap jaws shimmer, ready for something small */}
      {f.key === 'snaptrap' && <div className="anim-breathe absolute rounded-full border border-[#ff9fb8]/50" style={{ left: 10, top: 4, width: 68, height: 84 }} />}
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

function EnemyView({ e, alpha, now }: { e: EnemyEnt; alpha: number; now: number }) {
  const def = ENEMIES[e.key];
  const ex = e.prevX + (e.x - e.prevX) * alpha;
  const scale = def.scale;
  const w = 80 * (def.boss && e.key !== 'brute' ? 2.2 : scale);
  const flyLift = def.flying ? 36 : 0;
  const slowed = e.slowPct > 0; // engine clears slowUntil, but tint is fine while flagged
  // Mite Vaulter mid-leap: rising arc offset
  const jumpProg = e.jumpT > 0 ? 1 - e.jumpT / 0.45 : 0;
  const arcLift = jumpProg > 0 ? Math.sin(jumpProg * Math.PI) * 52 : 0;
  const windupFrac = def.smashWindup ? Math.min(1, e.windup / def.smashWindup) : 0;
  const fleeing = !!e.carrying; // Root Thief running loot home
  const rooted = e.rootUntil > now; // Bindweed Snare has it pinned
  // ── Enemy Batch 2 state ──
  const drCap = def.drCap ?? 0.85;
  const shielded = e.drPct > 0 && e.drUntil > now; // Grovemaw Slug's absorbed film
  const dashing = e.dashT > 0; // Nightcap Assassin / Iron Nightstalker mid-sprint
  const warded = e.immuneTo !== null; // Hollow King has a damage channel shut
  // ── Enemy Batch 3 state ──
  const plated = e.shieldUp; // Nightstalker: the plate is up — the next hit is wasted
  const domed = e.wardUp; // Wardshell Grub: the surprise ward is standing in this tile
  const regrowing = !!def.regrowHp && e.regrowT >= (def.regrowEvery ?? 2) * 0.5; // the knit is close
  const repositioning = e.retreatTo >= 0; // Nightstalker bounding back to re-arm
  const barTop = shielded || (e.maxShell > 0 && e.shell > 0) || (e.maxStone > 0 && e.stone > 0) ? -15 : -8;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: px(ex) - w / 2,
        top: laneY(e.lane) + CELL_H - 6 - w - flyLift - arcLift,
        width: w,
        height: w,
        zIndex:
          e.burrowed
            ? 12 + e.lane // the dirt mound slides beneath everything
            : 24 + e.lane + (def.flying ? 30 : 0),
        filter: `drop-shadow(0 0 8px ${ENEMY_GLOW[e.key]}) ${e.hitFlash > 0 ? 'brightness(2) saturate(1.6)' : ''} ${slowed ? 'drop-shadow(0 0 6px rgba(140,215,255,.8)) hue-rotate(-12deg)' : ''} ${e.stunT > 0 ? 'saturate(.6) brightness(.85)' : ''} ${rooted ? 'drop-shadow(0 0 8px rgba(127,224,192,.9))' : ''} ${shielded ? 'drop-shadow(0 0 10px rgba(168,255,208,.9))' : ''} ${dashing ? 'blur(0.6px) brightness(1.25)' : ''} ${e.enraged ? 'brightness(1.35) saturate(1.7) drop-shadow(0 0 14px rgba(255,80,80,.95))' : ''} ${warded ? 'drop-shadow(0 0 12px rgba(127,212,255,.9))' : ''} ${plated ? 'drop-shadow(0 0 10px rgba(205,214,222,.95))' : ''} ${domed ? 'drop-shadow(0 0 8px rgba(216,180,255,.85))' : ''} ${regrowing ? 'drop-shadow(0 0 8px rgba(126,231,135,.85))' : ''} ${repositioning ? 'brightness(1.15) blur(0.4px)' : ''}`,
        transform: `${e.chewing ? 'translateX(-2px) rotate(-1.5deg)' : ''} ${e.jumpT > 0 ? `rotate(${jumpProg * -14}deg)` : ''} ${fleeing || repositioning ? 'scaleX(-1)' : ''}`,
        opacity: e.burrowed ? 0.85 : 1,
      }}
    >
      {/* spawn fade-in */}
      <div className="h-full w-full anim-fadein" style={{ animationDuration: '0.35s' }}>
        <EnemySprite
          k={e.key}
          shellFrac={e.maxShell ? e.shell / e.maxShell : 0}
          phase={e.phase}
          stoneFrac={e.maxStone ? e.stone / e.maxStone : 0}
          burrowed={e.burrowed}
          windupFrac={windupFrac}
          carrying={fleeing}
          molted={!e.canSplit}
          shieldFrac={shielded ? e.drPct / drCap : 0}
          dashing={dashing}
          warded={warded}
          regrowing={regrowing}
          plated={plated}
          domed={domed}
        />
      </div>
      {/* Bindweed Snare: living ropes pinning it to the ground */}
      {rooted && (
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <path d="M6 96 C 24 82 32 68 36 54" fill="none" stroke="#2f8f7a" strokeWidth="6" strokeLinecap="round" />
          <path d="M94 96 C 76 82 68 68 64 54" fill="none" stroke="#2f8f7a" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 98 C 46 82 46 72 50 62" fill="none" stroke="#63d99a" strokeWidth="5" strokeLinecap="round" />
          <path d="M20 86 l -8 -10 M 80 86 l 8 -10 M 50 88 l -3 -12" stroke="#eaffd9" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="52" r="46" fill="none" stroke="#7fe0c0" strokeWidth="3" opacity="0.45" className="anim-pulse-ring" />
        </svg>
      )}
      {/* the hauled Flora, held aloft */}
      {fleeing && e.carrying && (
        <div
          className="absolute anim-bob"
          style={{ left: w / 2 - 26, top: -46, width: 52, height: 56, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.5))', zIndex: 1 }}
        >
          <FloraSprite k={e.carrying.key} hpFrac={e.carrying.hp / e.carrying.maxHp} />
        </div>
      )}
      {/* husk smash telegraph: a shrinking ring over the doomed plant */}
      {windupFrac > 0 && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: w + 2, width: 64, height: 8 }}
        >
          <div className="absolute inset-y-0 left-0 w-full overflow-hidden rounded-full border border-[#ff5d7c]/60 bg-[#1a0a10]/90">
            <div
              className="h-full"
              style={{ width: `${windupFrac * 100}%`, background: windupFrac > 0.6 ? '#ff3d3d' : '#ff9a3d' }}
            />
          </div>
        </div>
      )}
      {/* Grovemaw Slug: the absorbed film, thickening with everything it ate */}
      {shielded && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -22, width: 46, height: 5, background: 'rgba(8,16,14,.85)', borderRadius: 3, border: '1px solid rgba(168,255,208,.5)' }}>
          <div className="h-full rounded-[2px]" style={{ width: `${(e.drPct / drCap) * 100}%`, background: 'linear-gradient(90deg,#4fbf7a,#a8ffd0)' }} />
        </div>
      )}
      {/* stoneback slab pips (above hp bar) */}
      {e.maxStone > 0 && e.stone > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -8, width: 46, height: 5, background: 'rgba(8,16,14,.85)', borderRadius: 3, border: '1px solid rgba(200,195,175,.5)' }}>
          <div className="h-full rounded-[2px]" style={{ width: `${(e.stone / e.maxStone) * 100}%`, background: 'linear-gradient(90deg,#b9b3a4,#e8e2cf)' }} />
        </div>
      )}
      {/* shell pips */}
      {e.maxShell > 0 && e.shell > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -8, width: 46, height: 5, background: 'rgba(8,16,14,.85)', borderRadius: 3, border: '1px solid rgba(103,224,198,.4)' }}>
          <div className="h-full rounded-[2px]" style={{ width: `${(e.shell / e.maxShell) * 100}%`, background: 'linear-gradient(90deg,#67e0c6,#a8fff0)' }} />
        </div>
      )}
      {/* hp bar for damaged enemies (kept slim to avoid clutter) */}
      {!def.boss && !e.burrowed && e.hp < e.maxHp && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: barTop, width: 40, height: 4, background: 'rgba(8,16,14,.85)', borderRadius: 2 }}>
          <div className="h-full rounded-[2px]" style={{ width: `${(e.hp / e.maxHp) * 100}%`, background: '#ff7d95' }} />
        </div>
      )}
      {/* stunned imp: seeing spores */}
      {e.stunT > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 anim-twinkle" style={{ top: -20, fontSize: 15, letterSpacing: 4 }}>✦✧✦</div>
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
  // ── Batch 1 fx ──
  if (fx.kind === 'stolen') {
    return (
      <div
        className="anim-floatup pointer-events-none absolute z-[80] whitespace-nowrap font-ui text-[18px] font-extrabold"
        style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + 22, color: '#ff7d95', textShadow: '0 0 10px rgba(255,93,124,.8), 0 2px 2px rgba(0,0,0,.6)' }}
      >
        STOLEN!
      </div>
    );
  }
  if (fx.kind === 'cata') {
    // incoming Spore Imp: a target reticle burning into the tile
    return (
      <div className="pointer-events-none absolute z-[56]" style={{ left: px(fx.x) - CELL_W / 2, top: laneY(fx.lane), width: CELL_W, height: CELL_H }}>
        <div className="anim-pulse-ring absolute inset-2 rounded-xl border-2 border-dashed border-[#ff5d7c]/85" style={{ background: 'radial-gradient(circle, rgba(255,93,124,.16), transparent 70%)' }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-ui text-[22px] font-black text-[#ff9db1] anim-breathe">✕</div>
      </div>
    );
  }
  if (fx.kind === 'land') {
    return (
      <div className="pointer-events-none absolute z-[64]" style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + CELL_H / 2 - 38 }}>
        <div className="anim-shockwave rounded-full border-4 border-[#c9a86a]" style={{ width: 68, height: 68 }} />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2 + 0.4;
          return (
            <div
              key={i}
              className="anim-burst absolute rounded-full"
              style={{ width: 7, height: 7, left: 30, top: 30, background: '#8a6f4c', ['--bx' as string]: `${Math.cos(a) * 32}px`, ['--by' as string]: `${Math.sin(a) * 22 - 10}px` }}
            />
          );
        })}
      </div>
    );
  }
  if (fx.kind === 'dirt' || fx.kind === 'emerge') {
    const big = fx.kind === 'emerge';
    return (
      <div className="pointer-events-none absolute z-[64]" style={{ left: px(fx.x) - (big ? 40 : 24), top: laneY(fx.lane) + CELL_H / 2 - (big ? 34 : 30) }}>
        <div className="anim-puff rounded-full" style={{ width: big ? 80 : 48, height: big ? 54 : 40, background: 'radial-gradient(circle, #7a614255 0%, transparent 70%)' }} />
        {Array.from({ length: big ? 8 : 5 }).map((_, i) => {
          const a = (i / (big ? 8 : 5)) * Math.PI * 2 + 0.7;
          return (
            <div
              key={i}
              className="anim-burst absolute rounded-full"
              style={{ width: 6 + (i % 2) * 3, height: 6 + (i % 2) * 3, left: big ? 36 : 20, top: big ? 24 : 18, background: i % 2 ? '#8a6f4c' : '#5a4630', ['--bx' as string]: `${Math.cos(a) * (big ? 46 : 28)}px`, ['--by' as string]: `${Math.sin(a) * (big ? 30 : 20) - 12}px` }}
            />
          );
        })}
      </div>
    );
  }
  if (fx.kind === 'smash') {
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 50, top: laneY(fx.lane) + CELL_H / 2 - 56 }}>
        <div className="anim-shockwave rounded-full border-4 border-[#ffb37a]" style={{ width: 100, height: 100 }} />
        <div className="anim-puff absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,154,61,.4) 0%, transparent 65%)' }} />
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <div
              key={i}
              className="anim-burst absolute rounded-sm"
              style={{ width: 9, height: 5, left: 46, top: 46, background: '#c9a86a', transform: `rotate(${i * 51}deg)`, ['--bx' as string]: `${Math.cos(a) * 52}px`, ['--by' as string]: `${Math.sin(a) * 36}px` }}
            />
          );
        })}
      </div>
    );
  }
  if (fx.kind === 'grab') {
    return (
      <div className="pointer-events-none absolute z-[68]" style={{ left: px(fx.x) - 26, top: laneY(fx.lane) + CELL_H - 96 }}>
        <div className="anim-floatup font-ui text-[19px] font-black" style={{ color: '#ffd76a', textShadow: '0 0 10px rgba(255,215,106,.7), 0 2px 2px rgba(0,0,0,.6)' }}>GRAB!</div>
        <div className="anim-ringburst absolute -left-2 top-2 rounded-full border-2 border-[#ffd76a]" style={{ width: 52, height: 52 }} />
      </div>
    );
  }
  if (fx.kind === 'drop') {
    return (
      <div className="pointer-events-none absolute z-[68]" style={{ left: px(fx.x) - 24, top: laneY(fx.lane) + CELL_H / 2 - 30 }}>
        <div className="anim-puff rounded-full" style={{ width: 48, height: 48, background: 'radial-gradient(circle, #a3f2a055 0%, transparent 70%)' }} />
        <div className="anim-floatup absolute -top-4 left-0 font-ui text-[14px] font-extrabold" style={{ color: '#a3f2a0', textShadow: '0 1px 3px #000' }}>DROPPED</div>
      </div>
    );
  }
  if (fx.kind === 'shieldbreak') {
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H / 2 - 36 }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.3;
          return (
            <div
              key={i}
              className="anim-burst absolute rounded-sm"
              style={{ width: 8 + (i % 3) * 3, height: 6 + (i % 2) * 3, left: 26, top: 26, background: i % 2 ? '#c9c2b0' : '#8f8a7c', transform: `rotate(${i * 47}deg)`, ['--bx' as string]: `${Math.cos(a) * 42}px`, ['--by' as string]: `${Math.sin(a) * 30 - 8}px` }}
            />
          );
        })}
      </div>
    );
  }
  if (fx.kind === 'deflect') {
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 14, top: laneY(fx.lane) + CELL_H / 2 - 34 }}>
        <svg viewBox="0 0 28 28" width={28} height={28} className="anim-pop">
          <path d="M14 3 L 18 12 L 27 14 L 18 16 L 14 25 L 10 16 L 1 14 L 10 12 Z" fill="#fff3c4" stroke="#0d1b13" strokeWidth="1.6" />
        </svg>
      </div>
    );
  }
  // ── Flora Batch 1 fx ──
  if (fx.kind === 'boom') {
    // Cinderpod blast: a full tile of fire, in-lane
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 52, top: laneY(fx.lane) + CELL_H / 2 - 52, width: 104, height: 104 }}>
        <div className="anim-shockwave absolute inset-0 rounded-full border-4 border-[#ff9a3d]" style={{ background: 'radial-gradient(circle, rgba(255,215,106,.55) 0%, rgba(217,96,46,.35) 45%, transparent 72%)' }} />
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2 + 0.3;
          return (
            <div
              key={i}
              className="anim-burst absolute rounded-full"
              style={{ width: 9 + (i % 3) * 4, height: 9 + (i % 3) * 4, left: 47, top: 47, background: i % 2 ? '#ffd76a' : '#ff7a3d', ['--bx' as string]: `${Math.cos(a) * 46}px`, ['--by' as string]: `${Math.sin(a) * 32}px` }}
            />
          );
        })}
      </div>
    );
  }
  if (fx.kind === 'snap') {
    return (
      <div className="pointer-events-none absolute z-[70]" style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + CELL_H / 2 - 34, width: 68, height: 68 }}>
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <path d="M4 52 C 18 34 40 30 50 40 C 60 30 82 34 96 52 C 80 46 62 46 50 54 C 38 46 20 46 4 52 Z" fill="#c7385f" stroke="#0a140f" strokeWidth="3" strokeLinejoin="round" className="anim-pop" />
          <path d="M22 44 l 4 9 l -9 -1 Z M 44 38 l 3 9 l -9 -2 Z M 56 38 l 6 7 l -9 2 Z M 78 44 l 9 8 l -9 1 Z" fill="#fff3e0" stroke="#0a140f" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div className="anim-floatup absolute -top-2 left-1/2 -translate-x-1/2 font-ui text-[15px] font-black" style={{ color: '#ff9fb8', textShadow: '0 0 10px rgba(199,56,95,.9), 0 2px 2px #000' }}>
          SNAP!
        </div>
      </div>
    );
  }
  if (fx.kind === 'root') {
    return (
      <div className="pointer-events-none absolute z-[64]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H / 2 - 34 }}>
        <svg viewBox="0 0 60 68" width={60} height={68} className="overflow-visible">
          <path d="M30 66 C 12 56 8 40 14 22" fill="none" stroke="#2f8f7a" strokeWidth="5" strokeLinecap="round" className="anim-pop" />
          <path d="M30 66 C 48 56 52 40 46 22" fill="none" stroke="#2f8f7a" strokeWidth="5" strokeLinecap="round" className="anim-pop" />
          <path d="M30 68 C 26 50 26 40 30 28" fill="none" stroke="#63d99a" strokeWidth="4" strokeLinecap="round" />
          <path d="M14 30 l -8 -6 M 46 30 l 8 -6 M 30 24 l -4 -10" stroke="#eaffd9" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'absorb') {
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H / 2 - 36 }}>
        <div className="anim-ringburst absolute rounded-full border-[3px] border-[#ffcf6b]" style={{ left: 8, top: 8, width: 44, height: 44 }} />
        <svg viewBox="0 0 60 60" width={60} height={60} className="anim-pop overflow-visible">
          <path d="M30 6 C 44 12 50 20 48 32 C 46 44 38 50 30 54 C 22 50 14 44 12 32 C 10 20 16 12 30 6 Z" fill="none" stroke="#ffcf6b" strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 30 l 6 8 l 14 -18" fill="none" stroke="#fff3c4" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'lotus') {
    return (
      <div className="pointer-events-none absolute z-[72]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H - 104 }}>
        <div className="anim-ringburst absolute rounded-full border-2 border-[#ffd7ef]" style={{ left: 6, top: 18, width: 48, height: 48 }} />
        <div className="anim-floatup absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[14px] font-black" style={{ color: '#ffd7ef', textShadow: '0 0 10px rgba(217,127,180,.9), 0 2px 2px #000' }}>
          {fx.text ?? '−1s TRAY'}
        </div>
      </div>
    );
  }
  if (fx.kind === 'under') {
    return (
      <div className="pointer-events-none absolute z-[18]" style={{ left: px(fx.x) - 26, top: laneY(fx.lane) + CELL_H / 2 + 16 }}>
        <div className="anim-puff rounded-full" style={{ width: 52, height: 34, background: 'radial-gradient(circle, #7a614266 0%, transparent 70%)' }} />
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2 + 0.5;
          return (
            <div key={i} className="anim-burst absolute rounded-full" style={{ width: 6, height: 6, left: 23, top: 14, background: i % 2 ? '#8a6f4c' : '#c9b878', ['--bx' as string]: `${Math.cos(a) * 24}px`, ['--by' as string]: `${Math.sin(a) * 16}px` }} />
          );
        })}
      </div>
    );
  }
  // ── Flora Batch 2 fx ──
  if (fx.kind === 'riposte') {
    // Sentinel Bloom: barbs snapping out at something that tried to run past
    return (
      <div className="pointer-events-none absolute z-[70]" style={{ left: px(fx.x) - 32, top: laneY(fx.lane) + CELL_H / 2 - 36, width: 64, height: 64 }}>
        <div className="anim-ringburst absolute rounded-full border-[3px] border-[#c9b8ee]" style={{ left: 6, top: 6, width: 52, height: 52 }} />
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <path d="M14 84 L 84 16 M 84 84 L 16 16" stroke="#e6dcff" strokeWidth="6" strokeLinecap="round" className="anim-pop" />
          <path d="M50 6 L 50 30 M 50 70 L 50 94 M 6 50 L 30 50 M 70 50 L 94 50" stroke="#c9b8ee" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'ambush') {
    return (
      <div className="pointer-events-none absolute z-[70]" style={{ left: px(fx.x) - 36, top: laneY(fx.lane) + CELL_H / 2 - 40, width: 72, height: 72 }}>
        <div className="anim-shockwave absolute inset-0 rounded-full border-4 border-[#8fd06a]" style={{ background: 'radial-gradient(circle, rgba(143,208,106,.5) 0%, rgba(63,122,60,.3) 45%, transparent 72%)' }} />
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <path d="M20 84 C 6 64 8 40 22 26" fill="none" stroke="#4f8f4a" strokeWidth="7" strokeLinecap="round" className="anim-pop" />
          <path d="M80 84 C 94 64 92 40 78 26" fill="none" stroke="#4f8f4a" strokeWidth="7" strokeLinecap="round" className="anim-pop" />
          <path d="M22 26 l 12 -8 M 78 26 l -12 -8 M 30 40 l 12 -4 M 70 40 l -12 -4" stroke="#e8f0c8" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <div className="anim-floatup absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[15px] font-black" style={{ color: '#c8e88a', textShadow: '0 0 10px rgba(79,143,74,.95), 0 2px 2px #000' }}>
          AMBUSH!
        </div>
      </div>
    );
  }
  if (fx.kind === 'gale') {
    // the gust itself, and where it ended up
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 40, top: laneY(fx.lane) + CELL_H / 2 - 30 }}>
        <svg viewBox="0 0 80 60" width={80} height={60} className="anim-burst overflow-visible">
          <path d="M76 14 C 56 8 26 12 6 22" fill="none" stroke="#dff5ff" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M78 30 C 58 24 28 28 4 38" fill="none" stroke="#a8e0f0" strokeWidth="4" strokeLinecap="round" />
          <path d="M72 46 C 54 42 30 46 14 54" fill="none" stroke="#dff5ff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // ── Enemy Batch 2 fx ──
  if (fx.kind === 'molt') {
    // Molt Wisp coming apart — a husk peeling open along its seam
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + CELL_H / 2 - 40 }}>
        <div className="anim-ringburst absolute rounded-full border-[3px] border-[#ffd76a]" style={{ left: 8, top: 8, width: 52, height: 52 }} />
        <svg viewBox="0 0 68 68" width={68} height={68} className="anim-pop overflow-visible">
          <path d="M34 8 C 48 16 54 30 48 44 C 42 56 26 56 20 44 C 14 30 20 16 34 8 Z" fill="none" stroke="#e8d9a0" strokeWidth="3" strokeLinejoin="round" strokeDasharray="7 5" />
          <path d="M34 6 L 34 58" stroke="#ffb15e" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        <div className="anim-floatup absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[13px] font-black" style={{ color: '#ffd76a', textShadow: '0 0 10px rgba(255,183,77,.9), 0 2px 2px #000' }}>
          MOLT!
        </div>
      </div>
    );
  }
  if (fx.kind === 'feed') {
    // Grovemaw Slug swallowing the status effect whole
    return (
      <div className="pointer-events-none absolute z-[68]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H / 2 - 42 }}>
        <div className="anim-ringburst absolute rounded-full border-2 border-[#a8ffd0]" style={{ left: 6, top: 8, width: 48, height: 48 }} />
        <svg viewBox="0 0 60 60" width={60} height={60} className="anim-pop overflow-visible">
          <path d="M30 52 C 16 44 12 28 20 16 C 28 6 44 8 48 20 C 51 30 44 40 36 42" fill="none" stroke="#a8ffd0" strokeWidth="3" strokeLinecap="round" />
          <path d="M36 42 l 8 2 l -3 8" fill="none" stroke="#eaffe0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="anim-floatup absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[13px] font-black" style={{ color: '#a8ffd0', textShadow: '0 0 10px rgba(99,217,154,.9), 0 2px 2px #000' }}>
          EATEN
        </div>
      </div>
    );
  }
  if (fx.kind === 'shrug') {
    // Barkskin Marauder throwing a Bindweed lash off
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 26, top: laneY(fx.lane) + CELL_H / 2 - 34 }}>
        <svg viewBox="0 0 52 52" width={52} height={52} className="anim-pop overflow-visible">
          <path d="M10 42 C 6 28 14 14 26 12 M 42 42 C 46 28 38 14 26 12" fill="none" stroke="#8a6a44" strokeWidth="4" strokeLinecap="round" />
          <path d="M18 20 l -8 -8 M 34 20 l 8 -8 M 26 12 l 0 -10" stroke="#7fbf5f" strokeWidth="3.4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'dash') {
    // Nightcap Assassin sprint blur
    return (
      <div className="pointer-events-none absolute z-[64]" style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + CELL_H / 2 - 24 }}>
        <svg viewBox="0 0 68 44" width={68} height={44} className="anim-burst overflow-visible">
          <path d="M66 8 L 18 8 M 64 22 L 6 22 M 66 36 L 22 36" stroke="#c9b8ee" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'strike') {
    // the single back-row burst
    return (
      <div className="pointer-events-none absolute z-[70]" style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + CELL_H / 2 - 34, width: 68, height: 68 }}>
        <div className="anim-shockwave absolute inset-0 rounded-full border-4 border-[#c9b8ee]" style={{ background: 'radial-gradient(circle, rgba(201,184,238,.5) 0%, rgba(90,74,140,.3) 45%, transparent 72%)' }} />
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <path d="M86 10 L 18 80" stroke="#dfe6ff" strokeWidth="6" strokeLinecap="round" className="anim-pop" />
          <path d="M80 6 L 94 18" stroke="#0a140f" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'ward') {
    // the Hollow King shutting a damage channel off — or a hit bouncing off it
    return (
      <div className="pointer-events-none absolute z-[68]" style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + CELL_H / 2 - 42 }}>
        <div className="anim-ringburst absolute rounded-full border-[3px] border-[#7fd4ff]" style={{ left: 6, top: 10, width: 56, height: 56 }} />
        <svg viewBox="0 0 68 68" width={68} height={68} className="anim-pop overflow-visible">
          <path d="M34 6 L 58 16 L 58 38 C 58 54 46 62 34 66 C 22 62 10 54 10 38 L 10 16 Z" fill="none" stroke="#7fd4ff" strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M22 34 l 9 10 l 18 -20" fill="none" stroke="#e6f6ff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'enrage') {
    return (
      <div className="pointer-events-none absolute z-[72]" style={{ left: px(fx.x) - 60, top: laneY(fx.lane) + CELL_H / 2 - 64, width: 120, height: 120 }}>
        <div className="anim-shockwave absolute inset-0 rounded-full border-4 border-[#ff3d3d]" style={{ background: 'radial-gradient(circle, rgba(255,61,61,.45) 0%, rgba(255,154,61,.25) 45%, transparent 72%)' }} />
        <div className="anim-floatup absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[22px] font-black tracking-[0.18em]" style={{ color: '#ff7d95', textShadow: '0 0 14px rgba(255,61,61,.95), 0 2px 3px #000' }}>
          ENRAGED
        </div>
      </div>
    );
  }
  // ── Enemy Batch 3 fx ──
  if (fx.kind === 'regrow') {
    // Regrowth Husk: the seams pull shut and the wound knits itself closed
    return (
      <div className="pointer-events-none absolute z-[66]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H / 2 - 40 }}>
        <div className="anim-ringburst absolute rounded-full border-[3px] border-[#7ee787]" style={{ left: 6, top: 10, width: 48, height: 48 }} />
        <svg viewBox="0 0 60 60" width={60} height={60} className="anim-pop overflow-visible">
          <path d="M12 40 C 20 26 40 26 48 40 M 16 46 C 26 36 34 36 44 46" fill="none" stroke="#a3f2a0" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M22 30 l 1 10 M 30 28 l 0 11 M 38 30 l -1 10" stroke="#d9ffb0" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <div className="anim-floatup absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[15px] font-black" style={{ color: '#a3f2a0', textShadow: '0 0 10px rgba(87,193,120,.95), 0 2px 2px #000' }}>
          {fx.text ?? 'KNIT'}
        </div>
      </div>
    );
  }
  if (fx.kind === 'resist') {
    // Cinder Golem: a fire hit lands and the clay drinks half of it
    return (
      <div className="pointer-events-none absolute z-[65]" style={{ left: px(fx.x) - 24, top: laneY(fx.lane) + CELL_H / 2 - 36 }}>
        <div className="anim-puff rounded-full" style={{ width: 48, height: 40, background: 'radial-gradient(circle, rgba(255,154,61,.5) 0%, transparent 70%)' }} />
        <svg viewBox="0 0 48 40" width={48} height={40} className="anim-pop absolute inset-0 overflow-visible">
          <path d="M10 30 C 8 20 14 12 24 10 C 34 8 40 16 38 26" fill="none" stroke="#ffd76a" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 6 l 5 8 M 36 12 l 6 2 M 12 18 l -6 4" stroke="#ff9a3d" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        <div className="anim-floatup absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[13px] font-black" style={{ color: '#ffcf6b', textShadow: '0 0 8px rgba(217,96,46,.95), 0 2px 2px #000' }}>
          HALF
        </div>
      </div>
    );
  }
  if (fx.kind === 'graze') {
    // Bulwark Roach: a small hit skitters off the plates
    return (
      <div className="pointer-events-none absolute z-[65]" style={{ left: px(fx.x) - 16, top: laneY(fx.lane) + CELL_H / 2 - 30 }}>
        <svg viewBox="0 0 32 32" width={32} height={32} className="anim-pop overflow-visible">
          <path d="M16 4 L 19 13 L 28 16 L 19 19 L 16 28 L 13 19 L 4 16 L 13 13 Z" fill="#e8d9a0" stroke="#0d1b13" strokeWidth="1.4" />
        </svg>
        <div className="anim-floatup absolute -top-2 left-4 font-ui text-[12px] font-black" style={{ color: '#c9c2b0', textShadow: '0 1px 2px #000' }}>1</div>
      </div>
    );
  }
  if (fx.kind === 'anchor') {
    // Boulder Toad: the gust slides off granite
    return (
      <div className="pointer-events-none absolute z-[64]" style={{ left: px(fx.x) - 34, top: laneY(fx.lane) + CELL_H / 2 - 30 }}>
        <svg viewBox="0 0 68 48" width={68} height={48} className="anim-burst overflow-visible">
          <path d="M64 12 C 46 6 22 10 6 20" fill="none" stroke="#dff5ff" strokeWidth="3.6" strokeLinecap="round" opacity="0.7" />
          <path d="M62 28 C 44 22 24 26 10 34" fill="none" stroke="#a8e0f0" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </svg>
        <div className="anim-puff absolute left-3 top-6 rounded-full" style={{ width: 44, height: 26, background: 'radial-gradient(circle, #8f8a7c66 0%, transparent 70%)' }} />
        <div className="anim-floatup absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[13px] font-black" style={{ color: '#d8d2c0', textShadow: '0 1px 2px #000' }}>UNMOVED</div>
      </div>
    );
  }
  if (fx.kind === 'plate') {
    // Iron Nightstalker: something hits the pauldron and the night just eats it
    return (
      <div className="pointer-events-none absolute z-[68]" style={{ left: px(fx.x) - 26, top: laneY(fx.lane) + CELL_H / 2 - 38 }}>
        <div className="anim-ringburst absolute rounded-full border-[3px] border-[#cdd6de]" style={{ left: 8, top: 10, width: 38, height: 38 }} />
        <svg viewBox="0 0 52 52" width={52} height={52} className="anim-pop overflow-visible">
          <path d="M14 20 C 22 10 38 10 44 22 C 38 30 24 32 16 28 Z" fill="#cdd6de" stroke="#0d1b13" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M8 10 l 8 8 M 46 8 l -6 8 M 26 2 l 0 8" stroke="#eef5ff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (fx.kind === 'shroud') {
    // Wardshell Grub: the dome catches the first touch of a tile and cracks free
    return (
      <div className="pointer-events-none absolute z-[68]" style={{ left: px(fx.x) - 30, top: laneY(fx.lane) + CELL_H / 2 - 42 }}>
        <div className="anim-shockwave absolute rounded-full border-[3px] border-[#d8b4ff]" style={{ left: 4, top: 6, width: 52, height: 52 }} />
        <svg viewBox="0 0 60 60" width={60} height={60} className="anim-pop overflow-visible">
          <path d="M10 38 C 6 20 20 8 32 8 C 46 8 56 20 52 36" fill="none" stroke="#d8b4ff" strokeWidth="2.8" strokeLinecap="round" strokeDasharray="10 6" />
          <path d="M30 8 L 26 20 L 36 24 L 30 34" fill="none" stroke="#f0e2ff" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
        <div className="anim-floatup absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[13px] font-black" style={{ color: '#d8b4ff', textShadow: '0 0 10px rgba(168,110,210,.9), 0 2px 2px #000' }}>
          NO SELL
        </div>
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
