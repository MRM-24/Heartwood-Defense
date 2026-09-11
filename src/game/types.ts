// ─── Core game types ────────────────────────────────────────────────────────
export const LANES = 5;
export const COLS = 9;
export const TICK = 0.1; // fixed logic tick (seconds)
export const FRONT_OFF = 0.34; // enemy "mouth" offset from its x anchor (col units)

export type FloraKey =
  | 'thornvine'
  | 'glowbulb'
  | 'bramble'
  | 'cactus'
  | 'frostcap'
  | 'sentinel'
  // ── Flora Batch 1: answers to the Rootbound Depths ──
  | 'cinderpod' // explosive in-lane splash — cracks Stoneback slabs
  | 'deeproot' // underground battery — the only plant that sees a burrowed Tunnel Larva
  | 'bulwark' // wall with reach — swallows Locust Ranger spines
  | 'snaptrap' // passive maw — devours anything under 100 HP that enters its tile
  | 'watchvine' // rearguard shooter — always hits the enemy furthest along the lane
  | 'bindweed' // root control — immobilises one enemy per cast, no damage
  | 'lotus'; // economy — +40 Nectar and a tray-cooldown rebate

export type EnemyKey =
  | 'gnat'
  | 'beetle'
  | 'skitter'
  | 'warden'
  | 'drifter'
  | 'brute'
  | 'colossus'
  // ── Batch 1: the Rootbound Depths ──
  | 'vaulter'
  | 'grub'
  | 'larva'
  | 'ranger'
  | 'imp'
  | 'husk'
  | 'thief';

export interface FloraStats {
  key: FloraKey;
  name: string;
  cost: number;
  recharge: number; // seconds until you may plant another
  hp: number;
  role: string;
  desc: string;
  attack?: {
    dmg: number;
    interval: number;
    pierce?: boolean; // hits every enemy in the lane
    fly?: boolean; // can target flying enemies
    slowPct?: number;
    slowDur?: number;
    aoe?: boolean; // splash source — the only thing that cracks a Stoneback Grub's slab
    // ── Flora Batch 1 ──
    splash?: number; // Cinderpod: blast radius in columns around the impact (real AoE)
    underground?: boolean; // Deeproot Sentry: may target & strike a burrowed Tunnel Larva
    rearmost?: boolean; // Watchvine / Bindweed: ignores facing — always picks the enemy furthest along the lane
    rootDur?: number; // Bindweed Snare: full immobilise duration (no damage)
    quiet?: boolean; // the shot deals no damage — don't spam hit fx on big bodies
  };
  produce?: { amount: number; interval: number; boost?: boolean }; // boost: Nectar Lotus tray rebate
  // ── Flora Batch 1 special rules ──
  reach?: boolean; // Bulwark Bramble: absorbs Locust Ranger spines crossing (or aimed past) its tile
  snapKill?: number; // Snaptrap Root: instant kill threshold for enemies entering its tile
}

export interface EnemyStats {
  key: EnemyKey;
  name: string;
  hp: number;
  speed: number; // columns per second
  dmg: number;
  atkInterval: number;
  flying?: boolean;
  shell?: number; // armored shell HP (absorbs 50% of each hit)
  spacing: number; // gap kept from enemy ahead (col units)
  scale: number; // visual scale
  boss?: boolean;
  noScale?: boolean; // exempt from level hpMul (spec-fixed HP, e.g. Spore Imp)
  // ── Batch 1 special rules ──
  vault?: boolean; // Mite Vaulter: leaps the first blocking Flora, once
  stoneShield?: number; // Stoneback Grub: slab HP — blocks 100% of damage, only splash wears it down
  burrowEmerge?: number; // Tunnel Larva: x below which it surfaces (untargetable + unblockable above)
  ranged?: number; // Locust Ranger: attack range in cols ahead of its mouth
  smashWindup?: number; // Gargant Husk: wind-up seconds before a one-hit Flora kill
  grabEvery?: number; // Root Thief: seconds between snatch attempts
  escapeTime?: number; // Root Thief: seconds it takes to haul loot off the right edge
  desc: string;
  counter: string;
}

export interface WaveGroup {
  type: EnemyKey;
  count: number;
  gap: number; // seconds between individuals
  startDelay?: number; // offset within the wave
  catapult?: boolean; // delivered over the wall into a random back-half tile (Spore Imp)
}

export interface WaveDef {
  at: number; // seconds into the level when the group starts
  groups: WaveGroup[];
}

export interface LevelDef {
  id: number; // 0..14 global
  world: 1 | 2 | 3;
  idx: number; // 1..5 within world
  name: string;
  blurb: string;
  tip: string;
  hpMul: number; // global enemy HP scaling (trash only)
  waves: WaveDef[];
  boss?: 'brute' | 'colossus';
  addPool: EnemyKey[]; // colossus adds
}

// ─── Runtime entities ───────────────────────────────────────────────────────
export interface FloraEnt {
  id: number;
  key: FloraKey;
  lane: number;
  col: number;
  hp: number;
  maxHp: number;
  atkT: number; // time until next shot
  prodT: number; // time until next nectar pulse
  flash: number; // hit-flash timer
  fired: number; // muzzle-flash timer
  prod: number; // production glow timer
  eatenBy: number | null; // id of enemy currently chewing (for anim)
}

