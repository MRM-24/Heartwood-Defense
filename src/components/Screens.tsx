import { ArrowLeft, ChevronRight, Droplets, Hourglass, Lock, Play, RotateCcw, ScrollText, Shield, Swords, Trophy, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { ENEMIES, FLORA, FLORA_ORDER, LOADOUT_SLOTS, LEVELS, WORLDS, unlockedFloraFor } from '../game/data';
import { levelEnemyIntel } from '../game/engine';
import type { FloraKey, LevelDef } from '../game/types';
import { EnemySprite, FloraSprite, HeartTree } from './sprites';

// ── shared ambient backdrop ─────────────────────────────────────────────────
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#081009] text-[#e6f2de]">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(110% 80% at 50% -10%, #1b3320 0%, #0d1a11 48%, #060c08 100%)' }} />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[560px] w-[560px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(150,60,130,.5) 0%, transparent 65%)' }} />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full opacity-25" style={{ background: 'radial-gradient(circle, rgba(90,190,120,.4) 0%, transparent 65%)' }} />
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="anim-drift pointer-events-none absolute rounded-full"
          style={{
            width: 2 + (i % 4),
            height: 2 + (i % 4),
            left: `${(i * 167) % 100}%`,
            top: `${(i * 89) % 100}%`,
            background: i % 4 === 0 ? 'rgba(255,190,240,.4)' : 'rgba(190,255,205,.35)',
            animationDuration: `${16 + (i % 5) * 4}s`,
            animationDelay: `${-i * 1.9}s`,
          }}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-35" style={{ background: 'linear-gradient(to top, #05090600 0%, transparent 40%), radial-gradient(120% 100% at 50% 120%, #132416 0%, transparent 70%)' }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ThornButton({
  children,
  onClick,
  primary,
  danger,
  disabled,
  small,
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2.5 rounded-xl border font-ui font-extrabold tracking-widest transition-all duration-150 ${
        small ? 'px-5 py-2.5 text-[13px]' : 'px-8 py-4 text-[15px]'
      } ${
        disabled
          ? 'cursor-not-allowed border-[#2c4431] bg-[#10180f] text-[#55695c]'
          : primary
            ? 'border-[#ffd76a] bg-gradient-to-b from-[#3a2c0f] to-[#241a08] text-[#ffd76a] shadow-[0_0_24px_rgba(255,215,106,.25)] hover:shadow-[0_0_34px_rgba(255,215,106,.45)] hover:brightness-110 active:scale-[.97]'
            : danger
              ? 'border-[#ff5d7c]/70 bg-[#2a0e18] text-[#ff9db1] hover:bg-[#3a1622] active:scale-[.97]'
              : 'border-[#4a7a52] bg-[#142418] text-[#bfe3bb] hover:border-[#7fd77f] hover:text-[#e3ffe0] active:scale-[.97]'
      }`}
    >
      {children}
    </button>
  );
}

// ── TITLE ───────────────────────────────────────────────────────────────────
export function TitleScreen({ onPlay, onHow, hasSave }: { onPlay: () => void; onHow: () => void; hasSave: boolean }) {
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-10">
        <div className="anim-fadein mb-2 flex items-end gap-8">
          <div className="hidden h-[300px] w-[130px] md:block">
            <HeartTree />
          </div>
          <div className="flex flex-col items-center pb-6">
            <div className="mb-3 flex items-center gap-3 font-ui text-[13px] font-bold tracking-[0.5em] text-[#8fb392]">
              <span className="h-px w-10 bg-[#57c178]/50" />
              A TALE OF ROOT AND ROT
              <span className="h-px w-10 bg-[#57c178]/50" />
            </div>
            <h1 className="font-display text-center text-[64px] font-black leading-[0.95] tracking-tight md:text-[92px]">
              <span className="bg-gradient-to-b from-[#eaffd9] via-[#a3f2a0] to-[#57c178] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(125,255,176,.25)]">HEARTWOOD</span>
              <br />
              <span className="bg-gradient-to-b from-[#ffe9a8] via-[#ffd76a] to-[#e09a2b] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(255,215,106,.25)]">DEFENSE</span>
            </h1>
            <p className="mt-5 max-w-[520px] text-center font-ui text-[15px] font-medium leading-relaxed text-[#9db08f]">
              The Blightspawn march on the Heart Tree. Command the sentient Flora —
              spend Nectar, hold five lanes, and let nothing through. Every lane hides
              a single Root Snare. When it is spent, there is no second chance.
            </p>
          </div>
          <div className="hidden h-[300px] w-[130px] -scale-x-100 md:block">
            <HeartTree />
          </div>
        </div>
        <div className="anim-fadein flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: '.15s' }}>
          <ThornButton primary onClick={onPlay}>
            <Play className="h-5 w-5" /> {hasSave ? 'CONTINUE THE VIGIL' : 'BEGIN THE VIGIL'}
          </ThornButton>
          <ThornButton onClick={onHow}>
            <ScrollText className="h-5 w-5" /> FIELD GUIDE
          </ThornButton>
        </div>
        <div className="mt-10 flex items-center gap-2 font-ui text-[12px] font-semibold tracking-wider text-[#62788] text-opacity-70">
          <Shield className="h-4 w-4 text-[#57c178]" />
          <span className="text-[#6b8571]">15 levels · 3 worlds · 6 Flora · 14 Blightspawn · 2 bosses</span>
        </div>
      </div>
    </Backdrop>
  );
}

// ── FIELD GUIDE ─────────────────────────────────────────────────────────────
export function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="anim-popin max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#4a7a52] bg-[#0f1c12] p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-3xl font-black text-[#a3f2a0]">Field Guide</h2>
          <button onClick={onClose} className="rounded-lg border border-[#3a5a3f] p-1.5 text-[#9db08f] hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 font-ui text-[14px] leading-relaxed text-[#b9cbb2]">
          <Rule n="1" title="Nectar is everything">
            You start with <b className="text-[#ffd76a]">50</b> and gain <b className="text-[#ffd76a]">+25 every 10s</b>. Glowbulbs ripen +20 more every 12s.
            Plant economy early — the final waves punish the frugal.
          </Rule>
          <Rule n="2" title="Lanes are law">
            Blightspawn walk left down one of five lanes and queue single-file — only the frontmost chews.
            Shooters only fire down their own lane. Every tile holds one Flora; every Flora has its own recharge.
          </Rule>
          <Rule n="3" title="One snare per lane">
            If anything reaches the Heart Tree, that lane's <b className="text-[#a3f2a0]">Root Snare</b> erupts once, killing everything in the lane.
            If the lane is breached again — <b className="text-[#ff9db1]">the level is lost</b>.
          </Rule>
          <Rule n="4" title="Bring counters">
            Swarms drown single shooters — answer with pierce. Carapace Wardens drink small hits; Stoneback Grubs ignore them
            entirely (only splash cracks stone). Spore Drifters laugh at walls: only the Sunflower Sentinel touches the sky.
            Check the level intel before every battle.
          </Rule>
          <Rule n="6" title="The Depths punish habits">
            In the Rootbound Depths the blight answers how you defend: Mite Vaulters leap a lone wall, Tunnel Larva surface at
            column 6 behind your front line, Locust Rangers snipe from two tiles out, Spore Imps catapult into your back half,
            Gargant Husks smash a plant dead after a 1.5s wind-up, and Root Thieves make off with your most wounded Flora.
            Defense in depth — never one wall and a prayer.
          </Rule>
          <Rule n="5" title="The shovel">
            Digging up a Flora returns <b>nothing</b>. Use it to rebuild a broken lane, not to save money.
          </Rule>
        </div>
        <h3 className="mb-3 mt-7 font-display text-xl font-bold text-[#ffd76a]">The Flora</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {FLORA_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2.5 rounded-xl border border-[#2c4431] bg-[#14241a] p-2.5">
              <div className="h-14 w-12 shrink-0"><FloraSprite k={k} /></div>
              <div className="min-w-0">
                <div className="truncate font-ui text-[13px] font-extrabold text-[#e3ffe0]">{FLORA[k].name}</div>
                <div className="flex items-center gap-2 font-ui text-[11px] font-bold">
                  <span className="flex items-center gap-0.5 text-[#ffd76a]"><Droplets className="h-3 w-3" />{FLORA[k].cost}</span>
                  <span className="flex items-center gap-0.5 text-[#8fd0f5]"><Hourglass className="h-3 w-3" />{FLORA[k].recharge}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end"><ThornButton primary small onClick={onClose}>UNDERSTOOD</ThornButton></div>
      </div>
    </div>
  );
}

function Rule({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#4a7a52] bg-[#1d3a24] font-ui text-[12px] font-extrabold text-[#a3f2a0]">{n}</span>
      <p><b className="text-[#e3ffe0]">{title}.</b> {children}</p>
    </div>
  );
}

// ── WORLD SELECT ────────────────────────────────────────────────────────────
export function WorldSelect({
  maxLevel,
  stars,
  onPick,
  onBack,
}: {
  maxLevel: number;
  stars: Record<number, number>;
  onPick: (world: 1 | 2 | 3) => void;
  onBack: () => void;
}) {
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-10">
        <Header kicker="CHOOSE YOUR GROUND" title="Two Worlds of the Vale" />
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {WORLDS.map((w) => {
            const levels = LEVELS.filter((l) => l.world === w.id);
            const locked = maxLevel < (w.id - 1) * 5;
            const starCount = levels.reduce((n, l) => n + (stars[l.id] ?? 0), 0);
            return (
              <button
                key={w.id}
                disabled={locked}
                onClick={() => onPick(w.id)}
                className={`group relative overflow-hidden rounded-3xl border p-8 text-left transition-all duration-200 ${
                  locked
                    ? 'cursor-not-allowed border-[#2c3430] bg-[#101512] opacity-60'
                    : 'border-[#4a7a52] bg-gradient-to-b from-[#14281a] to-[#0c1710] hover:-translate-y-1 hover:border-[#7fd77f] hover:shadow-[0_18px_50px_rgba(0,0,0,.5),0_0_30px_rgba(125,255,176,.15)]'
                }`}
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-25 transition-opacity group-hover:opacity-45"
                  style={{ background: `radial-gradient(circle, ${w.hue} 0%, transparent 70%)` }}
                />
                <div className="font-ui text-[12px] font-extrabold tracking-[0.4em] text-[#7f9a85]">WORLD {w.id}</div>
                <div className="mt-1 font-display text-4xl font-black" style={{ color: w.hue }}>{w.name}</div>
                <p className="mt-2 font-ui text-[14px] text-[#9db08f]">{w.sub}</p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <span key={i} className={`h-2 w-2 rotate-45 ${i < starCount ? 'bg-[#ffd76a]' : 'bg-[#2c4431]'}`} />
                    ))}
                    <span className="ml-2 font-ui text-[12px] font-bold text-[#7f9a85]">{starCount}/15</span>
                  </div>
                  {locked ? (
                    <span className="flex items-center gap-2 font-ui text-[12px] font-bold text-[#7f9a85]"><Lock className="h-4 w-4" /> CLEAR {WORLDS[w.id - 2].name.toUpperCase()}</span>
                  ) : (
                    <span className="flex items-center gap-1 font-ui text-[13px] font-extrabold text-[#a3f2a0] opacity-70 transition-opacity group-hover:opacity-100">
                      ENTER <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-8"><ThornButton small onClick={onBack}><ArrowLeft className="h-4 w-4" /> TITLE</ThornButton></div>
      </div>
    </Backdrop>
  );
}

// ── LEVEL SELECT ────────────────────────────────────────────────────────────
export function LevelSelect({
  world,
  maxLevel,
  stars,
  onPick,
  onBack,
}: {
  world: 1 | 2 | 3;
  maxLevel: number;
  stars: Record<number, number>;
  onPick: (level: LevelDef) => void;
  onBack: () => void;
}) {
  const levels = LEVELS.filter((l) => l.world === world);
  const w = WORLDS.find((x) => x.id === world)!;
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-10">
        <Header kicker={`WORLD ${world} — ${w.name.toUpperCase()}`} title={w.id === 1 ? 'Hold the Vale' : 'Break the Hollow'} />
        <div className="flex w-full flex-col gap-3">
          {levels.map((l) => {
            const locked = l.id > maxLevel;
            const st = stars[l.id] ?? 0;
            const newFlora = l.id === 1 ? ['cactus'] : l.id === 5 ? ['frostcap'] : l.id === 6 ? ['sentinel'] : [];
            return (
              <button
                key={l.id}
                disabled={locked}
                onClick={() => onPick(l)}
                className={`group flex items-center gap-5 rounded-2xl border px-6 py-4 text-left transition-all ${
                  locked
                    ? 'cursor-not-allowed border-[#26312b] bg-[#0d120e] opacity-55'
                    : 'border-[#3a5a3f] bg-[#101d13] hover:border-[#7fd77f] hover:bg-[#14261a] hover:shadow-[0_0_24px_rgba(125,255,176,.12)]'
                }`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-display text-2xl font-black ${
                  locked ? 'border-[#2c4431] text-[#4d6a55]' : l.boss ? 'border-[#ff5d7c]/60 bg-[#2a0e18] text-[#ff9db1]' : 'border-[#4a7a52] bg-[#1d3a24] text-[#a3f2a0]'
                }`}>
                  {locked ? <Lock className="h-5 w-5" /> : `${world}-${l.idx}`}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl font-bold text-[#e3ffe0]">{l.name}</span>
                    {l.boss && <span className="flex items-center gap-1 rounded-md bg-[#3a1622] px-2 py-0.5 font-ui text-[10px] font-extrabold tracking-widest text-[#ff9db1]"><Swords className="h-3 w-3" /> BOSS</span>}
                    {newFlora.length > 0 && st === 0 && (
                      <span className="rounded-md bg-[#33230f] px-2 py-0.5 font-ui text-[10px] font-extrabold tracking-widest text-[#ffd76a]">
                        UNLOCKS {FLORA[newFlora[0] as FloraKey].name.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-ui text-[13px] text-[#8ba48f]">{l.blurb}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {[1, 2, 3].map((i) => (
                    <svg key={i} viewBox="0 0 24 24" className={`h-5 w-5 ${i <= st ? 'fill-[#ffd76a] text-[#ffd76a]' : 'fill-[#22301f] text-[#3a5a3f]'}`} stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" strokeLinejoin="round" />
                    </svg>
                  ))}
                </div>
                {!locked && <ChevronRight className="h-5 w-5 shrink-0 text-[#57c178] opacity-0 transition-opacity group-hover:opacity-100" />}
              </button>
            );
          })}
        </div>
        <div className="mt-8"><ThornButton small onClick={onBack}><ArrowLeft className="h-4 w-4" /> WORLDS</ThornButton></div>
      </div>
    </Backdrop>
  );
}

