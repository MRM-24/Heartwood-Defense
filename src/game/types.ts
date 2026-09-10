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
  | 'sentinel';

export type EnemyKey =
  | 'gnat'
  | 'beetle'
  | 'skitter'
  | 'warden'
  | 'drifter'
  | 'brute'
  | 'colossus';

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
  };
  produce?: { amount: number; interval: number };
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
  desc: string;
  counter: string;
}

export interface WaveGroup {
  type: EnemyKey;
  count: number;
  gap: number; // seconds between individuals
  startDelay?: number; // offset within the wave
}

export interface WaveDef {
  at: number; // seconds into the level when the group starts
  groups: WaveGroup[];
}

export interface LevelDef {
  id: number; // 0..9 global
  world: 1 | 2;
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
}

export interface Proj {
  id: number;
  lane: number;
  x: number;
  prevX: number;
  dmg: number;
  pierce: boolean;
  fly: boolean;
  slowPct: number;
  slowDur: number;
  kind: 'thorn' | 'spike' | 'frost' | 'ray';
  hitIds: Set<number>; // pierce: enemies already struck
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
    | 'warn';
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
}
