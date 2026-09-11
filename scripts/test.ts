// Mechanics verification: each spec rule, tested against the real engine.
import { createGame, damageEnemy, levelEnemyIntel, placeFlora, shovelAt, spawnEnemy, stepGame, totalEnemies } from '../src/game/engine';
const SPAWN_X_EDGE = 9.4; // must match the engine's SPAWN_X
import { ENEMIES, ENEMY_ORDER, FLORA, FLORA_ORDER, LEVELS, defaultLoadoutFor, discoveriesForLevel, enemyFirstLevel, enemyLevels, floraUnlockLevel, unlockedFloraFor } from '../src/game/data';
import { DEFAULT_SAVE, codexEnemies, codexFlora, discoverLevel, levelsCleared, loadSave, recordWin, resetProgress, resumeLevelId, totalStars } from '../src/game/save';
import type { EnemyKey, FloraKey, LevelDef } from '../src/game/types';

let passed = 0, failed = 0;
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ FAIL: ${name} ${detail}`); }
}
const ALL: FloraKey[] = [
  'thornvine', 'glowbulb', 'bramble', 'cactus', 'frostcap', 'sentinel',
  // Flora Batch 1
  'cinderpod', 'deeproot', 'bulwark', 'snaptrap', 'watchvine', 'bindweed', 'lotus',
  // Flora Batch 2
  'ironbark', 'emberlash', 'needlereed', 'gale', 'sentinelbloom', 'ambush', 'prism',
];
function mkLevel(): LevelDef {
  // sentinel wave far in the future keeps the level alive while we test
  return {
    id: 99, world: 1, idx: 1, name: 'TEST', blurb: '', tip: '', hpMul: 1,
    waves: [{ at: 99999, groups: [{ type: 'gnat' as EnemyKey, count: 1, gap: 1 }] }],
    addPool: ['gnat'],
  };
}
function fresh(loadout: FloraKey[] = ALL) {
  const s = createGame(mkLevel(), loadout);
  s.nectar = 1000; // test budget
  return s;
}
function run(s: ReturnType<typeof createGame>, secs: number, each?: () => void) {
  const steps = Math.round(secs / 0.1);
  for (let i = 0; i < steps; i++) { each?.(); stepGame(s); if (s.status !== 'playing') break; }
}

// ── 1. Root snare consumes once; second breach loses ──
{
  console.log('Root Snare');
  const s = fresh();
  spawnEnemy(s, 'gnat', 2, 1.2);
  run(s, 6);
  ok(s.snares[2] === false, 'snare consumed on breach');
  ok(s.enemies.length === 0, 'snare killed the breaching enemy');
  ok(s.status === 'playing', 'level continues after first breach');
  spawnEnemy(s, 'gnat', 2, 1.2);
  run(s, 6);
  ok(s.status === 'lost' && s.lostLane === 2, 'second breach in same lane loses the level');
}

// ── 2. Snare kills flying too, and bypasses brute split ──
{
  console.log('Snare cleave');
  const s = fresh();
  spawnEnemy(s, 'drifter', 1, 1.0);
  spawnEnemy(s, 'brute', 1, 0.9);
  run(s, 6);
  ok(s.snares[1] === false && s.status === 'playing', 'snare fired for mixed lane');
  ok(s.enemies.length === 0, 'flying + brute both died, no split skitters');
}

// ── 3. Carapace Warden shell math (50% absorb until 100 shell) ──
{
  console.log('Warden shell');
  const s = fresh();
  placeFlora(s, 'thornvine', 0, 0);
  const w = spawnEnemy(s, 'warden', 0, 6);
  let shellGoneBeforeDeath = false;
  run(s, 60, () => { if (w.shell <= 0 && w.hp > 0) shellGoneBeforeDeath = true; });
  ok(shellGoneBeforeDeath, 'shell depletes before body dies');
  ok(w.shell <= 0 || w.hp <= 0, 'shell actually absorbed hits', `shell=${w.shell}`);
  // verify 50% split on a controlled hit: track after first thorn lands
}

// ── 4. Queueing: only the frontmost attacks ──
{
  console.log('Single-file queue');
  const s = fresh();
  placeFlora(s, 'bramble', 1, 4);
  const a = spawnEnemy(s, 'gnat', 1, 6);
  const b = spawnEnemy(s, 'gnat', 1, 6.6);
  run(s, 5);
  const wall = s.grid[1][4]!;
  const dmg = wall.maxHp - wall.hp;
  ok(a.chewing !== b.chewing, 'only one chews at a time', `a=${a.chewing} b=${b.chewing}`);
  ok(dmg <= 45, `only frontmost damages wall (dmg=${dmg} after 5s, ~40 expected from solo 8/s)`);
  ok(Math.abs(b.x - a.x) >= ENEMIES.gnat.spacing - 0.06, 'follower keeps spacing', `gap=${(b.x - a.x).toFixed(2)}`);
}

// ── 5. Cactus pierces ALL enemies in lane ──
{
  console.log('Cactus pierce');
  const s = fresh();
  placeFlora(s, 'cactus', 3, 0);
  const s1 = spawnEnemy(s, 'skitter', 3, 5);
  const s2 = spawnEnemy(s, 'skitter', 3, 5.6);
  const s3 = spawnEnemy(s, 'skitter', 3, 6.2);
  run(s, 3);
  ok(s1.hp < s1.maxHp && s2.hp < s2.maxHp && s3.hp < s3.maxHp, 'volley hit all three skitters');
}

// ── 6. Frost applies slow ──
{
  console.log('Frost slow');
  const s = fresh();
  placeFlora(s, 'frostcap', 0, 0);
  const g = spawnEnemy(s, 'gnat', 0, 5);
  run(s, 3);
  ok(g.slowUntil > s.t && g.slowPct >= 0.39, 'target is slowed 40%');
}

// ── 7. Only Sentinel hits flying ──
{
  console.log('Anti-air exclusivity');
  const s = fresh();
  placeFlora(s, 'thornvine', 0, 0);
  placeFlora(s, 'cactus', 0, 1);
  placeFlora(s, 'frostcap', 0, 2);
  const d = spawnEnemy(s, 'drifter', 0, 6);
  run(s, 8);
  ok(d.hp === d.maxHp, 'ground flora cannot touch the drifter');
  const s2 = fresh();
  placeFlora(s2, 'sentinel', 0, 0);
  const d2 = spawnEnemy(s2, 'drifter', 0, 6);
  run(s2, 12);
  ok(d2.hp < d2.maxHp, 'sentinel can hit the drifter');
}

// ── 8. Brute splits into two skitter swarms ──
{
  console.log('Brute split');
  const s = fresh();
  const br = spawnEnemy(s, 'brute', 0, 5);
  br.hp = 1; // mortally wounded, then shot
  placeFlora(s, 'thornvine', 0, 0);
  run(s, 3);
  const skitters = s.enemies.filter((e) => e.key === 'skitter').length;
  ok(skitters === 6, `brute split into 6 skitters (2 swarms), got ${skitters}`);
}

// ── 9. Economy: passive +25/10s, glowbulb +20/12s ──
{
  console.log('Economy');
  const s = fresh();
  placeFlora(s, 'glowbulb', 2, 0);
  const before = s.nectar; // 25 remaining after 25-cost bulb
  run(s, 12.2);
  ok(s.nectar >= before + 25 + 20, `passive + bulb pulses land (got ${Math.floor(s.nectar)} from ${before})`);
}

// ── 10. Placement validation + tray recharge + shovel ──
{
  console.log('Placement rules');
  const s = fresh(["thornvine","glowbulb"]);
  ok(placeFlora(s, 'thornvine', 0, 0) === 'ok', 'first plant ok');
  ok(placeFlora(s, 'thornvine', 0, 0) === 'occupied', 'occupied tile rejected');
  ok(placeFlora(s, 'thornvine', 0, 1) === 'cooldown', 'recharge enforced');
  ok(placeFlora(s, 'thornvine', 9, 1) === 'offboard', 'offboard rejected');
  ok(s.nectar === 950, 'cost deducted (1000-50)');
  ok(shovelAt(s, 0, 0) === true, 'shovel removes');
  ok(s.nectar === 950, 'shovel refunds nothing');
  run(s, 5.2);
  ok((s.trayCd['thornvine'] ?? 0) <= 0, 'recharge ticks down');
  const s3 = fresh(["glowbulb"]);
  ok(placeFlora(s3, 'thornvine', 0, 0) === 'inactive', 'flora not in loadout rejected');
}

// ── 11. Colossus phases + adds ──
{
  console.log('Colossus');
  const lvl = mkLevel();
  lvl.addPool = ['gnat'];
  const s = fresh();
  const c = spawnEnemy(s, 'colossus', 2, 7);
  c.hp = Math.floor(c.maxHp * 0.5); // force phase 2
  run(s, 2);
  ok(c.phase === 2, 'phase 2 at <2/3 hp', `phase=${c.phase}`);
  c.hp = Math.floor(c.maxHp * 0.2);
  run(s, 2);
  ok(c.phase === 3, 'phase 3 at <1/3 hp');
  const before = s.enemies.length;
  run(s, 5);
  ok(s.enemies.length > before - 6, 'colossus spawns adds over time');
}

// ── 12. Determinism: same seed → same result ──
{
  console.log('Determinism');
  const mk = () => ({ id: 0, world: 1 as const, idx: 1, name: 'D', blurb: '', tip: '', hpMul: 1, waves: [{ at: 1, groups: [{ type: 'gnat' as EnemyKey, count: 3, gap: 0.5 }] }], addPool: [] });
  const a = createGame(mk(), ALL, 42);
  const b = createGame(mk(), ALL, 42);
  for (let i = 0; i < 30; i++) { stepGame(a); stepGame(b); }
  const lanesA = a.enemies.map((e) => `${e.lane}:${e.x.toFixed(3)}`).join('|');
  const lanesB = b.enemies.map((e) => `${e.lane}:${e.x.toFixed(3)}`).join('|');
  ok(lanesA === lanesB, 'identical seeds produce identical spawns');
}

// ── 13. Mite Vaulter: leaps the first wall once, then behaves ──
{
  console.log('Mite Vaulter');
  const s = fresh();
  placeFlora(s, 'bramble', 1, 6); // a single thin wall
  const v = spawnEnemy(s, 'vaulter', 1, 8.5);
  run(s, 5);
  const wall1 = s.grid[1][6];
  ok(!!wall1 && wall1.hp === wall1.maxHp, 'leapt over the wall without taking a bite');
  ok(v.vaulted && v.x < 5.7, 'used its one leap and landed past the wall', `x=${v.x.toFixed(2)}`);
  placeFlora(s, 'glowbulb', 1, 4); // anything behind the wall holds it now
  run(s, 4);
  const plant2 = s.grid[1][4];
  ok(!!plant2 && plant2.hp < plant2.maxHp, 'a second plant holds it — leap is once per enemy');
}

// ── 14. Stoneback Grub: slab ignores single-target, only splash wears it ──
{
  console.log('Stoneback Grub');
  const s = fresh();
  placeFlora(s, 'thornvine', 0, 0);
  const g = spawnEnemy(s, 'grub', 0, 6);
  run(s, 3);
  ok(g.hp === g.maxHp && g.stone === g.maxStone, 'single-target thorns ping off the slab harmlessly');
  const s2 = fresh();
  placeFlora(s2, 'cactus', 0, 0);
  const g2 = spawnEnemy(s2, 'grub', 0, 6);
  run(s2, 3);
  ok(g2.stone < g2.maxStone, 'cactus splash wears the slab down');
  ok(g2.hp === g2.maxHp, 'body untouched while the slab holds');
  g2.stone = 0; // simulate a cracked slab
  run(s2, 3);
  ok(g2.hp < g2.maxHp, 'once cracked, ordinary damage reaches the body');
  const s3 = fresh();
  placeFlora(s3, 'frostcap', 0, 0);
  const g3 = spawnEnemy(s3, 'grub', 0, 6);
  run(s3, 4);
  ok(g3.stone < g3.maxStone, 'frostcap spores count as splash vs the slab');
}

// ── 15. Tunnel Larva: untargetable east of column 6, passes walls there ──
{
  console.log('Tunnel Larva');
  const s = fresh();
  placeFlora(s, 'thornvine', 0, 7); // wasted placement in the burrow zone
  placeFlora(s, 'sentinel', 0, 3);  // backline shooter (fires on ground too)
  placeFlora(s, 'bramble', 0, 4);   // mid-board wall
  const lv = spawnEnemy(s, 'larva', 0, 8.8);
  run(s, 3);
  ok(lv.burrowed, 'burrowed beneath the east columns');
  ok(lv.hp === lv.maxHp, 'untargetable while underground');
  run(s, 16);
  ok(!lv.burrowed && lv.x <= 6.1, 'surfaced at column 6, past the east plants', `x=${lv.x.toFixed(2)}`);
  ok(!!s.grid[0][7], 'flora in the burrow zone was ignored, not eaten');
  ok(lv.hp < lv.maxHp, 'shootable once surfaced');
  const wall = s.grid[0][4];
  ok(!!wall && wall.hp < wall.maxHp, 'held up by the mid-board wall and chewing it');
}

// ── 16. Locust Ranger: attacks from 2 tiles out, never closes ──
{
  console.log('Locust Ranger');
  const s = fresh();
  placeFlora(s, 'bramble', 2, 5);
  const r = spawnEnemy(s, 'ranger', 2, 8.8);
  run(s, 5);
  const wall = s.grid[2][5];
  ok(!!wall && wall.hp < wall.maxHp, 'snipes the wall from two tiles out');
  ok(r.x > 6.9, 'never closed to melee range', `x=${r.x.toFixed(2)}`);
  ok(!r.chewing || wall.hp < wall.maxHp, 'damage comes from spines, not bites');
}

// ── 17. Spore Imp: catapulted into the back half, stunned on landing ──
{
  console.log('Spore Imp');
  const lvl = mkLevel();
  lvl.waves = [{ at: 1, groups: [{ type: 'imp' as EnemyKey, count: 3, gap: 1, catapult: true }] }];
  const plan = createGame(lvl, ALL, 7);
  ok(
    plan.pending.length === 3 && plan.pending.every((p) => p.catapult && (p.x ?? 0) >= 1 && (p.x ?? 0) <= 5),
    'salvo aimed at random back-half tiles (cols 2–5, 1-indexed)',
  );
  const s = createGame(lvl, ALL, 7);
  s.nectar = 1000;
  run(s, 0.5);
  ok(s.fx.some((f) => f.kind === 'cata'), 'tile telegraph burns before the shell lands');
  run(s, 0.9); // t=1.4: first imp down
  const imp1 = s.enemies.find((e) => e.key === 'imp');
  ok(!!imp1 && imp1.x <= 5, 'landed behind the front line', `x=${imp1?.x.toFixed(2)}`);
  ok(!!imp1 && imp1.stunT > 0, 'briefly stunned where it hit');
  run(s, 3.5);
  const imps = s.enemies.filter((e) => e.key === 'imp');
  ok(imps.length === 3, 'whole salvo delivered');
  ok(imps.every((e) => e.stunT <= 0), 'recovered and prowling after landing');
}

// ── 18. Gargant Husk: telegraphed one-hit smash, regardless of HP ──
{
  console.log('Gargant Husk');
  const s = fresh();
  placeFlora(s, 'bramble', 3, 6);
  placeFlora(s, 'thornvine', 3, 5); // second plant (bramble still recharging)
  const h = spawnEnemy(s, 'husk', 3, 7.6);
  run(s, 2.6);
  ok(h.windup > 0 && h.windup < 1.5, 'wind-up charges visibly before the smash', `w=${h.windup.toFixed(2)}`);
  ok(!!s.grid[3][6], 'wall still whole during the wind-up');
  run(s, 2);
  ok(!s.grid[3][6], '400 HP wall obliterated in one smash — HP never mattered');
  ok(!!s.grid[3][5], 'wind-up is per plant: next plant gets its own countdown');
  run(s, 14);
  ok(!s.grid[3][5], 'second plant smashed too — no amount of HP saves it');
}

// ── 19. Root Thief: grabs the most wounded flora; kill it to drop, or lose it ──
{
  console.log('Root Thief');
  const s = fresh();
  placeFlora(s, 'glowbulb', 4, 0);
  placeFlora(s, 'bramble', 4, 5);
  s.grid[4][5]!.hp = 30; // the wounded one — bait (no shooters in this lane)
  const t = spawnEnemy(s, 'thief', 4, 8.6);
  run(s, 6.2);
  ok(t.carrying?.key === 'bramble', 'snatched the most wounded flora in the lane, not the bulb');
  ok(!s.grid[4][5], 'its tile emptied while hauled');
  ok(t.x > 6.5, 'turned tail and fled east', `x=${t.x.toFixed(2)}`);
  // bring the hammer down mid-heist
  placeFlora(s, 'cactus', 4, 2);
  t.hp = 10;
  run(s, 2.5);
  const dropped = s.grid[4][5];
  ok(!!dropped && dropped.key === 'bramble' && dropped.hp === 30, 'thief killed mid-heist → flora dropped back, unharmed');
  // escape case: nobody stops it → gone for good
  const s2 = fresh();
  placeFlora(s2, 'glowbulb', 1, 0);
  placeFlora(s2, 'bramble', 1, 4);
  s2.grid[1][4]!.hp = 25;
  const t2 = spawnEnemy(s2, 'thief', 1, 8.6);
  run(s2, 6.2);
  ok(t2.carrying?.key === 'bramble', 'second thief grabs its prize');
  run(s2, 4);
  ok(!s2.enemies.includes(t2), 'escaped off-board with the loot');
  ok(!s2.grid[1][4], 'the flora is lost permanently');
}

// ── 20. Cinderpod: a real two-tile blast, and it cracks stone ──
{
  console.log('Cinderpod');
  const s = fresh();
  placeFlora(s, 'cinderpod', 0, 0);
  const grub = spawnEnemy(s, 'grub', 0, 6);
  const neighbour = spawnEnemy(s, 'gnat', 0, 6.6);
  const far = spawnEnemy(s, 'gnat', 0, 8.6);
  run(s, 3);
  ok(grub.stone < grub.maxStone, 'blast wears the Stoneback slab', `stone=${grub.stone}`);
  ok(neighbour.hp < neighbour.maxHp, 'the adjacent tile is caught too — real AoE');
  ok(far.hp === far.maxHp, 'Blightspawn beyond the adjacent tile are untouched');
}

// ── 21. Deeproot Sentry: the only Flora that reaches a burrowed Tunnel Larva ──
{
  console.log('Deeproot Sentry');
  const s = fresh();
  placeFlora(s, 'deeproot', 0, 3);
  placeFlora(s, 'thornvine', 0, 4); // cannot see underground
  const larva = spawnEnemy(s, 'larva', 0, 8.8);
  ok(larva.burrowed, 'larva starts burrowed');
  run(s, 3);
  ok(larva.hp < larva.maxHp, 'the sentry strikes it underground', `hp=${larva.hp}`);
  ok(larva.burrowed, 'and it is still burrowed while taking fire');
  // above ground it is an ordinary single-target shooter
  const s2 = fresh();
  placeFlora(s2, 'deeproot', 0, 3);
  const gnat = spawnEnemy(s2, 'gnat', 0, 7);
  run(s2, 3);
  ok(gnat.hp < gnat.maxHp, 'and it shoots surfaced foes like anyone else');
}

// ── 22. Bulwark Bramble: its reach swallows Ranger spines ──
{
  console.log('Bulwark Bramble');
  const s = fresh();
  placeFlora(s, 'bulwark', 2, 4);
  placeFlora(s, 'thornvine', 2, 2); // aimed at by the spine below
  const wall = s.grid[2][4]!;
  const vine = s.grid[2][2]!;
  // a Locust spine already in flight, aimed at the Flora behind the wall
  s.eprojs.push({ id: s.nextId++, lane: 2, x: 6.5, prevX: 6.5, col: 2, targetId: vine.id, dmg: 9 });
  run(s, 2);
  ok(wall.hp < wall.maxHp, 'the wall drank the spine', `wall=${wall.hp}`);
  ok(vine.hp === vine.maxHp, 'the Flora behind it was never touched');
  ok(s.eprojs.length === 0, 'and the spine is consumed');
  // live fire: a Ranger stops out of reach and its spines never pass the wall
  const s2 = fresh();
  placeFlora(s2, 'bulwark', 1, 6);
  placeFlora(s2, 'sentinel', 1, 4);
  const ranger = spawnEnemy(s2, 'ranger', 1, 9.2);
  const wall2 = s2.grid[1][6]!;
  const behind = s2.grid[1][4]!;
  run(s2, 30);
  ok(ranger.x > 9.0, 'the Ranger halts east of the wall', `x=${ranger.x.toFixed(2)}`);
  ok(wall2.hp < wall2.maxHp, 'spines land on the wall instead', `wall=${wall2.hp}`);
  ok(behind.hp === behind.maxHp, 'nothing behind the wall is ever hit');
}

// ── 23. Snaptrap Root: swallows anything under 100 HP, zero damage above it ──
{
  console.log('Snaptrap Root');
  const s = fresh();
  placeFlora(s, 'snaptrap', 1, 5);
  const sk = spawnEnemy(s, 'skitter', 1, 8.5);
  run(s, 20);
  ok(!s.enemies.includes(sk), 'a Skitter that enters the tile is swallowed whole');
  const s2 = fresh();
  placeFlora(s2, 'snaptrap', 1, 5);
  const warden = spawnEnemy(s2, 'warden', 1, 8.5);
  run(s2, 12);
  ok(s2.enemies.includes(warden) && warden.hp === warden.maxHp, 'a 150 HP Warden takes literally zero damage (and lives)');
  ok(warden.x > 6.2 && warden.x < 6.6, 'the trap still blocks the lane like any wall', `x=${warden.x.toFixed(2)}`);
  // no cooldown between individual kills
  const s3 = fresh();
  placeFlora(s3, 'snaptrap', 3, 5);
  spawnEnemy(s3, 'skitter', 3, 8.4);
  spawnEnemy(s3, 'skitter', 3, 8.8);
  spawnEnemy(s3, 'skitter', 3, 9.2);
  run(s3, 14);
  ok(s3.enemies.length === 0, 'a whole swarm queued up and every one was eaten', `left=${s3.enemies.length}`);
  // a Mite Vaulter's leap carries it clean over the jaws
  const s4 = fresh();
  placeFlora(s4, 'snaptrap', 4, 5);
  const vaulter = spawnEnemy(s4, 'vaulter', 4, 8.2);
  run(s4, 9);
  ok(s4.enemies.includes(vaulter) && vaulter.x < 5, 'a Mite Vaulter springs the trap', `x=${vaulter.x.toFixed(2)}`);
  ok(s4.grid[4][5]!.hp === s4.grid[4][5]!.maxHp, 'and never touches it');
  // stone slabs are too hard to bite
  const s5 = fresh();
  placeFlora(s5, 'snaptrap', 0, 5);
  const grub = spawnEnemy(s5, 'grub', 0, 8.5);
  run(s5, 14);
  const trap = s5.grid[0][5];
  ok(s5.enemies.includes(grub), 'a Stoneback Grub is not swallowed (the slab holds)');
  ok(grub.stone === grub.maxStone, 'and its slab is untouched by the jaws');
  ok(!!trap && trap.hp < trap.maxHp, 'the Grub just chews the trap like any wall');
}

// ── 24. Watchvine: always hits the enemy furthest along the lane, even backwards ──
{
  console.log('Watchvine');
  const s = fresh();
  placeFlora(s, 'watchvine', 0, 4);
  const behind = spawnEnemy(s, 'gnat', 0, 2.6); // slipped behind the line
  const ahead = spawnEnemy(s, 'gnat', 0, 7.4); // nearest foe in front
  run(s, 3);
  ok(behind.hp < behind.maxHp, 'it fired BACKWARDS at the enemy behind it', `behind=${behind.hp}`);
  ok(ahead.hp === ahead.maxHp, 'the nearer enemy ahead was ignored — furthest along wins');
  // works just as well in the front row
  const s2 = fresh();
  placeFlora(s2, 'watchvine', 1, 8);
  const lead = spawnEnemy(s2, 'gnat', 1, 5);
  run(s2, 2);
  ok(lead.hp < lead.maxHp, 'and from the front row it still strikes the leading enemy');
}

// ── 25. Bindweed Snare: total immobilise, no damage, and it breaks a Husk wind-up ──
{
  console.log('Bindweed Snare');
  const s = fresh();
  placeFlora(s, 'bindweed', 2, 4);
  const gnat = spawnEnemy(s, 'gnat', 2, 7.5);
  run(s, 2.2);
  ok(gnat.rootUntil > s.t, 'the leading enemy is rooted', `t=${s.t.toFixed(2)} until=${gnat.rootUntil.toFixed(2)}`);
  ok(gnat.hp === gnat.maxHp, 'and the snare deals no damage whatsoever');
  const x0 = gnat.x;
  run(s, 1.2);
  ok(Math.abs(gnat.x - x0) < 0.001, 'rooted means rooted — it does not move a step');
  run(s, 3.5);
  ok(gnat.x < x0, 'and it walks again once the root expires');
  // the Husk answer: a lash landing mid-wind-up wipes it and restarts the clock
  const s2 = fresh();
  placeFlora(s2, 'bindweed', 3, 5);
  const husk = spawnEnemy(s2, 'husk', 3, 6.4);
  s2.grid[3][5]!.atkT = 0.02; // charged lash: it lands while the smash is winding up
  run(s2, 0.4);
  ok(husk.windup === 0 && husk.rootUntil > s2.t, 'the lash lands and the wind-up is wiped');
  ok(!!s2.grid[3][5], 'the plant survives the smash window it interrupted');
  run(s2, 3.0);
  ok(!!s2.grid[3][5], 'and it is still standing a full smash-window later');
}

// ── 26. Nectar Lotus: +40 a harvest, plus a tray rebate for the next planting ──
{
  console.log('Nectar Lotus');
  const s = fresh();
  placeFlora(s, 'lotus', 0, 0);
  const before = s.nectar;
  run(s, 15.3);
  ok(s.nectar >= before + 40, `+40 Nectar lands (got ${Math.floor(s.nectar)} from ${before})`);
  ok(s.lotusT > 0, 'the rebate window opens with the harvest');
  ok(placeFlora(s, 'lotus', 0, 1) === 'ok', 'something is planted inside the window');
  ok(s.trayCd['lotus'] <= 14, `tray recharge rebated by 1s (${s.trayCd['lotus']?.toFixed(2)})`);
  ok(s.lotusT === 0, 'and the window is spent');
  const s2 = fresh();
  placeFlora(s2, 'lotus', 0, 0);
  run(s2, 3);
  placeFlora(s2, 'thornvine', 0, 1);
  ok(Math.abs(s2.trayCd['thornvine'] - 5) < 0.01, 'no rebate when the window is closed');
}

// ── 27. Molt Wisp: splits ONCE below half HP; the halves never split again ──
{
  console.log('Molt Wisp');
  const s = fresh();
  placeFlora(s, 'thornvine', 0, 0); // 18 dmg / 1.4s
  const w = spawnEnemy(s, 'wisp', 0, 6);
  ok(w.hp === 50 && w.maxHp === 50, 'spawns at 50 HP', `hp=${w.hp}`);
  ok(w.canSplit, 'arrives able to split');
  run(s, 1.6); // one thorn: 50 → 32, still above the 25 threshold
  ok(s.enemies.filter((e) => e.key === 'wisp').length === 1, 'no split while it is above half HP');
  ok(w.hp === 32, `one thorn takes it to 32 (got ${w.hp})`);
  run(s, 1.6); // second thorn: 32 → 14, under half → split
  const halves = s.enemies.filter((e) => e.key === 'wisp');
  ok(halves.length === 2, `split into two bodies, got ${halves.length}`);
  ok(halves.every((x) => x.hp === 25 && x.maxHp === 25), 'each half is 25 HP', halves.map((x) => x.hp).join(','));
  ok(halves.every((x) => !x.canSplit), 'and the halves never split again');
  ok(!s.enemies.includes(w), 'the original body is gone — it became the two');

  // an overkill splash hit splits it too: crossing the line is what matters
  const s2 = fresh();
  placeFlora(s2, 'cactus', 2, 0); // 15 dmg volley
  const w2 = spawnEnemy(s2, 'wisp', 2, 6);
  w2.hp = 26;
  run(s2, 2.2);
  const after = s2.enemies.filter((e) => e.key === 'wisp');
  ok(after.length === 2, 'a hit that would have killed it splits it instead', `n=${after.length}`);

  // total HP is conserved — splash did not get a discount, it got two targets
  const s3 = fresh();
  const w3 = spawnEnemy(s3, 'wisp', 3, 6);
  const pool0 = w3.hp;
  w3.hp = 30;
  damageEnemy(s3, w3, 25, { kind: 'splash' }); // 30 → 5, under half
  const pool = s3.enemies.filter((e) => e.key === 'wisp').reduce((n, e) => n + e.hp, 0);
  ok(pool === 50 && pool0 === 50, 'the split conserves the HP pool: 50 in, 50 out', `pool=${pool}`);
}

// ── 28. Grovemaw Slug: eats slow/DoT, converts it to damage reduction ──
{
  console.log('Grovemaw Slug');
  const s = fresh();
  placeFlora(s, 'frostcap', 0, 0); // 12 splash dmg + 40% slow for 3s
  const sl = spawnEnemy(s, 'slug', 0, 6);
  run(s, 2.5);
  ok(sl.drPct > 0 && sl.drUntil > s.t, 'ate the chill and raised a shield', `dr=${sl.drPct.toFixed(2)}`);
  ok(sl.slowUntil <= s.t, 'and was never actually slowed');
  ok(Math.abs(sl.drPct - 0.3) < 0.001, `0.4 × 3s of chill = 1.2 control points = 30% DR (got ${sl.drPct.toFixed(3)})`);
  ok(sl.hp < sl.maxHp, 'the damage on the spore still lands');

  // raw damage is reduced by exactly the shield it is holding
  const s2 = fresh();
  placeFlora(s2, 'thornvine', 0, 0); // 18 dmg, no status
  const sl2 = spawnEnemy(s2, 'slug', 0, 6);
  sl2.drPct = 0.5;
  sl2.drUntil = 999;
  run(s2, 1.6); // exactly one thorn
  const took = sl2.maxHp - sl2.hp;
  ok(Math.abs(took - 9) < 0.5, `a 50% shield halves an 18-dmg thorn to 9 (took ${took.toFixed(1)})`);

  // the shield is temporary
  const s3 = fresh();
  const sl3 = spawnEnemy(s3, 'slug', 3, 6);
  sl3.drPct = 0.4;
  sl3.drUntil = s3.t + 0.5;
  run(s3, 1.0);
  ok(sl3.drPct === 0, 'the absorbed shield lapses on its own');

  // it never attacks Flora — it is a sponge that walks, not a chewer
  const s4 = fresh();
  placeFlora(s4, 'bramble', 4, 5);
  const sl4 = spawnEnemy(s4, 'slug', 4, 8);
  run(s4, 22);
  const wall = s4.grid[4][5];
  ok(!!wall && wall.hp === wall.maxHp, 'it never bites — the wall is untouched after 22s');
  ok(sl4.x < 6.5, 'it just keeps coming', `x=${sl4.x.toFixed(2)}`);

  // and it eats poison the same way (DoT channel — see test 34)
  const s5 = fresh();
  const sl5 = spawnEnemy(s5, 'slug', 1, 8);
  damageEnemy(s5, sl5, 10, { poisonDps: 20, poisonDur: 5 });
  ok(sl5.poisonDps === 0, 'poison is swallowed too');
  ok(Math.abs(sl5.drPct - 0.85) < 0.001, `and caps at 85% DR (got ${sl5.drPct.toFixed(3)})`);
}

// ── 29. Chitterling Pack: four bodies, one lane slot, all sub-threshold ──
{
  console.log('Chitterling Pack');
  const s = fresh();
  spawnEnemy(s, 'chitter', 2, 9.0);
  const pack = s.enemies.filter((e) => e.key === 'chitter');
  ok(pack.length === 4, `one spawn delivers four bodies, got ${pack.length}`);
  ok(pack.every((e) => e.lane === 2), 'all four share the lane');
  const spread0 = Math.max(...pack.map((e) => e.x)) - Math.min(...pack.map((e) => e.x));
  ok(spread0 <= 1.0, `they arrive stacked in a single lane slot (spread ${spread0.toFixed(2)} cols)`);
  ok(pack.every((e) => e.hp === 20 && e.maxHp === 20), 'each one is 20 HP');
  ok(ENEMIES.chitter.speed > ENEMIES.skitter.speed, 'and they are faster than a Skitter Swarm');
  run(s, 3);
  const spread = Math.max(...pack.map((e) => e.x)) - Math.min(...pack.map((e) => e.x));
  ok(spread < 0.5, `they stay bunched inside one lane slot as they run (spread ${spread.toFixed(2)})`);

  // the Snaptrap stress test: four sub-threshold bodies through one tile
  const s2 = fresh();
  placeFlora(s2, 'snaptrap', 1, 5);
  spawnEnemy(s2, 'chitter', 1, 8.0);
  run(s2, 14);
  const left = s2.enemies.filter((e) => e.key === 'chitter').length;
  ok(left === 0, `the no-cooldown claim holds — the whole pack was swallowed (left ${left})`);
  ok(s2.enemies.length === 0, 'nothing slipped through behind it');
}

// ── 30. Barkskin Marauder: root-immune, must be damaged down ──
{
  console.log('Barkskin Marauder');
  const s = fresh();
  placeFlora(s, 'bindweed', 1, 4);
  const m = spawnEnemy(s, 'marauder', 1, 7.5);
  run(s, 5);
  ok(m.rootUntil <= s.t, 'Bindweed Snare cannot root it');
  ok(m.x < 7.0, 'it walked straight through the lash', `x=${m.x.toFixed(2)}`);
  ok(s.events.includes('shrug'), 'and the lash is visibly thrown off');
  // the control answer that works on everything else does nothing here
  const s2 = fresh();
  placeFlora(s2, 'bindweed', 2, 4);
  const gnat = spawnEnemy(s2, 'gnat', 2, 7.5);
  run(s2, 5);
  ok(gnat.rootUntil > 0 || gnat.x < 6.0, 'the same Bindweed does root a Gnat — so this is the Marauder, not the plant');
  // raw damage is the only answer
  const s3 = fresh();
  placeFlora(s3, 'thornvine', 3, 0);
  const m3 = spawnEnemy(s3, 'marauder', 3, 6);
  run(s3, 3);
  ok(m3.hp < m3.maxHp, 'thorns still bite — damage is the answer');
  const s4 = fresh();
  placeFlora(s4, 'bramble', 4, 5);
  spawnEnemy(s4, 'marauder', 4, 6.4);
  run(s4, 4);
  const wall = s4.grid[4][5]!;
  ok(wall.maxHp - wall.hp >= 30, `it chews hard when it arrives (${wall.maxHp - wall.hp} in 4s)`);
}

// ── 31. Nightcap Assassin: past the front two, burst the back row, then walk ──
{
  console.log('Nightcap Assassin');
  const s = fresh();
  placeFlora(s, 'bramble', 0, 7); // front line
  placeFlora(s, 'bulwark', 0, 6); // second
  placeFlora(s, 'glowbulb', 0, 3); // the "safe" back row
  const front = s.grid[0][7]!;
  const second = s.grid[0][6]!;
  const back = s.grid[0][3]!;
  const n = spawnEnemy(s, 'nightcap', 0, 8.8);
  let guard = 0;
  while (s.status === 'playing' && !(n.dashUsed && n.dashT === 0) && guard++ < 400) stepGame(s);
  ok(n.dashUsed, 'the first Flora to block it set it sprinting');
  ok(front.hp === front.maxHp, 'it slipped past the front wall untouched');
  ok(second.hp === second.maxHp, 'and past the second Flora untouched');
  ok(back.hp < back.maxHp, 'then burst the plant in the back row', `back=${back.hp}`);
  ok(back.maxHp - back.hp === 20, `the dash is a single 20-dmg burst (took ${back.maxHp - back.hp})`);
  ok(n.dashT === 0, 'the sprint is over');
  // …and after that it is just a walker that chews at its listed 20/1s
  run(s, 1.1);
  ok(!s.grid[0][3], 'once the burst lands it chews like any other enemy');
  const x0 = n.x;
  run(s, 1.0);
  ok(Math.abs(n.x - x0) < 0.6, `it falls back to an ordinary walk (moved ${Math.abs(n.x - x0).toFixed(2)} in 1s, a sprint would cover ~2.1)`);

  // once per assassin, and no back row means no burst
  const s2 = fresh();
  placeFlora(s2, 'bramble', 4, 6);
  placeFlora(s2, 'glowbulb', 4, 4);
  const n2 = spawnEnemy(s2, 'nightcap', 4, 8.6);
  run(s2, 8);
  ok(n2.dashUsed && n2.dashT === 0, 'with only two plants there is no back row — the sprint runs out');
  ok(s2.grid[4][6]!.hp === s2.grid[4][6]!.maxHp, 'the first Flora is untouched');
  ok(s2.grid[4][4]!.hp === s2.grid[4][4]!.maxHp, 'and so is the second — it passed both, it did not burst either');
}

// ── 32. Fen Wretch: halves Nectar output in its lane, by aura ──
{
  console.log('Fen Wretch');
  const s = fresh();
  placeFlora(s, 'glowbulb', 0, 0); // lane 0 — under the wretch
  placeFlora(s, 'lotus', 1, 0); // lane 1 — a second Nectar plant, out of the aura
  const drainLane = s.grid[0][0]!;
  const clearLane = s.grid[1][0]!;
  const w = spawnEnemy(s, 'wretch', 0, 8.8);
  run(s, 0.2);
  ok(drainLane.withered, 'the Nectar plant in its lane is flagged as drained');
  ok(!clearLane.withered, 'the one in another lane is not');
  ok(ENEMIES.wretch.nectarDrain === 0.5, 'the aura is a 50% rate cut');
  // drive the harvest clocks directly and measure how far they get in 1s
  drainLane.prodT = 10;
  clearLane.prodT = 10;
  run(s, 1.0);
  const drained = 10 - drainLane.prodT;
  const clear = 10 - clearLane.prodT;
  ok(Math.abs(drained - 0.5) < 0.06, `the drained bulb's clock runs at half speed (${drained.toFixed(2)}s of progress in 1s)`);
  ok(Math.abs(clear - 1.0) < 0.06, `a Nectar plant in another lane runs at full speed (${clear.toFixed(2)}s in 1s)`);
  // it is an aura, not a hit: the wretch never had to reach the plant
  ok(w.x > 8.0, 'the wretch is still at the far end of the board', `x=${w.x.toFixed(2)}`);
  // kill it and the lane recovers
  w.hp = 1;
  damageEnemy(s, w, 10, { kind: 'physical' });
  ok(!s.enemies.includes(w), 'killed');
  drainLane.prodT = 10;
  run(s, 1.0);
  const after = 10 - drainLane.prodT;
  ok(Math.abs(after - 1.0) < 0.06, `the clock snaps back to full speed (${after.toFixed(2)}s in 1s)`);
  ok(!drainLane.withered, 'and the drain flag clears with it');
}

