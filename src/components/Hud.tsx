import { FastForward, Pause, Shovel, Skull, Volume2, VolumeX } from 'lucide-react';
import { ENEMIES, FLORA } from '../game/data';
import type { FloraKey, GameState } from '../game/types';
import { FloraSprite } from './sprites';

interface Props {
  s: GameState;
  speed: number;
  muted: boolean;
  onSelect: (k: FloraKey) => void;
  onShovel: () => void;
  onSpeed: () => void;
  onPause: () => void;
  onMute: () => void;
}

export default function Hud({ s, speed, muted, onSelect, onShovel, onSpeed, onPause, onMute }: Props) {
  const boss = s.enemies.find((e) => ENEMIES[e.key].boss);
  const incomeFrac = 1 - s.nectarT / 10;

  return (
    <div className="flex w-full items-stretch gap-3" style={{ width: 1080 }}>
      {/* nectar */}
      <div className="relative flex min-w-[168px] items-center gap-3 rounded-2xl border border-[#3a5a3f] bg-[#101d13]/90 px-4 py-2 shadow-[0_4px_20px_rgba(0,0,0,.4)]">
        <div className="anim-breathe-slow relative">
          <svg viewBox="0 0 40 48" width="34" height="42">
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
          <span className="font-ui text-[30px] font-extrabold leading-none text-[#ffd76a] [text-shadow:0_2px_8px_rgba(224,154,43,.45)]">
            {Math.floor(s.nectar)}
          </span>
          <div className="mt-1.5 h-[5px] w-[88px] overflow-hidden rounded-full bg-[#0a140f]">
            <div className="h-full rounded-full bg-[#a87c2a]" style={{ width: `${incomeFrac * 100}%` }} />
          </div>
          {s.lotusT > 0 ? (
            <span className="mt-1 animate-pulse font-ui text-[11px] font-extrabold tracking-wide text-[#ffd7ef]">
              LOTUS REBATE −1s · {s.lotusT.toFixed(1)}s
            </span>
          ) : (
            <span className="mt-1 font-ui text-[11px] font-semibold tracking-wide text-[#9db08f]">+25 NEXT DROP</span>
          )}
        </div>
      </div>

      {/* seed tray */}
      <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[#3a5a3f] bg-[#101d13]/90 px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,.4)]">
        {s.loadout.map((k, i) => {
          const def = FLORA[k];
          const cd = s.trayCd[k] ?? 0;
          const cdFrac = cd / def.recharge;
          const afford = s.nectar >= def.cost;
          const usable = cd <= 0 && afford && s.status === 'playing';
          const selected = s.selected === k;
          return (
            <button
              key={k}
              onClick={() => onSelect(k)}
              className={`group relative h-[88px] w-[92px] shrink-0 overflow-hidden rounded-xl border transition-all duration-100 ${
                selected
                  ? 'border-[#ffd76a] shadow-[0_0_16px_rgba(255,215,106,.4)]'
                  : usable
                    ? 'border-[#4a7a52] hover:border-[#7fd77f] hover:shadow-[0_0_12px_rgba(125,255,176,.25)]'
                    : 'border-[#2c4431]'
              } bg-[#16281a]`}
              title={`${def.name} — ${def.role}\n${def.desc}`}
            >
              {/* keybind */}
              <span className="absolute left-1 top-0.5 z-10 font-ui text-[11px] font-bold text-[#78917f]">{i + 1}</span>
              {/* sprite */}
              <div
                className={`absolute inset-x-3 top-0.5 bottom-6 transition-all ${usable ? '' : 'opacity-45 grayscale-[.7]'} ${selected ? '-translate-y-0.5' : ''}`}
              >
                <FloraSprite k={k} />
              </div>
              {/* name + cost */}
              <div className="absolute inset-x-0 bottom-0 flex h-[26px] items-center justify-between bg-[#0c1710]/95 px-1.5">
                <span className="truncate font-ui text-[11px] font-bold text-[#cfe6c8]">{def.name.split(' ')[0]}</span>
                <span className={`font-ui text-[13px] font-extrabold ${afford ? 'text-[#ffd76a]' : 'text-[#ff7d95]'}}`}>
                  {def.cost}
                </span>
              </div>
              {/* cooldown sweep */}
              {cd > 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="absolute inset-x-0 bottom-0 bg-[#060b08]/75 backdrop-blur-[1px]" style={{ top: `${(1 - cdFrac) * 100}%` }} />
                  <span className="relative font-ui text-[20px] font-extrabold text-[#e8f4e4] [text-shadow:0_2px_4px_#000]">{cd.toFixed(0)}</span>
                </div>
              )}
            </button>
          );
        })}

        {/* shovel */}
        <button
          onClick={onShovel}
          className={`relative ml-1 flex h-[88px] w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
            s.shovelArmed
              ? 'border-[#ffb37a] bg-[#33231a] shadow-[0_0_14px_rgba(255,179,122,.4)]'
              : 'border-[#2c4431] bg-[#16281a] hover:border-[#a8794a]'
          }`}
          title="Shovel — remove a Flora (no refund). Hotkey: X"
        >
          <Shovel className={`h-8 w-8 ${s.shovelArmed ? 'text-[#ffb37a]' : 'text-[#a8794a]'}`} />
          <span className="font-ui text-[10px] font-bold tracking-wider text-[#9db08f]">DIG UP</span>
          <span className="absolute left-1 top-0.5 font-ui text-[11px] font-bold text-[#78917f]">X</span>
        </button>
      </div>

      {/* right cluster */}
      <div className="flex min-w-[236px] flex-col gap-2">
        {/* wave progress */}
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[#3a5a3f] bg-[#101d13]/90 px-3 py-1.5">
          <div className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: s.waveTotal }).map((_, i) => {
              const done = s.waveAlert > i || (s.waveAlert === -1 ? false : false) || s.status === 'won';
              const current = s.waveAlert === i && s.status === 'playing';
              const final = i === s.waveTotal - 1;
              return (
                <div key={i} className="flex flex-1 items-center gap-1.5">
                  <div
                    className={`flex h-[22px] flex-1 items-center justify-center rounded-md border text-[10px] transition-all ${
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
                </div>
              );
            })}
          </div>
          <span className="font-ui text-[11px] font-bold text-[#9db08f]">
            {s.enemies.length > 0 ? `${s.enemies.length} LEFT` : s.status === 'won' ? 'CLEAR' : 'QUIET'}
          </span>
        </div>
        {/* controls */}
        <div className="flex gap-2">
          <button
            onClick={onSpeed}
            className={`flex h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border font-ui text-[13px] font-extrabold transition-all ${
              speed > 1 ? 'border-[#ffc46b] bg-[#33230f] text-[#ffd76a]' : 'border-[#3a5a3f] bg-[#101d13] text-[#9db08f] hover:text-[#cfe6c8]'
            }`}
            title="Toggle game speed"
          >
            <FastForward className="h-4 w-4" /> {speed}×
          </button>
          <button
            onClick={onPause}
            className="flex h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#3a5a3f] bg-[#101d13] font-ui text-[13px] font-extrabold text-[#9db08f] transition-all hover:text-[#cfe6c8]"
            title="Pause (Esc)"
          >
            <Pause className="h-4 w-4" /> PAUSE
          </button>
          <button
            onClick={onMute}
            className="flex h-[42px] w-[48px] items-center justify-center rounded-xl border border-[#3a5a3f] bg-[#101d13] text-[#9db08f] transition-all hover:text-[#cfe6c8]"
            title="Sound on/off"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* boss bar */}
      {boss && (
        <div className="anim-banner absolute left-1/2 top-[118px] z-[95] w-[520px] -translate-x-1/2">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="font-display text-[16px] font-bold tracking-[0.18em] text-[#ff9db1]">{ENEMIES[boss.key].name.toUpperCase()}</span>
            <span className="flex gap-1">
              {[1, 2, 3].map((p) => (
                <span key={p} className={`h-2.5 w-2.5 rotate-45 border ${boss.phase >= p ? 'border-[#ff7d95] bg-[#ff5d7c]' : 'border-[#5c2a3a] bg-[#2a0e18]'}`} />
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
              <span className="font-ui text-[12px] font-black tracking-[0.16em] text-[#7fd4ff]">
                {boss.immuneTo === 'physical' ? 'STRIKES' : boss.immuneTo === 'splash' ? 'SPLASH' : 'POISON'} WARDED — SWITCH PLANTS
              </span>
              <span className="font-ui text-[12px] font-bold text-[#9fc4d8]">{boss.immuneT.toFixed(1)}s</span>
            </div>
          )}
          {boss.enraged && (
            <div className="anim-pop mt-1 rounded-md border border-[#ff3d3d]/70 bg-[#20080c]/90 px-3 py-0.5 text-center font-ui text-[12px] font-black tracking-[0.16em] text-[#ff7d95]">
              ENRAGED — TWICE THE SWINGS, TWICE THE DAMAGE TAKEN
            </div>
          )}
        </div>
      )}
    </div>
  );
}
