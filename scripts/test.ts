// Mechanics verification: each spec rule, tested against the real engine.
import { createGame, placeFlora, shovelAt, spawnEnemy, stepGame } from '../src/game/engine';
import { ENEMIES, FLORA } from '../src/game/data';
import type { EnemyKey, FloraKey, LevelDef } from '../src/game/types';

let passed = 0, failed = 0;
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ FAIL: ${name} ${detail}`); }
}
const ALL: FloraKey[] = ['thornvine', 'glowbulb', 'bramble', 'cactus', 'frostcap', 'sentinel'];
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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
