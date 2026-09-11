// Headless balance harness: a scripted average-skill player runs every level.
// Usage: npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs --outfile=/tmp/sim.cjs && node /tmp/sim.cjs
import { createGame, placeFlora, stepGame } from '../src/game/engine';
import { ENEMIES, FLORA, LEVELS, defaultLoadoutFor } from '../src/game/data';
import { starsForLevel, TICK, type EnemyEnt, type EnemyKey, type FloraKey, type GameState, type LevelDef } from '../src/game/types';

const GLOW_ORDER = [2, 0, 4, 1, 3];
const isFlying = (e: EnemyEnt) => !!ENEMIES[e.key].flying;

// Threat profile per level — the bot reads the intel like a player would.
interface Threats {
  larva: boolean;
  imp: boolean;
  grub: boolean;
  husk: boolean;
  thief: boolean;
  vaulter: boolean;
  ranger: boolean;
  flyer: boolean;
  // ── Enemy Batch 2 ──
  split: boolean; // Molt Wisp / Chitterling — a numbers problem, wants pierce
  sponge: boolean; // Grovemaw Slug / Barkskin Marauder — status is useless, wants raw damage
  backline: boolean; // Nightcap Assassin / Fen Wretch — the back row is contested
  slug: boolean; // Grovemaw Slug specifically — wants Ironbark
  marauder: boolean; // Barkskin Marauder specifically — wants Gale Fern
  stalker: boolean; // Iron Nightstalker — Gust cancels its plate-armoured pass
  king: boolean; // The Hollow King — wants Prism Bud
}
function threatsOf(level: LevelDef): Threats {
  const set = new Set<EnemyKey>();
  for (const w of level.waves) for (const g of w.groups) set.add(g.type);
  for (const k of level.addPool) set.add(k);
  return {
    larva: set.has('larva'),
    imp: set.has('imp'),
    grub: set.has('grub'),
    husk: set.has('husk'),
    thief: set.has('thief'),
    vaulter: set.has('vaulter'),
    ranger: set.has('ranger'),
    flyer: set.has('drifter'),
    split: set.has('wisp') || set.has('chitter'),
    sponge: set.has('slug') || set.has('marauder'),
    backline: set.has('nightcap') || set.has('wretch'),
    slug: set.has('slug'),
    marauder: set.has('marauder'),
    stalker: set.has('nightstalker'),
    king: set.has('hollowking'),
  };
}

function freeCol(s: GameState, lane: number, prefs: number[]): number {
  for (const c of prefs) if (c >= 0 && c < s.grid[lane].length && !s.grid[lane][c]) return c;
  return -1;
}

function countFlora(s: GameState, lane: number, pred: (k: FloraKey) => boolean): number {
  let n = 0;
  for (const f of s.grid[lane]) if (f && pred(f.key)) n++;
  return n;
}
function countAll(s: GameState, key: FloraKey): number {
  return s.grid.flat().filter((f) => f?.key === key).length;
}

/** Plants that can actually shoot an enemy standing at `x` of this lane.
 *  Normal flora only fire forwards (at enemies east of their tile); the
 *  Watchvine/Bindweed `rearmost` targeting ignores facing and shoots back. */
const FRONT_OFF = 0.6;
function coversX(s: GameState, lane: number, x: number): number {
  return s.grid[lane].filter((f, c) => {
    const atk = f && FLORA[f.key].attack;
    return !!atk && (!!atk.rearmost || c + 0.1 + FRONT_OFF < x);
  }).length;
}

/** Place `key` in this lane if the tray, Nectar and tiles allow it. */
function tryPlace(s: GameState, key: FloraKey, lane: number, prefs: number[]): boolean {
  if (!s.loadout.includes(key)) return false;
  if ((s.trayCd[key] ?? 0) > 0 || s.nectar < FLORA[key].cost) return false;
  const c = freeCol(s, lane, prefs);
  if (c < 0) return false;
  return placeFlora(s, key, lane, c) === 'ok';
}

