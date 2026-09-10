// Procedural ambient soundtrack — no audio assets, everything synthesized.
// A slow, warm loop of detuned pads, soft bass and plucked arpeggios
// (Am → F → C → G) that runs underneath menus and battles.
// Must be started from a user gesture (browser autoplay policy).

const BASE_VOL = 0.15; // BGM sits well under the SFX master
const BAR = 3.6; // seconds per chord
const LOOKAHEAD = 1.2; // seconds scheduled ahead of the clock
const TICK_MS = 400; // scheduler wake-up interval

// Chord progression in MIDI note numbers: Am7 → Fmaj7 → Cmaj → G
const PROG: number[][] = [
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [48, 52, 55, 60],
  [55, 59, 62, 67],
];

// A-minor pentatonic sparkle notes for the occasional high pluck
const PENTA = [69, 72, 74, 76, 79, 81];

let ctx: AudioContext | null = null;
let musicMaster: GainNode | null = null;
let echo: DelayNode | null = null;
let timer: number | null = null;
let nextBar = 0;
let barIdx = 0;
let muted = false;
let running = false;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// ── voices ─────────────────────────────────────────────────────────────────

function pad(t: number, midi: number, dur: number) {
  if (!ctx || !musicMaster) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.04, t + dur * 0.4);
  g.gain.setValueAtTime(0.04, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, t + dur);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 780;
  f.connect(g);
  g.connect(musicMaster);
  for (const detune of [-5, 5]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = hz(midi);
    o.detune.value = detune;
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

function bass(t: number, midi: number) {
  if (!ctx || !musicMaster) return;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = hz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.11, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + BAR * 0.9);
  o.connect(g);
  g.connect(musicMaster);
  o.start(t);
  o.stop(t + BAR);
}

function pluck(t: number, midi: number, vol: number) {
  if (!ctx || !musicMaster) return;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = hz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(g);
  g.connect(musicMaster);
  if (echo) g.connect(echo); // a little space on the plucks
  o.start(t);
  o.stop(t + 0.6);
}

// ── bar scheduler ──────────────────────────────────────────────────────────

function scheduleBar(t: number, chord: number[], idx: number) {
  // pads overlap slightly for a legato feel
  for (const m of chord) pad(t, m, BAR + 0.5);
  bass(t, chord[0] - 12);

  // gentle 8th-note arpeggio over the upper chord tones, with breathing gaps
  const steps = 8;
  const step = BAR / steps;
  for (let i = 0; i < steps; i++) {
    if ((idx + i) % 4 === 3) continue; // rest
    const tone = chord[1 + ((i * 3 + idx) % (chord.length - 1))] + 12;
    pluck(t + i * step, tone, 0.045);
  }

  // occasional pentatonic sparkle on alternating bars
  if (idx % 2 === 1) {
    pluck(t + BAR * 0.5, PENTA[(idx * 7) % PENTA.length], 0.035);
  }
}

function tick() {
  if (!ctx) return;
  while (nextBar < ctx.currentTime + LOOKAHEAD) {
    scheduleBar(nextBar, PROG[barIdx % PROG.length], barIdx);
    nextBar += BAR;
    barIdx++;
  }
}

function onVis() {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend();
  else void ctx.resume();
}

// ── public API ─────────────────────────────────────────────────────────────

/** Idempotent — safe to call on every pointer/key event. */
export function startBgm() {
  if (running || typeof window === 'undefined') return;
  try {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return;
  }
  musicMaster = ctx.createGain();
  musicMaster.gain.value = muted ? 0 : BASE_VOL;
  musicMaster.connect(ctx.destination);

  // quarter-note echo for the plucks
  echo = ctx.createDelay(2);
  echo.delayTime.value = BAR / 4;
  const fb = ctx.createGain();
  fb.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  echo.connect(fb);
  fb.connect(echo);
  echo.connect(wet);
  wet.connect(musicMaster);

  nextBar = ctx.currentTime + 0.1;
  barIdx = 0;
  tick();
  timer = window.setInterval(tick, TICK_MS);
  document.addEventListener('visibilitychange', onVis);
  running = true;
}

export function stopBgm() {
  if (!running) return;
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  document.removeEventListener('visibilitychange', onVis);
  if (ctx) void ctx.close();
  ctx = null;
  musicMaster = null;
  echo = null;
  running = false;
}

export function setBgmMuted(m: boolean) {
  muted = m;
  if (ctx && musicMaster) {
    musicMaster.gain.setTargetAtTime(m ? 0 : BASE_VOL, ctx.currentTime, 0.12);
  }
}
