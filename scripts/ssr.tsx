// SSR smoke test: render every screen + a live combat board with all entity kinds.
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import Board from '../src/components/Board';
import Hud from '../src/components/Hud';
import { GuideModal, LevelSelect, LoadoutScreen, LoseOverlay, PauseOverlay, TitleScreen, WinOverlay, WorldSelect } from '../src/components/Screens';
import { createGame, placeFlora, spawnEnemy, stepGame } from '../src/game/engine';
import { ENEMY_ORDER, FLORA_ORDER, LEVELS, defaultLoadoutFor } from '../src/game/data';
import type { EnemyKey } from '../src/game/types';

let count = 0;
function check(name: string, fn: () => unknown) {
  try {
    const out = fn();
    const len = typeof out === 'string' ? out.length : 0;
    count++;
    console.log(`  ✓ ${name} (${len}b)`);
  } catch (e) {
    console.log(`  ✗ FAIL ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

check('App(title)', () => renderToString(<App />));
check('TitleScreen', () => renderToString(<TitleScreen hasSave onPlay={() => {}} onHow={() => {}} />));
check('GuideModal', () => renderToString(<GuideModal onClose={() => {}} />));
check('WorldSelect', () => renderToString(<WorldSelect maxLevel={3} stars={{ 0: 3, 1: 2 }} onPick={() => {}} onBack={() => {}} />));
check('LevelSelect w2', () => renderToString(<LevelSelect world={2} maxLevel={8} stars={{}} onPick={() => {}} onBack={() => {}} />));
check('WorldSelect(all 4)', () => renderToString(<WorldSelect maxLevel={19} stars={{ 15: 3, 19: 2 }} onPick={() => {}} onBack={() => {}} />));
check('LevelSelect w4', () => renderToString(<LevelSelect world={4} maxLevel={19} stars={{}} onPick={() => {}} onBack={() => {}} />));
check('LoadoutScreen w4 boss', () => renderToString(<LoadoutScreen level={LEVELS[19]} picked={defaultLoadoutFor(LEVELS[19])} setPicked={() => {}} onStart={() => {}} onBack={() => {}} />));
check('LoadoutScreen', () => renderToString(<LoadoutScreen level={LEVELS[6]} picked={defaultLoadoutFor(LEVELS[6])} setPicked={() => {}} onStart={() => {}} onBack={() => {}} />));
check('PauseOverlay', () => renderToString(<PauseOverlay onResume={() => {}} onRestart={() => {}} onQuit={() => {}} />));
check('WinOverlay', () => renderToString(<WinOverlay stars={3} isLast={false} onNext={() => {}} onReplay={() => {}} onMap={() => {}} />));
check('LoseOverlay', () => renderToString(<LoseOverlay lane={2} onRetry={() => {}} onMap={() => {}} />));

// live combat board with everything on screen
const level = LEVELS[9]; // colossus level
const s = createGame(level, FLORA_ORDER); // every Flora in the tray so all 20 can be drawn
s.nectar = 5000; // enough for all 20 Flora on one board
placeFlora(s, 'thornvine', 1, 2);
placeFlora(s, 'glowbulb', 0, 0);
placeFlora(s, 'bramble', 2, 5);
placeFlora(s, 'cactus', 3, 1);
placeFlora(s, 'frostcap', 4, 1);
placeFlora(s, 'sentinel', 2, 2);
// Flora Batch 1 — every new sprite on one board
placeFlora(s, 'cinderpod', 0, 3);
placeFlora(s, 'deeproot', 1, 4);
placeFlora(s, 'bulwark', 3, 5);
placeFlora(s, 'snaptrap', 4, 4);
placeFlora(s, 'watchvine', 0, 1);
placeFlora(s, 'bindweed', 1, 5);
placeFlora(s, 'lotus', 3, 0);
// Flora Batch 2 — every new sprite, in each of its visual states
placeFlora(s, 'ironbark', 2, 0);
placeFlora(s, 'emberlash', 1, 0);
placeFlora(s, 'needlereed', 3, 3);
placeFlora(s, 'gale', 4, 2);
placeFlora(s, 'sentinelbloom', 0, 5);
placeFlora(s, 'ambush', 2, 7);
placeFlora(s, 'prism', 4, 6);
// every Blightspawn in the game, on one board — Batch 1 and Batch 2 included.
// Spawned east of the targeting line so nothing gets shot before it is drawn.
ENEMY_ORDER.forEach((k, i) => {
  const e = spawnEnemy(s, k as EnemyKey, i % 5, 9.8 - (i % 3) * 0.1);
  if (k === 'colossus') e.hp = e.maxHp * 0.4; // phase visuals
  if (k === 'warden') e.shell = 50;
});
s.grid[1][2]!.hp = 30; // hp bar state
for (let i = 0; i < 40; i++) stepGame(s);
// ── Enemy Batch 2 visual states, applied after the steps so they survive ──
for (const e of s.enemies) {
  if (e.key === 'wisp' && !e.canSplit) {
    /* already a molted half */
  } else if (e.key === 'wisp') {
    e.canSplit = false; // draw the split-half variant
  }
  if (e.key === 'slug') {
    e.drPct = 0.6;
    e.drUntil = s.t + 3; // Grovemaw film
  }
  if (e.key === 'nightcap') {
    e.dashT = 1.2; // mid-sprint blur
  }
  if (e.key === 'hollowking') {
    e.phase = 2;
    e.immuneTo = 'splash'; // warded ring + boss-bar ward line
    e.immuneT = 3.4;
    e.enraged = false;
  }
}
// a second King in another lane to cover the enraged render path
{
  const rage = spawnEnemy(s, 'hollowking', 4, 9.4);
  rage.phase = 3;
  rage.enraged = true;
  rage.hp = rage.maxHp * 0.2;
}
// a withered Nectar plant (Fen Wretch aura)
s.grid[0][0]!.withered = true;
// Flora Batch 2 states: a live beam, a spent ambush, a riposte flash, a fire half
if (s.grid[1][0]) {
  const beamTarget = s.enemies.find((e) => e.lane === 1);
  s.grid[1][0].beamId = beamTarget ? beamTarget.id : null;
}
if (s.grid[2][7]) s.grid[2][7].ambushT = 4; // sprung and recharging
if (s.grid[0][5]) s.grid[0][5].fired = 0.3; // just counter-struck
if (s.grid[4][6]) s.grid[4][6].shotIdx = 1; // next shot is the fire half
s.snares[0] = false;
s.snareFx[1] = 1.0;
s.waveAlertT = 2;
s.warnWave = 3;
s.shake = 0.3;
check('Board(full combat)', () => renderToString(<Board s={s} alpha={0.5} onCell={() => 'none'} />));
// every Batch 2 sprite + state actually reached the output, not just "didn't throw"
{
  const html = renderToString(<Board s={s} alpha={0.5} onCell={() => {}} />);
  for (const [label, needle] of [
    ['MoltWisp', 'mw-core'],
    ['GrovemawSlug', 'gs-body'],
    ['BarkskinMarauder', 'bm-bark'],
    ['NightcapAssassin', 'na-cap'],
    ['FenWretch', 'fw-belly'],
    ['HollowKing', 'hk-body'],
    ['slug absorbed-film bar', '4fbf7a'],
    ['hollow king ward ring', '7fd4ff'],
    ['nightcap sprint lines', 'c9b8ee'],
    ['IronbarkTitan', 'ib-wood'],
    ['EmberlashVine', 'el-ember'],
    ['PrismBud', 'pb-crystal'],
    ['SentinelBloom petals', 'sb-petal'],
  ] as const) {
    check(`sprite: ${label}`, () => {
      if (!html.includes(needle)) throw new Error(`${needle} not in rendered board`);
      return html;
    });
  }
  // spawned fresh: the warm-up steps would let the Snaptrap on this board eat them
  spawnEnemy(s, 'chitter', 2, 9.6);
  const chitters = s.enemies.filter((e) => e.key === 'chitter').length;
  check('Chitterling pack spawned as 4', () => {
    if (chitters < 4) throw new Error(`expected 4 chitters, got ${chitters}`);
    return chitters;
  });
}
check('Hud(boss, cd, tray)', () =>
  renderToString(
    <Hud s={s} speed={2} muted={false} onSelect={() => {}} onShovel={() => {}} onSpeed={() => {}} onPause={() => {}} onMute={() => {}} />,
  ),
);
// selected + shovel-armed render paths
s.selected = 'cactus';
check('Board(selected)', () => renderToString(<Board s={s} alpha={0} onCell={() => 'none'} />));
s.selected = null;
s.shovelArmed = true;
check('Board(shovel)', () => renderToString(<Board s={s} alpha={0} onCell={() => 'none'} />));
// won/lost terminal boards
s.status = 'won';
check('Board(won)', () => renderToString(<Board s={s} alpha={0} onCell={() => 'none'} />));
s.status = 'lost';
s.lostLane = 4;
check('Board(lost)', () => renderToString(<Board s={s} alpha={0} onCell={() => 'none'} />));

console.log(`\n${count} renders OK, exit=${process.exitCode ?? 0}`);
