// Novice harness: only the 3 starter plants, slow 0.7s actions, minimal economy.
// SIM_SEEDS=n runs every level across N lane-RNG seeds and reports aggregates.
import { createGame, placeFlora, stepGame } from '../src/game/engine';
import { LEVELS } from '../src/game/data';
import { TICK, type FloraKey, type GameState, type LevelDef } from '../src/game/types';

function freeCol(s: GameState, lane: number, prefs: number[]): number {
  for (const c of prefs) if (!s.grid[lane][c]) return c;
  return -1;
}
function act(s: GameState) {
  const glowN = s.grid.flat().filter((f) => f?.key === 'glowbulb').length;
  if (glowN < 2 && (s.trayCd['glowbulb'] ?? 0) <= 0 && s.nectar >= 50) {
    for (const l of [2, 0, 4]) {
      const c = freeCol(s, l, [0, 1]);
      if (c >= 0 && placeFlora(s, 'glowbulb', l, c) === 'ok') return;
    }
  }
  for (let l = 0; l < 5; l++) {
    const foes = s.enemies.filter((e) => e.lane === l && e.key !== 'drifter');
    if (!foes.length) continue;
    const atk = s.grid[l].filter((f) => f && f.key === 'thornvine').length;
    const wall = s.grid[l].some((f) => f?.key === 'bramble');
    const front = Math.min(...foes.map((e) => e.x));
    if (atk === 0 && (s.trayCd['thornvine'] ?? 0) <= 0 && s.nectar >= 50) {
      const c = freeCol(s, l, [4, 3, 5, 2]);
      if (c >= 0 && placeFlora(s, 'thornvine', l, c) === 'ok') return;
    }
    if (!wall && front < 6 && (s.trayCd['bramble'] ?? 0) <= 0 && s.nectar >= 75) {
      const c = freeCol(s, l, [6, 5]);
      if (c >= 0 && placeFlora(s, 'bramble', l, c) === 'ok') return;
    }
    if (atk < 3 && front < 8 && (s.trayCd['thornvine'] ?? 0) <= 0 && s.nectar >= 130) {
      const c = freeCol(s, l, [3, 2, 4]);
      if (c >= 0 && placeFlora(s, 'thornvine', l, c) === 'ok') return;
    }
  }
}

interface NoviceResult {
  status: string;
  t: number;
  snares: number;
  kills: number;
  lost: number;
}
function runLevel(level: LevelDef, seed?: number): NoviceResult {
  const s = createGame(level, ['thornvine', 'glowbulb', 'bramble'] as FloraKey[], seed);
  const events0 = s.events.length;
  let aT = 0;
  const tracing = process.env.SIM_TRACE === String(level.id + 1);
  let nextTrace = 20;
  while (s.status === 'playing' && s.t < 800) {
    aT -= TICK;
    if (aT <= 0) {
      act(s);
      aT = 0.7;
    }
    stepGame(s);
    if (tracing && s.t >= nextTrace) {
      nextTrace += 20;
      const board = s.grid
        .map((lane) => lane.map((f) => (f ? (f.key as string)[0].toUpperCase() : '.')).join(''))
        .map((g, l) => `l${l}[${g}]${s.enemies.filter((e) => e.lane === l).map((e) => `${e.key.slice(0, 5)}@${e.x.toFixed(1)}`).join(' ')}`)
        .join(' ');
      console.log(`t=${s.t.toFixed(0).padStart(3)} xp=${String(Math.round(s.nectar)).padStart(4)} sn=${s.snares.filter(Boolean).length} ${board}`);
    }
  }
  return {
    status: s.status,
    t: s.t,
    snares: s.snares.filter(Boolean).length,
    kills: s.kills,
    lost: s.events.slice(events0).filter((e) => e === 'plantdie' || e === 'smash' || e === 'stolen').length,
  };
}
function seedFor(level: LevelDef, k: number): number | undefined {
  if (k === 0) return undefined;
  return ((level.id * 7919 + 1337) ^ Math.imul(k + 1, 2654435761)) >>> 0;
}

const SEED_N = Number(process.env.SIM_SEEDS ?? '0');
if (SEED_N > 0) {
  console.log('level name                       win%  timeout%  s̄nares(min)  s̄t    floraLost');
  const onlyK = process.env.SIM_K ? Number(process.env.SIM_K) : -1;
  const lvlFilter = process.env.SIM_LVL ? process.env.SIM_LVL.split(',').map(Number) : null;
  for (const level of LEVELS) {
    if (lvlFilter && !lvlFilter.includes(level.id + 1)) continue;
    const runs: NoviceResult[] = [];
    const ks = onlyK >= 0 ? [onlyK] : [...Array(SEED_N).keys()];
    for (const k of ks) runs.push(runLevel(level, seedFor(level, k)));
    const wins = runs.filter((r) => r.status === 'won').length;
    const timeouts = runs.filter((r) => r.status === 'playing').length;
    const avg = (f: (r: NoviceResult) => number) => runs.reduce((n, r) => n + f(r), 0) / runs.length;
    const minSnares = Math.min(...runs.map((r) => r.snares));
    console.log(
      `L${String(level.id + 1).padStart(2)} ${level.name.padEnd(26)} ${String(Math.round((100 * wins) / runs.length)).padStart(3)}%  ` +
        `${String(Math.round((100 * timeouts) / runs.length)).padStart(3)}%     ` +
        `${avg((r) => r.snares).toFixed(2)} (${minSnares})    ${avg((r) => r.t).toFixed(0).padStart(3)}  ${avg((r) => r.lost).toFixed(1)}`,
    );
  }
} else {
  for (const level of LEVELS) {
    const r = runLevel(level);
    console.log(
      `L${level.id + 1} ${level.name.padEnd(24)} ${r.status.toUpperCase().padEnd(6)} t=${r.t
        .toFixed(0)
        .padStart(3)}s snares=${r.snares}/5 kills=${r.kills}`,
    );
  }
}
