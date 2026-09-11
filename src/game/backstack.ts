/**
 * The app's back stack.
 *
 * Every dismissible surface — a modal, a dialog, a sub-page, the pause menu —
 * registers one *layer* here. Escape and the system back button (Android
 * hardware back, a browser back gesture, or the PWA's back affordance) both
 * resolve to "close the top layer", so a keyboard player and a phone player
 * walk backwards through the app the exact same way.
 *
 * Layers are ordered by `priority` (modals above screens) and, within the same
 * priority, most-recently-mounted first. That matters because React runs child
 * effects before parent ones: a dialog mounted inside a screen would otherwise
 * register *before* the screen and be skipped.
 *
 * History mirroring
 * -----------------
 * A layer also pushes one real browser history entry so the OS back button
 * works. Entries are reconciled against the number of registered layers on the
 * next task, which keeps React's double-invoked effects in development from
 * corrupting the depth count, and every bookkeeping pop is flagged so it can't
 * be mistaken for a user pressing back.
 */
import { useEffect, useRef } from 'react';

/**
 * Layering constants. Higher wins; within the same level the newest mounts
 * first. Screens sit at the bottom, dialogs (confirm / codex entry) on top.
 */
export const BACK_PRIORITY = {
  screen: 0,
  overlay: 10,
  modal: 15,
  dialog: 20,
  nested: 25,
} as const;

interface Layer {
  id: number;
  priority: number;
  close: () => void;
  /** Set when a back press (rather than the UI) closed this layer. */
  consumed: boolean;
}

const IS_BROWSER = typeof window !== 'undefined';

const layers: Layer[] = [];
let seq = 0;

/** History entries this module has pushed and not yet popped. */
let owned = 0;
/** Pops we triggered ourselves via Escape — they still dispatch. */
let unwinding = 0;
/** Bookkeeping pops that must stay silent. */
let silent = 0;
/** Are we in history-mirroring mode? Disabled if the History API is blocked. */
let historyOk = IS_BROWSER;

let bound = false;

function bind() {
  if (bound || !IS_BROWSER) return;
  bound = true;
  window.addEventListener('popstate', onPop);
  try {
    // Name the entry we start on so every push has something beneath it.
    window.history.replaceState({ ...( window.history.state ?? {}), hw: true }, '');
  } catch {
    historyOk = false;
  }
}

function onPop() {
  owned = Math.max(0, owned - 1);
  if (silent > 0) {
    silent--;
    return;
  }
  if (unwinding > 0) unwinding--;
  dispatchBack();
}

/** Active layer with the highest priority; ties go to the newest. */
function topLayer(): Layer | null {
  let best: Layer | null = null;
  for (const l of layers) {
    if (!best) { best = l; continue; }
    if (l.priority > best.priority || (l.priority === best.priority && l.id > best.id)) best = l;
  }
  return best;
}

function dispatchBack() {
  const top = topLayer();
  if (!top) return;
  top.consumed = true;
  top.close();
}

/** Bring the real history depth in line with the registered layer count. */
function syncNow() {
  if (!IS_BROWSER || !historyOk) return;
  const want = layers.length;
  if (want === owned) return;
  if (want > owned) {
    try {
      for (let i = owned; i < want; i++) window.history.pushState({ hw: true }, '');
      owned = want;
    } catch {
      historyOk = false;
    }
  } else {
    // A few entries to drop (a screen closed by other means) — drop them
    // quietly so the bookkeeping pop isn't mistaken for a back press.
    const drop = owned - want;
    silent += drop;
    owned = want;
    try {
      window.history.go(-drop);
    } catch {
      silent -= drop;
      historyOk = false;
    }
  }
}

/**
 * Deferred so React's double-invoked development effects (mount → unmount →
 * mount inside one commit) don't push and pop an extra entry.
 */
let syncTimer: number | null = null;
function scheduleSync() {
  if (!IS_BROWSER || !historyOk) return;
  if (syncTimer !== null) return;
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    syncNow();
  }, 0);
}

/** Cancel a pending mirror and settle it now — used before walking back. */
function flushSync() {
  if (syncTimer === null) return;
  window.clearTimeout(syncTimer);
  syncTimer = null;
  syncNow();
}

function register(close: () => void, priority: number): Layer {
  bind();
  const layer: Layer = { id: ++seq, priority, close: () => close(), consumed: false };
  layers.push(layer);
  scheduleSync();
  return layer;
}

function unregister(layer: Layer) {
  const i = layers.indexOf(layer);
  if (i >= 0) layers.splice(i, 1);
  // Not closed by a back press: drop its history entry quietly.
  if (historyOk && !layer.consumed) scheduleSync();
}

/**
 * Ask to go back one step. Escape calls this; so does an explicit "back"
 * affordance that wants to unwind history rather than jump screens.
 */
export function requestBack(steps = 1) {
  if (!IS_BROWSER) return;
  const n = Math.max(1, Math.floor(steps));
  if (layers.length === 0) return;
  // A back press can arrive moments after a navigation, before the mirror has
  // pushed its entry. Settle it first, or the layer would close without one.
  flushSync();
  if (historyOk && owned >= n) {
    unwinding += n;
    try {
      window.history.go(-n);
      return;
    } catch {
      unwinding -= n;
      historyOk = false;
    }
  }
  for (let i = 0; i < n; i++) dispatchBack();
}

/** Number of live layers — used by screens that want to know if they can go back. */
export function backDepth() {
  return layers.length;
}

/**
 * Register the current surface. `close` is invoked by Escape or the system
 * back button; `active` toggles registration; `priority` decides who wins
 * (screens 0, modals 10, nested modals 20).
 */
export function useBackHandler(
  close: () => void,
  opts: { active?: boolean; priority?: number } = {},
) {
  const { active = true, priority = 0 } = opts;
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!active || !IS_BROWSER) return;
    const layer = register(() => closeRef.current(), priority);
    return () => unregister(layer);
  }, [active, priority]);
}

/** Global Escape dispatcher — driven by the same stack, so nothing double-fires. */
export function installBackKeys(): () => void {
  if (!IS_BROWSER) return () => {};
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (e.defaultPrevented) return;
    if (layers.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    requestBack();
  };
  window.addEventListener('keydown', onKey);
  bind();
  return () => window.removeEventListener('keydown', onKey);
}