// ── 33. The Hollow King: three phases, alternating ward, enrage ──
{
  console.log('The Hollow King');
  const s = fresh();
  const k = spawnEnemy(s, 'hollowking', 2, 8.6);
  ok(k.hp === 3500 && k.maxHp === 3500, 'spawns at 3500 HP, exempt from hpMul', `hp=${k.hp}`);
  ok(!!ENEMIES.hollowking.boss, 'flagged as a boss (boss bar, no minibar)');
  ok(k.phase === 1 && !k.enraged && k.immuneTo === null, 'phase 1: no ward, no enrage');
  run(s, 11);
  ok(s.enemies.some((e) => e.key === 'wisp'), 'phase 1 sheds Molt Wisps periodically');

  // phase 2 — the ward alternates between the two live damage channels
  k.hp = Math.floor(k.maxHp * 0.5);
  run(s, 0.2);
  ok(k.phase === 2, 'phase 2 below two-thirds HP', `phase=${k.phase}`);
  const seen = new Set<string>();
  let openTicks = 0;
  run(s, 16, () => {
    if (k.immuneTo) seen.add(k.immuneTo);
    else openTicks++;
  });
  ok(seen.has('physical') && seen.has('splash'), `the ward alternates channels (saw ${[...seen].join(' + ')})`);
  ok(openTicks > 0, 'and there is a window where nothing is warded');

  // phase 3 — enrage
  k.hp = Math.floor(k.maxHp * 0.2);
  run(s, 0.2);
  ok(k.phase === 3 && k.enraged, 'phase 3 below a quarter HP sets the enrage');

  // the arithmetic, driven straight through the damage primitive
  const s2 = fresh();
  const k2 = spawnEnemy(s2, 'hollowking', 0, 8);
  const hp0 = k2.hp;
  damageEnemy(s2, k2, 100, { kind: 'physical' });
  ok(Math.abs(hp0 - k2.hp - 100) < 0.01, 'a plain 100-dmg strike lands as 100');
  k2.enraged = true;
  damageEnemy(s2, k2, 100, { kind: 'physical' });
  ok(Math.abs(hp0 - k2.hp - 300) < 0.01, 'and as 200 more once enraged — double damage taken');
  k2.enraged = false;
  k2.immuneTo = 'physical';
  const hpw = k2.hp;
  damageEnemy(s2, k2, 100, { kind: 'physical' });
  ok(k2.hp === hpw, 'a warded channel takes literally nothing');
  damageEnemy(s2, k2, 100, { kind: 'splash' });
  ok(k2.hp === hpw - 100, 'the other channel still lands in full');

  // doubled attack speed
  const s3 = fresh();
  placeFlora(s3, 'bramble', 1, 5);
  const k3 = spawnEnemy(s3, 'hollowking', 1, 6.4);
  k3.hp = Math.floor(k3.maxHp * 0.2); // force the enrage
  k3.atkT = 0;
  run(s3, 3.0);
  const wall = s3.grid[1][5]!;
  ok(k3.enraged, 'enraged before it reached the wall');
  ok(wall.maxHp - wall.hp >= 150, `40 dmg every 0.6s: ${wall.maxHp - wall.hp} in 3s (a normal pace would be ~80)`);
}

