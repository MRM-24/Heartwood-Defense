import { FastForward, Pause, Shovel, Skull, Volume2, VolumeX } from 'lucide-react';
import { ENEMIES, FLORA } from '../game/data';
import type { FloraKey, GameState } from '../game/types';
import { FloraSprite } from './sprites';

interface Props {
  s: GameState;
  speed: number;
  muted: boolean;
  /** Phone/tablet arrangement: trays in the thumb zone, controls in a top bar. */
  compact?: boolean;
  /**
   * Compact layout is rendered in pieces so the game screen can place the
   * board between/around them: `top` is the status strip, `tray` is the
   * portrait seed row, `rail` is the landscape side column. Omit `part` for
   * the combined desktop layout.
   */
  part?: 'top' | 'tray' | 'rail';
  /**
   * Landscape phone arrangement: the top strip drops the boss banner (the
   * game screen overlays it on the field so it never eats board height).
   */
  landscape?: boolean;
  /** False while paused or after the level ends. */
  interactive?: boolean;
  onSelect: (k: FloraKey) => void;
  onShovel: () => void;
  onSpeed: () => void;
  onPause: () => void;
  onMute: () => void;
}

/** Nectar balance + the passive-income sweep. */
function NectarPanel({ s, compact, slim }: { s: GameState; compact?: boolean; slim?: boolean }) {
  const incomeFrac = 1 - s.nectarT / 10;
  if (slim) {
    /* Landscape phones: height is the scarce dimension, so the counter goes
       horizontal and gives the board back ~20px of field. */
    return (
      <div
        className="relative flex shrink-0 items-center gap-2 rounded-xl border border-[#3a5a3f] bg-[#101d13]/90 px-2.5 shadow-[0_4px_20px_rgba(0,0,0,.4)]"
        aria-label={`${Math.floor(s.nectar)} nectar`}
      >
        <div className="anim-breathe-slow relative">
          <svg viewBox="0 0 40 48" width={19} height={23} aria-hidden>
            <defs>
              <radialGradient id="hud-nectar-slim" cx="0.4" cy="0.35" r="0.75">
                <stop offset="0" stopColor="#fff3c4" />
                <stop offset="0.6" stopColor="#ffd76a" />
                <stop offset="1" stopColor="#e09a2b" />
              </radialGradient>
            </defs>
            <path d="M20 2 C 28 14 36 22 36 32 A 16 16 0 0 1 4 32 C 4 22 12 14 20 2 Z" fill="url(#hud-nectar-slim)" stroke="#0a140f" strokeWidth="2.6" />
          </svg>
        </div>
        <span className="font-ui text-[19px] font-extrabold leading-none text-[#ffd76a] tabular-nums [text-shadow:0_2px_8px_rgba(224,154,43,.45)]">
          {Math.floor(s.nectar)}
        </span>
        <div className="h-[5px] w-[38px] overflow-hidden rounded-full bg-[#0a140f]" title={s.lotusT > 0 ? `Lotus: next drop in ${s.lotusT.toFixed(1)}s` : 'Next nectar drop'}>
          <div className="h-full rounded-full bg-[#a87c2a]" style={{ width: `${incomeFrac * 100}%` }} />
        </div>
        {s.lotusT > 0 && (
          <span className="font-ui text-[9px] font-extrabold tracking-wide text-[#ffd7ef]">LOTUS</span>
        )}
      </div>
    );
  }
  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-2xl border border-[#3a5a3f] bg-[#101d13]/90 shadow-[0_4px_20px_rgba(0,0,0,.4)] ${
        compact ? 'px-3 py-1.5' : 'min-w-[168px] px-4 py-2'
      }`}
    >
      <div className="anim-breathe-slow relative">
        <svg viewBox="0 0 40 48" width={compact ? 26 : 34} height={compact ? 32 : 42} aria-hidden>
          <defs>
            <radialGradient id="hud-nectar" cx="0.4" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#fff3c4" />
              <stop offset="0.6" stopColor="#ffd76a" />
              <stop offset="1" stopColor="#e09a2b" />
            </radialGradient>
          </defs>
          <path d="M20 2 C 28 14 36 22 36 32 A 16 16 0 0 1 4 32 C 4 22 12 14 20 2 Z" fill="url(#hud-nectar)" stroke="#0a140f" strokeWidth="2.6" />
          <ellipse cx="14" cy="26" rx="4" ry="6" fill="#fff8dd" opacity="0.8" transform="rotate(-18 14 26)" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span
          className={`font-ui font-extrabold leading-none text-[#ffd76a] tabular-nums [text-shadow:0_2px_8px_rgba(224,154,43,.45)] ${
            compact ? 'text-[22px]' : 'text-[30px]'
          }`}
          aria-label={`${Math.floor(s.nectar)} nectar`}
        >
          {Math.floor(s.nectar)}
        </span>
        <div className={`mt-1 h-[5px] overflow-hidden rounded-full bg-[#0a140f] ${compact ? 'w-[62px]' : 'w-[88px]'}`}>
          <div className="h-full rounded-full bg-[#a87c2a]" style={{ width: `${incomeFrac * 100}%` }} />
        </div>
        {s.lotusT > 0 ? (
          <span className="mt-1 whitespace-nowrap font-ui text-[10px] font-extrabold tracking-wide text-[#ffd7ef]">
            LOTUS −1s · {s.lotusT.toFixed(1)}s
          </span>
        ) : (
          <span className="mt-1 whitespace-nowrap font-ui text-[10px] font-semibold tracking-wide text-[#9db08f]">
            +25 NEXT DROP
          </span>
        )}
      </div>
    </div>
  );
}