function botAct(s: GameState, th: Threats) {
  if (s.status !== 'playing') return;
  const has = (k: FloraKey) => s.loadout.includes(k);
  const splashKey: FloraKey = has('cinderpod') ? 'cinderpod' : 'cactus';
  const foes = (l: number) => s.enemies.filter((e) => e.lane === l);

  // 1) economy first (cap 4 bulbs) — Nectar Lotus only once the lanes are held.
  // A human stops scaling the moment a ground enemy is inside col 6 of an
  // un-walled lane; the bot used to plant bulbs anyway and lose the lane to a
  // plain walker 40 seconds before the boss.
  const galeGoal = 2;
  const glowCount = countAll(s, 'glowbulb');
  const TANKY_WALKERS = new Set(['beetle', 'warden', 'grub', 'husk', 'marauder', 'slug', 'regrow', 'golem', 'roach', 'wardshell', 'toad', 'nightstalker']);
  const emergencyLane = (() => {
    for (let l = 0; l < 5; l++) {
      if (s.grid[l].some((f) => f && !FLORA[f.key].attack && f.key === 'bramblewall')) continue;
      if (
        s.enemies.some(
          (e) => {
            if (e.lane !== l || e.hp <= 0 || e.burrowed || e.jumpT > 0 || e.dashT > 0 || isFlying(e) || e.chewing) return false;
            // tanky walkers deserve an early wall; fast trash is allowed inside
            // col 3.5 before scaling pauses — vines usually clear it first
            return TANKY_WALKERS.has(e.key) ? e.x < 6 : e.x < 3.5;
          }
        )
      )
        return l;
    }
    return -1;
  })();
  if (has('glowbulb') && glowCount < 4 && s.nectar >= 55 && emergencyLane < 0) {
    for (const l of GLOW_ORDER) if (tryPlace(s, 'glowbulb', l, [0, 1])) return;
  }
  // Flora Batch 2: the answers that have to exist before the threat arrives.
  // A Grovemaw Slug turns every status you own into armour, so raw burst first.
  if (th.slug && has('ironbark') && countAll(s, 'ironbark') < 2 && s.nectar >= FLORA.ironbark.cost) {
    for (const l of GLOW_ORDER) if (tryPlace(s, 'ironbark', l, [4, 3, 5])) return;
  }
  // The Hollow King wards a whole damage channel — one Prism Bud per contested lane.
  if (th.king && has('prism') && countAll(s, 'prism') < 2 && s.nectar >= FLORA.prism.cost) {
    for (const l of GLOW_ORDER) if (tryPlace(s, 'prism', l, [4, 3, 5])) return;
  }
  // Grub levels: get the splash answer down EARLY, while the board is still open —
  // a Stoneback ignores chip damage, and once it parks at a wall every tile that
  // could have held the counter may already be planted.
  if (th.grub && countAll(s, splashKey) < 2 && s.nectar >= FLORA[splashKey].cost) {
    for (const l of GLOW_ORDER) if (tryPlace(s, splashKey, l, [3, 2, 4])) return;
  }
  // Dash levels (Nightcap / Iron Nightstalker) and root-immune Marauders: a gust
  // cancels the whole pass, so get at least two Ferns rooted before the wave —
  // reacting after a Nightcap is behind the wall is already too late.
  if ((th.backline || th.marauder || th.stalker) && has('gale') && countAll(s, 'gale') < galeGoal && s.nectar >= FLORA.gale.cost) {
    // one Fern per lane — dashes arrive in several lanes at once
    for (const l of GLOW_ORDER) {
      if (countFlora(s, l, (k) => k === 'gale') === 0 && tryPlace(s, 'gale', l, [3, 2, 4])) return;
    }
  }
  if (has('lotus') && countAll(s, 'lotus') < 1 && s.nectar >= 200 && s.t > 45) {
    const held = [0, 1, 2, 3, 4].every((l) => foes(l).length === 0 || countFlora(s, l, (k) => !!FLORA[k].attack) > 0);
    if (held) for (const l of GLOW_ORDER) if (tryPlace(s, 'lotus', l, [0, 1])) return;
  }

  // 2) respond lane by lane
  for (let l = 0; l < 5; l++) {
    const lane = foes(l);
    if (!lane.length) continue;
    const flyers = lane.filter((e) => e.key === 'drifter');
    const ground = lane.filter((e) => e.key !== 'drifter');
    if (!ground.length) {
      if (flyers.length > 0 && countFlora(s, l, (k) => k === 'sentinel') === 0) {
        if (tryPlace(s, 'sentinel', l, [3, 2, 4])) return;
      }
      continue;
    }
    const skitters = ground.filter((e) => e.key === 'skitter').length;
    const front = ground.reduce((a, b) => (a.x <= b.x ? a : b));
    const frontX = front.x;
    const boss = ground.some((e) => e.hp > 400);
    const heavy = ground.some((e) => e.key === 'husk' || e.key === 'colossus');
    const burrowed = ground.some((e) => e.burrowed);
    const attackers = countFlora(s, l, (k) => !!FLORA[k].attack);
    const covering = coversX(s, l, frontX); // shooters that can actually reach the leader
    const walls = countFlora(s, l, (k) => k === 'bramble' || k === 'bulwark');
    const sentinels = countFlora(s, l, (k) => k === 'sentinel');
    const splash = countFlora(s, l, (k) => k === 'cactus' || k === 'frostcap' || k === 'cinderpod');

    // anti-air is non-negotiable
    if (flyers.length > 0 && sentinels === 0 && tryPlace(s, 'sentinel', l, [3, 2, 4])) return;
    // Tunnel Larva: only the Deeproot Sentry can touch the buried stretch
    if (th.larva && burrowed && countFlora(s, l, (k) => k === 'deeproot') === 0) {
      if (tryPlace(s, 'deeproot', l, [4, 3, 5])) return;
    }
    // Stoneback Grubs ignore chip damage — splash wears the slab down
    if (th.grub && ground.some((e) => e.key === 'grub') && splash === 0) {
      if (tryPlace(s, splashKey, l, [3, 2, 4])) return;
      if (tryPlace(s, 'cactus', l, [3, 2, 4])) return;
    }
    // Locust Rangers: a Bulwark Bramble snatches the spines out of the air — but
    // only worth building where there is already a line of shooters to protect.
    if (
      th.ranger &&
      ground.some((e) => e.key === 'ranger') &&
      attackers >= 1 &&
      countAll(s, 'bulwark') < 2 &&
      countFlora(s, l, (k) => k === 'bulwark') === 0
    ) {
      if (tryPlace(s, 'bulwark', l, [5, 6, 4])) return;
    }
    // Gargant Husk: it one-shots whatever it reaches, so root it out front
    if (th.husk && ground.some((e) => e.key === 'husk') && countFlora(s, l, (k) => k === 'bindweed') === 0) {
      if (tryPlace(s, 'bindweed', l, [3, 2, 4])) return;
    }
    // backline coverage: Imps drop in, Thieves dig past, and a Nightcap Assassin
    // sprints clean over the wall to burst whatever is parked behind it. A
    // Watchvine shoots *backwards* at whatever got through; a Snaptrap eats the weak.
    if (!boss && (th.imp || th.thief || th.backline) && coversX(s, l, 2) === 0 && s.nectar >= 200 && attackers >= 1) {
      if (tryPlace(s, 'watchvine', l, [2, 1, 3])) return;
    }
    // Flora Batch 2, lane by lane. Ironbark is the listed counter to both the
    // status-immune Grovemaw Slug and the Bulwark Roach (hard hits beat its
    // per-hit damage floor); burn-resistant Cinder Golems take full physical.
    if (
      ground.some((e) => e.key === 'slug' || e.key === 'roach' || e.key === 'golem') &&
      countFlora(s, l, (k) => k === 'ironbark') === 0
    ) {
      if (tryPlace(s, 'ironbark', l, [4, 3, 5, 2])) return;
    }
    // Gale is the designed answer to every dasher (its gust cancels the sprint)
    // as well as the root-immune Marauder: Nightcap and the retreating Iron
    // Nightstalker both lose their whole pass to a well-placed gust.
    if (
      ground.some((e) => e.key === 'marauder' || e.key === 'husk' || e.key === 'nightcap' || e.key === 'nightstalker') &&
      countFlora(s, l, (k) => k === 'gale') === 0
    ) {
      if (tryPlace(s, 'gale', l, [3, 2, 4])) return;
    }
    if ((th.split || ground.some((e) => e.key === 'wisp' || e.key === 'chitter')) && splash === 0) {
      if (tryPlace(s, 'emberlash', l, [4, 3, 5])) return;
      if (tryPlace(s, 'needlereed', l, [4, 3, 5])) return;
    }
    // A Fen Wretch walking in is worth 120 damage to spring on — plant the trap ahead of it.
    if (th.backline && ground.some((e) => e.key === 'wretch') && countFlora(s, l, (k) => k === 'ambush') === 0) {
      if (tryPlace(s, 'ambush', l, [5, 6, 4])) return;
    }
    // Fen Wretch: its aura halves this lane's Nectar for as long as it lives, so
    // it outranks everything else in the lane — pile damage on it first.
    if (ground.some((e) => e.key === 'wretch') && attackers < 3) {
      if (tryPlace(s, 'thornvine', l, [3, 2, 4, 5])) return;
      if (tryPlace(s, splashKey, l, [3, 2, 4])) return;
    }
    // Grovemaw Slug / Barkskin Marauder: control Flora is eaten or shrugged off,
    // so a lane holding one needs a raw-damage answer, not another Frostcap.
    if (
      ground.some((e) => e.key === 'slug' || e.key === 'marauder') &&
      countFlora(s, l, (k) => k === 'thornvine' || k === 'cinderpod') < 2 &&
      s.nectar >= 130
    ) {
      if (tryPlace(s, 'thornvine', l, [4, 3, 5, 2])) return;
      if (tryPlace(s, 'cinderpod', l, [3, 2, 4])) return;
    }
    // A chewer parked at a wall with no splash in the lane takes no damage at all:
    // put a splash plant in the first free tile WEST of it that can still reach it.
    if (ground.some((e) => e.chewing) && splash === 0) {
      const chewer = ground.find((e) => e.chewing)!;
      for (let c = s.grid[l].length - 1; c >= 0; c--) {
        if (c + 0.1 + FRONT_OFF < chewer.x && !s.grid[l][c] && tryPlace(s, splashKey, l, [c])) return;
      }
    }
    // Something stuck in behind the line — a chewer at the wall, a burrower, a
    // catapulted Imp — cannot be touched by forward-facing shooters. That is
    // exactly what the Watchvine's backwards fire is for.
    if (covering === 0 && (front.chewing || frontX < 6.4)) {
      if (countAll(s, 'watchvine') < 3 && s.nectar >= FLORA.watchvine.cost) {
        if (tryPlace(s, 'watchvine', l, [2, 1, 3, 0])) return;
      }
      if (tryPlace(s, 'thornvine', l, [1, 0, 2])) return;
      if (tryPlace(s, 'deeproot', l, [1, 0, 2])) return;
    }
    // first attacker anywhere threatened
    if (attackers === 0 && ground.length > 0 && frontX < 9.2) {
      if (tryPlace(s, 'thornvine', l, [4, 3, 5, 2])) return;
    }
    // splash vs swarms
    if (skitters >= 2 && countFlora(s, l, (k) => k === 'cactus' || k === 'cinderpod') === 0) {
      if (tryPlace(s, splashKey, l, [3, 2, 4])) return;
      if (tryPlace(s, 'cactus', l, [3, 2, 4])) return;
    }
    // wall when the front is close (never east of the larva emerge line)
    if (ground.length > 0 && walls === 0 && frontX < 6.4 && s.nectar >= 75) {
      const prefs = th.larva ? [5, 4] : th.vaulter ? [6, 5, 4] : [6, 5];
      if (tryPlace(s, 'bramble', l, prefs)) return;
    }
    // a second wall behind the first eats Mite Vaulter leaps
    if (th.vaulter && ground.some((e) => e.key === 'vaulter') && walls === 1 && frontX < 7.5 && s.nectar >= 120) {
      if (tryPlace(s, 'bramble', l, [5, 4, 3])) return;
    }
    // Snaptrap: eats anything squishy that walks into its tile, so park it where
    // trash funnels — just behind the front line.
    if (!boss && ground.some((e) => e.maxHp < 100) && countAll(s, 'snaptrap') < 2 && s.nectar >= 175) {
      if (tryPlace(s, 'snaptrap', l, [5, 6, 4])) return;
    }
    // frost control for wardens/husks/beetles mid-board
    if (
      ground.some((e) => e.key === 'warden' || e.key === 'colossus' || e.key === 'husk' || e.key === 'beetle') &&
      countFlora(s, l, (k) => k === 'frostcap') === 0 &&
      s.nectar >= 100
    ) {
      if (tryPlace(s, 'frostcap', l, [2, 3])) return;
    }
    // reinforce: second/third attacker; husks, bosses and thieves get four
    const want = boss || heavy || (th.thief && ground.some((e) => e.key === 'thief')) ? 4 : 2;
    if (attackers < want && frontX < 8.5 && s.nectar >= 120) {
      if (tryPlace(s, 'thornvine', l, [3, 2, 4, 5])) return;
    }
  }

  // 3) proactive backline insurance for catapult/burrow levels (all lanes)
  if (th.imp || th.larva || th.thief || th.backline) {
    for (const l of [2, 1, 3, 0, 4]) {
      if (coversX(s, l, 2) > 0 || s.nectar < 140) continue;
      // a shooter at the very back (col 0-1) is what catches a deep drop
      if (s.nectar >= 220 && countAll(s, 'watchvine') < 2 && tryPlace(s, 'watchvine', l, [1, 2, 0])) return;
      if (tryPlace(s, 'thornvine', l, [1, 0, 2])) return;
      if (tryPlace(s, 'deeproot', l, [1, 0, 2])) return;
    }
  }

  // 4) spend surplus on thornvines in open lanes
  if (s.nectar >= 220) {
    for (const l of [2, 1, 3, 0, 4]) {
      if (countFlora(s, l, (k) => !!FLORA[k].attack) < 3) {
        if (tryPlace(s, 'thornvine', l, [4, 5])) return;
      }
    }
  }
}

