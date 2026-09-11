// SSR smoke test: render every screen + a live combat board with all entity kinds.
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import Board from '../src/components/Board';
import Hud from '../src/components/Hud';
import { CodexEntry, ConfirmDialog, GuideModal, LevelSelect, LoadoutScreen, LoseOverlay, PauseOverlay, TitleScreen, WinOverlay, WorldSelect } from '../src/components/Screens';
import { createGame, placeFlora, spawnEnemy, stepGame } from '../src/game/engine';
import { ENEMY_ORDER, FLORA_ORDER, LEVELS, defaultLoadoutFor } from '../src/game/data';
import { codexEnemies, codexFlora, levelsCleared, totalStars, type SaveData } from '../src/game/save';
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

// ── menu + field guide surfaces ────────────────────────────────────────────
// A mid-campaign save: worlds 1–2 played, so most of the roster is still shadow.
const partSave: SaveData = { maxLevel: 8, stars: { 0: 3, 1: 2, 5: 1 }, muted: false, codex: { flora: [], enemies: [] } };
const partFlora = codexFlora(partSave);
const partEnemies = codexEnemies(partSave);
const fullSave: SaveData = { maxLevel: 24, stars: {}, muted: true, codex: { flora: [], enemies: [] } };
const emptySave: SaveData = { maxLevel: 0, stars: {}, muted: false, codex: { flora: [], enemies: [] } };

function assert(name: string, html: string, needles: string[]) {
  for (const n of needles) if (!html.includes(n)) throw new Error(`missing "${n}"`);
  return html;
}

