import type { EnemyKey, EnemyStats, FloraKey, FloraStats, LevelDef, WaveDef, WaveGroup, WorldId } from './types';

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

  // ── FLORA BATCH 1: THE ROOTBOUND DEPTHS ───────────────────────────────────
  // Every one of these answers a specific Blightspawn from the enemy batch —
  // none of them are "more damage". Where the enemy batch punishes a lazy habit,
  // these give the habit a counter.
  cinderpod: {
    key: 'cinderpod',
    name: 'Cinderpod',
    cost: 125,
    recharge: 10,
    hp: 70,
    role: 'Splash',
    desc: 'Lobs an explosive seed every 2.5s: 25 dmg to the target AND every Blightspawn in the adjacent tile — real area damage, and area damage is what cracks a Stoneback Grub\u2019s slab.',
    attack: { dmg: 25, interval: 2.5, aoe: true, splash: 1 },
  },
  deeproot: {
    key: 'deeproot',
    name: 'Deeproot Sentry',
    cost: 150,
    recharge: 12,
    hp: 100,
    role: 'Burrow Guard',
    desc: 'Roots an ear through the soil. Fires underground every 2s for 16 dmg at anything tunnelling beneath its lane — the only Flora that can touch a burrowed Tunnel Larva. Above ground it is just a slow single-target shooter.',
    attack: { dmg: 16, interval: 2, underground: true },
  },
  bulwark: {
    key: 'bulwark',
    name: 'Bulwark Bramble',
    cost: 100,
    recharge: 8,
    hp: 350,
    role: 'Shield Wall',
    desc: 'A wall like Bramblewall, but with reach: its outer boughs snatch Locust Ranger spines out of the air. Any spine that crosses its tile — even one aimed at Flora further down the lane — is absorbed by the wall instead.',
    reach: true,
  },
  snaptrap: {
    key: 'snaptrap',
    name: 'Snaptrap Root',
    cost: 175,
    recharge: 15,
    hp: 90,
    role: 'Trap',
    desc: 'Passive jaws, no cooldown between bites: the instant any Blightspawn below 100 HP enters its tile it is swallowed whole. It does absolutely nothing to anything above that threshold — and stone slabs are too hard to bite.',
    snapKill: 100,
  },
  watchvine: {
    key: 'watchvine',
    name: 'Watchvine',
    cost: 150,
    recharge: 12,
    hp: 80,
    role: 'Rearguard',
    desc: 'Works in any tile, front or back. Never fires at the nearest foe — it always strikes the Blightspawn furthest along its lane, even one that has slipped behind it. 20 dmg every 1.5s. The answer to things that land behind your wall.',
    attack: { dmg: 20, interval: 1.5, rearmost: true },
  },
  bindweed: {
    key: 'bindweed',
    name: 'Bindweed Snare',
    cost: 125,
    recharge: 10,
    hp: 70,
    role: 'Control',
    desc: 'Every 4s it lashes the leading enemy in its lane and pins it for 3s — no damage, total immobilise: no walking, no biting, and a charging Gargant Husk has to start its smash wind-up over. Stacks beautifully with burst Flora.',
    attack: { dmg: 0, interval: 4, rearmost: true, rootDur: 3, quiet: true },
  },
  lotus: {
    key: 'lotus',
    name: 'Nectar Lotus',
    cost: 100,
    recharge: 15,
    hp: 60,
    role: 'Economy',
    desc: 'Ripens +40 Nectar every 15s. Each harvest also rebates the next Flora you plant within 5s — 1s off its tray recharge. A snowball for aggressive openings.',
    produce: { amount: 40, interval: 15, boost: true },
  },

  // ── FLORA BATCH 2: THE HOLLOW CROWN ───────────────────────────────────────
  // Every one of these answers a specific Blightspawn from Enemy Batch 2, and
  // every one of them does it WITHOUT a status effect — because the Crown eats
  // statuses (Grovemaw Slug) or shrugs them off (Barkskin Marauder).
  ironbark: {
    key: 'ironbark',
    name: 'Ironbark Titan',
    cost: 250,
    recharge: 20,
    hp: 200,
    role: 'Heavy Hitter',
    desc: 'A slab of living ironwood that swings once every 3s for 80 raw damage at a single target. No splash, no chill, no poison — nothing a Grovemaw Slug can swallow and turn into armour. Expensive, slow to recharge, and the most reliable kill in the vale.',
    attack: { dmg: 80, interval: 3 },
  },
  emberlash: {
    key: 'emberlash',
    name: 'Emberlash Vine',
    cost: 150,
    recharge: 10,
    hp: 90,
    role: 'Burn Beam',
    desc: 'Holds a continuous 8-damage-per-second ember beam on whatever is frontmost in its lane. There is no projectile and no wind-up, so nothing is wasted when the target changes — a Molt Wisp that splits into two halves is simply burned from the first tick on the new one.',
    attack: { dmg: 8, interval: 1, beam: true, fire: true },
  },
  needlereed: {
    key: 'needlereed',
    name: 'Needle Reed',
    cost: 125,
    recharge: 8,
    hp: 70,
    role: 'Spray',
    desc: 'Every 2s it looses a 5-needle spray at 6 damage a needle, spread across up to three enemies in its lane instead of piling all five into one. Cheap, fast to replace, and the efficient answer to Chitterling Packs and anything else that arrives clustered.',
    attack: { dmg: 6, interval: 2, spray: 5, sprayTargets: 3 },
  },
  gale: {
    key: 'gale',
    name: 'Gale Fern',
    cost: 150,
    recharge: 12,
    hp: 80,
    role: 'Displacement',
    desc: 'Every 6s it exhales a gust that shoves the leading enemy in its lane back two whole tiles. Physical displacement, not a status effect — a Barkskin Marauder that laughs at Bindweed still gets pushed, and a sprinting Nightcap Assassin is knocked clean out of its dash.',
    attack: { dmg: 0, interval: 6, knockback: 2, quiet: true },
  },
  sentinelbloom: {
    key: 'sentinelbloom',
    name: 'Sentinel Bloom',
    cost: 175,
    recharge: 15,
    hp: 150,
    role: 'Riposte',
    desc: 'It never shoots. Instead it watches: any Blightspawn that sprints or leaps across its tile — a dashing Nightcap Assassin, a leaping Mite Vaulter — takes an automatic 50-damage counter-strike, once per enemy. Turns "get behind the wall" into a cost.',
    counterDash: 50,
  },
  ambush: {
    key: 'ambush',
    name: 'Ambush Fern',
    cost: 125,
    recharge: 12,
    hp: 60,
    role: 'Trap',
    desc: 'Stays folded and inert until something steps into its own tile, then snaps open for a single 120-damage ambush before folding down again to recharge. Plant it early in the lane and a Fen Wretch pays for its aura the moment it arrives.',
    ambush: 120,
    ambushCd: 6,
  },
  prism: {
    key: 'prism',
    name: 'Prism Bud',
    cost: 200,
    recharge: 15,
    hp: 100,
    role: 'Alternating',
    desc: 'Splits its own light: every other shot comes out as a focused physical bolt, and the one between as an 18-damage fire burst with splash. 1.8s a shot either way, so whatever damage channel The Hollow King has warded, the next Prism shot is already on the other one.',
    attack: { dmg: 18, interval: 1.8, altKind: true },
  },
};