// Star thresholds come from the level definition (see types.ts / GameScreen).
const starsFor = (level: LevelDef, snaresLeft: number) => starsForLevel(level, snaresLeft);

interface RunResult {
  status: string;
  t: number;
  snares: number;
  stars: number;
  kills: number;
  nectar: number;
  plants: number;
  lost: number; // Flora destroyed / smashed / stolen off-board
  batch: string; // which Batch 1/2 Flora actually hit the board, and how many
  stuck: string[]; // enemies still walking when a loss/timeout settles
}

function runLevel(level: LevelDef, seed?: number): RunResult {
  const th = threatsOf(level);
  const loadout = defaultLoadoutFor(level);
  const s = createGame(level, loadout, seed);
  let actionT = 0;
  const tracing = process.env.SIM_TRACE === String(level.id + 1);
  let nextLog = 0;
  const events0 = s.events.length;
  while (s.status === 'playing' && s.t < 900) {
    actionT -= TICK;
    if (actionT <= 0) {
      botAct(s, th);
      actionT = 0.35; // human-ish placement pace
    }
    stepGame(s);
    if (tracing && s.t >= nextLog) {
      nextLog += 20;
      const lanes = [0, 1, 2, 3, 4].map((l) => {
        const g = s.grid[l].map((f) => (f ? (f.key as string)[0].toUpperCase() : '.')).join('');
        const front = s.enemies.filter((e) => e.lane === l).sort((a, b) => a.x - b.x)[0];
        const tag = front
          ? `${front.key}@${front.x.toFixed(1)}${front.stone ? `+s${front.stone}` : ''}${front.burrowed ? 'B' : ''}${front.chewing ? 'C' : ''}`
          : '';
        return `l${l}[${g}]${tag}`;
      });
      console.log(`   t=${s.t.toFixed(0).padStart(3)} xp=${String(Math.floor(s.nectar)).padStart(4)} ${lanes.join(' ')}`);
    }
  }
  const snaresLeft = s.snares.filter(Boolean).length;
  const lost = s.events.slice(events0).filter((e) => e === 'plantdie' || e === 'smash' || e === 'stolen').length;
  const used = (k: FloraKey) => s.grid.flat().filter((f) => f?.key === k).length;
  const batch = (
    [
      'cinderpod', 'deeproot', 'bulwark', 'snaptrap', 'watchvine', 'bindweed', 'lotus',
      'ironbark', 'emberlash', 'needlereed', 'gale', 'sentinelbloom', 'ambush', 'prism',
    ] as FloraKey[]
  )
    .filter((k) => used(k) > 0)
    .map((k) => `${k}x${used(k)}`)
    .join(' ');
  const stuck =
    s.status !== 'won' && s.pending.length === 0
      ? s.enemies.map(
          (e) => `${e.key} lane=${e.lane} x=${e.x.toFixed(2)} hp=${e.hp}/${e.maxHp} stone=${e.stone} chewing=${e.chewing}`,
        )
      : [];
  return {
    status: s.status,
    t: s.t,
    snares: snaresLeft,
    stars: starsFor(level, snaresLeft),
    kills: s.kills,
    nectar: s.nectar,
    plants: s.placedCount,
    lost,
    batch,
    stuck,
  };
}