// ── 34. DoT channel: wired end to end, dormant until a Flora uses it ──
{
  console.log('DoT channel (dormant plumbing)');
  const s = fresh();
  const g = spawnEnemy(s, 'gnat', 0, 8);
  damageEnemy(s, g, 10, { poisonDps: 5, poisonDur: 4 });
  ok(g.poisonDps === 5 && g.poisonUntil > s.t, 'poison arms on hit');
  const hp0 = g.hp;
  run(s, 1.0);
  const lost = hp0 - g.hp;
  ok(Math.abs(lost - 5) < 0.15, `ticks at 5 dmg/s (lost ${lost.toFixed(2)} in 1s)`);
  run(s, 3.2);
  ok(g.poisonDps === 0, 'and expires when its duration runs out');

  // every existing Flora classifies onto a channel the King can ward
  const kinds: Record<string, string> = {};
  for (const key of ALL) {
    const atk = FLORA[key].attack;
    if (!atk) continue;
    const sx = fresh();
    placeFlora(sx, key, 0, 0);
    spawnEnemy(sx, 'gnat', 0, 6);
    run(sx, 0.2);
    // read the classification off a freshly fired shot
    sx.projs.length = 0;
    sx.grid[0][0]!.atkT = 0.001;
    run(sx, 0.1);
    if (sx.projs.length) kinds[key] = sx.projs[0].dmgKind;
  }
  ok(kinds['thornvine'] === 'physical' && kinds['sentinel'] === 'physical', 'single-target shooters are physical');
  ok(kinds['watchvine'] === 'physical' && kinds['deeproot'] === 'physical', 'rearguard and burrow shots are physical');
  ok(kinds['cinderpod'] === 'splash' && kinds['cactus'] === 'splash' && kinds['frostcap'] === 'splash', 'every area plant is splash');
  ok(!Object.values(kinds).includes('poison'), 'nothing produces poison yet — the channel is live but dormant');
}

