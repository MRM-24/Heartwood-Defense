// Headless balance harness: a scripted average-skill player runs every level.
// Usage: npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs --outfile=/tmp/sim.cjs && node /tmp/sim.cjs
import { createGame, placeFlora, stepGame } from '../src/game/engine';
import { FLORA, LEVELS, defaultLoadoutFor } from '../src/game/data';
import { TICK, type EnemyEnt, type EnemyKey, type FloraKey, type GameState, type LevelDef } from '../src/game/types';

const GLOW_ORDER = [2, 0, 4, 1, 3];

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

  // 1) economy first (cap 4 bulbs) — Nectar Lotus only once the lanes are held
  const glowCount = countAll(s, 'glowbulb');
  if (has('glowbulb') && glowCount < 4 && s.nectar >= 55) {
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
    // Flora Batch 2, lane by lane.
    if (ground.some((e) => e.key === 'slug') && countFlora(s, l, (k) => k === 'ironbark') === 0) {
      if (tryPlace(s, 'ironbark', l, [4, 3, 5, 2])) return;
    }
    if (ground.some((e) => e.key === 'marauder' || e.key === 'husk') && countFlora(s, l, (k) => k === 'gale') === 0) {
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

let allWin = true;
for (const level of LEVELS) {
  const th = threatsOf(level);
  const loadout = defaultLoadoutFor(level);
  const s = createGame(level, loadout);
  let actionT = 0;
  const tracing = process.env.SIM_TRACE === String(level.id + 1);
  let nextLog = 0;
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
  allWin = allWin && s.status === 'won';
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
  console.log(
    `L${String(level.id + 1).padStart(2)} ${level.name.padEnd(22)} ${s.status.toUpperCase().padEnd(6)} ` +
      `t=${s.t.toFixed(0).padStart(3)}s snares=${snaresLeft}/5 kills=${String(s.kills).padStart(3)} ` +
      `nectarLeft=${String(Math.floor(s.nectar)).padStart(4)} plants=${s.placedCount} ` +
      `tray=[${loadout.join(',')}]${batch ? ` batch: ${batch}` : ''}`,
  );
  if (s.status !== 'won' && s.pending.length === 0) {
    for (const e of s.enemies) {
      console.log(`      stuck: ${e.key} lane=${e.lane} x=${e.x.toFixed(2)} hp=${e.hp}/${e.maxHp} stone=${e.stone} chewing=${e.chewing}`);
    }
  }
}
console.log(allWin ? '\nALL LEVELS WINNABLE (bot)' : '\nBALANCE FAILURES PRESENT');