export interface EnemyEnt {
  id: number;
  key: EnemyKey;
  lane: number;
  x: number; // anchor position in column units (9.4 → 0)
  prevX: number;
  hp: number;
  maxHp: number;
  shell: number;
  maxShell: number;
  atkT: number;
  slowUntil: number;
  slowPct: number;
  hitFlash: number;
  phase: number; // boss phase
  addT: number; // boss add timer
  chewing: boolean; // currently attacking a plant
  born: number; // spawn tick for entry anim
  // ── Batch 1 mechanics ──
  vaulted: boolean; // Mite Vaulter: has used its leap
  jumpT: number; // remaining leap time (0 = grounded)
  jumpFrom: number; // leap start x
  jumpTo: number; // leap landing x
  stone: number; // Stoneback Grub slab HP
  maxStone: number;
  burrowed: boolean; // Tunnel Larva: underground & untargetable
  windup: number; // Gargant Husk: seconds charged into the current smash
  grabT: number; // Root Thief: seconds until the next snatch attempt
  carrying: FloraEnt | null; // Root Thief: uprooted Flora being hauled away
  carrySpd: number; // Root Thief: flee speed toward the right edge
  stunT: number; // Spore Imp: landing recovery (no move / no bite)
  // ── Flora Batch 1 mechanics ──
  rootUntil: number; // Bindweed Snare: fully immobilised until this time (no move, no bite, no wind-up)
}

export interface Proj {
  id: number;
  lane: number;
  x: number;
  prevX: number;
  dmg: number;
  pierce: boolean;
  fly: boolean;
  aoe: boolean; // splash source — cracks Stoneback Grub slabs
  slowPct: number;
  slowDur: number;
  kind: 'thorn' | 'spike' | 'frost' | 'ray' | 'cinder' | 'root' | 'bind';
  hitIds: Set<number>; // pierce: enemies already struck
  // ── Flora Batch 1 ──
  dir: 1 | -1; // travel direction (Watchvine / Bindweed can fire backwards)
  splash: number; // blast radius in columns (0 = single target)
  underground: boolean; // travels beneath the surface — can strike a burrowed enemy
  rootDur: number; // 0 = no root; otherwise seconds of immobilise on hit
  targetId?: number; // locked-on shot: only this enemy can be struck
}

// Enemy-fired ordnance (Locust Ranger thorn spines) — hunts one Flora.
export interface EProj {
  id: number;
  lane: number;
  x: number;
  prevX: number;
  col: number; // target tile column
  targetId: number; // FloraEnt id the spine was aimed at
  dmg: number;
}

export interface Fx {
  id: number;
  kind:
    | 'burst'
    | 'sporeburst'
    | 'nectar'
    | 'income'
    | 'snare'
    | 'place'
    | 'shovel'
    | 'reject'
    | 'splash'
    | 'shockwave'
    | 'warn'
    // ── Batch 1 ──
    | 'dirt' // earthy puff (vaulter landing, dirt kicked up)
    | 'emerge' // Tunnel Larva surfacing
    | 'smash' // Gargant Husk obliterating a Flora
    | 'grab' // Root Thief uprooting a Flora
    | 'drop' // stolen Flora dropped back in place
    | 'stolen' // Root Thief made it off-board with the goods
    | 'shieldbreak' // Stoneback Grub slab shattering
    | 'deflect' // single-target ping off a Stoneback slab
    | 'cata' // Spore Imp incoming — tile telegraph
    | 'land' // Spore Imp impact
    // ── Flora Batch 1 ──
    | 'boom' // Cinderpod detonation
    | 'snap' // Snaptrap Root swallowing something small
    | 'root' // Bindweed Snare pinning an enemy
    | 'absorb' // Bulwark Bramble drinking a Locust spine
    | 'lotus' // Nectar Lotus tray rebate spark
    | 'under'; // Deeproot Sentry round breaking ground
  lane: number;
  x: number; // col units (or grid-relative)
  ttl: number;
  max: number;
  text?: string;
}

export interface PendingSpawn {
  at: number;
  type: EnemyKey;
  lane: number;
  wave: number; // wave index (for progress)
  x?: number; // catapult landing x (col units)
  catapult?: boolean;
  warned?: boolean; // telegraph marker already shown
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  t: number; // elapsed seconds
  tick: number;
  level: LevelDef;
  loadout: FloraKey[];
  nectar: number;
  nectarT: number; // passive income timer
  trayCd: Record<string, number>; // per-flora recharge remaining
  grid: (FloraEnt | null)[][]; // [lane][col]
  enemies: EnemyEnt[];
  projs: Proj[];
  eprojs: EProj[]; // enemy-fired spines
  fx: Fx[];
  pending: PendingSpawn[];
  snares: boolean[]; // per-lane root snare charge
  snareFx: number[]; // per-lane snare flash timer
  status: GameStatus;
  lostLane: number;
  waveTotal: number;
  waveAlert: number; // last wave index that began spawning
  waveAlertT: number; // banner countdown
  warnWave: number; // wave index the banner is warning about
  selected: FloraKey | null;
  shovelArmed: boolean;
  events: string[]; // drained by UI each frame for SFX
  shake: number; // screen shake timer
  kills: number;
  nextId: number;
  rngState: number;
  placedCount: number;
  bossKey: EnemyKey | null;
  lotusT: number; // Nectar Lotus rebate window remaining (seconds)
}