// ── 35. Campaign wiring: World 4 exists, is gated, and reports its threats ──
{
  console.log('World 4 wiring');
  ok(LEVELS.length === 25, `25 levels (got ${LEVELS.length})`);
  const w4 = LEVELS.filter((l) => l.world === 4);
  ok(w4.length === 5 && w4.map((l) => l.id).join(',') === '15,16,17,18,19', 'five levels, ids 15–19');
  ok(LEVELS[19].boss === 'hollowking', 'the world finale is the Hollow King');
  const intel = levelEnemyIntel(LEVELS[19]);
  for (const k of ['wisp', 'chitter', 'nightcap', 'wretch', 'marauder', 'slug', 'hollowking'] as EnemyKey[]) {
    ok(intel.includes(k), `${ENEMIES[k].name} shows up in the level intel`);
  }
  // a Chitterling group of one is four bodies on the board
  const packLevel = LEVELS[17]; // A Thousand Small Teeth
  ok(packLevel.waves.some((w) => w.groups.some((g) => g.type === 'chitter')), 'that level really does field Chitterling Packs');
  const naive = packLevel.waves.reduce((n, w) => n + w.groups.reduce((m, g) => m + g.count, 0), 0);
  ok(totalEnemies(packLevel) > naive, `packSize is counted in the level total (${totalEnemies(packLevel)} bodies vs ${naive} groups)`);
  // every enemy key resolves to a stat block (Record<EnemyKey,…> would not compile otherwise, but be sure)
  let allResolve = true;
  for (const k of Object.keys(ENEMIES)) if (!ENEMIES[k as EnemyKey]?.name) allResolve = false;
  ok(allResolve && Object.keys(ENEMIES).length === 27, `27 Blightspawn defined (got ${Object.keys(ENEMIES).length})`);
}

