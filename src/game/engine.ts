// ─── Heartwood Defense engine ───────────────────────────────────────────────
// Pure simulation: no React, no DOM. Fixed-tick (TICK seconds) and seeded so
// combat resolves deterministically and can be tested headlessly.
import { ENEMIES, FLORA, PASSIVE_INCOME, PASSIVE_PERIOD, START_NECTAR } from './data';
import {
  COLS,
  FRONT_OFF,
  LANES,
  TICK,
  type EnemyEnt,
  type EnemyKey,
  type FloraEnt,
  type FloraKey,
  type Fx,
  type GameState,
  type LevelDef,
} from './types';

const PROJ_SPEED = 4.6;
const SPAWN_X = 9.4;
const SNARE_LINE = 0.06;

// Deterministic RNG (mulberry32) — state lives on the GameState so the whole
// simulation is reproducible from (level, loadout, seed).
function rand(s: GameState): number {
  let t = (s.rngState += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const isFlying = (e: EnemyEnt) => !!ENEMIES[e.key].flying;

function pushFx(s: GameState, kind: Fx['kind'], lane: number, x: number, ttl: number, text?: string) {
  s.fx.push({ id: s.nextId++, kind, lane, x, ttl, max: ttl, text });
}

// ─── Construction ───────────────────────────────────────────────────────────
export function createGame(level: LevelDef, loadout: FloraKey[], seed?: number): GameState {
  const s: GameState = {
    t: 0,
    tick: 0,
    level,
    loadout: [...loadout],
    nectar: START_NECTAR,
    nectarT: PASSIVE_PERIOD,
    trayCd: {},
    grid: Array.from({ length: LANES }, () => Array<FloraEnt | null>(COLS).fill(null)),
    enemies: [],
    projs: [],
    fx: [],
    pending: [],
    snares: Array(LANES).fill(true),
    snareFx: Array(LANES).fill(0),
    status: 'playing',
    lostLane: -1,
    waveTotal: level.waves.length,
    waveAlert: -1,
    waveAlertT: 0,
    warnWave: -1,
    selected: null,
    shovelArmed: false,
    events: [],
    shake: 0,
    kills: 0,
    nextId: 1,
    rngState: (seed ?? level.id * 7919 + 1337) >>> 0,
    placedCount: 0,
    bossKey: level.boss ?? null,
  };
  for (const k of loadout) s.trayCd[k] = 0;

  // Schedule every spawn up front — consistent, testable wave behavior.
  const waveLastLane: number[] = [];
  level.waves.forEach((w, wi) => {
    const groupLanes: number[] = [];
    for (const g of w.groups) {
      // pick one lane for this whole group (swarms attack a lane together)
      let lane = Math.floor(rand(s) * LANES);
      for (let tries = 0; tries < 4 && (groupLanes.includes(lane) || waveLastLane[wi] === lane); tries++) {
        lane = Math.floor(rand(s) * LANES);
      }
      groupLanes.push(lane);
      waveLastLane[wi] = lane;
      const base = w.at + (g.startDelay ?? 0);
      for (let i = 0; i < g.count; i++) {
        s.pending.push({ at: base + i * g.gap, type: g.type, lane, wave: wi });
      }
    }
  });
  s.pending.sort((a, b) => a.at - b.at);
  return s;
}

export function spawnEnemy(s: GameState, type: EnemyKey, lane: number, x = SPAWN_X): EnemyEnt {
  const def = ENEMIES[type];
  const boss = !!def.boss;
  const hp = Math.round(def.hp * (boss ? 1 : s.level.hpMul));
  const e: EnemyEnt = {
    id: s.nextId++,
    key: type,
    lane,
    x,
    prevX: x,
    hp,
    maxHp: hp,
    shell: def.shell ?? 0,
    maxShell: def.shell ?? 0,
    atkT: 0.4,
    slowUntil: 0,
    slowPct: 0,
    hitFlash: 0,
    phase: 1,
    addT: 10,
    chewing: false,
    born: s.tick,
  };
  s.enemies.push(e);
  return e;
}

// ─── Placement / shovel ─────────────────────────────────────────────────────
export type PlaceResult = 'ok' | 'occupied' | 'poor' | 'cooldown' | 'offboard' | 'inactive';

export function placeFlora(s: GameState, key: FloraKey, lane: number, col: number): PlaceResult {
  if (s.status !== 'playing') return 'inactive';
  if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return 'offboard';
  if (!s.loadout.includes(key)) return 'inactive';
  if (s.grid[lane][col]) return 'occupied';
  const def = FLORA[key];
  if (nectarShort(s, key)) return 'poor';
  if ((s.trayCd[key] ?? 0) > 0) return 'cooldown';
  s.nectar -= def.cost;
  s.trayCd[key] = def.recharge;
  const f: FloraEnt = {
    id: s.nextId++,
    key,
    lane,
    col,
    hp: def.hp,
    maxHp: def.hp,
    atkT: def.attack ? def.attack.interval * 0.4 : 0, // first shot comes a little early
    prodT: def.produce ? def.produce.interval : 0,
    flash: 0,
    fired: 0,
    prod: 0,
    eatenBy: null,
  };
  s.grid[lane][col] = f;
  s.placedCount++;
  pushFx(s, 'place', lane, col + 0.5, 0.45);
  s.events.push('place');
  return 'ok';
}

function nectarShort(s: GameState, key: FloraKey): boolean {
  return s.nectar < FLORA[key].cost;
}

export function shovelAt(s: GameState, lane: number, col: number): boolean {
  if (s.status !== 'playing') return false;
  const f = s.grid[lane]?.[col];
  if (!f) return false;
  s.grid[lane][col] = null;
  pushFx(s, 'shovel', lane, col + 0.5, 0.4);
  s.events.push('shovel');
  return true;
}

// ─── Combat helpers ─────────────────────────────────────────────────────────
function damageEnemy(s: GameState, e: EnemyEnt, dmg: number, slowPct = 0, slowDur = 0) {
  if (e.hp <= 0) return;
  // Carapace: shell drinks 50% of each hit until depleted.
  if (e.shell > 0) {
    const absorbed = Math.min(e.shell, dmg * 0.5);
    e.shell -= absorbed;
    e.hp -= dmg - absorbed;
  } else {
    e.hp -= dmg;
  }
  if (slowPct > 0) {
    e.slowPct = Math.max(e.slowPct, slowPct);
    e.slowUntil = s.t + slowDur;
  }
  e.hitFlash = 0.14;
  if (e.hp <= 0) killEnemy(s, e);
}

function killEnemy(s: GameState, e: EnemyEnt, quiet = false) {
  const idx = s.enemies.indexOf(e);
  if (idx === -1) return;
  s.enemies.splice(idx, 1);
  s.kills++;
  if (!quiet) {
    pushFx(s, 'sporeburst', e.lane, e.x, 0.5);
    s.events.push('kill');
  }
  if (e.key === 'brute' && !quiet) {
    // splits into two skitter swarms (3 + 3) bursting from the corpse
    for (let i = 0; i < 6; i++) {
      spawnEnemy(s, 'skitter', e.lane, Math.min(COLS + 0.3, e.x + 0.35 + (i % 3) * 0.32 + (i >= 3 ? 0.5 : 0)));
    }
    s.events.push('split');
  }
  if (e.key === 'colossus') s.events.push('bossdead');
}

function findTarget(s: GameState, f: FloraEnt): EnemyEnt | null {
  const atk = FLORA[f.key].attack!;
  let bestFlyer: EnemyEnt | null = null;
  let bestGround: EnemyEnt | null = null;
  for (const e of s.enemies) {
    if (e.lane !== f.lane) continue;
    if (e.x - FRONT_OFF <= f.col + 0.1) continue; // already at/behind the plant
    if (e.x > COLS + 0.6) continue; // hasn't entered the board
    if (isFlying(e)) {
      if (!atk.fly) continue;
      if (!bestFlyer || e.x < bestFlyer.x) bestFlyer = e;
    } else {
      if (!bestGround || e.x < bestGround.x) bestGround = e;
    }
  }
  // anti-air flora prioritize flyers; pierce/volley just needs any ground target
  if (atk.fly) return bestFlyer ?? bestGround;
  return bestGround;
}

function fireProjectile(s: GameState, f: FloraEnt) {
  const atk = FLORA[f.key].attack!;
  const kind =
    f.key === 'thornvine' ? 'thorn'
    : f.key === 'cactus' ? 'spike'
    : f.key === 'frostcap' ? 'frost'
    : 'ray';
  s.projs.push({
    id: s.nextId++,
    lane: f.lane,
    x: f.col + 0.75,
    prevX: f.col + 0.75,
    dmg: atk.dmg,
    pierce: !!atk.pierce,
    fly: !!atk.fly,
    slowPct: atk.slowPct ?? 0,
    slowDur: atk.slowDur ?? 0,
    kind,
    hitIds: new Set(),
  });
  f.fired = 0.16;
  s.events.push(kind === 'thorn' ? 'shoot' : kind);
}

// ─── Main step ──────────────────────────────────────────────────────────────
export function stepGame(s: GameState) {
  if (s.status !== 'playing') return;
  s.t += TICK;
  s.tick++;

  // passive nectar
  s.nectarT -= TICK;
  if (s.nectarT <= 0) {
    s.nectarT += PASSIVE_PERIOD;
    s.nectar += PASSIVE_INCOME;
    pushFx(s, 'income', 2, -0.6, 1.1, `+${PASSIVE_INCOME}`);
    s.events.push('income');
  }

  // tray recharges
  for (const k of s.loadout) {
    if (s.trayCd[k] > 0) s.trayCd[k] = Math.max(0, s.trayCd[k] - TICK);
  }

  // wave schedule
  while (s.pending.length && s.pending[0].at <= s.t) {
    const p = s.pending.shift()!;
    spawnEnemy(s, p.type, p.lane);
    if (s.waveAlert !== p.wave) {
      s.waveAlert = p.wave;
      s.events.push(p.wave === s.waveTotal - 1 ? 'warnfinal' : 'warn');
    }
  }
  // incoming-wave banner (only for waves that haven't started yet)
  if (s.pending.length) {
    const nextWave = s.pending[0].wave;
    const dt = s.pending[0].at - s.t;
    if (dt <= 4 && dt > 0 && nextWave > s.waveAlert) {
      s.warnWave = nextWave;
      s.waveAlertT = Math.max(s.waveAlertT, dt);
    }
  }
  if (s.waveAlertT > 0) s.waveAlertT -= TICK;

  // ── Flora ──
  for (let l = 0; l < LANES; l++) {
    for (let c = 0; c < COLS; c++) {
      const f = s.grid[l][c];
      if (!f) continue;
      if (f.flash > 0) f.flash -= TICK;
      if (f.fired > 0) f.fired -= TICK;
      if (f.prod > 0) f.prod -= TICK;
      f.eatenBy = null;
      const def = FLORA[f.key];
      if (def.produce) {
        f.prodT -= TICK;
        if (f.prodT <= 0) {
          f.prodT += def.produce.interval;
          s.nectar += def.produce.amount;
          f.prod = 0.7;
          pushFx(s, 'nectar', l, c + 0.5, 1.0, `+${def.produce.amount}`);
          s.events.push('produce');
        }
      }
      if (def.attack) {
        const target = findTarget(s, f);
        if (target) {
          f.atkT -= TICK;
          if (f.atkT <= 0) {
            f.atkT += def.attack.interval;
            fireProjectile(s, f);
          }
        } else {
          // stay at most half-charged while idle (no full latch)
          f.atkT = Math.min(f.atkT, def.attack.interval * 0.5);
        }
      }
    }
  }

  // ── Enemies: movement, queueing, chewing ──
  for (let l = 0; l < LANES; l++) {
    const ground = s.enemies
      .filter((e) => e.lane === l && !isFlying(e))
      .sort((a, b) => a.x - b.x);
    const flyers = s.enemies
      .filter((e) => e.lane === l && isFlying(e))
      .sort((a, b) => a.x - b.x);

    let laneChewed = false; // only the frontmost attacker chews per lane
    for (let i = 0; i < ground.length; i++) {
      const e = ground[i];
      let stop = -Infinity;
      // conga line: keep spacing behind the enemy ahead
      if (i > 0) stop = ground[i - 1].x + ENEMIES[e.key].spacing;
      // blocking flora: nearest plant at or ahead of the mouth
      const mouth = e.x - FRONT_OFF;
      let blockCol = -1;
      if (mouth < COLS) {
        for (let c = Math.min(COLS - 1, Math.floor(mouth)); c >= 0; c--) {
          if (s.grid[l][c]) {
            blockCol = c;
            break;
          }
        }
      }
      let blocked = false;
      if (blockCol >= 0) {
        const edgeX = blockCol + 1 + FRONT_OFF + 0.05; // stand-off line just right of the plant
        stop = Math.max(stop, Math.min(edgeX, e.x)); // clamped: never snaps enemy backward
        blocked = mouth <= blockCol + 1 + 0.12;
      }
      e.prevX = e.x;
      const slowMul = e.slowUntil > s.t ? 1 - e.slowPct : 1;
      const phaseMul = e.key === 'colossus' ? [0, 1, 1.4, 1.85][e.phase] : 1;
      const spd = ENEMIES[e.key].speed * slowMul * phaseMul;
      e.x = Math.max(stop, e.x - spd * TICK);
      e.chewing = false;
      if (blocked && blockCol >= 0) {
        const f = s.grid[l][blockCol];
        if (f && !laneChewed) {
          laneChewed = true;
          e.chewing = true;
          f.eatenBy = e.id;
          e.atkT -= TICK;
          if (e.atkT <= 0) {
            e.atkT += ENEMIES[e.key].atkInterval;
            f.hp -= ENEMIES[e.key].dmg;
            f.flash = 0.2;
            s.events.push('chomp');
            if (f.hp <= 0) {
              s.grid[l][f.col] = null;
              pushFx(s, 'sporeburst', l, f.col + 0.5, 0.5);
              s.events.push('plantdie');
            }
          }
        }
      } else {
        e.atkT = Math.min(e.atkT, ENEMIES[e.key].atkInterval * 0.6);
      }
    }
    for (let i = 0; i < flyers.length; i++) {
      const e = flyers[i];
      e.prevX = e.x;
      const stop = i > 0 ? flyers[i - 1].x + ENEMIES[e.key].spacing : -Infinity;
      e.x = Math.max(stop, e.x - ENEMIES[e.key].speed * TICK);
      e.chewing = false;
    }
  }

  // ── Root Snare / defeat ──
  for (const e of [...s.enemies]) {
    if (e.x - FRONT_OFF > SNARE_LINE) continue;
    const l = e.lane;
    if (s.snares[l]) {
      s.snares[l] = false;
      s.snareFx[l] = 1.4;
      for (const o of [...s.enemies]) if (o.lane === l) killEnemy(s, o, true);
      pushFx(s, 'snare', l, 2, 1.2);
      s.shake = 0.55;
      s.events.push('snare');
    } else {
      s.status = 'lost';
      s.lostLane = l;
      s.shake = 0.8;
      s.events.push('lose');
      return;
    }
  }

  // ── Boss behaviors ──
  for (const e of s.enemies) {
    if (e.key !== 'colossus') continue;
    const frac = e.hp / e.maxHp;
    const phase = frac > 2 / 3 ? 1 : frac > 1 / 3 ? 2 : 3;
    if (phase !== e.phase) {
      e.phase = phase;
      pushFx(s, 'shockwave', e.lane, e.x - 0.5, 0.9);
      s.shake = Math.max(s.shake, 0.4);
      s.events.push('phase');
      // phase break burst
      for (let i = 0; i < 2; i++) {
        spawnEnemy(s, 'skitter', Math.floor(rand(s) * LANES));
      }
    }
    e.addT -= TICK;
    if (e.addT <= 0) {
      e.addT = [0, 9, 6.5, 4.5][e.phase];
      const pool = s.level.addPool;
      spawnEnemy(s, pool[Math.floor(rand(s) * pool.length)], Math.floor(rand(s) * LANES));
      if (e.phase === 3) {
        spawnEnemy(s, pool[Math.floor(rand(s) * pool.length)], Math.floor(rand(s) * LANES));
      }
      s.events.push('bossadd');
    }
  }

  // ── Projectiles ──
  for (let i = s.projs.length - 1; i >= 0; i--) {
    const p = s.projs[i];
    p.prevX = p.x;
    p.x += PROJ_SPEED * TICK;
    const lo = Math.min(p.prevX, p.x) - 0.2;
    const hi = Math.max(p.prevX, p.x) + 0.2;
    let hitSomething = false;
    if (p.pierce) {
      for (const e of [...s.enemies]) {
        if (e.lane !== p.lane || p.hitIds.has(e.id)) continue;
        if (isFlying(e) && !p.fly) continue;
        if (e.x + 0.3 >= lo && e.x - FRONT_OFF <= hi) {
          p.hitIds.add(e.id);
          damageEnemy(s, e, p.dmg, p.slowPct, p.slowDur);
          s.events.push('hit');
        }
      }
    } else {
      let best: EnemyEnt | null = null;
      for (const e of s.enemies) {
        if (e.lane !== p.lane) continue;
        if (isFlying(e) && !p.fly) continue;
        if (e.x + 0.3 >= lo && e.x - FRONT_OFF <= hi) {
          if (!best || e.x < best.x) best = e;
        }
      }
      if (best) {
        if (p.kind === 'frost') pushFx(s, 'splash', p.lane, best.x, 0.4);
        damageEnemy(s, best, p.dmg, p.slowPct, p.slowDur);
        s.events.push('hit');
        hitSomething = true;
      }
    }
    if (hitSomething || p.x > COLS + 0.8) s.projs.splice(i, 1);
  }

  // ── Timers, fx, endings ──
  for (let i = s.fx.length - 1; i >= 0; i--) {
    s.fx[i].ttl -= TICK;
    if (s.fx[i].ttl <= 0) s.fx.splice(i, 1);
  }
  for (let l = 0; l < LANES; l++) if (s.snareFx[l] > 0) s.snareFx[l] -= TICK;
  for (const e of s.enemies) if (e.hitFlash > 0) e.hitFlash -= TICK;
  if (s.shake > 0) s.shake -= TICK;

  if (s.pending.length === 0 && s.enemies.length === 0 && s.status === 'playing') {
    s.status = 'won';
    s.events.push('win');
  }
}

// ─── Queries for UI ─────────────────────────────────────────────────────────
export function levelEnemyIntel(level: LevelDef): EnemyKey[] {
  const set = new Set<EnemyKey>();
  for (const w of level.waves) for (const g of w.groups) set.add(g.type);
  return ENEMY_SORT.filter((k) => set.has(k));
}
const ENEMY_SORT: EnemyKey[] = ['gnat', 'skitter', 'beetle', 'warden', 'drifter', 'brute', 'colossus'];

export function totalEnemies(level: LevelDef): number {
  return level.waves.reduce((n, w) => n + w.groups.reduce((m, g) => m + g.count, 0), 0);
}

export { TICK, LANES, COLS };
