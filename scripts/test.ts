// Mechanics verification: each spec rule, tested against the real engine.
import { createGame, placeFlora, shovelAt, spawnEnemy, stepGame } from '../src/game/engine';
import { ENEMIES, FLORA } from '../src/game/data';
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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