// ── LOADOUT ─────────────────────────────────────────────────────────────────
export function LoadoutScreen({
  level,
  picked,
  setPicked,
  onStart,
  onBack,
}: {
  level: LevelDef;
  picked: FloraKey[];
  setPicked: (p: FloraKey[]) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const unlocked = unlockedFloraFor(level.id);
  const intel = levelEnemyIntel(level);
  const needsAA = intel.includes('drifter');
  const hasAA = picked.includes('sentinel');
  const needsSplash = intel.includes('grub');
  const hasSplash = picked.includes('cactus') || picked.includes('frostcap');
  const toggle = (k: FloraKey) => {
    if (picked.includes(k)) setPicked(picked.filter((x) => x !== k));
    else if (picked.length < LOADOUT_SLOTS) setPicked([...picked, k]);
  };
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-8">
        <Header kicker={`WORLD ${level.world}-${level.idx} · ${level.name.toUpperCase()}`} title="Choose Your Flora" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* flora library */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-ui text-[12px] font-extrabold tracking-[0.3em] text-[#7f9a85]">SEED TRAY — {picked.length}/{LOADOUT_SLOTS}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: LOADOUT_SLOTS }).map((_, i) => (
                  <span key={i} className={`h-2.5 w-6 rounded-sm ${i < picked.length ? 'bg-[#ffd76a]' : 'bg-[#22301f]'}`} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {unlocked.map((k) => {
                const def = FLORA[k];
                const on = picked.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggle(k)}
                    className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all ${
                      on ? 'border-[#ffd76a] bg-[#241f0e] shadow-[0_0_18px_rgba(255,215,106,.18)]' : 'border-[#3a5a3f] bg-[#101d13] hover:border-[#7fd77f]'
                    } ${picked.length >= LOADOUT_SLOTS && !on ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`h-[74px] w-[68px] transition-transform group-hover:scale-105 ${on ? '' : 'opacity-90'}`}><FloraSprite k={k} /></div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md border font-ui text-[13px] font-black ${on ? 'border-[#ffd76a] bg-[#ffd76a] text-[#241a08]' : 'border-[#4a7a52] text-[#4a7a52]'}`}>
                        {on ? '✓' : '+'}
                      </div>
                    </div>
                    <div className="mt-1 font-ui text-[14px] font-extrabold text-[#e3ffe0]">{def.name}</div>
                    <div className="mb-1.5 flex items-center gap-2.5 font-ui text-[11px] font-bold">
                      <span className="flex items-center gap-0.5 text-[#ffd76a]"><Droplets className="h-3 w-3" />{def.cost}</span>
                      <span className="flex items-center gap-0.5 text-[#8fd0f5]"><Hourglass className="h-3 w-3" />{def.recharge}s</span>
                      <span className="text-[#8ba48f]">{def.role}</span>
                    </div>
                    <p className="font-ui text-[11px] leading-snug text-[#8ba48f]">{def.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
          {/* intel */}
          <div className="flex flex-col rounded-2xl border border-[#3a2c3a] bg-[#141019] p-5">
            <span className="font-ui text-[12px] font-extrabold tracking-[0.3em] text-[#c38fb8]">BLIGHTSPAWN INTEL</span>
            <p className="mb-4 mt-1 font-ui text-[13px] italic text-[#9d8fae]">&ldquo;{level.blurb}&rdquo;</p>
            <div className="flex-1 space-y-2.5">
              {intel.map((ek) => {
                const e = ENEMIES[ek];
                return (
                  <div key={ek} className="flex items-center gap-3 rounded-xl border border-[#33243a] bg-[#1a121f] p-2.5">
                    <div className="h-14 w-14 shrink-0" style={{ filter: 'drop-shadow(0 0 6px rgba(207,139,247,.4))' }}><EnemySprite k={ek} shellFrac={e.shell ? 1 : 0} stoneFrac={e.stoneShield ? 1 : 0} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 font-ui text-[13px] font-extrabold text-[#ecd7f7]">
                        {e.name}
                        {e.boss && <span className="rounded bg-[#3a1622] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ff9db1]">BOSS</span>}
                        {e.flying && <span className="rounded bg-[#1d2b3a] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#8fd0f5]">FLYING</span>}
                        {e.vault && <span className="rounded bg-[#2a2410] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#e4ff9c]">LEAPS</span>}
                        {e.stoneShield && <span className="rounded bg-[#26251f] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#d8d2c0]">SPLASH ONLY</span>}
                        {e.burrowEmerge !== undefined && <span className="rounded bg-[#1d2e28] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#9fd8c8]">BURROWS</span>}
                        {e.ranged && <span className="rounded bg-[#2e2a18] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ffe07a]">RANGED</span>}
                        {ek === 'imp' && <span className="rounded bg-[#2e1a2e] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ff9ad6]">DROPS IN</span>}
                        {e.smashWindup && <span className="rounded bg-[#2e1c10] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ffb37a]">ONE-HIT SMASH</span>}
                        {e.grabEvery && <span className="rounded bg-[#1c2634] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#a8c9ff]">STEALS</span>}
                      </div>
                      <p className="truncate font-ui text-[11px] text-[#9d8fae]">{e.desc}</p>
                      <p className="font-ui text-[11px] font-bold text-[#a3f2a0]">Counter: {e.counter}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {needsAA && !hasAA && (
              <div className="mt-3 rounded-xl border border-[#ff5d7c]/60 bg-[#2a0e18] px-3 py-2 font-ui text-[12px] font-bold text-[#ff9db1]">
                Spore Drifters expected — without the Sunflower Sentinel your lanes are undefended from the sky.
              </div>
            )}
            {needsSplash && !hasSplash && (
              <div className="mt-3 rounded-xl border border-[#ffb37a]/60 bg-[#2e1c10] px-3 py-2 font-ui text-[12px] font-bold text-[#ffb37a]">
                Stoneback Grubs expected — their slabs ignore single-target fire. Bring the Spitting Cactus or Frostcap, or bring prayers.
              </div>
            )}
            <div className="mt-3 rounded-xl border border-[#4a7a52]/50 bg-[#101d13] px-3 py-2 font-ui text-[12px] text-[#9db08f]">
              <b className="text-[#a3f2a0]">Warden&rsquo;s wisdom:</b> {level.tip}
            </div>
            <div className="mt-4 flex gap-3">
              <ThornButton small onClick={onBack}><ArrowLeft className="h-4 w-4" /> MAP</ThornButton>
              <div className="flex-1"><ThornButton primary onClick={onStart}><Play className="h-5 w-5" /> TO BATTLE</ThornButton></div>
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function Header({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="font-ui text-[12px] font-extrabold tracking-[0.45em] text-[#7f9a85]">{kicker}</div>
      <h2 className="mt-1 font-display text-5xl font-black text-[#eaffd9]">{title}</h2>
    </div>
  );
}

// ── IN-GAME OVERLAYS ────────────────────────────────────────────────────────
export function PauseOverlay({ onResume, onRestart, onQuit }: { onResume: () => void; onRestart: () => void; onQuit: () => void }) {
  return (
    <OverlayFrame>
      <h2 className="font-display text-4xl font-black text-[#eaffd9]">The Vale Waits</h2>
      <p className="mt-2 font-ui text-[14px] text-[#9db08f]">Paused. The Blightspawn are patient. Are you?</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ThornButton primary small onClick={onResume}><Play className="h-4 w-4" /> RESUME</ThornButton>
        <ThornButton small onClick={onRestart}><RotateCcw className="h-4 w-4" /> RESTART</ThornButton>
        <ThornButton small danger onClick={onQuit}><X className="h-4 w-4" /> ABANDON</ThornButton>
      </div>
    </OverlayFrame>
  );
}

export function WinOverlay({
  stars,
  isLast,
  onNext,
  onReplay,
  onMap,
}: {
  stars: number;
  isLast: boolean;
  onNext: () => void;
  onReplay: () => void;
  onMap: () => void;
}) {
  return (
    <OverlayFrame glow="rgba(255,215,106,.18)">
      <Trophy className="mx-auto h-10 w-10 text-[#ffd76a]" />
      <h2 className="mt-2 font-display text-5xl font-black text-transparent" style={{ background: 'linear-gradient(180deg,#eaffd9,#a3f2a0)', WebkitBackgroundClip: 'text' }}>
        THE LANE HOLDS
      </h2>
      <div className="mt-4 flex justify-center gap-2">
        {[1, 2, 3].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className={`h-11 w-11 ${i <= stars ? 'fill-[#ffd76a] text-[#ffd76a]' : 'fill-[#22301f] text-[#3a5a3f]'} anim-starpop`} style={{ animationDelay: `${0.15 + i * 0.18}s` }} stroke="currentColor" strokeWidth="1.2">
            <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" strokeLinejoin="round" />
          </svg>
        ))}
      </div>
      <p className="mt-2 font-ui text-[13px] font-semibold text-[#9db08f]">
        {stars === 3 ? 'Flawless — not a single Root Snare was spent.' : stars === 2 ? 'The snares held, mostly. A flawless run earns a third star.' : 'Victory, but at a cost. The Vale remembers.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!isLast && <ThornButton primary small onClick={onNext}>NEXT LEVEL <ChevronRight className="h-4 w-4" /></ThornButton>}
        <ThornButton small onClick={onReplay}><RotateCcw className="h-4 w-4" /> REPLAY</ThornButton>
        <ThornButton small onClick={onMap}>MAP</ThornButton>
      </div>
    </OverlayFrame>
  );
}

export function LoseOverlay({ lane, onRetry, onMap }: { lane: number; onRetry: () => void; onMap: () => void }) {
  return (
    <OverlayFrame glow="rgba(255,93,124,.15)">
      <h2 className="font-display text-5xl font-black text-transparent" style={{ background: 'linear-gradient(180deg,#ffb1c1,#ff5d7c)', WebkitBackgroundClip: 'text' }}>
        THE ROOTS ARE SEVERED
      </h2>
      <p className="mt-3 max-w-[440px] font-ui text-[14px] leading-relaxed text-[#c7a9b4]">
        Lane {lane + 1} fell, and its Root Snare was already spent. The Blight spawn
        reach the Heart Tree, and somewhere deep in the vale, something green stops singing.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ThornButton primary small onClick={onRetry}><RotateCcw className="h-4 w-4" /> TRY AGAIN</ThornButton>
        <ThornButton small onClick={onMap}>MAP</ThornButton>
      </div>
    </OverlayFrame>
  );
}

function OverlayFrame({ children, glow }: { children: ReactNode; glow?: string }) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#050906]/80 backdrop-blur-[3px]">
      <div
        className="anim-popin max-w-[560px] rounded-3xl border border-[#4a7a52]/60 bg-[#0e1a11]/95 px-10 py-8 text-center shadow-2xl"
        style={{ boxShadow: `0 30px 80px rgba(0,0,0,.6), 0 0 60px ${glow ?? 'rgba(125,255,176,.1)'}` }}
      >
        {children}
      </div>
    </div>
  );
}
