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
const EPROJ_SPEED = 5.2; // Locust Ranger spines
const SPAWN_X = 9.4;
const SNARE_LINE = 0.06;
const JUMP_TIME = 0.45; // Mite Vaulter leap duration
const IMP_STUN = 0.8; // Spore Imp landing recovery
const CATAPULT_WARN = 1.6; // seconds of telegraph before an imp lands
const THIEF_EXIT_X = COLS + 0.55; // off-board with the loot

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
    eprojs: [],
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
      const base = w.at + (g.startDelay ?? 0);
      if (g.catapult) {
        // Catapult salvo (Spore Imp): each shell picks its own lane and a
        // random back-half tile — it lands behind the front line, wall or not.
        for (let i = 0; i < g.count; i++) {
          const lane = Math.floor(rand(s) * LANES);
          const col = 1 + Math.floor(rand(s) * 4); // back half, cols 1..4
          const x = col + 0.25 + rand(s) * 0.5;
          s.pending.push({ at: base + i * g.gap, type: g.type, lane, wave: wi, x, catapult: true });
        }
        continue;
      }
      // pick one lane for this whole group (swarms attack a lane together)
      let lane = Math.floor(rand(s) * LANES);
      for (let tries = 0; tries < 4 && (groupLanes.includes(lane) || waveLastLane[wi] === lane); tries++) {
        lane = Math.floor(rand(s) * LANES);
      }
      groupLanes.push(lane);
      waveLastLane[wi] = lane;
      for (let i = 0; i < g.count; i++) {
        s.pending.push({ at: base + i * g.gap, type: g.type, lane, wave: wi });
      }
    }
  });
  s.pending.sort((a, b) => a.at - b.at);
  return s;
}

