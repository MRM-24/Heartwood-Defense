import { LEVELS } from './data';
import { starsForLevel } from './types';

const KEY = 'heartwood-defense-save-v1';

export interface SaveData {
  maxLevel: number; // highest unlocked level id (0-based)
  stars: Record<number, number>;
  muted: boolean;
}

export const DEFAULT_SAVE: SaveData = { maxLevel: 0, stars: {}, muted: false };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return { ...DEFAULT_SAVE, ...parsed, stars: parsed.stars ?? {} };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function persist(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode etc. */
  }
}

export function recordWin(save: SaveData, levelId: number, snaresLeft: number): SaveData {
  const stars = starsForLevel(LEVELS[levelId], snaresLeft);
  const next: SaveData = {
    ...save,
    maxLevel: Math.max(save.maxLevel, Math.min(LEVELS.length - 1, levelId + 1)),
    stars: { ...save.stars, [levelId]: Math.max(save.stars[levelId] ?? 0, stars) },
  };
  persist(next);
  return next;
}

export function setMuted(save: SaveData, muted: boolean): SaveData {
  const next = { ...save, muted };
  persist(next);
  return next;
}
