import { LEVELS, discoveriesForLevel } from './data';
import { starsForLevel, type EnemyKey, type FloraKey } from './types';

const KEY = 'heartwood-defense-save-v1';

/**
 * Field Guide entries the player has already been shown. This only ever grows:
 * a New Game wipes the campaign but keeps the guide filled in, so the shapes
 * you have met stay recorded.
 */
export interface Codex {
  flora: string[];
  enemies: string[];
}

export interface SaveData {
  maxLevel: number; // highest unlocked level id (0-based)
  stars: Record<number, number>;
  muted: boolean;
  codex: Codex;
}

export const DEFAULT_SAVE: SaveData = { maxLevel: 0, stars: {}, muted: false, codex: { flora: [], enemies: [] } };

function normCodex(c: Partial<Codex> | undefined): Codex {
  return {
    flora: Array.isArray(c?.flora) ? c!.flora.filter((x): x is string => typeof x === 'string') : [],
    enemies: Array.isArray(c?.enemies) ? c!.enemies.filter((x): x is string => typeof x === 'string') : [],
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE, codex: { flora: [], enemies: [] } };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      stars: parsed.stars ?? {},
      codex: normCodex(parsed.codex),
    };
  } catch {
    return { ...DEFAULT_SAVE, codex: { flora: [], enemies: [] } };
  }
}

export function persist(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode etc. */
  }
}

/**
 * Record everything a level's intel reveals. Returns the same object when
 * there is nothing new, so callers can setState with it every time a level is
 * opened without churning the save.
 */
export function discoverLevel(save: SaveData, levelId: number): SaveData {
  const found = discoveriesForLevel(levelId);
  const flora = [...save.codex.flora];
  const enemies = [...save.codex.enemies];
  let changed = false;
  for (const f of found.flora) if (!flora.includes(f)) { flora.push(f); changed = true; }
  for (const e of found.enemies) if (!enemies.includes(e)) { enemies.push(e); changed = true; }
  if (!changed) return save;
  const next: SaveData = { ...save, codex: { flora, enemies } };
  persist(next);
  return next;
}

export function recordWin(save: SaveData, levelId: number, snaresLeft: number): SaveData {
  const stars = starsForLevel(LEVELS[levelId], snaresLeft);
  const discovered = discoverLevel(save, levelId);
  const next: SaveData = {
    ...discovered,
    maxLevel: Math.max(save.maxLevel, Math.min(LEVELS.length - 1, levelId + 1)),
    stars: { ...save.stars, [levelId]: Math.max(save.stars[levelId] ?? 0, stars) },
  };
  persist(next);
  return next;
}

/** New Game: campaign progress goes, audio setting and the Field Guide stay. */
export function resetProgress(save: SaveData): SaveData {
  const next: SaveData = { maxLevel: 0, stars: {}, muted: save.muted, codex: save.codex };
  persist(next);
  return next;
}

export function setMuted(save: SaveData, muted: boolean): SaveData {
  const next = { ...save, muted };
  persist(next);
  return next;
}

/** The first level that has not been cleared yet (what CONTINUE resumes into). */
export function resumeLevelId(save: SaveData): number {
  for (let id = 0; id < LEVELS.length; id++) if (!save.stars[id]) return Math.min(id, LEVELS.length - 1);
  return LEVELS.length - 1;
}

/** Total stars collected across the campaign (max 3 per level). */
export function totalStars(save: SaveData): number {
  return Object.values(save.stars).reduce((n, s) => n + (s ?? 0), 0);
}

export function levelsCleared(save: SaveData): number {
  return Object.keys(save.stars).filter((k) => (save.stars[Number(k)] ?? 0) > 0).length;
}

/**
 * What the Field Guide may show in full: anything the player's progress has
 * reached, plus anything already recorded in the codex. Everything else is
 * drawn as a silhouette.
 */
export function codexFlora(save: SaveData): Set<FloraKey> {
  const out = new Set<FloraKey>(discoveriesForLevel(save.maxLevel).flora);
  for (const f of save.codex.flora) out.add(f as FloraKey);
  return out;
}

export function codexEnemies(save: SaveData): Set<EnemyKey> {
  const out = new Set<EnemyKey>(discoveriesForLevel(save.maxLevel).enemies);
  for (const e of save.codex.enemies) out.add(e as EnemyKey);
  return out;
}