export function spawnEnemy(s: GameState, type: EnemyKey, lane: number, x = SPAWN_X, catapulted = false): EnemyEnt {
  const def = ENEMIES[type];
  const boss = !!def.boss;
  const hp = Math.round(def.hp * (boss || def.noScale ? 1 : s.level.hpMul));
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
    vaulted: false,
    jumpT: 0,
    jumpFrom: 0,
    jumpTo: 0,
    stone: def.stoneShield ?? 0,
    maxStone: def.stoneShield ?? 0,
    burrowed: def.burrowEmerge !== undefined && x > def.burrowEmerge,
    windup: 0,
    grabT: def.grabEvery ?? 0,
    carrying: null,
    carrySpd: 0,
    stunT: catapulted ? IMP_STUN : 0,
  };
  s.enemies.push(e);
  if (catapulted) {
    // impact: dust ring + a beat of screen shake, then it rights itself
    pushFx(s, 'land', lane, x, 0.6);
    s.shake = Math.max(s.shake, 0.25);
    s.events.push('land');
  }
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
function damageEnemy(s: GameState, e: EnemyEnt, dmg: number, slowPct = 0, slowDur = 0, aoe = false) {
  if (e.hp <= 0) return;
  // Stoneback Grub: the slab blocks 100% of incoming damage and only splash
  // (Cactus volleys, Frostcap spores) can wear it down. Single-target pings off.
  if (e.maxStone > 0 && e.stone > 0) {
    if (aoe) {
      e.stone = Math.max(0, e.stone - dmg);
      if (slowPct > 0) {
        e.slowPct = Math.max(e.slowPct, slowPct);
        e.slowUntil = s.t + slowDur;
      }
      e.hitFlash = 0.14;
      if (e.stone <= 0) {
        pushFx(s, 'shieldbreak', e.lane, e.x, 0.6);
        s.events.push('shieldbreak');
      }
    } else {
      pushFx(s, 'deflect', e.lane, e.x, 0.3);
      s.events.push('deflect');
    }
    return; // nothing reaches the body while the slab holds
  }
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
  // Root Thief dies mid-heist → the stolen Flora drops back into place, unharmed.
  if (e.carrying) {
    const f = e.carrying;
    e.carrying = null;
    let col = f.col;
    if (s.grid[e.lane][col]) {
      // tile was refilled while it was carried — drop at the nearest free tile
      col = -1;
      for (let d = 0; d < COLS && col < 0; d++) {
        if (f.col - d >= 0 && !s.grid[e.lane][f.col - d]) col = f.col - d;
        else if (f.col + d < COLS && !s.grid[e.lane][f.col + d]) col = f.col + d;
      }
    }
    if (col >= 0) {
      f.col = col;
      s.grid[e.lane][col] = f;
      f.flash = 0.25;
      pushFx(s, 'drop', e.lane, col + 0.5, 0.6);
      s.events.push('drop');
    }
    // a completely full lane lets the loot shatter — practically unreachable
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
    if (e.burrowed) continue; // Tunnel Larva: underground and untargetable
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
    aoe: !!atk.aoe,
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
  // incoming catapult shells get a tile telegraph shortly before they land
  for (const p of s.pending) {
    if (p.catapult && !p.warned && p.at - s.t <= CATAPULT_WARN) {
      p.warned = true;
      pushFx(s, 'cata', p.lane, p.x ?? 0, Math.max(0.3, p.at - s.t));
      s.events.push('cata');
    }
  }
  while (s.pending.length && s.pending[0].at <= s.t) {
    const p = s.pending.shift()!;
    if (p.catapult) spawnEnemy(s, p.type, p.lane, p.x ?? SPAWN_X, true);
    else spawnEnemy(s, p.type, p.lane);
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
      const def = ENEMIES[e.key];
      e.prevX = e.x;

      // ── Mite Vaulter mid-leap: scripted arc — no spacing, no blocking, no biting
      if (e.jumpT > 0) {
        e.jumpT = Math.max(0, e.jumpT - TICK);
        const prog = 1 - e.jumpT / JUMP_TIME;
        e.x = e.jumpFrom + (e.jumpTo - e.jumpFrom) * prog;
        e.chewing = false;
        if (e.jumpT === 0) {
          pushFx(s, 'dirt', l, e.x, 0.45);
          s.events.push('vault');
        }
        continue;
      }

      // ── Spore Imp: sprawled where it landed, briefly harmless
      if (e.stunT > 0) {
        e.stunT -= TICK;
        e.chewing = false;
        continue;
      }

      // ── Root Thief hauling loot: sprints for the right edge, ignoring everything
      if (e.carrying) {
        const slowMul = e.slowUntil > s.t ? 1 - e.slowPct : 1;
        e.x += e.carrySpd * slowMul * TICK;
        e.chewing = false;
        if (e.x > THIEF_EXIT_X) {
          const idx = s.enemies.indexOf(e);
          if (idx !== -1) s.enemies.splice(idx, 1);
          pushFx(s, 'stolen', l, COLS, 1.2);
          s.events.push('stolen');
        }
        continue;
      }

      let stop = -Infinity;
      // conga line: keep spacing behind the enemy ahead
      if (i > 0) stop = ground[i - 1].x + def.spacing;
      // blocking flora: nearest plant at or ahead of the mouth
      // (burrowed Tunnel Larva pass straight through)
      const mouth = e.x - FRONT_OFF;
      let blockCol = -1;
      if (!e.burrowed && mouth < COLS) {
        for (let c = Math.min(COLS - 1, Math.floor(mouth)); c >= 0; c--) {
          if (s.grid[l][c]) {
            blockCol = c;
            break;
          }
        }
      }
      let blocked = false;
      let inRange = false; // Locust Ranger firing solution
      if (blockCol >= 0) {
        const range = def.ranged ?? 0;
        const edgeX = blockCol + 1 + range + FRONT_OFF + 0.05; // stand-off (ranged units halt farther out)
        stop = Math.max(stop, Math.min(edgeX, e.x)); // clamped: never snaps enemy backward
        blocked = mouth <= blockCol + 1 + 0.12;
        inRange = range > 0 && mouth <= blockCol + 1 + range + 0.12;
      }
      const slowMul = e.slowUntil > s.t ? 1 - e.slowPct : 1;
      const phaseMul = e.key === 'colossus' ? [0, 1, 1.4, 1.85][e.phase] : 1;
      const spd = def.speed * slowMul * phaseMul;
      e.x = Math.max(stop, e.x - spd * TICK);

      // ── Tunnel Larva surfacing: dirt, dust, and now it can be hurt
      if (def.burrowEmerge !== undefined) {
        const nowBurrowed = e.x > def.burrowEmerge;
        if (e.burrowed && !nowBurrowed) {
          pushFx(s, 'emerge', l, e.x, 0.7);
          s.shake = Math.max(s.shake, 0.18);
          s.events.push('emerge');
        }
        e.burrowed = nowBurrowed;
      }
      if (e.burrowed) {
        e.chewing = false;
        continue; // underground: untouchable and unstoppable
      }

      e.chewing = false;

      // ── Mite Vaulter: first contact with a Flora triggers the leap (once ever)
      if (def.vault && !e.vaulted && blocked && blockCol >= 0) {
        e.vaulted = true;
        e.jumpFrom = e.x;
        e.jumpTo = Math.max(blockCol - 0.5, 0.45); // one tile past the wall, clamped on-board
        e.jumpT = JUMP_TIME;
        s.events.push('jump');
        continue;
      }

      // ── Gargant Husk: no chewing — a telegraphed smash that kills in one hit
      if (def.smashWindup) {
        const f = blockCol >= 0 ? s.grid[l][blockCol] : null;
        if (f && blocked && !laneChewed) {
          laneChewed = true;
          e.chewing = true; // drives the wind-up pose
          f.eatenBy = e.id;
          if (e.windup === 0) s.events.push('windup');
          const chill = e.slowUntil > s.t ? 1 - e.slowPct : 1; // frost drags the swing out
          e.windup += TICK * chill;
          if (e.windup >= def.smashWindup) {
            s.grid[l][f.col] = null; // obliterated regardless of remaining HP
            pushFx(s, 'smash', l, f.col + 0.5, 0.7);
            s.shake = Math.max(s.shake, 0.5);
            s.events.push('smash');
            s.events.push('plantdie');
            e.windup = 0;
          }
        } else {
          e.windup = 0; // nothing under its fists — reset the swing
        }
        continue;
      }

      // ── Locust Ranger: halts up to 2 tiles out and fires spines at the nearest Flora
      if (def.ranged) {
        const f = blockCol >= 0 ? s.grid[l][blockCol] : null;
        if (f && inRange) {
          e.chewing = true; // aim pose
          e.atkT -= TICK;
          if (e.atkT <= 0) {
            e.atkT += def.atkInterval;
            s.eprojs.push({
              id: s.nextId++,
              lane: l,
              x: e.x - 0.3,
              prevX: e.x - 0.3,
              col: blockCol,
              targetId: f.id,
              dmg: def.dmg,
            });
            s.events.push('sting');
          }
        } else {
          e.atkT = Math.min(e.atkT, def.atkInterval * 0.6);
        }
        continue;
      }

      // ── Root Thief: never bites — on a timer it snatches the most wounded
      // Flora in the lane and bolts for the blight
      if (def.grabEvery) {
        e.grabT -= TICK;
        if (e.grabT <= 0) {
          e.grabT += def.grabEvery;
          let best: FloraEnt | null = null;
          for (const f of s.grid[l]) if (f && (!best || f.hp < best.hp)) best = f;
          if (best) {
            s.grid[l][best.col] = null;
            e.carrying = best;
            e.carrySpd = Math.min(3.2, Math.max(0.4, (THIEF_EXIT_X - e.x) / (def.escapeTime ?? 3)));
            pushFx(s, 'grab', l, best.col + 0.5, 0.6);
            s.events.push('grab');
          }
        }
        continue;
      }

      if (blocked && blockCol >= 0) {
        const f = s.grid[l][blockCol];
        if (f && !laneChewed) {
          laneChewed = true;
          e.chewing = true;
          f.eatenBy = e.id;
          e.atkT -= TICK;
          if (e.atkT <= 0) {
            e.atkT += def.atkInterval;
            f.hp -= def.dmg;
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
        e.atkT = Math.min(e.atkT, def.atkInterval * 0.6);
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
        if (e.burrowed) continue; // passes harmlessly over a Tunnel Larva
        if (isFlying(e) && !p.fly) continue;
        if (e.x + 0.3 >= lo && e.x - FRONT_OFF <= hi) {
          p.hitIds.add(e.id);
          damageEnemy(s, e, p.dmg, p.slowPct, p.slowDur, p.aoe);
          s.events.push('hit');
        }
      }
    } else {
      let best: EnemyEnt | null = null;
      for (const e of s.enemies) {
        if (e.lane !== p.lane) continue;
        if (e.burrowed) continue;
        if (isFlying(e) && !p.fly) continue;
        if (e.x + 0.3 >= lo && e.x - FRONT_OFF <= hi) {
          if (!best || e.x < best.x) best = e;
        }
      }
      if (best) {
        if (p.kind === 'frost') pushFx(s, 'splash', p.lane, best.x, 0.4);
        damageEnemy(s, best, p.dmg, p.slowPct, p.slowDur, p.aoe);
        s.events.push('hit');
        hitSomething = true;
      }
    }
    if (hitSomething || p.x > COLS + 0.8) s.projs.splice(i, 1);
  }

  // ── Enemy spines (Locust Ranger) ──
  for (let i = s.eprojs.length - 1; i >= 0; i--) {
    const p = s.eprojs[i];
    p.prevX = p.x;
    p.x -= EPROJ_SPEED * TICK;
    if (p.x <= p.col + 0.92) {
      const f = s.grid[p.lane]?.[p.col];
      if (f && f.id === p.targetId) {
        f.hp -= p.dmg;
        f.flash = 0.2;
        s.events.push('chomp');
        if (f.hp <= 0) {
          s.grid[p.lane][p.col] = null;
          pushFx(s, 'sporeburst', p.lane, p.col + 0.5, 0.5);
          s.events.push('plantdie');
        }
      }
      s.eprojs.splice(i, 1); // dug up or destroyed mid-flight? the spine buries itself
    } else if (p.x < -0.5) {
      s.eprojs.splice(i, 1);
    }
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
const ENEMY_SORT: EnemyKey[] = [
  'gnat', 'skitter', 'beetle', 'warden', 'drifter',
  'vaulter', 'larva', 'grub', 'ranger', 'imp', 'thief', 'husk',
  'brute', 'colossus',
];

export function totalEnemies(level: LevelDef): number {
  return level.waves.reduce((n, w) => n + w.groups.reduce((m, g) => m + g.count, 0), 0);
}

export { TICK, LANES, COLS };