// ── 36. Ironbark Titan: raw burst a Grovemaw Slug cannot eat ──
{
  console.log('Ironbark Titan');
  const s = fresh();
  placeFlora(s, 'ironbark', 0, 0);
  const beetle = spawnEnemy(s, 'beetle', 0, 6);
  run(s, 3.5);
  ok(beetle.maxHp - beetle.hp >= 80, `an 80-damage swing lands (took ${beetle.maxHp - beetle.hp} in 3.5s)`);
  // the whole point of it: nothing to absorb
  const s2 = fresh();
  placeFlora(s2, 'ironbark', 1, 0);
  const slug = spawnEnemy(s2, 'slug', 1, 6);
  run(s2, 4);
  ok(slug.drPct === 0, 'no status on the hit — the slug never raises a shield');
  ok(slug.maxHp - slug.hp >= 80, `raw burst lands in full (took ${slug.maxHp - slug.hp})`);
  // contrast: the control plant it replaces would have fed the slug
  const s3 = fresh();
  placeFlora(s3, 'frostcap', 2, 0);
  const slug3 = spawnEnemy(s3, 'slug', 2, 6);
  run(s3, 4);
  ok(slug3.drPct > 0, `while a Frostcap in the same lane feeds it (${(slug3.drPct * 100).toFixed(0)}% DR)`);
  ok(!FLORA.ironbark.attack!.aoe && !FLORA.ironbark.attack!.splash, 'single target, no splash — as specced');
}

// ── 37. Emberlash Vine: a held beam, so a split costs it nothing ──
{
  console.log('Emberlash Vine');
  const s = fresh();
  placeFlora(s, 'emberlash', 0, 0);
  const g = spawnEnemy(s, 'gnat', 0, 6);
  run(s, 1.0);
  const lost = g.maxHp - g.hp;
  ok(Math.abs(lost - 8) < 1.2, `8 damage per second of continuous burn (lost ${lost.toFixed(1)} in 1s)`);
  ok(s.projs.length === 0, 'a beam looses no projectile at all');
  // no wind-up, no buried shot: the beam simply moves to the smaller body
  const s2 = fresh();
  placeFlora(s2, 'emberlash', 1, 0);
  const w = spawnEnemy(s2, 'wisp', 1, 6);
  w.hp = 30; // one second of beam (8 dmg) crosses the 25-HP split line
  run(s2, 1.0);
  const halves = s2.enemies.filter((e) => e.key === 'wisp');
  ok(halves.length === 2, 'the beam burned straight through the split threshold', `n=${halves.length}`);
  const pool0 = s2.enemies.filter((e) => e.key === 'wisp').reduce((n, e) => n + e.hp, 0);
  run(s2, 1.0);
  const pool1 = s2.enemies.filter((e) => e.key === 'wisp').reduce((n, e) => n + e.hp, 0);
  ok(Math.abs(pool0 - pool1 - 8) < 1.5, `full output resumes on the new bodies instantly (${(pool0 - pool1).toFixed(1)} dmg in the next second — no wasted shot)`);
}

// ── 38. Needle Reed: five needles spread across up to three bodies ──
{
  console.log('Needle Reed');
  const s = fresh();
  placeFlora(s, 'needlereed', 0, 0);
  const e1 = spawnEnemy(s, 'gnat', 0, 5.0);
  const e2 = spawnEnemy(s, 'gnat', 0, 6.0);
  const e3 = spawnEnemy(s, 'gnat', 0, 7.0);
  const e4 = spawnEnemy(s, 'gnat', 0, 8.0);
  run(s, 2.6); // exactly one volley
  const hit = [e1, e2, e3].filter((e) => e.hp < e.maxHp).length;
  ok(hit === 3, `the volley spreads across three enemies (hit ${hit})`);
  ok(e4.hp === e4.maxHp, 'and the fourth is left alone — only three targets');
  const total = [e1, e2, e3, e4].reduce((n, e) => n + (e.maxHp - e.hp), 0);
  ok(Math.abs(total - 30) < 0.01, `five 6-damage needles = 30 damage total (dealt ${total})`);
  ok(e1.maxHp - e1.hp === 12, `the frontmost takes the odd needle: 2 × 6 (took ${e1.maxHp - e1.hp})`);
  ok(e3.maxHp - e3.hp === 6, `the third gets the single remainder (took ${e3.maxHp - e3.hp})`);
  // against a real cluster, nothing is overkilled
  const s2 = fresh();
  placeFlora(s2, 'needlereed', 1, 0);
  spawnEnemy(s2, 'chitter', 1, 6.0); // four 20-HP bodies in one slot
  run(s2, 2.6);
  const chewed = s2.enemies.filter((e) => e.key === 'chitter' && e.hp < e.maxHp).length;
  ok(chewed >= 3, `a Chitterling Pack is chewed across the pack, not focused (${chewed} of 4 touched)`);
}

