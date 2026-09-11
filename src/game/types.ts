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
  | 'lotus' // economy — +40 Nectar and a tray-cooldown rebate
  // ── Flora Batch 2: answers to the Hollow Crown ──
  | 'ironbark' // 80 raw dmg / 3s, single target — nothing for a Grovemaw Slug to eat
  | 'emberlash' // continuous burn beam — no projectile, so no wasted shot on a split
  | 'needlereed' // 5-shot spray spread across up to 3 enemies — no overkill on swarms
  | 'gale' // knocks the leading enemy back 2 tiles — displacement, not a status
  | 'sentinelbloom' // counter-strikes anything that sprints or leaps across its tile
  | 'ambush' // inert until something enters its tile, then one huge hit
  | 'prism'; // alternates damage channel every shot — always has an answer to a ward

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
  | 'thief'
  // ── Batch 2: the Hollow Crown ──
  | 'wisp' // splits once below half HP — two smaller bodies, not one big one
  | 'slug' // eats slow/DoT and turns it into damage reduction
  | 'chitter' // arrives as a pack of four in a single lane slot
  | 'marauder' // root-immune — Bindweed Snare finds nothing to hold
  | 'nightcap' // sprints past the front two Flora to burst a back-row plant
  | 'wretch' // lane-wide aura: Nectar plants ripen at half rate
  | 'hollowking' // world boss — three phases, and a damage type that switches off
  // ── Batch 3: The Hollow Reckoning — each one spends a Flora Batch 2 gimmick ──
  | 'regrow' // Regrowth Husk: knits back HP every 2s it goes unhit
  | 'golem' // Cinder Golem: swallows half of every burn/fire hit
  | 'roach' // Bulwark Roach: single hits under 10 raw damage floor to 1
  | 'toad' // Boulder Toad: immune to knockback and displacement
  | 'nightstalker' // Iron Nightstalker: dash past the line, plate eats the first hit, retreats
  | 'wardshell'; // Wardshell Grub: first hit inside each new tile deals nothing

/** Which of the four campaign worlds a level lives in (Batch 3 extends to 5). */
export type WorldId = 1 | 2 | 3 | 4 | 5;

/**
 * The damage channels a hit can arrive on. The Hollow King's phase-2 immunity
 * shuts exactly one of these off for a few seconds at a time, which is what
 * forces a mixed loadout mid-fight.
 *
 * `physical` — a single-target strike (Thornvine, Sunflower Sentinel,
 *              Deeproot Sentry, Watchvine, Snaptrap's jaws).
 * `splash`   — area damage (Cinderpod blast, Cactus volley, Frostcap spores).
 * `poison`   — the damage-over-time channel. Wired end to end but DORMANT: no
 *              Flora applies poison yet, so nothing currently produces it.
 */
