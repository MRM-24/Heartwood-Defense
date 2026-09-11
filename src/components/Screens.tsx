import {
  ArrowLeft,
  Bug,
  ChevronRight,
  Droplets,
  Heart,
  Hourglass,
  Leaf,
  Lock,
  Map,
  Play,
  RotateCcw,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ENEMIES,
  FLORA,
  FLORA_ORDER,
  ENEMY_ORDER,
  LEVELS,
  LOADOUT_SLOTS,
  WORLDS,
  enemyFirstLevel,
  enemyLevels,
  floraUnlockLevel,
  floraUnlockedAt,
  unlockedFloraFor,
} from '../game/data';
import { levelEnemyIntel } from '../game/engine';
import type { EnemyKey, EnemyStats, FloraKey, FloraStats, LevelDef, WorldId } from '../game/types';
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
  wide,
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  small?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2.5 rounded-xl border font-ui font-extrabold tracking-widest transition-all duration-150 ${
        wide ? 'w-full' : ''
      } ${
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

/** Small framed modal card used by the guide / dialogs. */
function ModalShell({
  children,
  onClose,
  width = 'max-w-3xl',
  z = 'z-50',
}: {
  children: ReactNode;
  onClose?: () => void;
  width?: string;
  z?: string;
}) {
  return (
    <div
      className={`fixed inset-0 ${z} flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div
        className={`anim-popin max-h-[88vh] w-full ${width} overflow-y-auto rounded-2xl border border-[#4a7a52] bg-[#0f1c12] p-7 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/** Escape-to-close, but only while no deeper modal is open. */
function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}

// ── CONFIRM DIALOG ──────────────────────────────────────────────────────────
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEscape(true, onCancel);
  return (
    <ModalShell onClose={onCancel} width="max-w-md" z="z-[60]">
      <h2 className="font-display text-3xl font-black text-[#ff9db1]">{title}</h2>
      <div className="mt-3 font-ui text-[14px] leading-relaxed text-[#b9cbb2]">{body}</div>
      <div className="mt-6 flex justify-end gap-3">
        <ThornButton small onClick={onCancel}>KEEP MY PROGRESS</ThornButton>
        <ThornButton small danger onClick={onConfirm}><RotateCcw className="h-4 w-4" /> {confirmLabel}</ThornButton>
      </div>
    </ModalShell>
  );
}

// ── TITLE ───────────────────────────────────────────────────────────────────
export function TitleScreen({
  hasSave,
  resume,
  stars,
  cleared,
  floraKnown,
  floraTotal,
  enemiesKnown,
  enemiesTotal,
  muted,
  onContinue,
  onNewGame,
  onLevels,
  onGuide,
  onToggleMute,
}: {
  hasSave: boolean;
  /** "World 2-3 · Frostmire Hollow" — shown under CONTINUE. */
  resume: string;
  stars: number;
  cleared: number;
  floraKnown: number;
  floraTotal: number;
  enemiesKnown: number;
  enemiesTotal: number;
  muted: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onLevels: () => void;
  onGuide: () => void;
  onToggleMute: () => void;
}) {
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-10">
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <button
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Sound off' : 'Sound on'}
            className="flex items-center gap-2 rounded-xl border border-[#3a5a3f] bg-[#101d13] px-3 py-2 font-ui text-[11px] font-bold tracking-widest text-[#9db08f] transition-colors hover:border-[#7fd77f] hover:text-[#e3ffe0]"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? 'MUTED' : 'SOUND'}
          </button>
        </div>
        <div className="anim-fadein mb-2 flex items-end gap-8">
          <div className="hidden h-[240px] w-[110px] md:block">
            <HeartTree />
          </div>
          <div className="flex flex-col items-center pb-4">
            <div className="mb-3 flex items-center gap-3 font-ui text-[13px] font-bold tracking-[0.5em] text-[#8fb392]">
              <span className="h-px w-10 bg-[#57c178]/50" />
              A TALE OF ROOT AND ROT
              <span className="h-px w-10 bg-[#57c178]/50" />
            </div>
            <h1 className="font-display text-center text-[56px] font-black leading-[0.95] tracking-tight md:text-[86px]">
              <span className="bg-gradient-to-b from-[#eaffd9] via-[#a3f2a0] to-[#57c178] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(125,255,176,.25)]">HEARTWOOD</span>
              <br />
              <span className="bg-gradient-to-b from-[#ffe9a8] via-[#ffd76a] to-[#e09a2b] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(255,215,106,.25)]">DEFENSE</span>
            </h1>
            <p className="mt-4 max-w-[520px] text-center font-ui text-[14px] font-medium leading-relaxed text-[#9db08f]">
              The Blightspawn march on the Heart Tree. Command the sentient Flora —
              spend Nectar, hold five lanes, and let nothing through.
            </p>
          </div>
          <div className="hidden h-[240px] w-[110px] -scale-x-100 md:block">
            <HeartTree />
          </div>
        </div>

        <div className="anim-fadein mt-4 flex w-full max-w-[560px] flex-col items-stretch gap-3" style={{ animationDelay: '.15s' }}>
          <ThornButton primary wide onClick={hasSave ? onContinue : onNewGame}>
            <span className="flex flex-col items-center leading-none">
              <span className="flex items-center gap-2.5">
                <Play className="h-5 w-5" /> {hasSave ? 'CONTINUE THE VIGIL' : 'BEGIN THE VIGIL'}
              </span>
              {hasSave && (
                <span className="mt-2 font-ui text-[11px] font-bold tracking-[0.2em] text-[#c8a75e]">{resume.toUpperCase()}</span>
              )}
            </span>
          </ThornButton>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ThornButton small onClick={onLevels}>
              <Map className="h-4 w-4" /> LEVEL SELECT
            </ThornButton>
            <ThornButton small onClick={onGuide}>
              <ScrollText className="h-4 w-4" /> FIELD GUIDE
            </ThornButton>
            <ThornButton small danger={hasSave} onClick={onNewGame}>
              <Sparkles className="h-4 w-4" /> NEW GAME
            </ThornButton>
          </div>
          {!hasSave && (
            <p className="text-center font-ui text-[12px] font-semibold text-[#6b8571]">
              No save found — BEGIN THE VIGIL starts a fresh campaign at World 1-1.
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-ui text-[12px] font-semibold tracking-wider text-[#6b8571]">
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-[#57c178]" /> {LEVELS.length} levels · {WORLDS.length} worlds</span>
          <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-[#ffd76a]" /> {stars} / {LEVELS.length * 3} stars · {cleared}/{LEVELS.length} cleared</span>
          <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 text-[#7fd77f]" /> Flora {floraKnown}/{floraTotal}</span>
          <span className="flex items-center gap-1.5"><Bug className="h-4 w-4 text-[#c38fb8]" /> Blightspawn {enemiesKnown}/{enemiesTotal}</span>
        </div>
      </div>
    </Backdrop>
  );
}

// ── FIELD GUIDE ─────────────────────────────────────────────────────────────
type GuideTab = 'rules' | 'flora' | 'enemies';

/**
 * Blanks a sprite down to a pure silhouette: every channel driven to zero, so
 * the outline survives but the colours do not. This is how the guide shows an
 * entry the player has not met yet — the shape, and nothing else.
 */
function Silhouette({ children, tint = 'rgba(125,255,176,.35)' }: { children: ReactNode; tint?: string }) {
  return (
    <div
      className="h-full w-full"
      style={{ filter: `brightness(0) opacity(.82) drop-shadow(0 0 4px ${tint})` }}
      aria-hidden
    >
      {children}
    </div>
  );
}

const levelTag = (id: number) => {
  const l = LEVELS[id];
  return l ? `${l.world}-${l.idx}` : '—';
};

function Chip({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <span className="rounded bg-[#1b2a1f] px-1.5 py-0.5 font-ui text-[9px] font-extrabold tracking-widest" style={{ color: tone }}>
      {children}
    </span>
  );
}

/** Trait badges derived straight from a Flora's stats block. */
function FloraTags({ f }: { f: FloraStats }) {
  const a = f.attack;
  return (
    <>
      {!!a?.pierce && <Chip tone="#e4ff9c">PIERCES LANE</Chip>}
      {!!a?.fly && <Chip tone="#8fd0f5">ANTI-AIR</Chip>}
      {!!a?.slowPct && <Chip tone="#a8e0f0">SLOWS {Math.round(a.slowPct * 100)}%</Chip>}
      {!!a?.aoe && <Chip tone="#ffb37a">SPLASH</Chip>}
      {!!a?.splash && <Chip tone="#ff9a3d">BLAST ±{a.splash} TILE</Chip>}
      {!!a?.underground && <Chip tone="#9fd8c8">HITS BURROWED</Chip>}
      {!!a?.rearmost && <Chip tone="#d9e8a8">STRIKES FURTHEST</Chip>}
      {!!a?.rootDur && <Chip tone="#7fe0c0">ROOTS {a.rootDur}s</Chip>}
      {!!a?.beam && <Chip tone="#ff9a3d">BEAM</Chip>}
      {!!a?.spray && <Chip tone="#e8f0c8">{a.spray}-SHOT SPRAY</Chip>}
      {!!a?.altKind && <Chip tone="#7fd4ff">ALTERNATES CHANNEL</Chip>}
      {!!a?.knockback && <Chip tone="#a8e0f0">KNOCKS BACK {a.knockback}</Chip>}
      {!!a?.fire && <Chip tone="#ffb37a">FIRE</Chip>}
      {!!f.reach && <Chip tone="#d9e8a8">CATCHES SPINES</Chip>}
      {!!f.snapKill && <Chip tone="#ff9fb8">DEVOURS &lt;{f.snapKill} HP</Chip>}
      {!!f.counterDash && <Chip tone="#c9b8ee">RIPOSTE {f.counterDash}</Chip>}
      {!!f.ambush && <Chip tone="#8fd06a">AMBUSH {f.ambush}</Chip>}
      {!!f.produce && <Chip tone="#ffd76a">+{f.produce.amount} NECTAR / {f.produce.interval}s</Chip>}
    </>
  );
}

/** Trait badges for a Blightspawn — the same set the pre-battle intel panel uses. */
export function EnemyTags({ k, e }: { k: EnemyKey; e: EnemyStats }) {
  return (
    <>
      {e.boss && <span className="rounded bg-[#3a1622] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ff9db1]">BOSS</span>}
      {e.flying && <span className="rounded bg-[#1d2b3a] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#8fd0f5]">FLYING</span>}
      {e.vault && <span className="rounded bg-[#2a2410] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#e4ff9c]">LEAPS</span>}
      {e.stoneShield && <span className="rounded bg-[#26251f] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#d8d2c0]">SPLASH ONLY</span>}
      {e.burrowEmerge !== undefined && <span className="rounded bg-[#1d2e28] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#9fd8c8]">BURROWS</span>}
      {e.ranged && <span className="rounded bg-[#2e2a18] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ffe07a]">RANGED</span>}
      {k === 'imp' && <span className="rounded bg-[#2e1a2e] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ff9ad6]">DROPS IN</span>}
      {e.smashWindup && <span className="rounded bg-[#2e1c10] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ffb37a]">ONE-HIT SMASH</span>}
      {e.grabEvery && <span className="rounded bg-[#1c2634] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#a8c9ff]">STEALS</span>}
      {e.regrowHp !== undefined && <span className="rounded bg-[#12241a] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#a3f2a0]">REGENERATES</span>}
      {!!e.fireResist && <span className="rounded bg-[#2e1c10] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ffb37a]">DRINKS FIRE</span>}
      {!!e.hitFloor && <span className="rounded bg-[#26251f] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#e8d9a0]">SMALL HITS GRAZE</span>}
      {e.knockImmune && <span className="rounded bg-[#1f2326] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#d8d2c0]">UNPUSHABLE</span>}
      {e.dashShield && <span className="rounded bg-[#1c2634] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#cdd6de]">ARMORED DASH</span>}
      {e.tileWard && <span className="rounded bg-[#221a2e] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#d8b4ff]">WARD PER TILE</span>}
      {!!e.splitBelow && <span className="rounded bg-[#221a2e] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#d8b4ff]">MOLTS</span>}
      {!!e.absorbStatus && <span className="rounded bg-[#1d2e28] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#9fd8c8]">EATS STATUS</span>}
      {!!e.packSize && <span className="rounded bg-[#2a2410] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#e4ff9c]">PACK OF {e.packSize}</span>}
      {e.rootImmune && <span className="rounded bg-[#2e2a18] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ffe07a]">ROOT-IMMUNE</span>}
      {!!e.dashThrough && <span className="rounded bg-[#2e1a2e] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#ff9ad6]">SPRINTS PAST {e.dashThrough}</span>}
      {!!e.nectarDrain && <span className="rounded bg-[#12241a] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#a3f2a0]">DRAINS NECTAR</span>}
      {!!e.immuneCycle && <span className="rounded bg-[#221a2e] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#d8b4ff]">ROTATING WARD</span>}
      {!!e.shell && <span className="rounded bg-[#26251f] px-1.5 font-ui text-[9px] font-extrabold tracking-widest text-[#d8d2c0]">SHELL {e.shell}</span>}
    </>
  );
}

function StatRow({ label, value, hidden }: { label: string; value: ReactNode; hidden?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#22331f] py-1.5">
      <span className="font-ui text-[11px] font-extrabold tracking-[0.2em] text-[#7f9a85]">{label}</span>
      {hidden ? (
        <span className="font-ui text-[13px] font-black tracking-widest text-[#3f5745]">? ? ?</span>
      ) : (
        <span className="text-right font-ui text-[13px] font-bold text-[#e3ffe0]">{value}</span>
      )}
    </div>
  );
}

/** Full-page entry for one Flora / Blightspawn, opened by clicking its card. */
export function CodexEntry({
  kind,
  known,
  onBack,
}: {
  kind: { type: 'flora'; key: FloraKey } | { type: 'enemy'; key: EnemyKey };
  known: boolean;
  onBack: () => void;
}) {
  const isFlora = kind.type === 'flora';
  const f = isFlora ? FLORA[kind.key as FloraKey] : null;
  const e = isFlora ? null : ENEMIES[kind.key as EnemyKey];
  const unlockId = isFlora ? floraUnlockLevel(kind.key as FloraKey) : enemyFirstLevel(kind.key as EnemyKey);
  const seenIn = isFlora ? [] : enemyLevels(kind.key as EnemyKey);
  useEscape(true, onBack);
  return (
    <ModalShell onClose={onBack} width="max-w-2xl" z="z-[60]">
      <div className="flex items-start gap-5">
        <div
          className={`relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border p-3 ${
            known ? 'border-[#4a7a52] bg-[#14241a]' : 'border-[#2c4431] bg-[#1e2c24]'
          }`}
        >
          {isFlora
            ? known ? <FloraSprite k={kind.key as FloraKey} /> : <Silhouette><FloraSprite k={kind.key as FloraKey} /></Silhouette>
            : known
              ? <div style={{ filter: 'drop-shadow(0 0 6px rgba(207,139,247,.4))' }}><EnemySprite k={kind.key as EnemyKey} shellFrac={e?.shell ? 1 : 0} stoneFrac={e?.stoneShield ? 1 : 0} /></div>
              : <Silhouette tint="rgba(207,139,247,.35)"><EnemySprite k={kind.key as EnemyKey} shellFrac={e?.shell ? 1 : 0} stoneFrac={e?.stoneShield ? 1 : 0} /></Silhouette>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-ui text-[11px] font-extrabold tracking-[0.35em] text-[#7f9a85]">
            {isFlora ? 'FLORA ENTRY' : 'BLIGHTSPAWN ENTRY'}
          </div>
          <h3 className={`font-display text-3xl font-black ${known ? (isFlora ? 'text-[#a3f2a0]' : 'text-[#e0c3f2]') : 'text-[#5b7363]'}`}>
            {known ? (isFlora ? f!.name : e!.name) : 'UNIDENTIFIED'}
          </h3>
          {known && isFlora && (
            <div className="mt-1 font-ui text-[12px] font-bold tracking-[0.25em] text-[#7f9a85]">{f!.role.toUpperCase()}</div>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {known && isFlora && <FloraTags f={f!} />}
            {known && !isFlora && <EnemyTags k={kind.key as EnemyKey} e={e!} />}
            {!known && <Chip tone="#5b7363">NOT YET ENCOUNTERED</Chip>}
          </div>
        </div>
        <button onClick={onBack} className="shrink-0 rounded-lg border border-[#3a5a3f] p-1.5 text-[#9db08f] hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          {isFlora ? (
            <>
              <StatRow label="COST" hidden={!known} value={<span className="text-[#ffd76a]">{f!.cost} nectar</span>} />
              <StatRow label="RECHARGE" hidden={!known} value={`${f!.recharge}s`} />
              <StatRow label="HEALTH" hidden={!known} value={`${f!.hp} HP`} />
              <StatRow
                label="ATTACK"
                hidden={!known}
                value={f!.attack ? `${f!.attack.dmg} dmg / ${f!.attack.interval}s` : 'no attack'}
              />
            </>
          ) : (
            <>
              <StatRow label="HEALTH" hidden={!known} value={`${e!.hp} HP`} />
              <StatRow label="SPEED" hidden={!known} value={`${e!.speed.toFixed(2)} cols/s`} />
              <StatRow label="BITE" hidden={!known} value={`${e!.dmg} dmg / ${e!.atkInterval}s`} />
              <StatRow label="FIRST SIGHTED" value={`World ${levelTag(unlockId ?? 0)}`} />
            </>
          )}
        </div>
        <div className="rounded-xl border border-[#2c4431] bg-[#101d13] p-4">
          <div className="mb-2 font-ui text-[11px] font-extrabold tracking-[0.3em] text-[#7f9a85]">
            {isFlora ? 'WARDEN’S NOTES' : 'FIELD NOTES'}
          </div>
          {known ? (
            <>
              <p className="font-ui text-[13px] leading-relaxed text-[#b9cbb2]">{isFlora ? f!.desc : e!.desc}</p>
              {!isFlora && (
                <p className="mt-3 font-ui text-[13px] font-bold leading-relaxed text-[#a3f2a0]">
                  Counter: {e!.counter}
                </p>
              )}
              {!isFlora && seenIn.length > 0 && (
                <p className="mt-3 font-ui text-[11px] font-bold tracking-wider text-[#7f9a85]">
                  SIGHTED IN {seenIn.length} LEVEL{seenIn.length > 1 ? 'S' : ''}: {seenIn.map(levelTag).join(' · ')}
                </p>
              )}
            </>
          ) : (
            <p className="font-ui text-[13px] leading-relaxed text-[#8ba48f]">
              {isFlora
                ? 'The warden has not written this one up yet. Its seeds do not wake until'
                : 'Nothing is known of this species — no warden has watched one march and lived to sketch it. It first walks at'}{' '}
              <b className="text-[#ffd76a]">World {levelTag(unlockId ?? 0)}</b>.
              {isFlora ? ' Reach that world and the entry fills itself in.' : ' Survive it and the entry fills itself in.'}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <ThornButton small onClick={onBack}>BACK TO THE GUIDE</ThornButton>
      </div>
    </ModalShell>
  );
}

// The entry learns whether it is unlocked from the guide's own sets.

export function GuideModal({
  onClose,
  unlockedFlora,
  unlockedEnemies,
  initialTab = 'rules',
}: {
  onClose: () => void;
  unlockedFlora: Set<FloraKey>;
  unlockedEnemies: Set<EnemyKey>;
  initialTab?: GuideTab;
}) {
  const [tab, setTab] = useState<GuideTab>(initialTab);
  const [entry, setEntry] = useState<{ type: 'flora'; key: FloraKey } | { type: 'enemy'; key: EnemyKey } | null>(null);

  useEscape(!entry, onClose);

  const floraKnown = FLORA_ORDER.filter((k) => unlockedFlora.has(k)).length;
  const enemyKnown = ENEMY_ORDER.filter((k) => unlockedEnemies.has(k)).length;

  const tabs: { id: GuideTab; label: string; icon: ReactNode; count?: string }[] = [
    { id: 'rules', label: 'THE RULES', icon: <ScrollText className="h-4 w-4" /> },
    { id: 'flora', label: 'FLORA', icon: <Leaf className="h-4 w-4" />, count: `${floraKnown}/${FLORA_ORDER.length}` },
    { id: 'enemies', label: 'BLIGHTSPAWN', icon: <Bug className="h-4 w-4" />, count: `${enemyKnown}/${ENEMY_ORDER.length}` },
  ];

  return (
    <>
    <ModalShell onClose={onClose} width="max-w-5xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black text-[#a3f2a0]">Field Guide</h2>
          <p className="mt-1 font-ui text-[12px] text-[#7f9a85]">
            Silhouettes are entries you have not met yet — the shape is all the vale will show you.
          </p>
        </div>
        <button onClick={onClose} className="shrink-0 rounded-lg border border-[#3a5a3f] p-1.5 text-[#9db08f] hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-[#22331f] pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-ui text-[12px] font-extrabold tracking-[0.2em] transition-colors ${
              tab === t.id
                ? 'border-[#7fd77f] bg-[#1c3323] text-[#e3ffe0]'
                : 'border-[#2c4431] bg-[#101d13] text-[#7f9a85] hover:border-[#4a7a52] hover:text-[#bfe3bb]'
            }`}
          >
            {t.icon}
            {t.label}
            {t.count && <span className="rounded bg-[#0b140d] px-1.5 py-0.5 text-[10px] text-[#a3f2a0]">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
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
          <Rule n="5" title="The shovel">
            Digging up a Flora returns <b>nothing</b>. Use it to rebuild a broken lane, not to save money.
          </Rule>
          <Rule n="6" title="The Depths punish habits">
            In the Rootbound Depths the blight answers how you defend: Mite Vaulters leap a lone wall, Tunnel Larva surface at
            column 6 behind your front line, Locust Rangers snipe from two tiles out, Spore Imps catapult into your back half,
            Gargant Husks smash a plant dead after a 1.5s wind-up, and Root Thieves make off with your most wounded Flora.
            Defense in depth — never one wall and a prayer.
          </Rule>
          <Rule n="7" title="The Flora answer back">
            Flora Batch 1 arrives with the Depths. The <b className="text-[#ffb37a]">Cinderpod</b> blasts a tile and the one beside it — the reliable
            way through a Stoneback slab. The <b className="text-[#9fd8c8]">Deeproot Sentry</b> is the only plant that can shoot a burrowed Tunnel Larva.
            The <b className="text-[#d9e8a8]">Bulwark Bramble</b> snatches Locust spines out of the air. The <b className="text-[#ff9fb8]">Snaptrap Root</b> eats
            anything under 100 HP that steps into its tile, and nothing else. The <b className="text-[#a3f2a0]">Watchvine</b> always strikes the enemy
            furthest along its lane — even one that has slipped behind it. The <b className="text-[#7fe0c0]">Bindweed Snare</b> roots one foe per cast,
            smash wind-ups included. The <b className="text-[#ffd7ef]">Nectar Lotus</b> ripens +40 and rebates the next planting. Pick six; the Depths
            will tell you which six.
          </Rule>
          <Rule n="8" title="The Crown punishes your counters">
            Under the Hollow Crown the blight has studied the answers you were handed. The <b className="text-[#a8ffd0]">Grovemaw Slug</b> eats your
            slows and poisons and turns them into damage reduction — leave the control Flora at home. The <b className="text-[#d9b98a]">Barkskin Marauder</b> shrugs
            off Bindweed entirely and cannot be stalled, only killed. <b className="text-[#ffb1d6]">Chitterling Packs</b> arrive four to a lane slot, each far too
            small to matter alone. The <b className="text-[#c9b8ee]">Nightcap Assassin</b> sprints clean past your front two plants and bursts something in the
            back row, and the <b className="text-[#c8e88a]">Fen Wretch</b> halves every Nectar plant in its lane just by standing there. <b className="text-[#ffd76a]">Molt Wisps</b> split
            in two below half HP — one big hit buys the blight two bodies. And <b className="text-[#d8a8ff]">the Hollow King</b> switches a whole damage
            channel off for five seconds at a time, so a tray that only does one kind of damage will stall.
          </Rule>
          <Rule n="9" title="Fight back without a status effect">
            The Crown eats slows and shrugs off roots, so the second Flora wave does its work with physics instead.
            The <b className="text-[#cdd6de]">Ironbark Titan</b> lands 80 raw damage a swing — nothing to absorb. The <b className="text-[#ff9a3d]">Emberlash Vine</b> holds a
            continuous burn beam, so a <b>Molt Wisp</b> splitting costs it no wasted shot. The <b className="text-[#e8f0c8]">Needle Reed</b> spreads five needles across
            three bodies instead of overkilling one. The <b className="text-[#a8e0f0]">Gale Fern</b> shoves the leader back two tiles — displacement, which root
            immunity does not answer. The <b className="text-[#c9b8ee]">Sentinel Bloom</b> counter-strikes anything that sprints or leaps past it. The <b className="text-[#8fd06a]">Ambush Fern</b> folds
            until something enters its tile, then hits for 120. And the <b className="text-[#7fd4ff]">Prism Bud</b> alternates damage channel every other shot, so the
            Hollow King's ward is never a full answer.
          </Rule>
          <Rule n="10" title="The Reckoning spends your favorites">
            In the Hollow Reckoning the blight answers the answer-plants. The <b className="text-[#a3f2a0]">Regrowth Husk</b> knits 15 HP back every 2s it goes
            unhit — burst with gaps between swings feeds it; streams starve it. The <b className="text-[#ffb37a]">Cinder Golem</b> drinks half of every burn hit,
            so pair fire with physical. The <b className="text-[#e8d9a0]">Bulwark Roach</b> floors any single hit under 10 down to 1 — spray bounces off it.
            The <b className="text-[#d8d2c0]">Boulder Toad</b> cannot be displaced at all. The <b className="text-[#cdd6de]">Iron Nightstalker</b>'s plate eats
            the first hit of every dash — even the Sentinel Bloom's counter — and it retreats to re-arm. And the <b className="text-[#d8b4ff]">Wardshell Grub</b>
            nullifies the first hit inside every new tile, so an Ambush Fern springs for nothing. No single plant solves these lanes; the tray has to run as a mix.
          </Rule>
        </div>
      )}

      {tab === 'flora' && (
        <>
          <div className="mb-3 flex items-center gap-2 font-ui text-[12px] font-bold tracking-wider text-[#7f9a85]">
            <Leaf className="h-4 w-4 text-[#7fd77f]" />
            {floraKnown} of {FLORA_ORDER.length} catalogued · tap any entry for its full write-up
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {FLORA_ORDER.map((k) => {
              const known = unlockedFlora.has(k);
              const def = FLORA[k];
              return (
                <button
                  key={k}
                  onClick={() => setEntry({ type: 'flora', key: k })}
                  className={`group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all ${
                    known
                      ? 'border-[#2c4431] bg-[#14241a] hover:border-[#7fd77f] hover:bg-[#182c1e]'
                      : 'border-[#243029] bg-[#111a15] hover:border-[#4a7a52]'
                  }`}
                >
                  <div className={`relative mx-auto h-[72px] w-[72px] rounded-lg ${known ? '' : 'bg-gradient-to-b from-[#24342a] to-[#18241d]'}`}>
                    {known ? <FloraSprite k={k} /> : <Silhouette><FloraSprite k={k} /></Silhouette>}
                    {!known && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md border border-[#3f5745] bg-[#0b140d] text-[#5b7363]">
                        <Lock className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className={`mt-1 truncate text-center font-ui text-[13px] font-extrabold ${known ? 'text-[#e3ffe0]' : 'text-[#5b7363]'}`}>
                    {known ? def.name : 'Undiscovered'}
                  </div>
                  <div className="flex items-center justify-center gap-2 font-ui text-[11px] font-bold">
                    {known ? (
                      <>
                        <span className="flex items-center gap-0.5 text-[#ffd76a]"><Droplets className="h-3 w-3" />{def.cost}</span>
                        <span className="flex items-center gap-0.5 text-[#8fd0f5]"><Hourglass className="h-3 w-3" />{def.recharge}s</span>
                      </>
                    ) : (
                      <span className="text-[#3f5745]">world {levelTag(floraUnlockLevel(k))}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === 'enemies' && (
        <>
          <div className="mb-3 flex items-center gap-2 font-ui text-[12px] font-bold tracking-wider text-[#7f9a85]">
            <Bug className="h-4 w-4 text-[#c38fb8]" />
            {enemyKnown} of {ENEMY_ORDER.length} catalogued · the ones in shadow are still out there
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {ENEMY_ORDER.map((k) => {
              const known = unlockedEnemies.has(k);
              const def = ENEMIES[k];
              const first = enemyFirstLevel(k);
              return (
                <button
                  key={k}
                  onClick={() => setEntry({ type: 'enemy', key: k })}
                  className={`group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all ${
                    known
                      ? 'border-[#33243a] bg-[#1a121f] hover:border-[#c38fb8] hover:bg-[#221827]'
                      : 'border-[#231c28] bg-[#120e15] hover:border-[#5b4466]'
                  }`}
                >
                  <div className={`relative mx-auto h-[72px] w-[72px] rounded-lg ${known ? '' : 'bg-gradient-to-b from-[#2a2130] to-[#1a1520]'}`}>
                    {known ? (
                      <div style={{ filter: 'drop-shadow(0 0 6px rgba(207,139,247,.4))' }}>
                        <EnemySprite k={k} shellFrac={def.shell ? 1 : 0} stoneFrac={def.stoneShield ? 1 : 0} />
                      </div>
                    ) : (
                      <Silhouette tint="rgba(207,139,247,.3)"><EnemySprite k={k} shellFrac={def.shell ? 1 : 0} stoneFrac={def.stoneShield ? 1 : 0} /></Silhouette>
                    )}
                    {!known && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md border border-[#4a3a55] bg-[#0d0a10] text-[#7a6288]">
                        <Lock className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className={`mt-1 truncate text-center font-ui text-[13px] font-extrabold ${known ? 'text-[#ecd7f7]' : 'text-[#7a6288]'}`}>
                    {known ? def.name : 'Unknown species'}
                  </div>
                  <div className="flex items-center justify-center gap-2 font-ui text-[11px] font-bold">
                    {known ? (
                      <span className="flex items-center gap-1 text-[#ff9db1]">
                        <Heart className="h-3 w-3" />{def.hp}
                        {def.boss && <Swords className="ml-0.5 h-3 w-3 text-[#ff5d7c]" />}
                      </span>
                    ) : (
                      <span className="text-[#5b4466]">{first === null ? 'unseen' : `world ${levelTag(first)}`}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 flex justify-end"><ThornButton primary small onClick={onClose}>UNDERSTOOD</ThornButton></div>
    </ModalShell>
    {entry && (
      <CodexEntry
        kind={entry}
        known={entry.type === 'flora' ? unlockedFlora.has(entry.key) : unlockedEnemies.has(entry.key)}
        onBack={() => setEntry(null)}
      />
    )}
    </>
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
  onPick: (world: WorldId) => void;
  onBack: () => void;
}) {
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-10">
        <Header kicker="CHOOSE YOUR GROUND" title="Five Worlds of the Vale" />
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
  guideFlora,
  guideEnemies,
}: {
  world: WorldId;
  maxLevel: number;
  stars: Record<number, number>;
  onPick: (level: LevelDef) => void;
  onBack: () => void;
  guideFlora: Set<FloraKey>;
  guideEnemies: Set<EnemyKey>;
}) {
  const levels = LEVELS.filter((l) => l.world === world);
  const w = WORLDS.find((x) => x.id === world)!;
  const [guide, setGuide] = useState(false);
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-10">
        <Header
          kicker={`WORLD ${world} — ${w.name.toUpperCase()}`}
          title={w.id === 1 ? 'Hold the Vale' : w.id === 5 ? 'Answer What You Taught' : 'Break the Hollow'}
        />
        <div className="flex w-full flex-col gap-3">
          {levels.map((l) => {
            const locked = l.id > maxLevel;
            const st = stars[l.id] ?? 0;
            const newFlora = floraUnlockedAt(l.id);
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
                        UNLOCKS {FLORA[newFlora[0]].name.toUpperCase()}
                        {newFlora.length > 1 ? ` +${newFlora.length - 1}` : ''}
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
        <div className="mt-8 flex gap-3">
          <ThornButton small onClick={onBack}><ArrowLeft className="h-4 w-4" /> WORLDS</ThornButton>
          <ThornButton small onClick={() => setGuide(true)}><ScrollText className="h-4 w-4" /> FIELD GUIDE</ThornButton>
        </div>
      </div>
      {guide && (
        <GuideModal
          initialTab="enemies"
          unlockedFlora={guideFlora}
          unlockedEnemies={guideEnemies}
          onClose={() => setGuide(false)}
        />
      )}
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
  const hasSplash = picked.includes('cinderpod') || picked.includes('cactus') || picked.includes('frostcap');
  const needsBurrowWatch = intel.includes('larva');
  const hasBurrowWatch = picked.includes('deeproot');
  const needsReach = intel.includes('ranger');
  const hasReach = picked.includes('bulwark');
  const needsBackline = intel.includes('imp') || intel.includes('thief');
  const hasBackline = picked.includes('watchvine') || picked.includes('snaptrap');
  const needsRoot = intel.includes('husk');
  const hasRoot = picked.includes('bindweed');
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
                        <EnemyTags k={ek} e={e} />
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
                Stoneback Grubs expected — their slabs ignore single-target fire. Bring the Cinderpod, Spitting Cactus or Frostcap, or bring prayers.
              </div>
            )}
            {needsBurrowWatch && !hasBurrowWatch && (
              <div className="mt-3 rounded-xl border border-[#9fd8c8]/60 bg-[#12241f] px-3 py-2 font-ui text-[12px] font-bold text-[#9fd8c8]">
                Tunnel Larva expected — they ride under three columns untouchable. Without a Deeproot Sentry, that stretch of lane is theirs.
              </div>
            )}
            {needsReach && !hasReach && (
              <div className="mt-3 rounded-xl border border-[#d9e8a8]/60 bg-[#24260f] px-3 py-2 font-ui text-[12px] font-bold text-[#d9e8a8]">
                Locust Rangers expected — they snipe from two tiles out. A Bulwark Bramble catches the spines so your cannons never meet them.
              </div>
            )}
            {needsBackline && !hasBackline && (
              <div className="mt-3 rounded-xl border border-[#ff9fb8]/60 bg-[#2a0e18] px-3 py-2 font-ui text-[12px] font-bold text-[#ff9fb8]">
                Things will land behind your wall (Spore Imps) and slip through it (Root Thieves). The Watchvine shoots backwards at whatever is furthest
                along; the Snaptrap Root swallows the small ones whole.
              </div>
            )}
            {needsRoot && !hasRoot && (
              <div className="mt-3 rounded-xl border border-[#7fe0c0]/60 bg-[#0f241f] px-3 py-2 font-ui text-[12px] font-bold text-[#7fe0c0]">
                Gargant Husks cannot be tanked — they smash a plant dead regardless of HP. The Bindweed Snare roots one per cast and breaks the wind-up.
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
export function PauseOverlay({
  onResume,
  onRestart,
  onQuit,
  onGuide,
}: {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onGuide?: () => void;
}) {
  return (
    <OverlayFrame>
      <h2 className="font-display text-4xl font-black text-[#eaffd9]">The Vale Waits</h2>
      <p className="mt-2 font-ui text-[14px] text-[#9db08f]">Paused. The Blightspawn are patient. Are you?</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ThornButton primary small onClick={onResume}><Play className="h-4 w-4" /> RESUME</ThornButton>
        <ThornButton small onClick={onRestart}><RotateCcw className="h-4 w-4" /> RESTART</ThornButton>
        {onGuide && <ThornButton small onClick={onGuide}><ScrollText className="h-4 w-4" /> FIELD GUIDE</ThornButton>}
        <ThornButton small danger onClick={onQuit}><X className="h-4 w-4" /> ABANDON</ThornButton>
      </div>
    </OverlayFrame>
  );
}

export function WinOverlay({
  stars,
  snaresLeft,
  isLast,
  onNext,
  onReplay,
  onMap,
}: {
  stars: number;
  snaresLeft?: number;
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
        {stars === 3 ? (snaresLeft === 5 ? 'Flawless — not a single Root Snare was spent.' : 'A third star — the Heart Tree stands nearly untouched.') : stars === 2 ? 'The snares held, mostly. Keep every Root Snare buried for a third star.' : 'Victory, but at a cost. The Vale remembers.'}
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
