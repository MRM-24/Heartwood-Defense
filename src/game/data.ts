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
    desc: 'Spits a splash volley every 1.8s that strikes EVERY enemy in its lane for 15 dmg. The only easy answer to Stoneback Grubs.',
    attack: { dmg: 15, interval: 1.8, pierce: true, aoe: true },
  },
  frostcap: {
    key: 'frostcap',
    name: 'Frostcap Mushroom',
    cost: 100,
    recharge: 8,
    hp: 60,
    role: 'Control',
    desc: 'Lobs a chilled spore (12 splash dmg / 2s) that slows its target by 40% for 3s. Splash cracks stone; chill buys time.',
    attack: { dmg: 12, interval: 2, slowPct: 0.4, slowDur: 3, aoe: true },
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

  // ── BATCH 1: THE ROOTBOUND DEPTHS ─────────────────────────────────────────
  // Each is built to counter a specific plant habit: thin walls, wall-stacking,
  // cactus spam, glass cannons with no cover, pure front-line defense, and
  // wounded plants left unattended.
  vaulter: {
    key: 'vaulter',
    name: 'Mite Vaulter',
    hp: 70,
    speed: 0.3,
    dmg: 8,
    atkInterval: 1.0,
    spacing: 0.55,
    scale: 0.95,
    vault: true,
    desc: 'Springs clean over the first Flora blocking its path — once — then behaves normally. One thin wall won\u2019t hold it.',
    counter: 'A second wall behind the first, or shoot it down',
  },
  grub: {
    key: 'grub',
    name: 'Stoneback Grub',
    hp: 90,
    speed: 0.2,
    dmg: 14,
    atkInterval: 1.2,
    spacing: 0.7,
    scale: 1.1,
    stoneShield: 150,
    desc: 'A 150-point stone slab blocks ALL single-target damage. Only splash — Cactus volleys, Frostcap spores — can crack it. The mirror of the Carapace Warden.',
    counter: 'Splash damage (Spitting Cactus / Frostcap)',
  },
  larva: {
    key: 'larva',
    name: 'Tunnel Larva',
    hp: 80,
    speed: 0.2,
    dmg: 10,
    atkInterval: 1.0,
    spacing: 0.7,
    scale: 1.0,
    burrowEmerge: 6,
    desc: 'Burrows under the first three columns of its lane, untouchable and unblocked, and surfaces at column 6. Walls out east are wasted Nectar.',
    counter: 'Mid-board and backline defense',
  },
  ranger: {
    key: 'ranger',
    name: 'Locust Ranger',
    hp: 65,
    speed: 0.2,
    dmg: 9,
    atkInterval: 1.3,
    spacing: 0.6,
    scale: 1.05,
    ranged: 2,
    desc: 'Halts two tiles short and hurls thorn spines at the first Flora in reach. Never needs to close in — glass cannons get sniped.',
    counter: 'A wall to soak its spines',
  },
  imp: {
    key: 'imp',
    name: 'Spore Imp',
    hp: 15,
    speed: 0.36,
    dmg: 6,
    atkInterval: 1.0,
    spacing: 0.45,
    scale: 0.72,
    noScale: true,
    desc: 'Catapulted clean over your line into the back half of a lane. Barely more than a spore with teeth — but teeth behind your wall.',
    counter: 'A shooter kept in the back half',
  },
  husk: {
    key: 'husk',
    name: 'Gargant Husk',
    hp: 400,
    speed: 0.075,
    dmg: 0,
    atkInterval: 1.5,
    spacing: 0.9,
    scale: 1.85,
    smashWindup: 1.5,
    desc: 'Never chews. After a 1.5s wind-up it obliterates whatever it is attacking in a single smash — regardless of HP. Kill it first.',
    counter: 'Focus fire before the wind-up lands',
  },
  thief: {
    key: 'thief',
    name: 'Root Thief',
    hp: 55,
    speed: 0.3,
    dmg: 0,
    atkInterval: 1.0,
    spacing: 0.5,
    scale: 0.95,
    grabEvery: 6,
    escapeTime: 3,
    desc: 'Never bites. Every 6s it snatches the most wounded Flora in its lane and hauls it for the blight — 3s to the edge. Kill it mid-heist and the plant drops back, unharmed.',
    counter: 'Burst it down before it escapes',
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
  'vaulter',
  'grub',
  'larva',
  'ranger',
  'imp',
  'husk',
  'thief',
];

// ─── CAMPAIGN ───────────────────────────────────────────────────────────────
const G = (type: EnemyKey, count: number, gap = 1.6, startDelay = 0, catapult = false): WaveGroup => ({
  type,
  count,
  gap,
  startDelay,
  catapult,
});
const W = (at: number, groups: WaveGroup[]): WaveDef => ({ at, groups });

export interface WorldDef {
  id: 1 | 2 | 3;
  name: string;
  sub: string;
  hue: string; // accent for UI
}

export const WORLDS: WorldDef[] = [
  { id: 1, name: 'Verdant Vale', sub: 'Where the first roots woke', hue: '#6ee7a0' },
  { id: 2, name: 'Frostmire Hollow', sub: 'The blight adapts. So must you.', hue: '#7fd4ff' },
  { id: 3, name: 'Rootbound Depths', sub: 'It has learned how you defend. Time to defend differently.', hue: '#d8a8ff' },
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
  // ── WORLD 3: THE ROOTBOUND DEPTHS ──
  // Batch 1 enemies debut here. Every level answers a lazy habit: one thin wall,
  // all-shooters-no-wall, cactus-only splash, front-line-only defense.
  {
    id: 10, world: 3, idx: 1, name: 'Over the Wall', hpMul: 1.4,
    blurb: 'The blight has watched your walls. It brought springs — and shovels.',
    tip: 'NEW FOES: Mite Vaulters leap a lone wall — double up. Tunnel Larva burrow under columns 7–9 and surface at column 6: hold the mid-board.',
    addPool: ['gnat', 'vaulter', 'larva'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(52, [G('vaulter', 2, 4)]),
      W(94, [G('larva', 2, 6), G('gnat', 2, 1.6, 8)]),
      W(140, [G('vaulter', 3, 3.5), G('larva', 1, 0, 10), G('gnat', 2, 1.5, 4)]),
      W(186, [G('larva', 2, 7), G('vaulter', 3, 3, 6), G('gnat', 3, 1.4, 12)]),
    ],
  },
  {
    id: 11, world: 3, idx: 2, name: 'Shell Game', hpMul: 1.45,
    blurb: 'Stone and shell together. One wants burst. One wants splash. Bring both.',
    tip: 'NEW FOE: the Stoneback Grub — its slab ignores single-target hits entirely. Cactus volleys and Frostcap spores crack stone; Thornvines finish the body. The Warden wants the opposite.',
    addPool: ['gnat', 'warden', 'grub'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(52, [G('grub', 1), G('gnat', 2, 1.6, 6)]),
      W(96, [G('warden', 1), G('grub', 1, 0, 8)]),
      W(142, [G('grub', 2, 8), G('skitter', 3, 0.7, 6)]),
      W(188, [G('warden', 2, 8), G('grub', 2, 8, 6), G('gnat', 3, 1.4, 12)]),
    ],
  },
  {
    id: 12, world: 3, idx: 3, name: 'Sting From Afar', hpMul: 1.5,
    blurb: 'Spines from two tiles out, and worse raining from the sky.',
    tip: 'NEW FOES: Locust Rangers snipe from range — give your cannons a wall to hide behind. Spore Imps are catapulted into the BACK half of a lane: keep a shooter in columns 1–5.',
    addPool: ['gnat', 'ranger', 'imp'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(52, [G('ranger', 2, 4)]),
      W(94, [G('ranger', 1), G('imp', 2, 3, 6, true)]),
      W(140, [G('ranger', 2, 5), G('imp', 3, 2.5, 8, true), G('gnat', 2, 1.6, 4)]),
      W(186, [G('imp', 4, 2.2, 0, true), G('ranger', 3, 4, 5), G('skitter', 3, 0.7, 12)]),
    ],
  },
  {
    id: 13, world: 3, idx: 4, name: 'The Long Dark', hpMul: 1.55,
    blurb: 'Something that does not chew. Something that does not fight — only takes.',
    tip: 'NEW FOES: the Gargant Husk SMASHES a plant dead in one 1.5s wind-up — kill it first, chill it to stall. Root Thieves snatch your most wounded Flora every 6s; kill one mid-heist and the plant drops back unharmed.',
    addPool: ['gnat', 'husk', 'thief'],
    waves: [
      W(12, [G('gnat', 3, 1.6)]),
      W(54, [G('thief', 1), G('beetle', 1, 0, 6)]),
      W(98, [G('husk', 1), G('gnat', 3, 1.4, 8)]),
      W(146, [G('thief', 2, 9), G('husk', 1, 0, 10), G('vaulter', 2, 4, 6)]),
      W(192, [G('husk', 2, 12), G('thief', 1, 0, 8), G('grub', 1, 0, 14), G('gnat', 3, 1.4, 4)]),
    ],
  },
  {
    id: 14, world: 3, idx: 5, name: 'Heart of the Rot', hpMul: 1.4, boss: 'colossus',
    blurb: 'The Colossus again — and this time it has learned every trick you taught it.',
    tip: 'BOSS: the Depths answer with you — vaulters, grubs, thieves, imps. Defense in depth: splash, burst, walls, AND a backline. Keep your calm and your snares.',
    addPool: ['gnat', 'vaulter', 'ranger', 'thief'],
    waves: [
      W(12, [G('gnat', 2, 2), G('vaulter', 2, 4, 8)]),
      W(56, [G('grub', 1), G('ranger', 1, 0, 7)]),
      W(104, [G('thief', 2, 8), G('imp', 3, 2.5, 6, true), G('larva', 1, 0, 12)]),
      W(158, [G('colossus', 1), G('husk', 1, 0, 16), G('imp', 2, 3, 24, true), G('gnat', 2, 1.5, 30)]),
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
  { level: 10, flora: [] },
  { level: 11, flora: [] },
  { level: 12, flora: [] },
  { level: 13, flora: [] },
  { level: 14, flora: [] },
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