export const FLORA_ORDER: FloraKey[] = [
  'thornvine',
  'glowbulb',
  'bramble',
  'cactus',
  'frostcap',
  'sentinel',
  // ── FLORA BATCH 1 ──
  'cinderpod',
  'deeproot',
  'bulwark',
  'snaptrap',
  'watchvine',
  'bindweed',
  'lotus',
  // ── FLORA BATCH 2 ──
  'ironbark',
  'emberlash',
  'needlereed',
  'gale',
  'sentinelbloom',
  'ambush',
  'prism',
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

  // ── BATCH 2: THE HOLLOW CROWN ─────────────────────────────────────────────
  // Built to push back on the Flora Batch 1 loadouts that Batch 1 taught:
  // splash-only clears, status-only control, and "the back row is safe".
  wisp: {
    key: 'wisp',
    name: 'Molt Wisp',
    hp: 50,
    speed: 0.24,
    dmg: 7,
    atkInterval: 1.0,
    spacing: 0.45,
    scale: 0.82,
    splitBelow: 0.5,
    splitInto: 'wisp',
    splitCount: 2,
    splitHpFrac: 0.5,
    desc: 'The first time it drops below half HP it comes apart into two 25-HP Molt Wisps that never split again. One body becomes two smaller ones — total HP is unchanged, but the shape of the problem is not.',
    counter: 'Sustained lane clear (Cactus volley / Watchvine), not one-shot splash',
  },
  slug: {
    key: 'slug',
    name: 'Grovemaw Slug',
    hp: 200,
    speed: 0.085,
    dmg: 0,
    atkInterval: 1.0,
    spacing: 0.8,
    scale: 1.25,
    absorbStatus: 0.25,
    drCap: 0.85,
    desc: 'Never bites — it just comes. Any slow or poison that lands on it is swallowed instead, and its total value becomes a temporary damage-reduction shield (25% per point of control, capped at 85%). Frostcap chills are its dinner.',
    counter: 'Raw damage only — bring Thornvines and Cinderpods, leave the control Flora home',
  },
  chitter: {
    key: 'chitter',
    name: 'Chitterling Pack',
    hp: 20,
    speed: 0.42,
    dmg: 3,
    atkInterval: 0.5,
    spacing: 0.13,
    scale: 0.52,
    packSize: 4,
    desc: 'Four bodies arrive stacked in a single lane slot and never spread out. Each one is trivially small — well under a Snaptrap\u2019s 100-HP jaw threshold — but there are four of them, six inches apart, at a dead run.',
    counter: 'Spitting Cactus (pierce) or a Snaptrap that really has no cooldown',
  },
  marauder: {
    key: 'marauder',
    name: 'Barkskin Marauder',
    hp: 180,
    speed: 0.18,
    dmg: 18,
    atkInterval: 1.4,
    spacing: 0.72,
    scale: 1.3,
    rootImmune: true,
    desc: 'Bark over sinew. Root and immobilise effects find nothing to hold — a Bindweed Snare lashes it and simply falls away. It cannot be time-stalled; it has to be damaged down.',
    counter: 'Raw damage and walls — Bindweed Snare is dead weight against it',
  },
  nightcap: {
    key: 'nightcap',
    name: 'Nightcap Assassin',
    hp: 90,
    speed: 0.3,
    dmg: 20,
    atkInterval: 1.0,
    spacing: 0.55,
    scale: 0.95,
    dashThrough: 2,
    desc: 'The first Flora to block it does not hold it: it breaks into a sprint, slips past your front two plants untouched, and puts a single 20-damage burst into whatever it reaches in the back row. Then it settles down and walks like anything else.',
    counter: 'Something lethal BEHIND the wall — Watchvine, Snaptrap Root',
  },
  wretch: {
    key: 'wretch',
    name: 'Fen Wretch',
    hp: 130,
    speed: 0.17,
    dmg: 12,
    atkInterval: 1.0,
    spacing: 0.65,
    scale: 1.05,
    nectarDrain: 0.5,
    desc: 'An aura, not an attack: while it lives in a lane, every Nectar plant there ripens at half rate. It will happily sit at your wall chewing while your economy quietly halves. Kill it first.',
    counter: 'Kill it fast — burst fire the moment it shows',
  },
  hollowking: {
    key: 'hollowking',
    name: 'The Hollow King',
    hp: 3500,
    speed: 0.055,
    dmg: 40,
    atkInterval: 1.2,
    spacing: 1.15,
    scale: 2.4,
    boss: true,
    enrageFrac: 0.25,
    immuneCycle: { on: 5, off: 2 },
    desc: 'Three phases. It sheds Molt Wisps as it walks; below two-thirds HP it shuts a whole damage channel off for 5s at a time, alternating between single-target strikes and area damage; below a quarter HP it enrages — attacking twice as fast and taking twice the damage.',
    counter: 'A loadout that can switch: raw strikes AND splash, and the nerve to wait out a ward',
  },

  // ── BATCH 3: THE HOLLOW RECKONING ──────────────────────────────────────────
  // Engineered to answer Flora Batch 2 piece by piece: every plant whose gimmick
  // bought a free win under the Crown has exactly one Blightspawn here spending
  // it. None of them are stat bumps — each one re-rules a whole class of hit.
  regrow: {
    key: 'regrow',
    name: 'Regrowth Husk',
    hp: 100,
    speed: 0.21,
    dmg: 10,
    atkInterval: 1.2,
    spacing: 0.62,
    scale: 1.05,
    regrowHp: 15,
    regrowEvery: 2,
    desc: 'Every 2s it goes unhit it knits 15 HP back shut. Punishes slow-cooldown burst hitters like Ironbark Titan that leave gaps between shots — the wound closes a chunk of your damage before the next swing ever lands. Fire a steady stream at it and there is never a quiet beat to heal on.',
    counter: 'Sustained fire — Thornvine stacks, Emberlash beams; lone big swings feed it',
  },
  golem: {
    key: 'golem',
    name: 'Cinder Golem',
    hp: 140,
    speed: 0.13,
    dmg: 16,
    atkInterval: 1.3,
    spacing: 0.8,
    scale: 1.35,
    fireResist: 0.5,
    desc: 'Its fired-clay shell drinks 50% of every burn/fire-type hit — an Emberlash beam smoulders at half light, and Prism Bud\u2019s fire burst lands for 9, not 18. A direct resistance to the Crown\u2019s favourite damage; the Prism\u2019s physical bolt and every raw strike go in whole. Explosions are concussive, not burning — Cinderpods hit at full.',
    counter: 'Physical damage alongside the burn — Ironbark, Thornvine, the Prism\u2019s other half',
  },
  roach: {
    key: 'roach',
    name: 'Bulwark Roach',
    hp: 110,
    speed: 0.2,
    dmg: 12,
    atkInterval: 1.0,
    spacing: 0.6,
    scale: 1.05,
    hitFloor: 10,
    desc: 'A per-hit damage floor: any single hit under 10 raw damage skitters off its shell and lands for 1. A Needle Reed volley spends all five needles for five damage. One Thornvine bite is worth six of them. Continuous damage is a stream, not a volley — an Emberlash tick never counts as a fresh hit, so burn still works.',
    counter: 'Fewer, harder hits — Ironbark, Thornvine, Cinderpod blasts',
  },
  toad: {
    key: 'toad',
    name: 'Boulder Toad',
    hp: 160,
    speed: 0.12,
    dmg: 14,
    atkInterval: 1.4,
    spacing: 0.85,
    scale: 1.3,
    knockImmune: true,
    desc: 'Squat, dense, and rooted by instinct — it is immune to knockback and displacement outright. A Gale Fern\u2019s gust washes over it like weather and the toad never shifts a finger-width. Nothing on the tray shoves this one off the line; it has to be damaged down.',
    counter: 'Direct damage — the fern is wasted Nectar here',
  },
  nightstalker: {
    key: 'nightstalker',
    name: 'Iron Nightstalker',
    hp: 130,
    speed: 0.3,
    dmg: 20,
    atkInterval: 1.0,
    spacing: 0.55,
    scale: 1,
    dashThrough: 2,
    dashShield: true,
    retreatAfterDash: 2.5,
    desc: 'Same headlong dash as a Nightcap Assassin — past your front two plants and one 20-damage burst into the back row — but it carries a one-time iron plate: the first hit it takes on each dash is simply not there. Sentinel Bloom\u2019s counter-strike clangs off the plating instead of biting. Then it does not settle in: it bounds back east, re-arms, and comes again.',
    counter: 'Spend the plate on a cheap hit, then land the real one — or gust it out of the sprint',
  },
  wardshell: {
    key: 'wardshell',
    name: 'Wardshell Grub',
    hp: 100,
    speed: 0.19,
    dmg: 9,
    atkInterval: 1.0,
    spacing: 0.7,
    scale: 1.15,
    tileWard: true,
    desc: 'A surprise ward: the first hit it receives after entering a new tile deals zero damage — one time, per tile. An Ambush Fern springs on it and comes up completely empty every step it takes. The ward is spent the instant anything touches it, soft or hard, so anything that lands twice eats this gimmick alive.',
    counter: 'Any hit spends it once per tile, then the real damage follows — Needle Reed springs wards for free',
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
  // ── Batch 2 ──
  'wisp',
  'chitter',
  'nightcap',
  'wretch',
  'marauder',
  'slug',
  'hollowking',
  // ── Batch 3: the Hollow Reckoning ──
  'regrow',
  'golem',
  'roach',
  'toad',
  'nightstalker',
  'wardshell',
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
  id: WorldId;
  name: string;
  sub: string;
  hue: string; // accent for UI
}

export const WORLDS: WorldDef[] = [
  { id: 1, name: 'Verdant Vale', sub: 'Where the first roots woke', hue: '#6ee7a0' },
  { id: 2, name: 'Frostmire Hollow', sub: 'The blight adapts. So must you.', hue: '#7fd4ff' },
  { id: 3, name: 'Rootbound Depths', sub: 'It has learned how you defend. Time to defend differently.', hue: '#d8a8ff' },
  { id: 4, name: 'The Hollow Crown', sub: 'It studied the counters you were given. It has answers now.', hue: '#ffc46b' },
  { id: 5, name: 'The Hollow Reckoning', sub: 'It learned your newest answers — and went shopping for new ones.', hue: '#ff9368' },
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
    tip: 'NEW: Deeproot Sentry — the only Flora that can shoot a burrowed Larva — and Nectar Lotus, the vale\u2019s strongest economy. NEW FOES: Mite Vaulters leap a lone wall — double up; Tunnel Larva ride under columns 7–9 and surface at column 6. Hold the mid-board.',
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
    tip: 'NEW: the Cinderpod — its blast hits the victim\u2019s tile and the one beside it, the reliable answer to stone. NEW FOE: the Stoneback Grub, whose slab ignores single-target hits entirely. Cactus volleys and Frostcap spores crack stone too; Thornvines finish the body. The Warden wants the opposite.',
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
    tip: 'NEW: Bulwark Bramble, whose boughs swallow Ranger spines mid-flight, and Watchvine, which always strikes the enemy furthest along its lane — even one behind it. NEW FOES: Locust Rangers snipe from range; Spore Imps are catapulted into the BACK half of a lane.',
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
    tip: 'NEW: Snaptrap Root, which swallows anything under 100 HP that steps into its tile, and Bindweed Snare, which roots one foe per cast — including a Husk mid-wind-up. NEW FOES: the Gargant Husk SMASHES a plant dead in one 1.5s wind-up; Root Thieves snatch your most wounded Flora every 6s. Kill a thief mid-heist and the plant drops back unharmed.',
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
  // ── WORLD 4: THE HOLLOW CROWN ──
  // Batch 2 enemies debut here. Where World 3 punished lazy habits, World 4
  // punishes lazy COUNTERS: the loadouts Batch 1 taught you to reach for.
  //   4-1 Molt Wisp          → splash-only clears leave two bodies standing
  //   4-2 Grovemaw / Marauder→ status-effect Flora is eaten or shrugged off
  //   4-3 Chitterling / Nightcap → the front line is not the only line, and the
  //                                back row is not a free-safety zone
  //   4-4 Fen Wretch         → your economy is a target, not a given
  //   4-5 The Hollow King    → one loadout cannot answer all three phases
  {
    id: 15, world: 4, idx: 1, name: 'Ash on the Wind', hpMul: 1.9,
    blurb: 'Something small and bright is drifting up from the crown. It does not die so much as come apart.',
    tip: 'NEW FOE: the Molt Wisp splits into two 25-HP wisps the first time it drops below half HP. A single big splash hit just makes two problems — bring sustained lane clear (Cactus volleys, Watchvine) instead of one-shot burst.',
    addPool: ['gnat', 'wisp', 'skitter'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(48, [G('wisp', 3, 3.5)]),
      W(84, [G('wisp', 4, 2.8), G('gnat', 3, 1.4, 8)]),
      W(122, [G('wisp', 4, 2.6), G('beetle', 1, 0, 6), G('skitter', 3, 0.7, 12)]),
      W(160, [G('wisp', 5, 2.2), G('gnat', 3, 1.4, 8), G('beetle', 1, 0, 14)]),
      W(196, [G('wisp', 5, 2), G('skitter', 3, 0.7, 6), G('gnat', 3, 1.4, 12)]),
    ],
  },
  {
    id: 16, world: 4, idx: 2, name: 'The Slow Green Hunger', hpMul: 2.0,
    blurb: 'A slug the size of a barrow, and something with bark where a hide should be.',
    tip: 'NEW FOES: the Grovemaw Slug EATS your slows and turns them into damage reduction — leave Frostcap at home and bring raw damage. The Barkskin Marauder shrugs off Bindweed Snare entirely and cannot be time-stalled.',
    addPool: ['gnat', 'slug', 'marauder'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(48, [G('slug', 1), G('gnat', 2, 1.6, 6)]),
      W(84, [G('marauder', 2, 6), G('wisp', 3, 3.5, 8)]),
      W(122, [G('slug', 2, 9), G('marauder', 2, 6, 6), G('skitter', 3, 0.7, 14)]),
      W(160, [G('slug', 2, 8), G('marauder', 3, 5, 6), G('wisp', 3, 3, 12)]),
      W(196, [G('slug', 3, 7), G('marauder', 3, 5, 8), G('gnat', 3, 1.4, 4)]),
    ],
  },
  {
    id: 17, world: 4, idx: 3, name: 'A Thousand Small Teeth', hpMul: 2.05,
    blurb: 'The undergrowth chitters. Then the chittering is behind you.',
    tip: 'NEW FOES: Chitterling Packs arrive as FOUR bodies in one lane slot, each far too small to matter and far too fast to ignore. Nightcap Assassins sprint past your front two plants and burst something in the BACK row — keep a Watchvine or Snaptrap behind the wall.',
    addPool: ['chitter', 'nightcap', 'gnat'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(48, [G('chitter', 1), G('gnat', 2, 1.6, 6)]),
      W(84, [G('nightcap', 2, 5), G('chitter', 2, 6, 8)]),
      W(120, [G('chitter', 3, 5), G('nightcap', 3, 4, 6), G('skitter', 3, 0.7, 12)]),
      W(158, [G('nightcap', 4, 3.5), G('chitter', 3, 4.5, 6), G('gnat', 3, 1.4, 12)]),
      W(194, [G('nightcap', 5, 3), G('chitter', 4, 4, 6), G('beetle', 1, 0, 10)]),
    ],
  },
  {
    id: 18, world: 4, idx: 4, name: 'The Fen Remembers', hpMul: 2.1,
    blurb: 'The water here is warm and wrong. Your Glowbulbs are ripening slower every minute.',
    tip: 'NEW FOE: the Fen Wretch halves the Nectar output of every Nectar plant in its lane for as long as it lives — an aura, not a hit. Kill it the instant it shows or your economy stalls out from under you. Everything from the crown comes with it.',
    addPool: ['wretch', 'slug', 'chitter', 'gnat'],
    waves: [
      W(12, [G('gnat', 3, 1.6)]),
      W(48, [G('wretch', 2, 6), G('gnat', 2, 1.6, 6)]),
      W(84, [G('wretch', 3, 5), G('chitter', 1, 0, 8), G('larva', 1, 0, 14)]),
      W(120, [G('wretch', 3, 5), G('slug', 1, 0, 8), G('marauder', 2, 6, 14)]),
      W(158, [G('wretch', 4, 5), G('husk', 1, 0, 10), G('chitter', 2, 6, 4)]),
      W(196, [G('wretch', 4, 4.5), G('slug', 2, 8, 6), G('nightcap', 3, 4, 12), G('gnat', 3, 1.4, 2)]),
    ],
  },
  {
    id: 19, world: 4, idx: 5, name: 'The Hollow Crown', hpMul: 1.95, boss: 'hollowking',
    blurb: 'It wears the vale\u2019s own tricks now, and it has learned which of your answers are habits.',
    tip: 'BOSS: three phases. It sheds Molt Wisps as it walks; below 2/3 HP it shuts a whole damage channel off for 5s at a time, alternating between single-target strikes and splash — watch the ward and switch plants; below 1/4 HP it enrages, hitting twice as fast but taking DOUBLE damage. Hold your burst for the enrage.',
    addPool: ['wisp', 'chitter', 'marauder', 'gnat'],
    waves: [
      W(12, [G('gnat', 2, 2), G('wisp', 3, 3.5, 8)]),
      W(50, [G('marauder', 2, 6), G('slug', 1, 0, 7)]),
      W(90, [G('nightcap', 3, 5), G('chitter', 2, 6, 6), G('wretch', 2, 6, 12)]),
      W(130, [G('wisp', 4, 3), G('marauder', 2, 6, 8), G('chitter', 2, 6, 14)]),
      W(168, [G('hollowking', 1), G('marauder', 2, 7, 14), G('nightcap', 3, 4, 20), G('chitter', 2, 6, 28), G('gnat', 3, 1.4, 36)]),
    ],
  },
  // ── WORLD 5: THE HOLLOW RECKONING ──
  // Batch 3 enemies debut here. There is no Flora Batch 3 — the whole point is
  // that the tray you already own closes this loop, as a MIX. Each level spends
  // one Flora Batch 2 trick and dares you to lean on it anyway:
  //   5-1 Regrowth Husk    → burst with gaps between swings feeds it
  //   5-2 Cinder Golem     → the burn half of your kit hits for half
  //   5-3 Bulwark Roach    → spray efficiency floors to chipping
  //   5-4 Toad + Nightstalker → displacement and ripostes find nothing to grab
  //   5-5 Wardshell Grub + the King → traps spring on nothing, plates eat first hits
  {
    id: 20, world: 5, idx: 1, name: 'The Knitting Dark', hpMul: 2.15,
    blurb: 'The husks come back together while you blink. Something has been timing your swings.',
    tip: 'NEW FOE: the Regrowth Husk knits 15 HP back for every 2s it is not hit. An Ironbark Titan swinging every 3s watches its own damage close up between shots. Do not give it a quiet beat: stacked Thornvines (1.4s), a held Emberlash beam, and anything that fires in volleys keep the wound open.',
    addPool: ['gnat', 'regrow', 'beetle'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(48, [G('regrow', 2, 5), G('gnat', 2, 1.6, 8)]),
      W(90, [G('regrow', 3, 4.5), G('beetle', 1, 0, 10)]),
      W(132, [G('regrow', 3, 4), G('chitter', 2, 6, 8), G('gnat', 2, 1.5, 14)]),
      W(176, [G('regrow', 4, 3.5), G('beetle', 2, 6, 6), G('wisp', 2, 5, 12)]),
    ],
  },
  {
    id: 21, world: 5, idx: 2, name: 'Half the Fire', hpMul: 2.2,
    blurb: 'Something walked out of the kiln and kept the ash. Your embers still bite it — about half as hard.',
    tip: 'NEW FOE: the Cinder Golem takes only 50% damage from burn and fire — the Emberlash beam smoulders at 4/s and Prism Bud\u2019s fire burst lands for 9. But its clay drinks no physical damage: Ironbark strikes, Thornvine thorns, and every other half of the Prism go in whole. Cinderpod blasts are concussion, not fire — those work too. Bring both channels.',
    addPool: ['golem', 'wisp', 'gnat'],
    waves: [
      W(12, [G('gnat', 3, 1.6)]),
      W(50, [G('golem', 1), G('gnat', 2, 1.6, 6)]),
      W(92, [G('golem', 2, 7), G('wisp', 3, 4, 6)]),
      W(136, [G('golem', 2, 6), G('marauder', 2, 5, 8), G('gnat', 3, 1.5, 14)]),
      W(180, [G('golem', 3, 5.5), G('wisp', 4, 3, 8), G('skitter', 3, 0.7, 16)]),
    ],
  },
  {
    id: 22, world: 5, idx: 3, name: 'Small Change', hpMul: 2.2,
    blurb: 'A shell that counts your needles as pennies — and a grub that takes one free hit per tile.',
    tip: 'NEW FOES: the Bulwark Roach floors any single hit under 10 damage down to 1 — a whole Needle Reed volley spends itself for five. Hit it hard, not often: Thornvines, Ironbark, Cinderpods (an Emberlash beam is a stream, not a volley — that one still works). The Wardshell Grub nullifies the FIRST hit in every new tile it steps into: an Ambush Fern springs for zero. Let anything cheap pop the ward, then bury it.',
    addPool: ['roach', 'wardshell', 'chitter', 'gnat'],
    waves: [
      W(12, [G('gnat', 2, 2)]),
      W(48, [G('roach', 2, 5), G('gnat', 2, 1.6, 8)]),
      W(90, [G('wardshell', 2, 6), G('chitter', 1, 0, 10)]),
      W(132, [G('roach', 3, 4.5), G('wardshell', 2, 6, 8), G('gnat', 2, 1.5, 14)]),
      W(176, [G('roach', 3, 4), G('wardshell', 3, 5, 6), G('chitter', 2, 6, 12)]),
    ],
  },
  {
    id: 23, world: 5, idx: 4, name: 'Stone in the Stream', hpMul: 2.25,
    blurb: 'One will not be moved. The other will not be caught on the first strike. Your favorite tricks are openers now.',
    tip: 'NEW FOES: the Boulder Toad is immune to displacement — a Gale Fern gust washes over it like weather, and it must simply be damaged down. The Iron Nightstalker dashes like a Nightcap Assassin, but an iron plate eats the first hit of every pass — Sentinel Bloom\u2019s counter clangs off — then it bursts your back row and bounds away to re-arm. Soften the plate with something cheap and let the second hit be the real one.',
    addPool: ['toad', 'nightstalker', 'nightcap', 'gnat'],
    waves: [
      W(12, [G('gnat', 3, 1.6)]),
      W(48, [G('toad', 2, 6), G('gnat', 2, 1.6, 8)]),
      W(90, [G('nightstalker', 2, 5), G('gnat', 2, 1.5, 8)]),
      W(132, [G('toad', 2, 6), G('nightstalker', 2, 5, 7), G('chitter', 1, 0, 13)]),
      W(178, [G('nightstalker', 3, 4.5), G('toad', 3, 5, 6), G('ranger', 2, 6, 14)]),
    ],
  },
  {
    id: 24, world: 5, idx: 5, name: 'The Reckoning Crown', hpMul: 2.1, boss: 'hollowking',
    blurb: 'The King returns wearing every answer you leaned on — and the blight now knows what each one is worth.',
    tip: 'BOSS: the same three-phase King, but his court has learned your kit — Regrowth Husks knit over your bursts, Cinder Golems half your fire, Roaches shrug your spray, Toads ignore your gusts, Nightstalkers eat your ripostes, and Wardshell Grubs no-sell your ambushes. One plant no longer solves a lane; mix damage types and roles, and save the enrage window for everything you have.',
    addPool: ['regrow', 'golem', 'roach', 'toad', 'nightstalker', 'wardshell'],
    waves: [
      W(12, [G('gnat', 2, 2), G('regrow', 2, 4.5, 8)]),
      W(50, [G('golem', 1), G('roach', 2, 5, 6)]),
      W(92, [G('toad', 2, 6), G('nightstalker', 2, 5, 6), G('wardshell', 1, 0, 13)]),
      W(134, [G('regrow', 3, 4), G('golem', 1, 0, 8), G('wardshell', 2, 6, 10)]),
      W(178, [G('hollowking', 1), G('toad', 1, 0, 14), G('nightstalker', 2, 5, 22), G('roach', 2, 6, 29), G('gnat', 3, 1.4, 36)]),
    ],
  },
];

// Flora unlocks: level id at which the flora becomes available. Flora Batch 1
// arrives with its enemies, one answer per level of the Rootbound Depths.
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
  { level: 10, flora: ['deeproot', 'lotus'] }, // vs Tunnel Larva (+ economy for the push)
  { level: 11, flora: ['cinderpod'] }, // vs Stoneback Grub
  { level: 12, flora: ['bulwark', 'watchvine'] }, // vs Locust Ranger / Spore Imp
  { level: 13, flora: ['snaptrap', 'bindweed'] }, // vs Root Thief & swarms / Gargant Husk
  { level: 14, flora: [] },
  // Flora Batch 2 arrives with World 4, one answer per level of the Crown.
  { level: 15, flora: ['emberlash', 'needlereed'] }, // vs Molt Wisp splits / clustered weak units
  { level: 16, flora: ['ironbark', 'gale'] }, // vs Grovemaw Slug / Barkskin Marauder
  { level: 17, flora: ['sentinelbloom'] }, // vs Nightcap Assassin
  { level: 18, flora: ['ambush'] }, // vs Fen Wretch
  { level: 19, flora: ['prism'] }, // vs The Hollow King's rotating ward
  // Enemy Batch 3 (World 5) ships with NO new Flora on purpose: the Reckoning
  // is a test of the 20 you already have. Nothing unlocks from 20 onward.
  { level: 20, flora: [] },
  { level: 21, flora: [] },
  { level: 22, flora: [] },
  { level: 23, flora: [] },
  { level: 24, flora: [] },
];

