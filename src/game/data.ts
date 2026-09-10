import type { EnemyKey, EnemyStats, FloraKey, FloraStats, LevelDef, WaveDef, WaveGroup } from './types';

// ─── FLORA ──────────────────────────────────────────────────────────────────
export const FLORA: Record<FloraKey, FloraStats> = {
  thornvine: {
    key: 'thornvine',
    name: 'Thornvine',
    cost: 50,
    recharge: 5,
    hp: 100,
    role: 'Shooter',
    desc: 'Launches thorns down its lane for 18 dmg every 1.4s. The backbone of any defense.',
    attack: { dmg: 18, interval: 1.4 },
  },
  glowbulb: {
    key: 'glowbulb',
    name: 'Glowbulb',
    cost: 25,
    recharge: 8,
    hp: 40,
    role: 'Economy',
    desc: 'No attack. Ripens +20 Nectar every 12s. Plant early, plant often.',
    produce: { amount: 20, interval: 12 },
  },
  bramble: {
    key: 'bramble',
    name: 'Bramblewall',
    cost: 75,
    recharge: 8,
    hp: 400,
    role: 'Blocker',
    desc: 'A knot of thorns with 400 HP. Holds the line while shooters work.',
  },
  cactus: {
    key: 'cactus',
    name: 'Spitting Cactus',
    cost: 100,
    recharge: 8,
    hp: 80,
    role: 'Pierce',
    desc: 'Spits a spike volley every 1.8s that strikes EVERY enemy in its lane for 15 dmg.',
    attack: { dmg: 15, interval: 1.8, pierce: true },
  },
  frostcap: {
    key: 'frostcap',
    name: 'Frostcap Mushroom',
    cost: 100,
    recharge: 8,
    hp: 60,
    role: 'Control',
    desc: 'Lobs a chilled spore (12 dmg / 2s) that slows its target by 40% for 3s.',
    attack: { dmg: 12, interval: 2, slowPct: 0.4, slowDur: 3 },
  },
  sentinel: {
    key: 'sentinel',
    name: 'Sunflower Sentinel',
    cost: 175,
    recharge: 15,
    hp: 120,
    role: 'Anti-Air',
    desc: 'The only Flora that can strike flying Blightspawn. 22 dmg every 1.5s, ground or sky.',
    attack: { dmg: 22, interval: 1.5, fly: true },
  },
};

export const FLORA_ORDER: FloraKey[] = [
  'thornvine',
  'glowbulb',
  'bramble',
  'cactus',
  'frostcap',
  'sentinel',
];

// ─── ENEMIES ────────────────────────────────────────────────────────────────
export const ENEMIES: Record<EnemyKey, EnemyStats> = {
  gnat: {
    key: 'gnat',
    name: 'Creeper Gnat',
    hp: 60,
    speed: 0.22,
    dmg: 8,
    atkInterval: 1.0,
    spacing: 0.55,
    scale: 1,
    desc: 'Baseline blightling. No tricks, just teeth.',
    counter: 'Any shooter',
  },
  beetle: {
    key: 'beetle',
    name: 'Husk Beetle',
    hp: 120,
    speed: 0.14,
    dmg: 12,
    atkInterval: 1.2,
    spacing: 0.7,
    scale: 1.15,
    desc: 'Slow, dense husk. Tests your sustained damage.',
    counter: 'Stacked Thornvines',
  },
  skitter: {
    key: 'skitter',
    name: 'Skitter Swarm',
    hp: 25,
    speed: 0.36,
    dmg: 4,
    atkInterval: 0.6,
    spacing: 0.4,
    scale: 0.78,
    desc: 'Fragile, fast, and arrives in threes. Overwhelms single-target fire.',
    counter: 'Spitting Cactus',
  },
  warden: {
    key: 'warden',
    name: 'Carapace Warden',
    hp: 150,
    speed: 0.2,
    dmg: 15,
    atkInterval: 1.0,
    shell: 100,
    spacing: 0.7,
    scale: 1.22,
    desc: 'Its shell drinks 50% of every hit until 100 shell HP shatters.',
    counter: 'Concentrated burst fire',
  },
  drifter: {
    key: 'drifter',
    name: 'Spore Drifter',
    hp: 70,
    speed: 0.2,
    dmg: 10,
    atkInterval: 1.0,
    flying: true,
    spacing: 0.55,
    scale: 1,
    desc: 'Rides the wind above your walls. Untouchable by ground fire.',
    counter: 'Sunflower Sentinel',
  },
  brute: {
    key: 'brute',
    name: 'Rotback Brute',
    hp: 600,
    speed: 0.11,
    dmg: 20,
    atkInterval: 1.2,
    spacing: 0.9,
    scale: 1.7,
    boss: true,
    desc: 'A walking compost heap. On death it splits into two Skitter Swarms.',
    counter: 'Focus fire + a fresh Bramblewall',
  },
  colossus: {
    key: 'colossus',
    name: 'Withered Colossus',
    hp: 3000,
    speed: 0.058,
    dmg: 48,
    atkInterval: 1.5,
    spacing: 1.1,
    scale: 2.5,
    boss: true,
    desc: 'The blight given form. Three phases, faster and hungrier as it dies. Calls adds.',
    counter: 'Everything you have. Then more.',
  },
};

