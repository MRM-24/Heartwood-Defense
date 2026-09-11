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
import { STAGE_GAP, STAGE_H, STAGE_W, fitStage } from '../src/utils/stageFit';

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
/* A ResizeObserver the test can fire: the battle screen measures its box from
   a resize observation, so "the window changed shape" has to be reproducible
   here or the fit maths would never run. */
const liveObservers = new Set<{ cb: ResizeObserverCallback }>();
class FakeResizeObserver {
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    liveObservers.add(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    liveObservers.delete(this);
  }
}
const fireResize = () => liveObservers.forEach((o) => o.cb([], o as unknown as ResizeObserver));
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

/* The battle screen measures the box it has to cover (`[data-fit-area]`) and
   the HUD row that shares its transform (`[data-fit-chrome]`). jsdom lays
   nothing out, so hand it the numbers a real viewport would report — the
   assertions below then check the layout reacts to them correctly. */
const fitBox = { w: 1908, h: 1018, chrome: 102 };
Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get(this: HTMLElement) {
    return this.hasAttribute('data-fit-area') ? fitBox.w : 0;
  },
});
Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get(this: HTMLElement) {
    return this.hasAttribute('data-fit-area') ? fitBox.h : 0;
  },
});
Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get(this: HTMLElement) {
    return this.hasAttribute('data-fit-chrome') ? fitBox.chrome : 0;
  },
});

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
/** Same, for checks that have to let React flush a re-measure first. */
async function checkAsync(name: string, fn: () => Promise<void>) {
  try {
    await fn();
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

  /**
   * Resize the box the stage has to cover, and let the screen re-measure it.
   */
  const resizeStageBox = async (w: number, h: number, chrome = fitBox.chrome) => {
    fitBox.w = w;
    fitBox.h = h;
    fitBox.chrome = chrome;
    act(() => {
      fireResize();
    });
    await tick(60);
  };

  /**
   * The stage covers the box it was given, edge to edge: the reserved CSS box
   * matches the measurement, the stage's aspect matches the box's (that is what
   * "no letterbox" means), and the playfield inside is never cropped. Expected
   * numbers come from the same pure `fitStage` the component calls, so this
   * checks the wiring rather than a copy of the maths.
   */
  const stageCoversItsBox = (label: string, chrome = 0) => {
    const expected = fitStage(fitBox.w, fitBox.h, chrome);
    const pxOf = (style: string, prop: string) =>
      Number(new RegExp(`${prop}:\\s*([\\d.]+)px`).exec(style)?.[1] ?? Number.NaN);

    assert(window.document.querySelector('[data-fit-area]'), `${label}: nothing is measuring the stage box`);
    const boxStyle = window.document.querySelector('[data-stage-box]')?.getAttribute('style') ?? '';
    const boxW = pxOf(boxStyle, 'width');
    const boxH = pxOf(boxStyle, 'height');
    assert(Math.abs(boxW - expected.boxW) < 1, `${label}: reserved width ${boxW} != ${expected.boxW.toFixed(1)}`);
    assert(Math.abs(boxH - expected.boxH) < 1, `${label}: reserved height ${boxH} != ${expected.boxH.toFixed(1)}`);
    assert(
      Math.abs(expected.boxW - fitBox.w) < 0.5 && Math.abs(expected.boxH - fitBox.h) < 0.5,
      `${label}: the stage does not cover ${fitBox.w}×${fitBox.h}`,
    );

    const stageAspect = expected.frameW / (chrome + expected.frameH);
    assert(
      Math.abs(stageAspect - fitBox.w / fitBox.h) < 0.02,
      `${label}: stage aspect ${stageAspect.toFixed(3)} != box aspect ${(fitBox.w / fitBox.h).toFixed(3)} — that gap is a letterbox`,
    );

    const frame = window.document.querySelector('.stage-viewport');
    assert(frame, `${label}: board frame missing`);
    const frameStyle = frame!.getAttribute('style') ?? '';
    const frameW = pxOf(frameStyle, 'width');
    const frameH = pxOf(frameStyle, 'height');
    assert(Math.abs(frameW - expected.frameW) < 1, `${label}: frame width ${frameW} != ${expected.frameW.toFixed(1)}`);
    assert(Math.abs(frameH - expected.frameH) < 1, `${label}: frame height ${frameH} != ${expected.frameH.toFixed(1)}`);
    assert(
      expected.frameW >= STAGE_W - 0.001 && expected.frameH >= STAGE_H - 0.001,
      `${label}: the 1080×600 playfield would be cropped`,
    );

    // A grown frame means forest in the margin; a flush frame means none.
    const decor = window.document.querySelector('[data-stage-decor]');
    const grown = expected.pad.left > 6 || expected.pad.top > 6;
    assert(!!decor === grown, `${label}: decor ${decor ? 'present' : 'absent'} but the margin is ${grown ? 'grown' : 'flush'}`);
  };

  /**
   * The stage carries exactly one scale() transform, and it is never the board
   * frame's own. Desktop scales HUD + frame together, phones scale the frame
   * alone; either way `.stage-viewport` sizes itself (frame = playfield + the
   * forest margin that fills the viewport's aspect) and stays untransformed.
   * Regression: the board once carried its own scale() *and* sat inside the
   * stage wrapper's scale() — the field rendered at scale² and overflowed.
   */
  const stageScaledOnce = (label: string) => {
    const transforms = window.document.querySelectorAll('[style*="scale("]');
    assert(transforms.length === 1, `${label}: expected exactly 1 stage transform, found ${transforms.length}`);
    const board = window.document.querySelector('.stage-viewport');
    assert(board, `${label}: board frame missing`);
    const style = board!.getAttribute('style') ?? '';
    assert(style.includes('width'), `${label}: the board frame must size itself`);
    assert(!style.includes('scale('), `${label}: the board frame must not scale itself`);
  };

  // ── the battle screen at desktop width ────────────────────────────────────
  check('desktop layout: into a battle', () => {
    click(byLabel('Level select'), 'LEVEL SELECT');
    click(byLabel('World 1'), 'WORLD 1');
    click(byLabel('First Bloom') ?? byLabel('1-1'), 'level 1-1');
    click(byLabel('TO BATTLE'), 'TO BATTLE');
    assert(text().includes('PAUSE'), 'desktop HUD did not render');
  });

  check('desktop layout: the stage is scaled exactly once', () => stageScaledOnce('desktop'));

  await checkAsync('desktop layout: HUD + field cover the whole window', async () => {
    // full HD minus the browser chrome; the HUD row shares the stage transform
    await resizeStageBox(1908, 1018, 102);
    stageCoversItsBox('desktop 1920×1080', fitBox.chrome + STAGE_GAP);
    const expected = fitStage(1908, 1018, fitBox.chrome + STAGE_GAP);
    assert(expected.scale > 1.35, `1080p should outgrow the old 1.35 ceiling, got ${expected.scale.toFixed(2)}`);
  });

  await checkAsync('desktop layout: an ultrawide window gets forest, not black bars', async () => {
    await resizeStageBox(3428, 1378);
    stageCoversItsBox('ultrawide 3440×1440', fitBox.chrome + STAGE_GAP);
    const expected = fitStage(3428, 1378, fitBox.chrome + STAGE_GAP);
    assert(expected.pad.left > 100, `ultrawide margin should be deep forest, got ${expected.pad.left.toFixed(0)}px`);
  });

  await checkAsync('desktop layout: a 4K window is capped, and still covered', async () => {
    await resizeStageBox(3828, 2098);
    stageCoversItsBox('4K 3840×2160', fitBox.chrome + STAGE_GAP);
  });

  await checkAsync('desktop layout: a tall window fills top to bottom', async () => {
    await resizeStageBox(888, 1338);
    stageCoversItsBox('tall window 900×1400', fitBox.chrome + STAGE_GAP);
    const expected = fitStage(888, 1338, fitBox.chrome + STAGE_GAP);
    assert(expected.pad.top > 200, `a tall window should grow canopy above the field, got ${expected.pad.top.toFixed(0)}px`);
  });

  // back to a plain laptop window for the rest of the desktop pass
  await resizeStageBox(1354, 706);

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

  check('landscape layout: the stage is scaled exactly once', () => stageScaledOnce('landscape'));

  await checkAsync('landscape layout: the field covers the board area, no bars', async () => {
    // iPhone 12/13/14 sideways: 844×390 minus safe insets, the slim status
    // strip and the two-column seed rail — height is the scarce axis.
    await resizeStageBox(686, 328);
    stageCoversItsBox('phone landscape 844×390');
    const expected = fitStage(686, 328);
    assert(expected.pad.top < 1, `landscape phones are height-bound: no vertical margin expected, got ${expected.pad.top.toFixed(0)}px`);
    assert(expected.frameH === STAGE_H, 'the playfield keeps its full height sideways');
    assert(expected.pad.left > 40, `the spare width should become forest, got ${expected.pad.left.toFixed(0)}px`);
  });

  await checkAsync('landscape layout: a small phone still fills, top to bottom', async () => {
    await resizeStageBox(521, 313);
    stageCoversItsBox('phone landscape 667×375');
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

  await checkAsync('compact layout: the field covers the room between strip and rack', async () => {
    // 390×844 portrait, minus safe insets, the status strip and the seed rack
    await resizeStageBox(378, 539);
    stageCoversItsBox('phone portrait 390×844');
    const expected = fitStage(378, 539);
    assert(expected.frameW === STAGE_W, 'portrait is width-bound: the frame stays 1080 wide');
    assert(expected.pad.top > 100, `portrait spare height should become canopy/undergrowth, got ${expected.pad.top.toFixed(0)}px`);
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