export function unlockedFloraFor(levelId: number): FloraKey[] {
  const out: FloraKey[] = [];
  for (const u of FLORA_UNLOCKS) {
    if (u.level <= levelId) out.push(...u.flora);
  }
  return out;
}

/** Flora that becomes available exactly at this level (for the "UNLOCKS …" tag). */
export function floraUnlockedAt(levelId: number): FloraKey[] {
  return FLORA_UNLOCKS.filter((u) => u.level === levelId).flatMap((u) => u.flora);
}

/** Every enemy key a level can field, waves + boss adds. */
export function levelThreats(level: LevelDef): Set<EnemyKey> {
  const set = new Set<EnemyKey>();
  for (const w of level.waves) for (const g of w.groups) set.add(g.type);
  for (const k of level.addPool) set.add(k);
  return set;
}

/**
 * Threat-aware starting loadout: the classic spine (economy → shooter → wall)
 * plus unlocked hard counters for whatever this level actually fields.
 */
export function defaultLoadoutFor(level: LevelDef): FloraKey[] {
  const unlocked = unlockedFloraFor(level.id);
  const threats = levelThreats(level);
  const out: FloraKey[] = [];
  const add = (k: FloraKey) => {
    if (unlocked.includes(k) && !out.includes(k) && out.length < LOADOUT_SLOTS) out.push(k);
  };
  add('glowbulb');
  add('thornvine');
  add('bramble');
  // hard requirements first — the enemies nothing else can answer
  if (threats.has('drifter') || threats.has('colossus')) add('sentinel');
  if (threats.has('grub')) { add('cinderpod'); add('cactus'); }
  if (threats.has('larva')) add('deeproot');
  if (threats.has('ranger')) add('bulwark');
  if (threats.has('imp') || threats.has('thief')) { add('watchvine'); add('snaptrap'); }
  if (threats.has('husk')) add('bindweed');
  if (threats.has('warden') || threats.has('beetle') || threats.has('skitter')) add('cactus');
  // ── Enemy Batch 3: the Reckoning — there is no single answer, so the tray
  // must keep both damage channels AND both hit rhythms alive. These picks run
  // above the Batch-2 rules so a batch-3 threat's answer can't be crowded out
  // of the six-slot tray by a rule that would only duplicate a plant anyway. ──
  // A Regrowth Husk can't knit while it is being hit at all — steady streams.
  if (threats.has('regrow')) add('emberlash');
  // The Golem halves burn and the Roach floors small hits — 80-damage swings
  // of raw physical go through both of them whole.
  if (threats.has('golem') || threats.has('roach')) add('ironbark');
  // The Toad cannot be shoved — a pierce volley grinds it and its friends.
  if (threats.has('toad')) add('cactus');
  // The Nightstalker re-arms after its burst — a gust cancels the whole sprint.
  if (threats.has('nightstalker')) add('gale');
  // A Wardshell's tile ward eats ONE hit, however cheap — needles spend it free.
  if (threats.has('wardshell')) add('needlereed');
  // ── Flora Batch 2: the Hollow Crown answers, strongest first ──
  // The King wards one damage channel at a time; Prism Bud is never on the wrong one.
  if (threats.has('hollowking')) add('prism');
  // A Grovemaw Slug eats statuses — raw burst has nothing for it to absorb.
  if (threats.has('slug')) add('ironbark');
  // Displacement works on things that shrug off root — and cancels a Nightcap sprint.
  if (threats.has('marauder') || threats.has('husk')) add('gale');
  // Splits and packs are a sustained-clear problem, not a burst problem.
  if (threats.has('wisp') || threats.has('chitter')) add('emberlash');
  if (threats.has('nightcap') || threats.has('vaulter')) add('sentinelbloom');
  if (threats.has('wretch')) add('ambush');
  if (threats.has('chitter')) add('needlereed');
  // Older toolkit, still useful as filler.
  if (threats.has('wisp') || threats.has('chitter')) add('cactus');
  if (threats.has('slug') || threats.has('marauder')) { add('thornvine'); add('cinderpod'); }
  if (threats.has('nightcap') || threats.has('wretch')) { add('watchvine'); add('snaptrap'); }
  if (threats.has('hollowking')) { add('cactus'); add('cinderpod'); add('watchvine'); add('bramble'); }
  // A Grovemaw Slug turns chill straight into armour — don't hand it dinner.
  if (!threats.has('slug')) add('frostcap');
  for (const k of unlocked) add(k);
  return out.slice(0, LOADOUT_SLOTS);
}

export const LOADOUT_SLOTS = 6;
export const START_NECTAR = 50;
export const PASSIVE_INCOME = 25;
export const PASSIVE_PERIOD = 10;
