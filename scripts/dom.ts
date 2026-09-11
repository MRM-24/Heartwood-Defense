/**
 * Runtime smoke test: mounts the real app in a DOM, then drives it the way a
 * player would — clicks, Escape, arrow keys, the Android back gesture — and
 * asserts that navigation, the click-sound layer, focus movement and the
 * history mirror all behave.
 *
 *   npm i --no-save jsdom
 *   npx esbuild scripts/dom.ts --bundle --platform=node --format=cjs \
 *     --loader:.tsx=tsx --jsx=automatic --external:jsdom --outfile=/tmp/dom.cjs
 *   NODE_PATH=$PWD/node_modules node /tmp/dom.cjs
 *
 * jsdom is a dev-only dependency of this harness; it is not needed to build or
 * play the game.
 */
import { JSDOM } from 'jsdom';

// ── environment ─────────────────────────────────────────────────────────────
const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div><div id="boot"></div></body></html>',
  { url: 'https://heartwood.test/', pretendToBeVisual: true },
);
const { window } = dom;

/** Node 22 ships some of these as getter-only globals, so define, don't assign. */
function define(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

/** Flip this to make the app believe it is on a phone (max-width breakpoints). */
let compactViewport = false;
/** Flip this to make the app believe it is a phone held in landscape. */
let landscapeViewport = false;
const noopMql = (query: string) => ({
  get matches() {
    if (landscapeViewport && /orientation: landscape/.test(query)) return true;
    return compactViewport && /max-width/.test(query);
  },
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});
(window as unknown as { matchMedia: typeof noopMql }).matchMedia = noopMql;
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
Object.defineProperty(window.navigator, 'vibrate', { value: () => true, configurable: true });
Object.defineProperty(window.navigator, 'serviceWorker', { value: undefined, configurable: true });

define('window', window);
define('document', window.document);
define('navigator', window.navigator);
define('HTMLElement', window.HTMLElement);
define('Element', window.Element);
define('Node', window.Node);
define('Event', window.Event);
define('KeyboardEvent', window.KeyboardEvent);
define('PointerEvent', window.PointerEvent ?? window.MouseEvent);
define('ResizeObserver', FakeResizeObserver);
define('requestAnimationFrame', (cb: FrameRequestCallback) => window.setTimeout(() => cb(Date.now()), 0) as unknown as number);
define('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
define('getComputedStyle', window.getComputedStyle.bind(window));
// (Node's own global `performance` is left alone — jsdom's recurses when aliased.)

/* jsdom performs no layout: every rect is 0×0 and offsetParent is always null,
   which would make the visibility and arrow-navigation maths no-ops. Faking a
   simple flowing layout keeps those code paths honest. */
let boxIndex = 0;
const boxes = new WeakMap<Element, { x: number; y: number; w: number; h: number }>();
Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', {
  get(this: HTMLElement) {
    return this === window.document.body ? null : window.document.body;
  },
  configurable: true,
});
window.Element.prototype.getBoundingClientRect = function (this: Element) {
  let b = boxes.get(this);
  if (!b) {
    b = { x: (boxIndex % 3) * 200, y: Math.floor(boxIndex / 3) * 60, w: 160, h: 44 };
    boxIndex++;
    boxes.set(this, b);
  }
  return {
    ...b,
    left: b.x,
    top: b.y,
    right: b.x + b.w,
    bottom: b.y + b.h,
    width: b.w,
    height: b.h,
    toJSON: () => b,
  } as DOMRect;
};

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A counting AudioContext: every voice the synth builds is tallied, so
// "did that tap make a sound?" is answerable without real audio.
let audioNodes = 0;
const param = () => ({
  value: 0,
  setValueAtTime: () => {},
  linearRampToValueAtTime: () => {},
  exponentialRampToValueAtTime: () => {},
  setTargetAtTime: () => {},
});
class FakeNode {
  connect(n: unknown) {
    return n;
  }
  start() {}
  stop() {}
}
class FakeAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  state = 'running';
  destination = {};
  createGain() {
    return Object.assign(new FakeNode(), { gain: param() });
  }
  createOscillator() {
    audioNodes++;
    return Object.assign(new FakeNode(), { frequency: param(), detune: { value: 0 }, type: 'sine' });
  }
  createBufferSource() {
    audioNodes++;
    return Object.assign(new FakeNode(), { buffer: null });
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(64) };
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(), { type: 'lowpass', frequency: { value: 0 }, Q: { value: 0 } });
  }
  createDelay() {
    return Object.assign(new FakeNode(), { delayTime: { value: 0 } });
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}
define('AudioContext', FakeAudioContext);
(window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;

// ── harness ─────────────────────────────────────────────────────────────────
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react');
const App = require('../src/App').default;
const { installBackKeys, requestBack } = require('../src/game/backstack');
const { installUiSounds } = require('../src/game/uiSound');
const { dropBootSplash } = require('../src/game/pwa');

let failures = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ FAIL ${name}: ${(e as Error).message}`);
  }
}
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = createRoot(window.document.getElementById('root')!);
const cleanups: (() => void)[] = [installBackKeys(), installUiSounds()];

const text = () => window.document.body.textContent ?? '';
const buttons = () => Array.from(window.document.querySelectorAll('button'));
/** Find a button by aria-label (prefix) or visible text, case-insensitively. */
const byLabel = (label: string) => {
  const needle = label.toLowerCase();
  return buttons().find(
    (b) =>
      (b.getAttribute('aria-label') ?? '').toLowerCase().startsWith(needle) ||
      (b.textContent ?? '').trim().toLowerCase().includes(needle),
  );
};
const click = (el: Element | undefined, name: string) => {
  assert(el, `no button found for ${name}`);
  act(() => {
    el!.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    el!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
};
const key = (k: string, on: EventTarget = window.document.activeElement ?? window.document.body) =>
  act(() => {
    on.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  });
/** Let queued tasks run (history.go, the history-mirror timer, rAF shims). */
const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms));

async function main() {
  act(() => {
    root.render(React.createElement(App));
  });
  await tick();

  check('boot splash is removed after mount', () => {
    dropBootSplash();
  });
  await tick(700);
  check('…it is gone', () => {
    assert(!window.document.getElementById('boot'), 'boot splash still in the tree');
  });

  check('title screen renders', () => {
    assert(text().includes('HEARTWOOD'), 'title missing');
    assert(text().includes('BEGIN THE VIGIL'), 'primary CTA missing');
  });

  check('clicking a button makes a sound', () => {
    click(byLabel('Field guide'), 'FIELD GUIDE'); // first gesture also boots the music
    assert(text().includes('THE RULES'), 'guide did not open');
    audioNodes = 0;
    click(byLabel('UNDERSTOOD'), 'UNDERSTOOD');
    assert(audioNodes > 0, 'no audio voices were created for the click');
    assert(!text().includes('THE RULES'), 'UNDERSTOOD did not close the guide');
  });

  check('Escape reopens the guide and closes it again', () => {
    click(byLabel('Field guide'), 'FIELD GUIDE');
    key('Escape');
  });
  await tick();
  check('…back on the title', () => {
    assert(text().includes('BEGIN THE VIGIL') && !text().includes('THE RULES'), 'guide survived Escape');
  });

  check('world select opens and Escape backs out', () => {
    click(byLabel('Level select'), 'LEVEL SELECT');
    assert(text().includes('Five Worlds of the Vale'), 'world select did not open');
    key('Escape');
  });
  await tick();
  check('…back on the title', () => {
    assert(text().includes('BEGIN THE VIGIL'), 'Escape did not return to the title');
  });

  check('deep chain: world → level → loadout', () => {
    click(byLabel('Level select'), 'LEVEL SELECT');
    click(byLabel('World 1'), 'WORLD 1');
    assert(text().includes('Hold the Vale'), 'level select did not open');
    click(byLabel('First Bloom') ?? byLabel('1-1'), 'level 1-1');
    assert(text().includes('Choose Your Flora'), 'loadout did not open');
  });

  check('back unwinds one layer at a time', () => key('Escape'));
  await tick();
  check('…loadout → level select', () => {
    assert(text().includes('Hold the Vale'), 'Escape left the loadout');
    requestBack();
  });
  await tick();
  check('…level select → world select', () => {
    assert(text().includes('Five Worlds of the Vale'), 'requestBack did not unwind the level screen');
    key('Escape');
  });
  await tick(80);
  check('…world select → title', () => {
    assert(text().includes('BEGIN THE VIGIL'), 'final Escape did not reach the title');
  });

  check('arrow keys move focus through the menu', () => {
    const first = window.document.activeElement;
    key('ArrowDown', byLabel('Field guide'));
    const after = window.document.activeElement;
    assert(after && after !== first, 'focus did not move on ArrowDown');
  });

  check('the focused button activates on Enter', () => {
    const target = byLabel('Level select');
    (target as HTMLElement).focus();
    const focused = window.document.activeElement;
    assert(focused === target, 'LEVEL SELECT did not take focus');
  });
  // Enter on a focused button produces a click in the browser; jsdom doesn't
  // synthesise one, so drive the same path the click layer listens to.
  act(() => {
    byLabel('Level select')!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  await tick();
  check('…and it navigated', () => {
    assert(text().includes('Five Worlds of the Vale'), 'activating LEVEL SELECT did not navigate');
    key('Escape');
  });
  await tick();
  check('…back on the title', () => {
    assert(text().includes('BEGIN THE VIGIL'), 'Escape did not return to the title');
  });

  check('NEW GAME on a fresh profile skips the dialog and opens 1-1', () => {
    click(byLabel('NEW GAME'), 'NEW GAME');
    assert(text().includes('Choose Your Flora'), 'NEW GAME did not start a fresh campaign');
  });

  check('back from the loadout lands on its level list', () => key('Escape'));
  await tick();
  check('…level select', () => {
    assert(text().includes('Hold the Vale'), 'loadout did not return to its level list');
    key('Escape');
  });
  await tick();
  check('…world select', () => {
    assert(text().includes('Five Worlds of the Vale'), 'level select did not return to world select');
    key('Escape');
  });
  await tick(80);
  check('…and the title', () => {
    assert(text().includes('BEGIN THE VIGIL'), 'world select did not return to the title');
  });

  // Count real pushes: `history.length` stops growing once the session history
  // is full of our own entries and back-navigation truncates forward ones.
  let pushes = 0;
  const realPush = window.history.pushState.bind(window.history);
  (window.history as unknown as { pushState: unknown }).pushState = (...args: unknown[]) => {
    pushes++;
    return (realPush as (...a: unknown[]) => void)(...args);
  };

  check('history is mirrored for the back gesture', () => {
    pushes = 0;
    click(byLabel('Level select'), 'LEVEL SELECT');
    assert(text().includes('Five Worlds of the Vale'), 'world select did not open');
  });
  await tick();
  check('…a history entry was pushed', () => {
    assert(pushes > 0, 'no history entry was pushed for the new screen');
  });

  check('…and the system back gesture closes it', () => {
    // What Android's back button / a browser back swipe dispatches.
    requestBack();
  });
  await tick();
  check('…world select closed without leaving the app', () => {
    assert(text().includes('BEGIN THE VIGIL'), 'system back did not return to the title');
  });

  // ── the battle screen at desktop width ────────────────────────────────────
  check('desktop layout: into a battle', () => {
    click(byLabel('Level select'), 'LEVEL SELECT');
    click(byLabel('World 1'), 'WORLD 1');
    click(byLabel('First Bloom') ?? byLabel('1-1'), 'level 1-1');
    click(byLabel('TO BATTLE'), 'TO BATTLE');
    assert(text().includes('PAUSE'), 'desktop HUD did not render');
  });

  check('desktop layout: the stage is scaled exactly once', () => {
    // Regression: the board used to carry its own scale() transform *and* sit
    // inside the stage wrapper's scale() — the field rendered at scale² and
    // overflowed fullscreen viewports.
    const transforms = window.document.querySelectorAll('[style*="scale("]');
    assert(transforms.length === 1, `expected exactly 1 stage transform, found ${transforms.length}`);
    const board = window.document.querySelector('.stage-viewport');
    assert(board, 'board wrapper missing');
    assert(!board!.getAttribute('style'), 'the board wrapper must not scale itself in the desktop stage');
  });

  check('desktop layout: Escape pauses', () => key('Escape'));
  await tick(60);
  check('…pause overlay', () => {
    assert(text().includes('The Vale Waits'), 'Escape did not pause the desktop battle');
  });
  click(byLabel('Abandon'), 'ABANDON');
  await tick(60);
  check('…back on the level list', () => {
    assert(text().includes('Hold the Vale'), 'ABANDON did not return to the level list');
    key('Escape');
  });
  await tick();
  check('…world select', () => {
    assert(text().includes('Five Worlds of the Vale'), 'Escape did not leave the level list');
    key('Escape');
  });
  await tick(80);
  check('…back on the title', () => {
    assert(text().includes('BEGIN THE VIGIL'), 'did not return to the title');
  });

  // ── the battle screen on a phone held in landscape ────────────────────────
  landscapeViewport = true;

  check('landscape layout: into a battle', () => {
    click(byLabel('Level select'), 'LEVEL SELECT');
    click(byLabel('World 1'), 'WORLD 1');
    click(byLabel('First Bloom') ?? byLabel('1-1'), 'level 1-1');
    click(byLabel('TO BATTLE'), 'TO BATTLE');
    assert(text().includes('READY'), 'landscape seed rail did not render');
    assert(text().includes('DIG UP'), 'shovel missing from the landscape rail');
  });

  check('landscape layout: the board scales itself, exactly once', () => {
    // Phones scale the board alone (the HUD stays unscaled around it): the
    // wrapper sizes itself and its inner div carries the one and only
    // transform in the tree.
    const board = window.document.querySelector('.stage-viewport');
    assert(board, 'board wrapper missing');
    assert((board!.getAttribute('style') ?? '').includes('width'), 'the landscape board must size itself');
    assert((board!.firstElementChild?.getAttribute('style') ?? '').includes('scale('), 'the landscape board must carry its own scale');
    const transforms = window.document.querySelectorAll('[style*="scale("]');
    assert(transforms.length === 1, `expected exactly 1 board transform, found ${transforms.length}`);
  });

  check('landscape layout: Escape pauses', () => key('Escape'));
  await tick(60);
  check('…pause overlay', () => {
    assert(text().includes('The Vale Waits'), 'Escape did not pause the landscape battle');
  });
  click(byLabel('Abandon'), 'ABANDON');
  await tick(60);
  check('…back on the level list', () => {
    assert(text().includes('Hold the Vale'), 'ABANDON did not return to the level list');
    key('Escape');
  });
  await tick();
  check('…world select', () => {
    assert(text().includes('Five Worlds of the Vale'), 'Escape did not leave the level list');
    key('Escape');
  });
  await tick(80);
  check('…back on the title', () => {
    assert(text().includes('BEGIN THE VIGIL'), 'did not return to the title');
  });

  landscapeViewport = false;

  // ── the actual battle screen, on a simulated phone ────────────────────────
  compactViewport = true;

  check('compact layout: into a battle', () => {
    click(byLabel('Level select'), 'LEVEL SELECT');
    click(byLabel('World 1'), 'WORLD 1');
    click(byLabel('First Bloom') ?? byLabel('1-1'), 'level 1-1');
    assert(text().includes('Choose Your Flora'), 'loadout did not open');
    click(byLabel('TO BATTLE'), 'TO BATTLE');
    assert(text().includes('SEED TRAY'), 'compact HUD did not render');
    assert(text().includes('DIG UP'), 'shovel button missing from the phone tray');
  });

  check('compact layout: a Flora can be armed', () => {
    click(byLabel('Thornvine'), 'Thornvine tray button');
  });
  await tick(60);
  check('…the tray drops a placement hint', () => {
    assert(text().includes('TAP A TILE TO PLANT THORNVINE'), 'placement hint missing');
  });

  check('Escape cancels the armed Flora first', () => key('Escape'));
  await tick(60);
  check('…selection cleared, battle still running', () => {
    assert(!text().includes('TAP A TILE TO PLANT'), 'Escape did not cancel the selection');
    assert(!text().includes('The Vale Waits'), 'Escape skipped straight past the selection');
  });

  check('Escape pauses a running battle', () => key('Escape'));
  await tick(60);
  check('…pause overlay', () => {
    assert(text().includes('The Vale Waits'), 'Escape did not pause');
    assert(!text().includes('Choose Your Flora'), 'Escape should pause, never abandon the level');
  });

  check('Escape resumes from the pause overlay', () => key('Escape'));
  await tick(60);
  check('…back in the battle', () => {
    assert(!text().includes('The Vale Waits'), 'Escape did not resume');
    assert(text().includes('SEED TRAY'), 'did not return to the battle');
  });

  compactViewport = false;

  check('unmount is clean', () => {
    act(() => root.unmount());
    cleanups.forEach((c) => c());
  });

  console.log(`\n${failures === 0 ? 'DOM smoke OK' : `${failures} FAILED`}`);
  // The music scheduler keeps timers alive; end the process deliberately.
  process.exit(failures ? 1 : 0);
}

void main();