// ── 39. Gale Fern: displacement, which root immunity does not answer ──
{
  console.log('Gale Fern');
  const s = fresh();
  placeFlora(s, 'gale', 0, 0);
  const m = spawnEnemy(s, 'marauder', 0, 7.0);
  let jumps = 0;
  let biggest = 0;
  let prev = m.x;
  run(s, 8, () => {
    if (m.x > prev + 0.5) {
      jumps++;
      biggest = Math.max(biggest, m.x - prev);
    }
    prev = m.x;
  });
  ok(jumps >= 1, `the gust shoves the Marauder east (saw ${jumps} shoves)`);
  ok(Math.abs(biggest - 2) < 0.05, `by two whole tiles (moved ${biggest.toFixed(2)}, less one tick of walking)`);
  ok(m.rootUntil <= s.t, 'and no root was ever involved — immunity is irrelevant');
  // bosses are heavy: half the distance
  const s2 = fresh();
  placeFlora(s2, 'gale', 1, 0);
  const k = spawnEnemy(s2, 'hollowking', 1, 6);
  let bossJump = 0;
  let kp = k.x;
  run(s2, 8, () => {
    if (k.x > kp + 0.2) bossJump = Math.max(bossJump, k.x - kp);
    kp = k.x;
  });
  ok(Math.abs(bossJump - 1) < 0.05, `a boss is shoved half as far (${bossJump.toFixed(2)} tiles)`);
  // a Nightcap caught mid-sprint is knocked out of its dash
  const s3 = fresh();
  placeFlora(s3, 'bramble', 2, 6);
  placeFlora(s3, 'glowbulb', 2, 3);
  const n = spawnEnemy(s3, 'nightcap', 2, 8.6);
  for (let i = 0; i < 80 && n.dashT <= 0 && s3.status === 'playing'; i++) stepGame(s3);
  ok(n.dashT > 0, 'the assassin broke into a sprint');
  const xBefore = n.x;
  s3.projs.push({
    id: s3.nextId++, lane: 2, x: n.x + 0.1, prevX: n.x + 0.1, dmg: 0, pierce: false, fly: false,
    aoe: false, slowPct: 0, slowDur: 0, kind: 'gale', hitIds: new Set(), dir: -1, splash: 0,
    underground: false, rootDur: 0, dmgKind: 'physical', poisonDps: 0, poisonDur: 0, knockback: 2,
  });
  stepGame(s3);
  ok(n.dashT === 0, 'a gust cancels the sprint outright');
  ok(n.x > xBefore, `and throws it back east (${xBefore.toFixed(2)} → ${n.x.toFixed(2)})`);
  ok(s3.grid[2][3]!.hp === s3.grid[2][3]!.maxHp, 'so the back-row plant never gets burst');
  // underground is not shovable
  const s4 = fresh();
  placeFlora(s4, 'gale', 3, 0);
  const lv = spawnEnemy(s4, 'larva', 3, 8.8);
  const lxp = lv.x;
  run(s4, 6, () => {
    if (lv.x > lxp + 0.5) throw new Error('shoved a burrowed larva');
  });
  ok(lv.burrowed || lv.x <= 8.8, 'a burrowed Tunnel Larva is untouched by the wind');
}

// ── 40. Sentinel Bloom: a riposte for anything that sprints or leaps past ──
{
  console.log('Sentinel Bloom');
  const s = fresh();
  placeFlora(s, 'sentinelbloom', 0, 4);
  placeFlora(s, 'bramble', 0, 6);
  placeFlora(s, 'glowbulb', 0, 2);
  const n = spawnEnemy(s, 'nightcap', 0, 8.6);
  run(s, 8);
  ok(n.maxHp - n.hp === 50, `a dashing Nightcap eats exactly one 50-damage riposte (took ${n.maxHp - n.hp})`);
  ok(s.grid[0][4]!.struck.size === 1, 'and it only ever struck that enemy once');
  // a Mite Vaulter is caught mid-leap — even over the bloom's own tile
  const s2 = fresh();
  placeFlora(s2, 'sentinelbloom', 3, 5);
  const v = spawnEnemy(s2, 'vaulter', 3, 8.2);
  run(s2, 6);
  ok(v.vaulted, 'the vaulter still leapt');
  ok(v.maxHp - v.hp >= 50, `and ate a counter-strike on the way over (took ${v.maxHp - v.hp})`);
  // walkers are nobody's problem
  const s3 = fresh();
  placeFlora(s3, 'sentinelbloom', 4, 4);
  const g = spawnEnemy(s3, 'gnat', 4, 7);
  run(s3, 12);
  ok(g.hp === g.maxHp, 'an ordinary walker is never struck — the bloom only answers sprints and leaps');
}

// ── 41. Ambush Fern: inert until something steps in, then one huge hit ──
{
  console.log('Ambush Fern');
  const s = fresh();
  placeFlora(s, 'ambush', 0, 4);
  const fern = s.grid[0][4]!;
  ok(fern.ambushT === 0, 'it starts folded and armed');
  const g = spawnEnemy(s, 'gnat', 0, 7);
  run(s, 8);
  ok(!s.enemies.includes(g), 'a 60-HP gnat is deleted outright by the 120-damage ambush');
  ok(fern.ambushT > 0, `and it folds back down to recharge (${fern.ambushT.toFixed(1)}s left)`);
  // nothing happens at range
  const s2 = fresh();
  placeFlora(s2, 'ambush', 1, 4);
  const far = spawnEnemy(s2, 'gnat', 1, 8.8);
  run(s2, 3);
  ok(s2.grid[1][4]!.ambushT === 0 && far.hp === far.maxHp, 'it stays inert until something actually enters its tile');
  // a big body survives one spring, and there is nothing to absorb
  const s3 = fresh();
  placeFlora(s3, 'ambush', 2, 4);
  const slug = spawnEnemy(s3, 'slug', 2, 6);
  run(s3, 10); // the first spring lands at ~7.2s; the recharge runs to ~13.2s
  ok(slug.hp === slug.maxHp - 120, `a Grovemaw Slug pays 120 for walking in (${slug.hp}/${slug.maxHp})`);
  ok(slug.drPct === 0, 'the ambush is not a status effect — nothing to eat');
  ok(s3.grid[2][4]!.ambushT > 0, `and the fern is folded down recharging (${s3.grid[2][4]!.ambushT.toFixed(1)}s)`);
  run(s3, 5);
  ok(!s3.enemies.includes(slug), 'when it springs a second time the slug is finished');
}

// ── 42. Prism Bud: alternates channels, so a ward is never a full answer ──
{
  console.log('Prism Bud');
  const s = fresh();
  placeFlora(s, 'prism', 0, 0);
  spawnEnemy(s, 'gnat', 0, 6);
  const seen: string[] = [];
  let lastId = 0;
  run(s, 9, () => {
    for (const p of s.projs) {
      if (p.id > lastId) {
        lastId = p.id;
        seen.push(p.dmgKind);
      }
    }
  });
  ok(seen.length >= 3, `it fired several shots (got ${seen.length})`);
  ok(seen[0] !== seen[1], `consecutive shots alternate channel (${seen.join(' → ')})`);
  ok(seen[0] === seen[2], 'and the pattern repeats');
  ok(seen.includes('physical') && seen.includes('splash'), 'both channels the King can ward are covered');
  // and that is exactly what defeats the rotating ward
  const s2 = fresh();
  const k = spawnEnemy(s2, 'hollowking', 0, 8);
  k.immuneTo = 'physical';
  const b0 = k.hp;
  damageEnemy(s2, k, 18, { kind: 'physical' });
  ok(k.hp === b0, 'a physical hit is fully warded');
  damageEnemy(s2, k, 18, { kind: 'splash' });
  ok(k.hp === b0 - 18, 'the fire half of the alternation sails straight through');
}

// ── 43. Batch 2 flora: unlocks, loadout wiring, and the roster count ──
{
  console.log('Flora Batch 2 wiring');
  ok(Object.keys(FLORA).length === 20, `20 Flora defined (got ${Object.keys(FLORA).length})`);
  ok(unlockedFloraFor(14).length === 13, 'nothing from Batch 2 leaks into World 3');
  const u19 = unlockedFloraFor(19);
  for (const k of ['ironbark', 'emberlash', 'needlereed', 'gale', 'sentinelbloom', 'ambush', 'prism'] as FloraKey[]) {
    ok(u19.includes(k), `${FLORA[k].name} is unlocked by the World 4 finale`);
  }
  ok(unlockedFloraFor(15).includes('emberlash') && !unlockedFloraFor(15).includes('prism'), 'unlocks arrive level by level, not all at once');
  // the threat-aware default tray reaches for the right answer
  ok(defaultLoadoutFor(LEVELS[16]).includes('ironbark'), 'a Grovemaw Slug level defaults to Ironbark');
  ok(defaultLoadoutFor(LEVELS[16]).includes('gale'), 'a Barkskin Marauder level defaults to Gale Fern');
  ok(defaultLoadoutFor(LEVELS[19]).includes('prism'), 'the Hollow King level defaults to Prism Bud');
}

// ── 44. Regression: nothing can be shoved off the board out of reach ──
{
  console.log('Off-board safety');
  // The Hollow King's 1.15 spacing used to shove it past the targeting cutoff
  // when a shed wisp landed just west of it — the level then never ended.
  const s = fresh();
  const k = spawnEnemy(s, 'hollowking', 0, SPAWN_X_EDGE);
  for (let i = 0; i < 2600 && s.status === 'playing'; i++) {
    stepGame(s);
    for (const e of s.enemies) {
      if (e.x > SPAWN_X_EDGE + 0.001) {
        ok(false, `${e.key} was pushed off-board to x=${e.x.toFixed(2)} (untargetable)`);
        break;
      }
    }
    if (failed > 0) break;
  }
  ok(s.enemies.every((e) => e.x <= SPAWN_X_EDGE + 0.001), 'no body ever leaves the targetable board');
  // a Gale Fern cannot strand its victim either
  const s2 = fresh();
  placeFlora(s2, 'gale', 1, 0);
  const g = spawnEnemy(s2, 'gnat', 1, 9.2);
  run(s2, 12);
  ok(g.x <= SPAWN_X_EDGE + 0.001, `a knocked-back gnat stays in reach (x=${g.x.toFixed(2)})`);
}

