// Headless balance harness: a scripted average-skill player runs every level.
// Usage: npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs --outfile=/tmp/sim.cjs && node /tmp/sim.cjs
import { createGame, placeFlora, stepGame } from '../src/game/engine';
import { FLORA, LEVELS, unlockedFloraFor } from '../src/game/data';
import { TICK, type EnemyKey, type FloraKey, type GameState, type LevelDef } from '../src/game/types';

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
  };
}

function freeCol(s: GameState, lane: number, prefs: number[]): number {
  for (const c of prefs) if (!s.grid[lane][c]) return c;
  return -1;
}

function countFlora(s: GameState, lane: number, pred: (k: FloraKey) => boolean): number {
  let n = 0;
  for (const f of s.grid[lane]) if (f && pred(f.key)) n++;
  return n;
}

function botAct(s: GameState, th: Threats) {
  if (s.status !== 'playing') return;
  const glowCount = GLOW_ORDER.reduce(
    (n, l) => n + s.grid[l].filter((f) => f?.key === 'glowbulb').length,
    0,
  );

  // 1) economy first (cap 4 bulbs)
  if (
    s.loadout.includes('glowbulb') &&
    glowCount < 4 &&
    (s.trayCd['glowbulb'] ?? 0) <= 0 &&
    s.nectar >= 55 // keep a buffer for an emergency thornvine
  ) {
    for (const l of GLOW_ORDER) {
      const c = freeCol(s, l, [0, 1]);
      if (c >= 0 && placeFlora(s, 'glowbulb', l, c) === 'ok') return;
    }
  }

  // 2) respond lane by lane
  for (let l = 0; l < 5; l++) {
    const foes = s.enemies.filter((e) => e.lane === l);
    if (!foes.length) continue;
    const flyers = foes.filter((e) => e.key === 'drifter');
    const ground = foes.filter((e) => e.key !== 'drifter');
    const skitters = ground.filter((e) => e.key === 'skitter').length;
    const boss = ground.some((e) => e.hp > 400);
    const heavy = ground.some((e) => e.key === 'husk' || e.key === 'colossus'); // needs focus fire
    const attackers = countFlora(s, l, (k) => !!FLORA[k].attack);
    const walls = countFlora(s, l, (k) => k === 'bramble');
    const sentinels = countFlora(s, l, (k) => k === 'sentinel');
    const splash = countFlora(s, l, (k) => k === 'cactus' || k === 'frostcap');
    const frontX = Math.min(...foes.map((e) => e.x));

    // anti-air is non-negotiable
    if (flyers.length > 0 && sentinels === 0 && s.loadout.includes('sentinel')) {
      if ((s.trayCd['sentinel'] ?? 0) <= 0 && s.nectar >= 175) {
        const c = freeCol(s, l, [3, 2, 4]);
        if (c >= 0 && placeFlora(s, 'sentinel', l, c) === 'ok') return;
      }
    }
    // Stoneback Grubs: without splash in the lane they simply do not die
    if (
      th.grub &&
      ground.some((e) => e.key === 'grub') &&
      splash === 0 &&
      (s.trayCd['cactus'] ?? 0) <= 0 &&
      s.nectar >= 100
    ) {
      const c = freeCol(s, l, [3, 2, 4]);
      if (c >= 0 && placeFlora(s, 'cactus', l, c) === 'ok') return;
    }
    // backline coverage: Tunnel Larva surface at col 6 and Spore Imps drop in
    // behind the front — a shooter at col ≤ 2 catches both
    if ((th.larva || th.imp) && countFlora(s, l, (k) => k === 'thornvine' && false) === 0) {
      const backShooters = s.grid[l].filter((f, c) => f && FLORA[f.key].attack && c <= 2).length;
      if (backShooters === 0 && (s.trayCd['thornvine'] ?? 0) <= 0 && s.nectar >= 50) {
        const c = freeCol(s, l, [2, 1, 3]);
        if (c >= 0 && placeFlora(s, 'thornvine', l, c) === 'ok') return;
      }
    }
    // first attacker anywhere threatened
    if (attackers === 0 && ground.length > 0 && frontX < 9.2) {
      if ((s.trayCd['thornvine'] ?? 0) <= 0 && s.nectar >= 50) {
        const c = freeCol(s, l, [4, 3, 5, 2]);
        if (c >= 0 && placeFlora(s, 'thornvine', l, c) === 'ok') return;
      }
    }
    // cactus vs swarms
    if (skitters >= 2 && s.loadout.includes('cactus') && countFlora(s, l, (k) => k === 'cactus') === 0) {
      if ((s.trayCd['cactus'] ?? 0) <= 0 && s.nectar >= 100) {
        const c = freeCol(s, l, [3, 2, 4]);
        if (c >= 0 && placeFlora(s, 'cactus', l, c) === 'ok') return;
      }
    }
    // wall when the front is close (never east of the larva emerge line)
    if (ground.length > 0 && walls === 0 && frontX < 6.4 && (s.trayCd['bramble'] ?? 0) <= 0 && s.nectar >= 75) {
      const prefs = th.larva ? [5, 4] : th.vaulter ? [6, 5, 4] : [6, 5];
      const c = freeCol(s, l, prefs);
      if (c >= 0 && placeFlora(s, 'bramble', l, c) === 'ok') return;
    }
    // a second wall behind the first eats Mite Vaulter leaps
    if (th.vaulter && ground.some((e) => e.key === 'vaulter') && walls === 1 && frontX < 7.5 && (s.trayCd['bramble'] ?? 0) <= 0 && s.nectar >= 120) {
      const c = freeCol(s, l, [5, 4, 3]);
      if (c >= 0 && placeFlora(s, 'bramble', l, c) === 'ok') return;
    }
    // frost control for wardens/husks/beetles mid-board
    if (
      s.loadout.includes('frostcap') &&
      ground.some((e) => e.key === 'warden' || e.key === 'colossus' || e.key === 'husk' || e.key === 'beetle') &&
      countFlora(s, l, (k) => k === 'frostcap') === 0 &&
      (s.trayCd['frostcap'] ?? 0) <= 0 &&
      s.nectar >= 100
    ) {
      const c = freeCol(s, l, [2, 3]);
      if (c >= 0 && placeFlora(s, 'frostcap', l, c) === 'ok') return;
    }
    // reinforce: second/third attacker; husks, bosses and thieves get four
    const want = boss || heavy || (th.thief && ground.some((e) => e.key === 'thief')) ? 4 : 2;
    if (attackers < want && frontX < 8.5 && (s.trayCd['thornvine'] ?? 0) <= 0 && s.nectar >= 120) {
      const c = freeCol(s, l, [3, 2, 4, 5]);
      if (c >= 0 && placeFlora(s, 'thornvine', l, c) === 'ok') return;
    }
  }

  // 3) proactive backline insurance for catapult/burrow levels (all lanes)
  if (th.imp || th.larva) {
    for (const l of [2, 1, 3, 0, 4]) {
      const backShooters = s.grid[l].filter((f, c) => f && FLORA[f.key].attack && c <= 2).length;
      if (backShooters === 0 && (s.trayCd['thornvine'] ?? 0) <= 0 && s.nectar >= 140) {
        const c = freeCol(s, l, [2, 1, 3]);
        if (c >= 0 && placeFlora(s, 'thornvine', l, c) === 'ok') return;
      }
    }
  }

  // 4) spend surplus on thornvines in open lanes
  if (s.nectar >= 220 && (s.trayCd['thornvine'] ?? 0) <= 0) {
    for (const l of [2, 1, 3, 0, 4]) {
      const attackers = countFlora(s, l, (k) => !!FLORA[k].attack);
      if (attackers < 3) {
        const c = freeCol(s, l, [4, 5]);
        if (c >= 0 && placeFlora(s, 'thornvine', l, c) === 'ok') return;
      }
    }
  }
}

let allWin = true;
for (const level of LEVELS) {
  const th = threatsOf(level);
  const loadout = unlockedFloraFor(level.id);
  const s = createGame(level, loadout);
  let actionT = 0;
  while (s.status === 'playing' && s.t < 900) {
    actionT -= TICK;
    if (actionT <= 0) {
      botAct(s, th);
      actionT = 0.35; // human-ish placement pace
    }
    stepGame(s);
  }
  const snaresLeft = s.snares.filter(Boolean).length;
  allWin = allWin && s.status === 'won';
  console.log(
    `L${level.id + 1} ${level.name.padEnd(24)} ${s.status.toUpperCase().padEnd(6)} ` +
      `t=${s.t.toFixed(0).padStart(3)}s snares=${snaresLeft}/5 kills=${String(s.kills).padStart(3)} ` +
      `nectarLeft=${String(Math.floor(s.nectar)).padStart(4)} plants=${s.placedCount}`,
  );
}
console.log(allWin ? '\nALL LEVELS WINNABLE (bot)' : '\nBALANCE FAILURES PRESENT');