export type DmgKind = 'physical' | 'splash' | 'poison';

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
    // ── Enemy Batch 2: the DoT channel ──
    // Fully wired through the engine (projectile → damage → tick → Grovemaw
    // Slug → Hollow King immunity) but no Flora sets it yet. Adding a poison
    // plant later needs no engine surgery — just these two numbers.
    poisonDps?: number; // damage per second for the duration below
    poisonDur?: number; // seconds the target stays poisoned
    // ── Flora Batch 2 ──
    beam?: boolean; // Emberlash Vine: continuous damage, no projectile, nothing to absorb
    spray?: number; // Needle Reed: shots per volley
    sprayTargets?: number; // …spread across at most this many enemies in the lane
    altKind?: boolean; // Prism Bud: alternates physical ↔ splash every other shot
    knockback?: number; // Gale Fern: tiles of displacement on hit
    fire?: boolean; // burn/fire source — the Cinder Golem swallows half of it (Prism Bud's fire half is fire automatically)
  };
  produce?: { amount: number; interval: number; boost?: boolean }; // boost: Nectar Lotus tray rebate
  // ── Flora Batch 1 special rules ──
  reach?: boolean; // Bulwark Bramble: absorbs Locust Ranger spines crossing (or aimed past) its tile
  snapKill?: number; // Snaptrap Root: instant kill threshold for enemies entering its tile
  // ── Flora Batch 2 special rules ──
  counterDash?: number; // Sentinel Bloom: damage to any dashing/leaping enemy crossing its tile
  ambush?: number; // Ambush Fern: one-shot damage when an enemy enters its tile
  ambushCd?: number; // …seconds before it can spring again
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
  // ── Batch 2 special rules ──
  splitBelow?: number; // Molt Wisp: HP fraction at which the one-time split fires
  splitInto?: EnemyKey; // …and what it becomes (defaults to itself)
  splitCount?: number; // …how many bodies replace it
  splitHpFrac?: number; // …each body's HP as a fraction of the parent's maxHp
  absorbStatus?: number; // Grovemaw Slug: damage reduction gained per point of control eaten
  drCap?: number; // …hard ceiling on that reduction
  packSize?: number; // Chitterling Pack: how many bodies arrive in one lane slot
  rootImmune?: boolean; // Barkskin Marauder: root/immobilise does nothing to it
  dashThrough?: number; // Nightcap Assassin: Flora it sprints past before bursting
  nectarDrain?: number; // Fen Wretch: lane-wide multiplier applied to Nectar plant output
  enrageFrac?: number; // Hollow King: HP fraction that triggers the enrage
  immuneCycle?: { on: number; off: number }; // Hollow King: seconds immune / seconds open
  // ── Batch 3 special rules: THE HOLLOW RECKONING ──
  regrowHp?: number; // Regrowth Husk: HP knitted back …
  regrowEvery?: number; // …every N seconds it has not taken a hit
  fireResist?: number; // Cinder Golem: fraction of burn/fire damage the shell swallows
  hitFloor?: number; // Bulwark Roach: a single hit below this raw damage lands for 1
  knockImmune?: boolean; // Boulder Toad: displacement effects simply do not apply
  dashShield?: boolean; // Iron Nightstalker: a plate eats the first hit of every dash
  retreatAfterDash?: number; // …and after the burst it bounds this many tiles back east to re-arm
  tileWard?: boolean; // Wardshell Grub: the first hit taken inside each new tile deals nothing
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
  id: number; // 0..24 global
  world: WorldId;
  idx: number; // 1..5 within world
  name: string;
  blurb: string;
  tip: string;
  hpMul: number; // global enemy HP scaling (trash only)
  waves: WaveDef[];
  boss?: 'brute' | 'colossus' | 'hollowking';
  addPool: EnemyKey[]; // colossus adds
  // Root Snares still in the ground at level end that earn ★★ and ★★★.
  // Defaults to { two: 3, three: 5 } (flawless). Late-world levels tune the
  // gate so a third star stays achievable-but-tight as the board gets busier
  // — the threshold bends with the pressure, rather than star ratings silently
  // drifting to all-2★ then all-1★.
  starSnares?: { two: number; three: number };
}

/** Root-Snare thresholds for a level (2★ / 3★), with the campaign defaults. */
export const DEFAULT_STAR_SNARES = { two: 3, three: 5 } as const;