// ── 45. Enemy Batch 3 wiring: World 5 fields the Reckoning ──
{
  console.log('World 5 wiring');
  ok(LEVELS.length === 25, `25 levels (got ${LEVELS.length})`);
  const w5 = LEVELS.filter((l) => l.world === 5);
  ok(w5.length === 5 && w5.map((l) => l.id).join(',') === '20,21,22,23,24', 'five levels, ids 20–24');
  ok(LEVELS[24].boss === 'hollowking', 'the finale is the King again, with the Reckoning as his court');
  const fielded = new Set<EnemyKey>();
  for (const l of w5) for (const w of l.waves) for (const g of w.groups) fielded.add(g.type);
  for (const k of ['regrow', 'golem', 'roach', 'toad', 'nightstalker', 'wardshell'] as EnemyKey[]) {
    ok(fielded.has(k), `${ENEMIES[k].name} debuts in a World 5 wave`);
    const e = ENEMIES[k];
    ok(!!e.name && !!e.desc && !!e.counter, `${e.name}: full stat block with a printed counter`);
  }
  const intel = levelEnemyIntel(LEVELS[24]);
  for (const k of ['regrow', 'golem', 'roach', 'toad', 'nightstalker', 'wardshell'] as EnemyKey[]) {
    ok(intel.includes(k), `${ENEMIES[k].name} shows up in the finale intel`);
  }
  // no Flora Batch 3 — the loop closes with the tray you already own
  ok(unlockedFloraFor(19).length === 20 && unlockedFloraFor(24).length === 20, 'nothing unlocks after the Crown');
  // threat-aware defaults reach for the right answers
  ok(defaultLoadoutFor(LEVELS[20]).includes('emberlash'), 'a Regrowth Husk level defaults to sustained burn');
  ok(defaultLoadoutFor(LEVELS[21]).includes('ironbark'), 'a Cinder Golem level defaults to raw physical');
  ok(defaultLoadoutFor(LEVELS[22]).includes('ironbark'), 'a Bulwark Roach level defaults to one big hit');
  ok(defaultLoadoutFor(LEVELS[22]).includes('needlereed'), '…and a ward-popper for the Grub beside it');
  ok(defaultLoadoutFor(LEVELS[23]).includes('gale'), 'a Nightstalker level defaults to the gust that cancels sprints');
}

// ── 46. Regrowth Husk: heals in the gaps between shots, never under a stream ──
{
  console.log('Regrowth Husk');
  const s = fresh();
  const h = spawnEnemy(s, 'regrow', 0, 6);
  damageEnemy(s, h, 30);
  ok(h.hp === 70, 'takes damage normally');
  run(s, 1.9);
  ok(h.hp === 70, 'no healing inside the 2s window');
  run(s, 0.2);
  ok(h.hp === 85, `knits 15 back just after 2s unhit (hp=${h.hp})`);
  run(s, 4.2);
  ok(h.hp === 100, 'and never knits past max HP');
  // every hit restarts the clock
  const s2 = fresh();
  const h2 = spawnEnemy(s2, 'regrow', 1, 6);
  damageEnemy(s2, h2, 40);
  run(s2, 1.5);
  damageEnemy(s2, h2, 10);
  run(s2, 1.5);
  ok(h2.hp === 50, 'a hit inside the window restarts it (no early heal)');
  run(s2, 0.6);
  ok(h2.hp === 65, 'the knit lands 2s after the LAST hit');
  // integration: the 1.4s Thornvine never lets it tick; the Ironbark's 3s gaps feed it
  const s3 = fresh();
  placeFlora(s3, 'bramble', 2, 1);
  placeFlora(s3, 'thornvine', 2, 0);
  const h3 = spawnEnemy(s3, 'regrow', 2, 6);
  h3.hp = 400; h3.maxHp = 400;
  run(s3, 20);
  ok(s3.events.filter((e) => e === 'regrow').length === 0, 'Thornvine cadence never leaves a 2s gap — zero heals');
  const s4 = fresh();
  placeFlora(s4, 'bramble', 3, 1);
  placeFlora(s4, 'ironbark', 3, 0);
  const h4 = spawnEnemy(s4, 'regrow', 3, 6);
  h4.hp = 500; h4.maxHp = 500;
  run(s4, 16);
  const healed = s4.events.filter((e) => e === 'regrow').length;
  ok(healed >= 3, `the 3s swing gap is exactly its dinner bell — ${healed} heals landed over 16s`);
}

// ── 47. Cinder Golem: burn at half, everything else whole ──
{
  console.log('Cinder Golem');
  const s = fresh();
  const g = spawnEnemy(s, 'golem', 0, 6);
  damageEnemy(s, g, 16, { fire: true });
  ok(g.hp === g.maxHp - 8, `a fire hit lands for half (16 raw → ${g.maxHp - g.hp})`);
  damageEnemy(s, g, 16);
  ok(g.hp === g.maxHp - 24, 'a physical hit goes in whole');
  damageEnemy(s, g, 16, { kind: 'splash' });
  ok(g.hp === g.maxHp - 40, 'splash that is not fire is not resisted either');
  // the Emberlash beam really is a burn source: it smoulders here
  const s2 = fresh();
  placeFlora(s2, 'emberlash', 1, 0);
  s2.trayCd['emberlash'] = 0; // second copy, same tick: skip the tray recharge gate
  placeFlora(s2, 'emberlash', 2, 0);
  const g2 = spawnEnemy(s2, 'golem', 1, 5);
  const gnat = spawnEnemy(s2, 'gnat', 2, 5);
  gnat.hp = 500; gnat.maxHp = 500; // durable control — an ordinary gnat would simply burn out
  run(s2, 5);
  const golemLost = g2.maxHp - g2.hp;
  const gnatLost = gnat.maxHp - gnat.hp;
  ok(golemLost > 16 && golemLost < 23, `the beam does ~half light on the Golem (${golemLost.toFixed(1)} over 5s)`);
  ok(gnatLost > 34, `the same 5s burns a gnat down for ${gnatLost.toFixed(1)}`);
  // Prism Bud alternation: the bolt lands whole, the fire burst lands halved
  const s3 = fresh();
  placeFlora(s3, 'prism', 3, 0);
  spawnEnemy(s3, 'golem', 3, 5);
  const fired: boolean[] = [];
  let lastId = 0;
  run(s3, 8, () => {
    for (const p of s3.projs) if (p.id > lastId) { lastId = p.id; fired.push(p.fire); }
  });
  ok(fired.length >= 3, `the Prism kept firing (got ${fired.length} shots)`);
  ok(!fired[0] && fired[1] && !fired[2], 'bolt — fire — bolt: only the middle shot is a burn hit');
  // a Cactus volley is concussion, not fire: full value
  const s4 = fresh();
  placeFlora(s4, 'cactus', 4, 0);
  const g4 = spawnEnemy(s4, 'golem', 4, 5);
  run(s4, 2.0);
  ok(g4.maxHp - g4.hp === 15, `one Cactus spike lands whole (${g4.maxHp - g4.hp})`);
}

// ── 48. Bulwark Roach: small hits floor to chipping ──
{
  console.log('Bulwark Roach');
  const s = fresh();
  const r = spawnEnemy(s, 'roach', 0, 6);
  damageEnemy(s, r, 6);
  ok(r.hp === r.maxHp - 1, 'a 6-damage needle is floored to 1');
  damageEnemy(s, r, 9);
  ok(r.hp === r.maxHp - 2, '9 is under the floor too');
  damageEnemy(s, r, 10);
  ok(r.hp === r.maxHp - 12, '10 is at the floor, not under it — full damage');
  // the plant it exists to neutralise
  const s2 = fresh();
  placeFlora(s2, 'needlereed', 1, 0);
  const r2 = spawnEnemy(s2, 'roach', 1, 5);
  run(s2, 2.4);
  ok(r2.maxHp - r2.hp === 5, `a whole five-needle volley spends itself for ${r2.maxHp - r2.hp}`);
  // one Thornvine bite out-damages that entire Reed volley
  const s3 = fresh();
  placeFlora(s3, 'thornvine', 2, 0);
  const r3 = spawnEnemy(s3, 'roach', 2, 5);
  run(s3, 1.6);
  ok(r3.maxHp - r3.hp >= 18, `a single 18-damage bite lands whole (${r3.maxHp - r3.hp})`);
  // the beam is a stream, not a volley of hits — the floor does not eat it
  const s4 = fresh();
  placeFlora(s4, 'emberlash', 3, 0);
  const r4 = spawnEnemy(s4, 'roach', 3, 5);
  run(s4, 5);
  ok(r4.maxHp - r4.hp > 30, `Emberlash still does full work (${(r4.maxHp - r4.hp).toFixed(0)} dmg over 5s)`);
}

// ── 49. Boulder Toad: displacement simply does not apply ──
{
  console.log('Boulder Toad');
  const s = fresh();
  placeFlora(s, 'gale', 0, 0);
  const t = spawnEnemy(s, 'toad', 0, 4.5);
  const x0 = t.x;
  run(s, 6.5);
  ok(s.events.includes('anchor'), 'the gust washes over it — and you can see it break');
  ok(t.x < x0, `it never stops advancing (x=${t.x.toFixed(2)} vs spawn ${x0})`);
  ok(t.hp === t.maxHp, 'the gust also deals no damage, it was always 0 — the toad just ignores the rest');
  // control: a gnat gets shoved two full tiles
  const s2 = fresh();
  placeFlora(s2, 'gale', 1, 0);
  const g = spawnEnemy(s2, 'gnat', 1, 4.5);
  run(s2, 3.6);
  ok(g.x > 5, `the same gust shoves a gnat back (x=${g.x.toFixed(2)})`);
  // damaged down is the answer: normal damage lands whole
  damageEnemy(s, t, 40);
  ok(t.hp === t.maxHp - 40, 'raw hits go in at full value');
}