export const ENEMY_ORDER: EnemyKey[] = [
  'gnat',
  'beetle',
  'skitter',
  'warden',
  'drifter',
  'brute',
  'colossus',
];

// ─── CAMPAIGN ───────────────────────────────────────────────────────────────
const G = (type: EnemyKey, count: number, gap = 1.6, startDelay = 0): WaveGroup => ({
  type,
  count,
  gap,
  startDelay,
});
const W = (at: number, groups: WaveGroup[]): WaveDef => ({ at, groups });

export interface WorldDef {
  id: 1 | 2;
  name: string;
  sub: string;
  hue: string; // accent for UI
}

export const WORLDS: WorldDef[] = [
  { id: 1, name: 'Verdant Vale', sub: 'Where the first roots woke', hue: '#6ee7a0' },
  { id: 2, name: 'Frostmire Hollow', sub: 'The blight adapts. So must you.', hue: '#7fd4ff' },
];

export const LEVELS: LevelDef[] = [
  // ── WORLD 1 ──
  {
    id: 0, world: 1, idx: 1, name: 'First Bloom', hpMul: 0.9,
    blurb: 'The Blightspawn probe the vale. Answer with thorns.',
    tip: 'Glowbulbs first — Nectar wins wars before a single shot is fired.',
    addPool: ['gnat'],
    waves: [
      W(10, [G('gnat', 1)]),
      W(46, [G('gnat', 2, 2.5)]),
      W(86, [G('gnat', 3, 2)]),
      W(128, [G('gnat', 3, 1.8), G('beetle', 1, 0, 6)]),
    ],
  },
  {
    id: 1, world: 1, idx: 2, name: 'Skittering Dark', hpMul: 1.0,
    blurb: 'The swarms have hatched. They are many, and they are fast.',
    tip: 'Skitters arrive in threes and sprint. Two Thornvines per lane — or pray for a Cactus soon.',
    addPool: ['gnat', 'skitter'],
    waves: [
      W(10, [G('gnat', 2, 2)]),
      W(44, [G('gnat', 2, 2)]),
      W(78, [G('skitter', 3, 0.7)]),
      W(112, [G('gnat', 2, 1.6), G('skitter', 3, 0.7, 4)]),
      W(150, [G('skitter', 3, 0.7), G('skitter', 3, 0.7, 5), G('gnat', 2, 1.5, 9)]),
    ],
  },
  {
    id: 2, world: 1, idx: 3, name: 'Husks in the Loam', hpMul: 1.06,
    blurb: 'Beetle husks shoulder through the undergrowth.',
    tip: 'Beetles are slow but dense. A Bramblewall pins them while your vines grind.',
    addPool: ['gnat', 'beetle', 'skitter'],
    waves: [
      W(12, [G('beetle', 1)]),
      W(50, [G('gnat', 3, 1.6)]),
      W(88, [G('beetle', 1), G('skitter', 3, 0.7, 6)]),
      W(128, [G('beetle', 2, 7), G('gnat', 2, 1.5, 3)]),
      W(172, [G('beetle', 2, 6), G('skitter', 3, 0.7, 4), G('skitter', 3, 0.7, 12)]),
    ],
  },
  {
    id: 3, world: 1, idx: 4, name: 'The Creeping Rot', hpMul: 1.12,
    blurb: 'Numbers and armor together. The vale is watching.',
    tip: 'Mix Cacti for swarms and Thornvines for beetles. Replant eaten walls immediately.',
    addPool: ['gnat', 'beetle', 'skitter'],
    waves: [
      W(12, [G('skitter', 3, 0.7)]),
      W(48, [G('beetle', 1), G('gnat', 2, 1.6, 5)]),
      W(88, [G('skitter', 3, 0.7), G('beetle', 1, 0, 7), G('gnat', 2, 1.4, 12)]),
      W(128, [G('beetle', 2, 6), G('skitter', 3, 0.7, 6)]),
      W(172, [G('beetle', 2, 6), G('gnat', 3, 1.4, 4), G('skitter', 3, 0.7, 10)]),
    ],
  },
  {
    id: 4, world: 1, idx: 5, name: 'Rotback', hpMul: 1.15, boss: 'brute',
    blurb: 'Something enormous drags itself out of the mire.',
    tip: 'BOSS: the Rotback Brute splits into skitters when it dies. Keep a Cactus near its lane.',
    addPool: ['gnat', 'beetle', 'skitter'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(54, [G('beetle', 1), G('skitter', 3, 0.7, 6)]),
      W(100, [G('beetle', 2, 7), G('gnat', 2, 1.5, 5)]),
      W(152, [G('brute', 1), G('gnat', 2, 2, 10), G('skitter', 3, 0.8, 18)]),
    ],
  },
  // ── WORLD 2 ──
  {
    id: 5, world: 2, idx: 1, name: 'Cold Snap', hpMul: 1.2,
    blurb: 'The hollow is colder — and the shells are harder.',
    tip: 'NEW: Frostcap Mushroom. NEW FOE: the Carapace Warden. Chill it, then break it.',
    addPool: ['gnat', 'warden', 'skitter'],
    waves: [
      W(12, [G('warden', 1)]),
      W(52, [G('gnat', 3, 1.5)]),
      W(92, [G('warden', 1), G('skitter', 3, 0.7, 7)]),
      W(134, [G('warden', 1), G('beetle', 1, 0, 6), G('gnat', 2, 1.4, 12)]),
      W(178, [G('warden', 2, 8), G('skitter', 3, 0.7, 5), G('gnat', 2, 1.4, 11)]),
    ],
  },
  {
    id: 6, world: 2, idx: 2, name: 'Things on the Wind', hpMul: 1.25,
    blurb: 'The blight has learned to fly. Your walls mean nothing to wings.',
    tip: 'NEW: Sunflower Sentinel — the ONLY answer to Spore Drifters. Bring it or lose lanes.',
    addPool: ['gnat', 'warden', 'drifter'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(50, [G('drifter', 1)]),
      W(90, [G('warden', 1), G('gnat', 2, 1.5, 7)]),
      W(130, [G('drifter', 1), G('skitter', 3, 0.7, 5)]),
      W(174, [G('warden', 1), G('drifter', 2, 6, 5), G('gnat', 2, 1.4, 11)]),
    ],
  },
  {
    id: 7, world: 2, idx: 3, name: 'Shellshock', hpMul: 1.3,
    blurb: 'Wardens march in pairs now, with wings above them.',
    tip: 'Two Sentinels minimum. Slow the ground push with Frostcaps while Sentinels own the sky.',
    addPool: ['gnat', 'beetle', 'warden', 'drifter'],
    waves: [
      W(12, [G('skitter', 3, 0.7), G('skitter', 3, 0.7, 6)]),
      W(54, [G('warden', 1), G('beetle', 1, 0, 8)]),
      W(96, [G('drifter', 1), G('gnat', 3, 1.4, 6)]),
      W(138, [G('warden', 1), G('skitter', 3, 0.7, 6), G('beetle', 1, 0, 12)]),
      W(182, [G('beetle', 2, 6), G('drifter', 2, 5, 5), G('warden', 1, 0, 11)]),
    ],
  },
  {
    id: 8, world: 2, idx: 4, name: 'The Hollow Choir', hpMul: 1.38,
    blurb: 'Every horror at once, singing through the frost.',
    tip: 'Economy is survival: four Glowbulbs early, or the final waves will bury you.',
    addPool: ['gnat', 'beetle', 'warden', 'drifter', 'skitter'],
    waves: [
      W(12, [G('warden', 1), G('gnat', 2, 1.6, 6)]),
      W(52, [G('skitter', 3, 0.7), G('beetle', 1, 0, 6), G('drifter', 1, 0, 11)]),
      W(94, [G('warden', 2, 8), G('gnat', 2, 1.4, 10)]),
      W(136, [G('beetle', 2, 6), G('skitter', 3, 0.7, 7), G('drifter', 1, 0, 12)]),
      W(182, [G('warden', 2, 7), G('drifter', 2, 5, 7), G('skitter', 3, 0.7, 13)]),
    ],
  },
  {
    id: 9, world: 2, idx: 5, name: 'The Withered Colossus', hpMul: 1.3, boss: 'colossus',
    blurb: 'It has been growing under the vale for a hundred years.',
    tip: 'BOSS: 3 phases — it speeds up as it breaks and constantly calls adds. Walls + Sentinels or die.',
    addPool: ['gnat', 'beetle', 'warden', 'skitter'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(56, [G('warden', 1), G('skitter', 3, 0.7, 7)]),
      W(102, [G('drifter', 1), G('beetle', 1, 0, 7)]),
      W(156, [G('colossus', 1), G('warden', 1, 0, 14), G('gnat', 2, 1.5, 24)]),
    ],
  },
];

// Flora unlocks: level id at which the flora becomes available
export const FLORA_UNLOCKS: { level: number; flora: FloraKey[] }[] = [
  { level: 0, flora: ['thornvine', 'glowbulb', 'bramble'] },
  { level: 1, flora: ['cactus'] },
  { level: 2, flora: [] },
  { level: 3, flora: [] },
  { level: 4, flora: [] },
  { level: 5, flora: ['frostcap'] },
  { level: 6, flora: ['sentinel'] },
  { level: 7, flora: [] },
  { level: 8, flora: [] },
  { level: 9, flora: [] },
];

export function unlockedFloraFor(levelId: number): FloraKey[] {
  const out: FloraKey[] = [];
  for (const u of FLORA_UNLOCKS) {
    if (u.level <= levelId) out.push(...u.flora);
  }
  return out;
}

export const LOADOUT_SLOTS = 6;
export const START_NECTAR = 50;
export const PASSIVE_INCOME = 25;
export const PASSIVE_PERIOD = 10;