check('App(title)', () => renderToString(<App />));
check('TitleScreen(new save)', () =>
  assert(
    'BEGIN',
    renderToString(
      <TitleScreen
        hasSave={false} resume="World 1-1 · First Bloom" stars={0} cleared={0}
        floraKnown={3} floraTotal={FLORA_ORDER.length} enemiesKnown={3} enemiesTotal={ENEMY_ORDER.length}
        muted={false} onContinue={() => {}} onNewGame={() => {}} onLevels={() => {}} onGuide={() => {}} onToggleMute={() => {}}
      />,
    ),
    ['BEGIN THE VIGIL', 'LEVEL SELECT', 'FIELD GUIDE', 'NEW GAME', 'No save found'],
  ),
);
check('TitleScreen(mid save)', () =>
  assert(
    'CONTINUE',
    renderToString(
      <TitleScreen
        hasSave resume="World 2-4 · The Hollow Choir" stars={totalStars(partSave)} cleared={levelsCleared(partSave)}
        floraKnown={partFlora.size} floraTotal={FLORA_ORDER.length} enemiesKnown={partEnemies.size} enemiesTotal={ENEMY_ORDER.length}
        muted onContinue={() => {}} onNewGame={() => {}} onLevels={() => {}} onGuide={() => {}} onToggleMute={() => {}}
      />,
    ),
    ['CONTINUE THE VIGIL', 'WORLD 2-4', 'MUTED', 'LEVEL SELECT', 'NEW GAME'],
  ),
);
check('ConfirmDialog(new game)', () =>
  assert('dlg', renderToString(<ConfirmDialog title="Start Over?" body="wipe" confirmLabel="START OVER" onConfirm={() => {}} onCancel={() => {}} />), [
    'Start Over?', 'KEEP MY PROGRESS', 'START OVER',
  ]),
);
check('GuideModal(fresh save — everything shadowed)', () => {
  const freshFlora = codexFlora(emptySave);
  const freshEnemies = codexEnemies(emptySave);
  return assert(
    'guide',
    renderToString(<GuideModal initialTab="flora" unlockedFlora={freshFlora} unlockedEnemies={freshEnemies} onClose={() => {}} />),
    [`Field Guide`, 'THE RULES', 'FLORA', 'BLIGHTSPAWN', `${freshFlora.size}/${FLORA_ORDER.length}`, `${freshEnemies.size}/${ENEMY_ORDER.length}`, 'Silhouettes', 'Thornvine', 'Undiscovered'],
  );
});
check('GuideModal(rules)', () => renderToString(<GuideModal initialTab="rules" unlockedFlora={partFlora} unlockedEnemies={partEnemies} onClose={() => {}} />));
check('GuideModal(flora tab — mixed known/unknown)', () =>
  assert(
    'flora tab',
    renderToString(<GuideModal initialTab="flora" unlockedFlora={partFlora} unlockedEnemies={partEnemies} onClose={() => {}} />),
    // known entries show their real names…
    ['Thornvine', 'Glowbulb', 'Bramblewall', 'Spitting Cactus', 'Frostcap Mushroom', 'Sunflower Sentinel',
      // …and the ones ahead of the player stay silhouetted and nameless
      'Undiscovered', 'brightness(0)'],
  ),
);
check('GuideModal(enemy tab — mixed known/unknown)', () =>
  assert(
    'enemy tab',
    renderToString(<GuideModal initialTab="enemies" unlockedFlora={partFlora} unlockedEnemies={partEnemies} onClose={() => {}} />),
    ['Creeper Gnat', 'Husk Beetle', 'Unknown species', 'brightness(0)'],
  ),
);
check('GuideModal(endgame — nothing hidden)', () => {
  const html = renderToString(<GuideModal initialTab="enemies" unlockedFlora={codexFlora(fullSave)} unlockedEnemies={codexEnemies(fullSave)} onClose={() => {}} />);
  if (html.includes('Unknown species')) throw new Error('a fully-played save still has shadowed entries');
  return assert('all revealed', html, ['The Hollow King', 'Wardshell Grub']);
});
check('CodexEntry(known flora)', () =>
  assert('known', renderToString(<CodexEntry kind={{ type: 'flora', key: 'thornvine' }} known onBack={() => {}} />), [
    'Thornvine', 'COST', 'nectar', 'SHOOTER', 'ATTACK', '18 dmg / 1.4s', '100 HP',
  ]),
);
check('CodexEntry(hidden flora)', () =>
  assert('hidden', renderToString(<CodexEntry kind={{ type: 'flora', key: 'prism' }} known={false} onBack={() => {}} />), [
    'UNIDENTIFIED', 'NOT YET ENCOUNTERED', '4-5', '? ? ?', 'brightness(0)',
  ]),
);
check('CodexEntry(known enemy)', () =>
  assert('known enemy', renderToString(<CodexEntry kind={{ type: 'enemy', key: 'grub' }} known onBack={() => {}} />), [
    'Stoneback Grub', 'SPLASH ONLY', 'SIGHTED IN', 'Counter:',
  ]),
);
check('CodexEntry(hidden enemy)', () =>
  assert('hidden enemy', renderToString(<CodexEntry kind={{ type: 'enemy', key: 'hollowking' }} known={false} onBack={() => {}} />), [
    'UNIDENTIFIED', 'World 4-5', 'brightness(0)',
  ]),
);
check('WorldSelect', () => renderToString(<WorldSelect maxLevel={3} stars={{ 0: 3, 1: 2 }} onPick={() => {}} onBack={() => {}} />));
check('LevelSelect w2', () => renderToString(<LevelSelect world={2} maxLevel={8} stars={{}} onPick={() => {}} onBack={() => {}} guideFlora={partFlora} guideEnemies={partEnemies} />));
check('WorldSelect(all 5)', () => renderToString(<WorldSelect maxLevel={24} stars={{ 15: 3, 19: 2, 24: 1 }} onPick={() => {}} onBack={() => {}} />));
check('LevelSelect w4', () => renderToString(<LevelSelect world={4} maxLevel={19} stars={{}} onPick={() => {}} onBack={() => {}} guideFlora={partFlora} guideEnemies={partEnemies} />));
check('LevelSelect w5', () => renderToString(<LevelSelect world={5} maxLevel={24} stars={{}} onPick={() => {}} onBack={() => {}} guideFlora={partFlora} guideEnemies={partEnemies} />));
check('LoadoutScreen w4 boss', () => renderToString(<LoadoutScreen level={LEVELS[19]} picked={defaultLoadoutFor(LEVELS[19])} setPicked={() => {}} onStart={() => {}} onBack={() => {}} />));
check('LoadoutScreen w5 boss', () => renderToString(<LoadoutScreen level={LEVELS[24]} picked={defaultLoadoutFor(LEVELS[24])} setPicked={() => {}} onStart={() => {}} onBack={() => {}} />));
check('LoadoutScreen', () => renderToString(<LoadoutScreen level={LEVELS[6]} picked={defaultLoadoutFor(LEVELS[6])} setPicked={() => {}} onStart={() => {}} onBack={() => {}} />));
check('PauseOverlay', () => renderToString(<PauseOverlay onResume={() => {}} onRestart={() => {}} onQuit={() => {}} />));
check('PauseOverlay(+guide)', () => assert('pause', renderToString(<PauseOverlay onGuide={() => {}} onResume={() => {}} onRestart={() => {}} onQuit={() => {}} />), ['FIELD GUIDE']));
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
  // ── Enemy Batch 3 visual states ──
  if (e.key === 'regrow') e.regrowT = 1.6; // the knit is close — seams lit
  if (e.key === 'nightstalker') {
    e.dashT = 1.2; // mid-sprint blur
    e.shieldUp = true; // plate up, glowing steel
  }
  if (e.key === 'wardshell') e.wardUp = true; // surprise dome standing
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
    ['RegrowthHusk', 'rh-body'],
    ['CinderGolem', 'cg-shell'],
    ['BulwarkRoach', 'br-shell'],
    ['BoulderToad', 'bt-hide'],
    ['IronNightstalker', 'ns-plate'],
    ['WardshellGrub', 'ws-body'],
    ['nightstalker plate aura', 'cdd6de'],
    ['wardshell dome', 'd8b4ff'],
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
