// Novice harness: only the 3 starter plants, slow 0.7s actions, minimal economy.
import { createGame, placeFlora, stepGame } from '../src/game/engine';
import { LEVELS } from '../src/game/data';
import { TICK, type FloraKey, type GameState } from '../src/game/types';

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
for (const level of LEVELS) {
  const s = createGame(level, ['thornvine', 'glowbulb', 'bramble'] as FloraKey[]);
  let aT = 0;
  while (s.status === 'playing' && s.t < 800) {
    aT -= TICK;
    if (aT <= 0) {
      act(s);
      aT = 0.7;
    }
    stepGame(s);
  }
  console.log(
    `L${level.id + 1} ${level.name.padEnd(24)} ${s.status.toUpperCase().padEnd(6)} t=${s.t
      .toFixed(0)
      .padStart(3)}s snares=${s.snares.filter(Boolean).length}/5 kills=${s.kills}`,
  );
}