/** Star rating (1–3) from snares remaining at level end. */
export function starsForLevel(level: LevelDef, snaresLeft: number): number {
  const t = level.starSnares ?? DEFAULT_STAR_SNARES;
  return snaresLeft >= t.three ? 3 : snaresLeft >= t.two ? 2 : 1;
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
  withered: boolean; // a Fen Wretch in this lane is draining the harvest
  // ── Flora Batch 2 ──
  shotIdx: number; // Prism Bud: which channel the next shot goes out on
  ambushT: number; // Ambush Fern: seconds until it can spring again (0 = armed)
  struck: Set<number>; // Sentinel Bloom: enemies it has already counter-struck
  beamId: number | null; // Emberlash Vine: enemy currently under the beam
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
  // ── Enemy Batch 2 mechanics ──
  canSplit: boolean; // Molt Wisp: the split is once per body — halves never split
  poisonDps: number; // DoT channel: damage per second while poisoned (0 = clean)
  poisonUntil: number; // …and for how much longer
  drPct: number; // Grovemaw Slug: damage reduction from absorbed statuses
  drUntil: number; // …expires here
  dashT: number; // Nightcap Assassin: seconds of sprint remaining
  dashUsed: boolean; // …the sprint is once per assassin
  dashPassed: number; // …Flora tiles it has slipped past untouched
  dashCol: number; // …last tile already counted (-1 = none)
  immuneTo: DmgKind | null; // Hollow King: this damage channel is currently shut off
  immuneT: number; // …seconds left in the current window
  immuneOn: boolean; // …true while the window is an immunity, false in the gap
  immuneIdx: number; // …which channel comes next (alternates every window)
  enraged: boolean; // Hollow King phase 3: double attack speed, double damage taken
  // ── Enemy Batch 3 mechanics ──
  regrowT: number; // Regrowth Husk: seconds since the last hit landed — at 2s the knit closes
  shieldUp: boolean; // Iron Nightstalker: the plate is armed — the next hit of this dash is eaten
  retreatTo: number; // …x it is bounding back east to after a burst (-1 = not repositioning)
  wardUp: boolean; // Wardshell Grub: the surprise ward is armed for the tile it stands in
  wardCol: number; // …the tile that current ward was armed for
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
  kind: 'thorn' | 'spike' | 'frost' | 'ray' | 'cinder' | 'root' | 'bind' | 'bolt' | 'needle' | 'gale';
  hitIds: Set<number>; // pierce: enemies already struck
  // ── Flora Batch 1 ──
  dir: 1 | -1; // travel direction (Watchvine / Bindweed can fire backwards)
  splash: number; // blast radius in columns (0 = single target)
  underground: boolean; // travels beneath the surface — can strike a burrowed enemy
  rootDur: number; // 0 = no root; otherwise seconds of immobilise on hit
  targetId?: number; // locked-on shot: only this enemy can be struck
  // ── Enemy Batch 2 ──
  dmgKind: DmgKind; // which channel this hit arrives on (the Hollow King can shut one off)
  poisonDps: number; // DoT applied on hit (dormant — no Flora produces it yet)
  poisonDur: number;
  knockback: number; // Gale Fern: tiles this hit shoves the victim back
  // ── Enemy Batch 3 ──
  fire: boolean; // burn/fire hit — the Cinder Golem drinks half of it
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
    | 'under' // Deeproot Sentry round breaking ground
    // ── Enemy Batch 2 ──
    | 'molt' // Molt Wisp coming apart into two smaller bodies
    | 'feed' // Grovemaw Slug swallowing a status effect
    | 'shrug' // Barkskin Marauder throwing off a root
    | 'dash' // Nightcap Assassin sprint blur
    | 'strike' // Nightcap Assassin's single back-row burst
    | 'ward' // Hollow King shutting a damage channel off (or a hit bouncing off it)
    | 'enrage' // Hollow King phase 3
    // ── Flora Batch 2 ──
    | 'riposte' // Sentinel Bloom counter-striking a sprint or a leap
    | 'ambush' // Ambush Fern springing
    | 'gale' // Gale Fern gust shoving something backwards
    // ── Enemy Batch 3 ──
    | 'regrow' // Regrowth Husk knitting an open wound shut
    | 'resist' // Cinder Golem swallowing the burn
    | 'graze' // a hit under the Bulwark Roach's floor skitters off
    | 'anchor' // Boulder Toad refusing to be displaced
    | 'plate' // Iron Nightstalker's shield eating a hit — or being raised with a dash
    | 'shroud' // Wardshell Grub's surprise ward fizzling the first hit in a tile
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