/** Wave pips + a live "enemies left" readout. */
function WaveTrack({ s, compact, slim }: { s: GameState; compact?: boolean; slim?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-[#3a5a3f] bg-[#101d13]/90 ${
        compact ? 'min-w-0 flex-1 px-2.5 py-1.5' : 'w-full px-3 py-1.5'
      } ${slim ? 'rounded-xl px-2 py-1' : ''}`}
      role="group"
      aria-label="Wave progress"
    >
      <div className="flex flex-1 items-center gap-1.5">
        {Array.from({ length: s.waveTotal }).map((_, i) => {
          const done = s.waveAlert > i || s.status === 'won';
          const current = s.waveAlert === i && s.status === 'playing';
          const final = i === s.waveTotal - 1;
          return (
            <div
              key={i}
              aria-current={current ? 'step' : undefined}
              title={`Wave ${i + 1} of ${s.waveTotal}${final ? ' (boss)' : ''}`}
              className={`flex flex-1 items-center justify-center rounded-md border ${
                slim ? 'h-[18px] text-[9px]' : 'h-[22px] text-[10px]'
              } ${
                done
                  ? 'border-[#57c178] bg-[#1d3a24] text-[#8fe07c]'
                  : current
                    ? final
                      ? 'anim-pulse-ring border-[#ff5d7c] bg-[#3a1622] text-[#ff9db1]'
                      : 'anim-pulse-ring border-[#ffc46b] bg-[#33230f] text-[#ffd76a]'
                    : 'border-[#2c4431] bg-[#0c1710] text-[#4d6a55]'
              }`}
            >
              {final ? <Skull className="h-3.5 w-3.5" /> : done ? '✓' : i + 1}
            </div>
          );
        })}
      </div>
      <span className="shrink-0 font-ui text-[11px] font-bold text-[#9db08f] tabular-nums">
        {s.enemies.length > 0 ? `${s.enemies.length} LEFT` : s.status === 'won' ? 'CLEAR' : 'QUIET'}
      </span>
    </div>
  );
}

/** One seed-tray button — Flora sprite, cost, cooldown sweep, key hint. */
function TrayButton({
  s,
  k,
  i,
  disabled,
  desktop,
  cell,
  onSelect,
}: {
  s: GameState;
  k: FloraKey;
  i: number;
  disabled?: boolean;
  /**
   * Desktop stage: the whole HUD shares the board's frame, so these buttons are
   * pinned to a size that keeps six + the shovel inside the 1080px playfield.
   */
  desktop?: boolean;
  /**
   * Grid cell (phone tray / landscape rail): the tile fills whatever the grid
   * gives it, so the whole loadout is on screen at once — no scrolling to find
   * a seed mid-wave, and every target stays ≥44pt.
   */
  cell?: boolean;
  onSelect: (k: FloraKey) => void;
}) {
  const def = FLORA[k];
  const cd = s.trayCd[k] ?? 0;
  const cdFrac = cd / def.recharge;
  const afford = s.nectar >= def.cost;
  const usable = cd <= 0 && afford && s.status === 'playing' && !disabled;
  const selected = s.selected === k;
  return (
    <button
      type="button"
      onClick={() => onSelect(k)}
      aria-pressed={selected}
      aria-label={`${def.name}, ${def.role}, ${def.cost} nectar${
        cd > 0 ? `, recharging ${Math.ceil(cd)} seconds` : afford ? '' : ', not enough nectar'
      }`}
      title={`${def.name} — ${def.role}\n${def.desc}\nHotkey: ${i + 1}`}
      className={`pressable group relative overflow-hidden rounded-xl border ${
        cell ? 'h-full min-h-[46px] w-full' : desktop ? 'h-[84px] w-[80px] shrink-0' : 'h-[76px] w-[74px] shrink-0 sm:h-[88px] sm:w-[92px]'
      } ${
        selected
          ? 'border-[#ffd76a] shadow-[0_0_16px_rgba(255,215,106,.4)]'
          : usable
            ? 'border-[#4a7a52] hover:border-[#7fd77f] hover:shadow-[0_0_12px_rgba(125,255,176,.25)]'
            : 'border-[#2c4431]'
      } bg-[#16281a]`}
    >
      {/* keybind */}
      <span className="absolute left-1 top-0.5 z-10 font-ui text-[11px] font-bold text-[#78917f]">{i + 1}</span>
      {/* sprite */}
      <div
        className={`absolute top-0.5 transition-transform ${cell ? 'inset-x-1 bottom-[22px]' : 'inset-x-2 bottom-6'} ${
          usable ? '' : 'opacity-45 grayscale-[.7]'
        } ${selected ? '-translate-y-0.5' : ''}`}
      >
        <FloraSprite k={k} />
      </div>
      {/* name + cost */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#0c1710]/95 ${
          cell ? 'h-[22px] gap-0.5 px-1' : 'h-[26px] px-1.5'
        }`}
      >
        <span className={`truncate font-ui font-bold text-[#cfe6c8] ${cell ? 'text-[10px]' : 'text-[11px]'}`}>
          {def.name.split(' ')[0]}
        </span>
        <span
          className={`shrink-0 font-ui font-extrabold tabular-nums ${cell ? 'text-[12px]' : 'text-[13px]'} ${
            afford ? 'text-[#ffd76a]' : 'text-[#ff7d95]'
          }`}
        >
          {def.cost}
        </span>
      </div>
      {/* cooldown sweep */}
      {cd > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" aria-hidden>
          <div className="absolute inset-x-0 bottom-0 bg-[#060b08]/75 backdrop-blur-[1px]" style={{ top: `${(1 - cdFrac) * 100}%` }} />
          <span className={`relative font-ui font-extrabold text-[#e8f4e4] tabular-nums [text-shadow:0_2px_4px_#000] ${cell ? 'text-[17px]' : 'text-[20px]'}`}>
            {cd.toFixed(0)}
          </span>
        </div>
      )}
    </button>
  );
}

function ShovelButton({
  s,
  onShovel,
  disabled,
  desktop,
  cell,
}: {
  s: GameState;
  onShovel: () => void;
  disabled?: boolean;
  /** Pinned narrow so the desktop HUD row fits the stage frame. */
  desktop?: boolean;
  /** Fills a grid cell — see `TrayButton`. */
  cell?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onShovel}
      disabled={disabled}
      aria-pressed={s.shovelArmed}
      aria-label="Shovel: remove a Flora, no refund"
      title="Shovel — remove a Flora (no refund). Hotkey: X"
      className={`pressable relative flex flex-col items-center justify-center gap-1 rounded-xl border ${
        cell ? 'h-full min-h-[46px] w-full' : desktop ? 'h-[84px] w-[64px] shrink-0' : 'h-[76px] w-[62px] shrink-0 sm:h-[88px] sm:w-[72px]'
      } ${
        s.shovelArmed
          ? 'border-[#ffb37a] bg-[#33231a] shadow-[0_0_14px_rgba(255,179,122,.4)]'
          : 'border-[#2c4431] bg-[#16281a] hover:border-[#a8794a]'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <Shovel className={`${cell ? 'h-6 w-6' : 'h-7 w-7'} ${s.shovelArmed ? 'text-[#ffb37a]' : 'text-[#a8794a]'}`} />
      <span className={`font-ui font-bold tracking-wider text-[#9db08f] ${cell ? 'text-[9px]' : 'text-[10px]'}`}>
        DIG UP
      </span>
      <span className="absolute left-1 top-0.5 font-ui text-[11px] font-bold text-[#78917f]">X</span>
    </button>
  );
}

function ControlCluster({
  speed,
  muted,
  compact,
  disabled,
  onSpeed,
  onPause,
  onMute,
}: {
  speed: number;
  muted: boolean;
  compact?: boolean;
  disabled?: boolean;
  onSpeed: () => void;
  onPause: () => void;
  onMute: () => void;
}) {
  const base = compact ? 'h-11 min-w-11 px-3' : 'h-[42px] px-3';
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={onSpeed}
        disabled={disabled}
        aria-label={`Game speed, currently ${speed} times`}
        title="Toggle game speed (F)"
        className={`pressable flex items-center justify-center gap-1.5 rounded-xl border font-ui text-[13px] font-extrabold ${base} ${
          speed > 1 ? 'border-[#ffc46b] bg-[#33230f] text-[#ffd76a]' : 'border-[#3a5a3f] bg-[#101d13] text-[#9db08f] hover:text-[#cfe6c8]'
        }`}
      >
        <FastForward className="h-4 w-4" /> {speed}×
      </button>
      <button
        type="button"
        onClick={onPause}
        disabled={disabled}
        aria-label="Pause"
        title="Pause (Esc)"
        className={`pressable flex items-center justify-center gap-1.5 rounded-xl border border-[#3a5a3f] bg-[#101d13] font-ui text-[13px] font-extrabold text-[#9db08f] hover:text-[#cfe6c8] ${base}`}
      >
        <Pause className="h-4 w-4" />
        <span className={compact ? 'hidden min-[420px]:inline' : 'inline'}>PAUSE</span>
      </button>
      <button
        type="button"
        onClick={onMute}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        aria-pressed={muted}
        title="Sound on/off (M)"
        className={`pressable flex w-11 items-center justify-center rounded-xl border border-[#3a5a3f] bg-[#101d13] text-[#9db08f] hover:text-[#cfe6c8] ${compact ? 'h-11' : 'h-[42px]'}`}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Boss health / phase / ward banner. */
export function BossBar({ s }: { s: GameState }) {
  const boss = s.enemies.find((e) => ENEMIES[e.key].boss);
  if (!boss) return null;
  return (
    <div className="anim-banner w-full max-w-[520px]">
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="font-display text-[14px] font-bold tracking-[0.18em] text-[#ff9db1] sm:text-[16px]">
          {ENEMIES[boss.key].name.toUpperCase()}
        </span>
        <span className="flex gap-1" aria-label={`Phase ${boss.phase} of 3`}>
          {[1, 2, 3].map((p) => (
            <span
              key={p}
              className={`h-2.5 w-2.5 rotate-45 border ${boss.phase >= p ? 'border-[#ff7d95] bg-[#ff5d7c]' : 'border-[#5c2a3a] bg-[#2a0e18]'}`}
            />
          ))}
        </span>
      </div>
      <div className="h-[14px] overflow-hidden rounded-lg border border-[#ff5d7c]/50 bg-[#1a0a10]/90 p-[2px]">
        <div
          className="h-full rounded-md transition-all duration-200"
          style={{ width: `${(boss.hp / boss.maxHp) * 100}%`, background: 'linear-gradient(90deg,#ff5d7c,#ff9a3d)' }}
        />
      </div>
      {/* The Hollow King's ward. The whole fight turns on reading this line:
          while a channel is denied, plants of that kind do literally nothing. */}
      {boss.immuneTo !== null && (
        <div className="anim-pop mt-1 flex items-center justify-center gap-2 rounded-md border border-[#7fd4ff]/60 bg-[#08181f]/90 px-3 py-0.5">
          <span className="font-ui text-[11px] font-black tracking-[0.16em] text-[#7fd4ff] sm:text-[12px]">
            {boss.immuneTo === 'physical' ? 'STRIKES' : boss.immuneTo === 'splash' ? 'SPLASH' : 'POISON'} WARDED — SWITCH PLANTS
          </span>
          <span className="font-ui text-[11px] font-bold text-[#9fc4d8] tabular-nums sm:text-[12px]">{boss.immuneT.toFixed(1)}s</span>
        </div>
      )}
      {boss.enraged && (
        <div className="anim-pop mt-1 rounded-md border border-[#ff3d3d]/70 bg-[#20080c]/90 px-3 py-0.5 text-center font-ui text-[11px] font-black tracking-[0.16em] text-[#ff7d95] sm:text-[12px]">
          ENRAGED — TWICE THE SWINGS, TWICE THE DAMAGE TAKEN
        </div>
      )}
    </div>
  );
}

export default function Hud({
  s,
  speed,
  muted,
  compact = false,
  part,
  landscape = false,
  interactive = true,
  onSelect,
  onShovel,
  onSpeed,
  onPause,
  onMute,
}: Props) {
  const boss = s.enemies.find((e) => ENEMIES[e.key].boss);

  // ── phone / tablet: status strip on top, seed tray in the thumb zone ──
  if (compact) {
    /** Seeds that could be planted this instant — the rack's live counter. */
    const ready = s.loadout.filter((k) => (s.trayCd[k] ?? 0) <= 0 && s.nectar >= FLORA[k].cost).length;
    if (part === 'top') {
      /* Landscape loses the boss banner (the game screen floats it over the
         field) and slims the counter: sideways, height is the scarce axis and
         every pixel here comes straight off the battlefield. */
      return (
        <div className="flex w-full flex-col gap-1.5">
          <div className={`flex items-stretch ${landscape ? 'gap-1.5' : 'gap-2'}`}>
            <NectarPanel s={s} compact slim={landscape} />
            <WaveTrack s={s} compact slim={landscape} />
            <ControlCluster
              speed={speed}
              muted={muted}
              compact
              disabled={!interactive}
              onSpeed={onSpeed}
              onPause={onPause}
              onMute={onMute}
            />
          </div>
          {boss && !landscape && (
            <div className="flex justify-center">
              <BossBar s={s} />
            </div>
          )}
        </div>
      );
    }
    if (part === 'rail') {
      /* Landscape: a two-column seed rack beside the board. Six seeds + the
         shovel + the ready count make exactly eight cells, so the whole
         loadout is on screen at once — no scrolling mid-wave — and the rows
         share the rail's height, which keeps every tile ≥44pt. */
      return (
        <div className="no-scrollbar grid h-full min-h-0 grid-cols-2 gap-1.5 overflow-y-auto overscroll-contain [grid-auto-rows:minmax(46px,1fr)]">
          {s.loadout.map((k, i) => (
            <TrayButton key={k} s={s} k={k} i={i} cell disabled={!interactive} onSelect={onSelect} />
          ))}
          <ShovelButton s={s} onShovel={onShovel} cell disabled={!interactive} />
          <div
            className="flex min-h-[46px] flex-col items-center justify-center rounded-xl border border-[#2c4431] bg-[#101d13]/85 px-1 text-center"
            role="status"
            aria-label={`${ready} of ${s.loadout.length} seeds ready`}
          >
            <span className="font-ui text-[14px] font-extrabold leading-none text-[#a3f2a0] tabular-nums">
              {ready}/{s.loadout.length}
            </span>
            <span className="mt-0.5 font-ui text-[9px] font-bold tracking-widest text-[#4d6a55]">READY</span>
          </div>
        </div>
      );
    }
    return (
      /* Portrait: a wrapping rack rather than a sideways scroll — six seeds and
         the shovel are all reachable in one tap, never a swipe that could land
         on the battlefield behind it. The game screen gives this block a
         viewport-relative height, so spare vertical room turns into bigger
         targets instead of more forest. */
      <div className="flex h-full w-full flex-col gap-1.5">
        <div className="flex shrink-0 items-end justify-between gap-2 px-0.5">
          <span className="truncate font-ui text-[11px] font-bold tracking-[0.2em] text-[#78917f]">
            {s.selected
              ? `TAP A TILE TO PLANT ${FLORA[s.selected].name.toUpperCase()}`
              : s.shovelArmed
                ? 'TAP A FLORA TO DIG IT UP'
                : 'SEED TRAY'}
          </span>
          <span className="shrink-0 font-ui text-[11px] font-bold tracking-widest text-[#4d6a55] tabular-nums">
            {ready}/{s.loadout.length} READY
          </span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-2 [grid-auto-rows:minmax(64px,1fr)] min-[560px]:grid-cols-7 min-[560px]:[grid-auto-rows:88px]">
          {s.loadout.map((k, i) => (
            <TrayButton key={k} s={s} k={k} i={i} cell disabled={!interactive} onSelect={onSelect} />
          ))}
          <ShovelButton s={s} onShovel={onShovel} cell disabled={!interactive} />
        </div>
      </div>
    );
  }

  // ── desktop: one HUD row above the field, inside the same scaled stage ──
  /* The row spans the stage frame, which is at least the playfield's 1080px
     and grows on wider screens; the seed rack takes the slack and centres its
     buttons so nothing drifts into a corner. The boss banner is not part of
     this row — the game screen floats it over the field so a boss fight never
     costs the board any height. */
  return (
    <div className="relative flex w-full min-w-0 items-stretch justify-between gap-3">
      <NectarPanel s={s} />
      <div className="flex max-w-[780px] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#3a5a3f] bg-[#101d13]/90 px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,.4)]">
        {s.loadout.map((k, i) => (
          <TrayButton key={k} s={s} k={k} i={i} disabled={!interactive} desktop onSelect={onSelect} />
        ))}
        <ShovelButton s={s} onShovel={onShovel} disabled={!interactive} desktop />
      </div>
      <div className="flex max-w-[420px] min-w-[236px] flex-1 flex-col gap-2">
        <div className="flex flex-1 items-center">
          <WaveTrack s={s} />
        </div>
        <ControlCluster
          speed={speed}
          muted={muted}
          disabled={!interactive}
          onSpeed={onSpeed}
          onPause={onPause}
          onMute={onMute}
        />
      </div>
    </div>
  );
}