/** Multi-seed mode (SIM_SEEDS=n): average-skill bot across N lane-RNG seeds. */
const SEED_N = Number(process.env.SIM_SEEDS ?? '0');
function seedFor(level: LevelDef, k: number): number | undefined {
  if (k === 0) return undefined; // k=0 is the canonical per-level seed
  return ((level.id * 7919 + 1337) ^ Math.imul(k + 1, 2654435761)) >>> 0;
}

if (SEED_N > 0) {
  // Aggregate calibration table — win rate, snare survival and star band.
  console.log('level name                     win%  s̄nares(min)  s̄tars  s̄t   floraLost');
  let allWinRate = true;
  const onlyK = process.env.SIM_K ? Number(process.env.SIM_K) : -1;
  for (const level of LEVELS) {
    if (onlyK >= 0 && !process.env.SIM_LVL!.split(',').map(Number).includes(level.id + 1)) continue;
    const runs: RunResult[] = [];
    const ks = onlyK >= 0 ? [onlyK] : [...Array(SEED_N).keys()];
    for (const k of ks) runs.push(runLevel(level, seedFor(level, k)));
    const wins = runs.filter((r) => r.status === 'won').length;
    const avg = (f: (r: RunResult) => number) => runs.reduce((n, r) => n + f(r), 0) / runs.length;
    const minSnares = Math.min(...runs.map((r) => r.snares));
    const winPct = Math.round((100 * wins) / runs.length);
    const hist = [0, 0, 0];
    runs.forEach((r) => hist[r.stars - 1]++);
    const loseSeeds = runs.map((r, k) => (r.status === 'won' ? -1 : k)).filter((k) => k >= 0);
    allWinRate = allWinRate && wins === runs.length;
    console.log(
      `L${String(level.id + 1).padStart(2)} ${level.name.padEnd(24)} ${String(winPct).padStart(3)}%  ` +
        `${avg((r) => r.snares).toFixed(2)} (${minSnares})    ${avg((r) => r.stars).toFixed(2)} ` +
        `[${hist.map((n) => String(n).padStart(2)).join('/')}]  ` +
        `${avg((r) => r.t).toFixed(0).padStart(3)}  ${avg((r) => r.lost).toFixed(1)}` +
        `${loseSeeds.length ? `  ⚠ lose@${loseSeeds.join(',')}` : ''}`,
    );
  }
  console.log(allWinRate ? `\nALL LEVELS WINNABLE across ${SEED_N} seeds (bot)` : `\nBALANCE FAILURES PRESENT across ${SEED_N} seeds`);
} else {
  let allWin = true;
  for (const level of LEVELS) {
    const loadout = defaultLoadoutFor(level);
    const r = runLevel(level);
    allWin = allWin && r.status === 'won';
    console.log(
      `L${String(level.id + 1).padStart(2)} ${level.name.padEnd(22)} ${r.status.toUpperCase().padEnd(6)} ` +
        `t=${r.t.toFixed(0).padStart(3)}s snares=${r.snares}/5 kills=${String(r.kills).padStart(3)} ` +
        `nectarLeft=${String(Math.floor(r.nectar)).padStart(4)} plants=${r.plants} ` +
        `tray=[${loadout.join(',')}]${r.batch ? ` batch: ${r.batch}` : ''}`,
    );
    for (const line of r.stuck) console.log(`      stuck: ${line}`);
  }
  console.log(allWin ? '\nALL LEVELS WINNABLE (bot)' : '\nBALANCE FAILURES PRESENT');
}
