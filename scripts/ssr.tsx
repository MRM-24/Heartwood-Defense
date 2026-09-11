// SSR smoke test: render every screen + a live combat board with all entity kinds.
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import Board from '../src/components/Board';
import Hud from '../src/components/Hud';
import { GuideModal, LevelSelect, LoadoutScreen, LoseOverlay, PauseOverlay, TitleScreen, WinOverlay, WorldSelect } from '../src/components/Screens';
import { createGame, placeFlora, spawnEnemy, stepGame } from '../src/game/engine';
import { LEVELS, defaultLoadoutFor } from '../src/game/data';
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
check('LoadoutScreen', () => renderToString(<LoadoutScreen level={LEVELS[6]} picked={defaultLoadoutFor(LEVELS[6])} setPicked={() => {}} onStart={() => {}} onBack={() => {}} />));
check('PauseOverlay', () => renderToString(<PauseOverlay onResume={() => {}} onRestart={() => {}} onQuit={() => {}} />));
check('WinOverlay', () => renderToString(<WinOverlay stars={3} isLast={false} onNext={() => {}} onReplay={() => {}} onMap={() => {}} />));
check('LoseOverlay', () => renderToString(<LoseOverlay lane={2} onRetry={() => {}} onMap={() => {}} />));

// live combat board with everything on screen
const level = LEVELS[9]; // colossus level
const s = createGame(level, defaultLoadoutFor(level));
s.nectar = 1500;
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
(['gnat', 'beetle', 'skitter', 'warden', 'drifter', 'brute', 'colossus'] as EnemyKey[]).forEach((k, i) => {
  const e = spawnEnemy(s, k, i % 5, 4 + (i % 4));
  if (k === 'colossus') e.hp = e.maxHp * 0.4; // phase visuals
  if (k === 'warden') e.shell = 50;
});
s.grid[1][2]!.hp = 30; // hp bar state
for (let i = 0; i < 40; i++) stepGame(s);
s.snares[0] = false;
s.snareFx[1] = 1.0;
s.waveAlertT = 2;
s.warnWave = 3;
s.shake = 0.3;
check('Board(full combat)', () => renderToString(<Board s={s} alpha={0.5} onCell={() => 'none'} />));
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