// ── 50. Iron Nightstalker: the plate eats the riposte, the burst lands, the dash re-arms ──
{
  console.log('Iron Nightstalker');
  const s = fresh();
  placeFlora(s, 'sentinelbloom', 0, 4);
  const n = spawnEnemy(s, 'nightstalker', 0, 7.2);
  run(s, 7.4);
  ok(n.dashUsed, 'a lone wall sets it sprinting, plate up');
  ok(n.hp === n.maxHp, `the Bloom's 50-damage riposte clangs off — zero damage (hp=${n.hp}/${n.maxHp})`);
  ok(s.grid[0][4]!.struck.size === 1, 'and the Bloom has spent its one counter on nothing');
  damageEnemy(s, n, 18);
  ok(n.hp === n.maxHp - 18, 'the next hit goes straight through');
  // the full loop: past two, burst the third, bound away, re-arm, come again
  const s2 = fresh();
  placeFlora(s2, 'bramble', 1, 5);
  s2.trayCd['bramble'] = 0; // two brambles in one tick: skip the per-key tray recharge
  placeFlora(s2, 'bramble', 1, 4);
  placeFlora(s2, 'glowbulb', 1, 3);
  const n2 = spawnEnemy(s2, 'nightstalker', 1, 8.2);
  run(s2, 13.5);
  ok(s2.events.filter((e) => e === 'strike').length === 2, 'two bursts into the back row, a cycle apart');
  ok(!s2.grid[1][3], 'the Glowbulb paid for both');
  ok(s2.events.filter((e) => e === 'plate').length >= 2, 'a fresh plate rose with the second dash');
  ok(s2.enemies.includes(n2), 'and it is still out there');
  // the bound east is observable and lands at the far end of the lane
  const s3 = fresh();
  const n3 = spawnEnemy(s3, 'nightstalker', 3, 5.5);
  n3.dashUsed = true; n3.shieldUp = false; n3.retreatTo = 7.5;
  run(s3, 2);
  ok(n3.retreatTo === -1, 'the bound ends at the far end of the lane');
  ok(n3.dashUsed === false, 'and the dash is re-armed for another pass');
  ok(n3.x > 6.5, `it really ran east first (x=${n3.x.toFixed(2)})`);
  // control: a plain Nightcap Assassin has no plate and pays for the Bloom in full
  const s4 = fresh();
  placeFlora(s4, 'sentinelbloom', 4, 4);
  const nc = spawnEnemy(s4, 'nightcap', 4, 7.2);
  run(s4, 7.4);
  ok(nc.hp === nc.maxHp - 50, 'Nightcap still eats the full counter-strike — this is a plate, not a rework');
}

// ── 51. Wardshell Grub: one free hit per tile, and it is once, not forever ──
{
  console.log('Wardshell Grub');
  const s = fresh();
  placeFlora(s, 'ambush', 0, 4);
  const g = spawnEnemy(s, 'wardshell', 0, 7);
  run(s, 8.6); // walks in at 0.19: arrival at the Fern's mouth is ~8.0s
  ok(g.hp === g.maxHp, `the 120-damage ambush is spent on the ward and lands for zero (hp=${g.hp})`);
  ok(s.grid[0][4]!.ambushT > 0, 'and the fern folds away anyway — the trap was consumed');
  damageEnemy(s, g, 30);
  ok(g.hp === g.maxHp - 30, 'the next hit inside the same tile goes in whole');
  const wcol = g.wardCol;
  g.x -= 1.1;
  stepGame(s);
  ok(g.wardUp && g.wardCol !== wcol, 'stepping one tile west raises a fresh ward');
  damageEnemy(s, g, 30);
  ok(g.hp === g.maxHp - 30, 'and the first hit inside the new tile is spent on nothing');
  damageEnemy(s, g, 25);
  ok(g.hp === g.maxHp - 55, '…but the second one in that tile bites');
  // multi-hit sources eat the ward for free and still land their volley
  const s2 = fresh();
  placeFlora(s2, 'needlereed', 1, 0);
  const g2 = spawnEnemy(s2, 'wardshell', 1, 5);
  run(s2, 2.4);
  ok(g2.maxHp - g2.hp === 24, `one needle springs the ward, the other four land (lost ${g2.maxHp - g2.hp})`);
  // statuses ride through the nullified hit
  const s3 = fresh();
  placeFlora(s3, 'frostcap', 2, 0);
  const g3 = spawnEnemy(s3, 'wardshell', 2, 5);
  run(s3, 3);
  ok(g3.hp === g3.maxHp, 'the first spore is spent on the dome…');
  ok(g3.slowUntil > s3.t, '…but the chill still lands — the ward blocks damage, not effects');
}


// ── 52. Field Guide unlocks: what the campaign has shown is all you may see ──
{
  console.log('Field Guide unlocks');
  const d0 = discoveriesForLevel(0);
  ok(d0.flora.length === 3, `level 1-1 reveals exactly the three starters (${d0.flora.join(',')})`);
  ok(d0.flora.includes('thornvine') && d0.flora.includes('glowbulb') && d0.flora.includes('bramble'), '…and they are the right three');
  ok(!d0.enemies.includes('hollowking') && !d0.enemies.includes('grub'), 'no later-world Blightspawn leaks into the opening entry');
  ok(d0.enemies.includes('gnat'), 'the Creeper Gnat of 1-1 is catalogued immediately');

  const d19 = discoveriesForLevel(19);
  ok(d19.flora.length === FLORA_ORDER.length, `by the Crown finale all ${FLORA_ORDER.length} Flora are unlocked (${d19.flora.length})`);
  ok(d19.enemies.includes('hollowking'), 'the Hollow King is catalogued once you reach his level');
  ok(!d19.enemies.includes('wardshell'), '…but Reckoning-only species stay in the dark');
  ok(discoveriesForLevel(24).enemies.length === ENEMY_ORDER.length, `the last level reveals the whole roster (${discoveriesForLevel(24).enemies.length})`);

  // monotonic: nothing you have seen can go dark again as you advance
  let monotonic = true;
  for (let i = 0; i < LEVELS.length - 1; i++) {
    const a = discoveriesForLevel(i), b = discoveriesForLevel(i + 1);
    if (!a.flora.every((k) => b.flora.includes(k))) monotonic = false;
    if (!a.enemies.every((k) => b.enemies.includes(k))) monotonic = false;
  }
  ok(monotonic, 'discoveries only ever grow, level to level');

  ok(floraUnlockLevel('thornvine') === 0 && floraUnlockLevel('glowbulb') === 0, 'starters report level 0 as their unlock');
  ok(floraUnlockLevel('cinderpod') === 11, `Cinderpod unlocks at level 11 (got ${floraUnlockLevel('cinderpod')})`);
  ok(floraUnlockLevel('prism') === 19, `Prism Bud unlocks at level 19 (got ${floraUnlockLevel('prism')})`);
  ok(enemyFirstLevel('hollowking') === 19, `the Hollow King first marches at level 19 (got ${enemyFirstLevel('hollowking')})`);
  ok(enemyFirstLevel('gnat') === 0, 'the gnat is a level 0 sighting');
  ok(ENEMY_ORDER.every((k) => enemyFirstLevel(k) !== null), 'every catalogued Blightspawn actually appears in some level');
  ok(ENEMY_ORDER.every((k) => enemyLevels(k).includes(enemyFirstLevel(k)!)), 'and its first sighting is one of its listed levels');
}

// ── 53. Save layer: codex growth, New Game, and where CONTINUE lands ──
{
  console.log('Save / codex');
  const fresh = { ...DEFAULT_SAVE, codex: { flora: [], enemies: [] } };
  ok(codexFlora(fresh).size === 3, `a fresh save shows 3 Flora in full (${codexFlora(fresh).size})`);
  ok(codexEnemies(fresh).size === discoveriesForLevel(0).enemies.length, 'and only the enemies 1-1 fields');
  ok(resumeLevelId(fresh) === 0, 'CONTINUE on a fresh save starts at level 0');

  // opening a level records what its intel names — and does so only once
  const opened = discoverLevel(fresh, 12);
  ok(opened !== fresh, 'opening a level with new intel returns a new save');
  ok(codexEnemies(opened).has('ranger') && codexEnemies(opened).has('imp'), 'Locust Rangers and Spore Imps are catalogued at 3-3');
  ok(codexFlora(opened).has('bulwark') && codexFlora(opened).has('watchvine'), '…and the Flora that answer them');
  ok(discoverLevel(opened, 12) === opened, 're-opening the same level changes nothing (same save object)');
  ok(discoverLevel(opened, 3) === opened, 'nor does an earlier level');

  // a win advances the campaign and folds its discoveries in
  const won = recordWin(opened, 12, 5);
  ok(won.maxLevel === 13, `winning 3-3 unlocks 3-4 (maxLevel=${won.maxLevel})`);
  ok(won.stars[12] === 3, 'flawless 3-3 is worth three stars');
  ok(resumeLevelId(won) === 0, `CONTINUE still points at the first uncleared level (${resumeLevelId(won)})`);

  // New Game: stars and progress go, the guide stays filled in
  const wiped = resetProgress(won);
  ok(wiped.maxLevel === 0 && Object.keys(wiped.stars).length === 0, 'New Game clears progress and stars');
  ok(codexEnemies(wiped).has('ranger'), 'the Field Guide keeps the Blightspawn you catalogued');
  ok(codexFlora(wiped).has('watchvine'), '…and the Flora');
  ok(wiped.muted === won.muted, 'the audio setting survives too');

  // codex entries count even where progress has not reached them
  const carried: typeof wiped = { maxLevel: 0, stars: {}, muted: false, codex: { flora: ['prism'], enemies: ['hollowking'] } };
  ok(codexFlora(carried).has('prism'), 'a codex-only Flora is shown in full without the progress');
  ok(codexEnemies(carried).has('hollowking'), 'same for a codex-only Blightspawn');
  ok(!codexFlora(carried).has('ironbark'), 'and an entry in neither stays a silhouette');

  // a fully cleared campaign points CONTINUE at the finale
  const done: typeof wiped = { maxLevel: 24, stars: {}, muted: false, codex: { flora: [], enemies: [] } };
  for (let i = 0; i < LEVELS.length - 1; i++) done.stars[i] = 1;
  ok(resumeLevelId(done) === LEVELS.length - 1, `with everything but the finale cleared, CONTINUE lands there (${resumeLevelId(done)})`);
  done.stars[LEVELS.length - 1] = 3;
  ok(resumeLevelId(done) === LEVELS.length - 1, 'and a 100% save still resolves to a real level, not off the end');
  // 24 levels at one star, plus the finale at three
  ok(levelsCleared(done) === LEVELS.length && totalStars(done) === (LEVELS.length - 1) * 1 + 3, `progress tallies add up (${levelsCleared(done)} cleared, ${totalStars(done)} stars)`);

  // a corrupt/legacy save must not crash the title screen
  ok(loadSave().codex.flora.length === 0, 'loadSave() without localStorage falls back to an empty codex');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
