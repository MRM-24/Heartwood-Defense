// Tiny WebAudio synth — no assets, everything generated.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
const lastPlay: Record<string, number> = {};

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSfxMuted(m: boolean) {
  muted = m;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.2,
  slideTo?: number,
  delay = 0,
) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol = 0.15, freq = 1200, delay = 0) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

const THROTTLE = 0.05; // seconds — avoid machine-gun audio

export function sfxEvent(name: string) {
  const now = performance.now() / 1000;
  if (lastPlay[name] && now - lastPlay[name] < THROTTLE) return;
  lastPlay[name] = now;
  switch (name) {
    case 'shoot': tone(760, 0.07, 'square', 0.06, 420); break;
    case 'spike': tone(520, 0.06, 'square', 0.06, 260); noise(0.04, 0.05, 2400); break;
    case 'frost': tone(1250, 0.16, 'sine', 0.08, 700); break;
    case 'ray': tone(940, 0.09, 'sawtooth', 0.05, 1350); break;
    case 'hit': noise(0.05, 0.06, 1800); break;
    case 'chomp': tone(140, 0.08, 'triangle', 0.07, 90); break;
    case 'kill': tone(340, 0.09, 'triangle', 0.08, 120); break;
    case 'split': tone(240, 0.12, 'sawtooth', 0.09, 420); noise(0.1, 0.08, 900); break;
    case 'produce': tone(1320, 0.14, 'sine', 0.07); tone(1760, 0.18, 'sine', 0.055, undefined, 0.06); break;
    case 'income': tone(990, 0.1, 'sine', 0.04); break;
    case 'place': tone(240, 0.1, 'triangle', 0.1, 340); break;
    case 'shovel': noise(0.12, 0.1, 700); break;
    case 'reject': tone(130, 0.12, 'sawtooth', 0.07); break;
    case 'warn': tone(196, 0.5, 'sawtooth', 0.09, 185); tone(147, 0.5, 'sawtooth', 0.07, 139, 0.05); break;
    case 'warnfinal': tone(165, 0.7, 'sawtooth', 0.11, 147); tone(110, 0.9, 'sawtooth', 0.09, 98, 0.1); break;
    case 'snare': tone(420, 0.5, 'sawtooth', 0.16, 50); noise(0.4, 0.14, 500); break;
    case 'plantdie': tone(300, 0.25, 'triangle', 0.09, 90); break;
    case 'phase': tone(90, 0.7, 'sawtooth', 0.14, 60); noise(0.5, 0.1, 300); break;
    case 'bossadd': tone(155, 0.3, 'square', 0.06, 120); break;
    case 'bossdead': tone(220, 0.8, 'sawtooth', 0.14, 40); noise(0.6, 0.12, 400); break;
    // ── Batch 1 mechanics ──
    case 'deflect': tone(1900, 0.05, 'square', 0.035, 1500); break; // ping off a Stoneback slab
    case 'shieldbreak': tone(700, 0.2, 'square', 0.1, 180); noise(0.16, 0.1, 2600); break;
    case 'jump': tone(240, 0.18, 'sine', 0.08, 660); break; // mite springs
    case 'vault': tone(150, 0.07, 'triangle', 0.08, 90); noise(0.06, 0.05, 500); break; // …and lands
    case 'emerge': tone(120, 0.35, 'sawtooth', 0.1, 70); noise(0.3, 0.09, 350); break;
    case 'sting': tone(1150, 0.07, 'sawtooth', 0.05, 500); break; // ranger spine loosed
    case 'grab': tone(500, 0.06, 'square', 0.09, 760); tone(760, 0.07, 'square', 0.08, 1100, 0.05); break;
    case 'drop': tone(420, 0.1, 'triangle', 0.08, 300); tone(560, 0.12, 'sine', 0.06, undefined, 0.07); break;
    case 'stolen': [500, 380, 270, 180].forEach((f, i) => tone(f, 0.14, 'triangle', 0.09, undefined, i * 0.09)); break;
    case 'cata': tone(1500, 1.3, 'sine', 0.07, 320); break; // incoming shell whistle
    case 'land': tone(95, 0.16, 'sawtooth', 0.13, 45); noise(0.14, 0.1, 420); break;
    case 'windup': tone(70, 1.1, 'sawtooth', 0.06, 130); break; // husk raises its fists
    case 'smash': tone(60, 0.4, 'sawtooth', 0.17, 30); noise(0.35, 0.15, 240); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.09, undefined, i * 0.12)); break;
    case 'lose': [330, 262, 196, 147].forEach((f, i) => tone(f, 0.3, 'triangle', 0.09, undefined, i * 0.16)); break;
  }
}
