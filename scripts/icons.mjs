/**
 * Generates the PWA icons — no image libraries, no binary source assets.
 *
 * The whole game is procedurally drawn, so its icons are too: this script
 * rasterises a tiny scene description (forest tile, golden Heart Tree canopy,
 * bark trunk, sprout, blight glow) straight into PNG bytes using only
 * `node:zlib`.
 *
 *   node scripts/icons.mjs
 *
 * Writes public/icons/icon-192.png, icon-512.png, icon-maskable-512.png and
 * apple-touch-icon.png (180px). Colours match the in-game Heart Tree sprite.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

// ── PNG encoding ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── colours ─────────────────────────────────────────────────────────────────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

const INK = hex('#0a140f');
const FOREST = hex('#0c1710');
const FOREST_DEEP = hex('#060c08');
const MOSS = hex('#1d3a24');
const BLIGHT = hex('#963c82');
const CORE_HI = hex('#ffe9a8'); // ht-core, matching sprites.tsx
const CORE_MID = hex('#ffb84d');
const CORE_LO = hex('#e0703a');
const BARK_HI = hex('#57402a');
const BARK_LO = hex('#3a2a1c');
const LEAF_HI = hex('#a3f2a0');
const LEAF = hex('#7fd77f');
const LEAF_LO = hex('#57c178');

// ── geometry ────────────────────────────────────────────────────────────────
/** The classic implicit heart: <= 0 inside. y is up. */
const heart = (x, y) => {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y;
};
// Measured bounds of the curve: x ∈ [-1.137, 1.137], y ∈ [-1, 1.233].
const HB = { x0: -1.1367, y0: -1, x1: 1.1367, y1: 1.2333 };
const HBW = HB.x1 - HB.x0;
const HBH = HB.y1 - HB.y0;
const HBCX = (HB.x0 + HB.x1) / 2;
const HBCY = (HB.y0 + HB.y1) / 2;

/** Target box for the heart canopy, in icon space (0..1, y down). */
const CANOPY = { w: 0.58, h: 0.58 * (HBH / HBW) };
CANOPY.x = 0.5 - CANOPY.w / 2;
CANOPY.y = 0.615 - CANOPY.h / 2;

/** Rounded-rect test in icon space. */
function inRoundRect(px, py, x, y, w, h, r) {
  const dx = Math.max(x + r - px, px - (x + w - r), 0);
  const dy = Math.max(y + r - py, py - (y + h - r), 0);
  const qx = Math.min(px, x + w - px);
  const qy = Math.min(py, y + h - py);
  if (qx < 0 || qy < 0) return false;
  if (qx >= r || qy >= r) return true;
  return dx * dx + dy * dy <= r * r;
}

/** Distance from a point to a capsule (stem / trunk); <= 0 is inside. */
function capsule(px, py, ax, ay, bx, by, r) {
  const vx = bx - ax;
  const vy = by - ay;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy));
  const dx = px - (ax + vx * t);
  const dy = py - (ay + vy * t);
  return dx * dx + dy * dy - r * r;
}

/** Ellipse test; <= 0 is inside. */
function ellipse(px, py, cx, cy, rx, ry, angle = 0) {
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  const dx = px - cx;
  const dy = py - cy;
  const x = dx * c - dy * s;
  const y = dx * s + dy * c;
  return (x * x) / (rx * rx) + (y * y) / (ry * ry) - 1;
}

/** icon space → heart-curve space (y flipped so icon-down = curve-down). */
function toCurve(px, py) {
  const fx = (px - CANOPY.x) / CANOPY.w;
  const fy = 1 - (py - CANOPY.y) / CANOPY.h;
  return [HB.x0 + fx * HBW, HB.y0 + fy * HBH];
}

/** 0 = outside, 1 = outline band, 2 = fill. */
const FILL = 2;
const RIM = 1;

function heartShape(px, py) {
  const [u, v] = toCurve(px, py);
  if (heart(u, v) > 0) return 0;
  const d = 0.045; // outline thickness in curve units
  const u2 = HBCX + (u - HBCX) * (1 + d);
  const v2 = HBCY + (v - HBCY) * (1 + d);
  return heart(u2, v2) <= 0 ? FILL : RIM;
}

function strokeOf(test, r, rim) {
  return (px, py) => (test(px, py, r) <= 0 ? FILL : test(px, py, r + rim) <= 0 ? RIM : 0);
}

const trunkShape = strokeOf((px, py, r) => capsule(px, py, 0.5, 0.855, 0.5, 0.955, r), 0.032, 0.011);
const stemShape = strokeOf((px, py, r) => capsule(px, py, 0.5, 0.385, 0.468, 0.185, r), 0.019, 0.009);
const leafLShape = strokeOf((px, py, r) => ellipse(px, py, 0.398, 0.272, 0.062 + r * 0.6, 0.031 + r * 0.35, -0.55), 0, 0.011);
const leafRShape = strokeOf((px, py, r) => ellipse(px, py, 0.566, 0.212, 0.068 + r * 0.6, 0.033 + r * 0.35, -1.0), 0, 0.011);

// ── the scene ───────────────────────────────────────────────────────────────
/**
 * Colour of one sample. `px`/`py` are 0..1 icon space; `maskable` pulls the
 * artwork into the safe zone so an OS mask can't clip it.
 */
function sample(pxIn, pyIn, maskable) {
  if (!maskable) {
    // Rounded tile — leave the corners transparent.
    if (!inRoundRect(pxIn, pyIn, 0, 0, 1, 1, 0.2237)) return [0, 0, 0, 0];
  }
  // Maskable: zoom the artwork out around the Heart so an OS mask (circle,
  // squircle, whatever) can crop the edges without touching the subject.
  const k = maskable ? 1 / 0.82 : 1;
  const originY = maskable ? 0.56 : 0.5;
  const px = (pxIn - 0.5) * k + 0.5;
  const py = (pyIn - originY) * k + originY;

  // Background: deep forest, lit green from the top-left, blight from the east.
  let bg = mix(FOREST, FOREST_DEEP, clamp(Math.hypot(px - 0.12, py - 0.08) * 1.15));
  bg = mix(bg, MOSS, clamp(1 - Math.hypot(px - 0.18, py - 0.12) * 1.6) * 0.9);
  bg = mix(bg, BLIGHT, clamp(1 - Math.hypot(px - 0.98, py - 1.02) * 1.4) * 0.42);

  // Ground shadow under the trunk.
  if (ellipse(px, py, 0.5, 0.965, 0.15, 0.032) <= 0) bg = mix(bg, INK, 0.55);

  let col = bg;

  // Trunk behind the canopy.
  const trunk = trunkShape(px, py);
  if (trunk) col = trunk === FILL ? mix(BARK_HI, BARK_LO, clamp((py - 0.84) / 0.13)) : INK;

  // The Heart — radial core glow, same ramp as the in-game sprite.
  const canopy = heartShape(px, py);
  if (canopy) {
    if (canopy === RIM) col = INK;
    else {
      const [u, v] = toCurve(px, py);
      const d = clamp(Math.hypot((u + 0.12) / 1.35, (v - 0.38) / 1.35));
      col = d < 0.5 ? mix(CORE_HI, CORE_MID, d / 0.5) : mix(CORE_MID, CORE_LO, (d - 0.5) / 0.5);
    }
  }

  // Sprout: stem and two leaves growing out of the notch.
  const stem = stemShape(px, py);
  if (stem) col = stem === FILL ? mix(LEAF_LO, LEAF, clamp((0.39 - py) / 0.21)) : INK;
  const leafL = leafLShape(px, py);
  if (leafL) col = leafL === FILL ? mix(LEAF_HI, LEAF, clamp((py - 0.24) / 0.08)) : INK;
  const leafR = leafRShape(px, py);
  if (leafR) col = leafR === FILL ? mix(LEAF_HI, LEAF_LO, clamp((py - 0.18) / 0.08)) : INK;

  // Two fireflies, straight from the Heart Tree sprite.
  if (ellipse(px, py, 0.215, 0.315, 0.016, 0.016) <= 0) col = CORE_HI;
  if (ellipse(px, py, 0.795, 0.44, 0.013, 0.013) <= 0) col = mix(LEAF_HI, CORE_HI, 0.4);

  return [...col, 255];
}

function render(size, maskable) {
  const SS = 3; // 3×3 supersampling, straight-alpha aware
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [cr, cg, cb, ca] = sample((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, maskable);
          const w = ca / 255;
          r += cr * w;
          g += cg * w;
          b += cb * w;
          a += ca;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      // Accumulators hold Σ(channel × alpha) — divide by Σalpha for the colour.
      const inv = a > 0 ? 255 / a : 0;
      rgba[i] = Math.round(r * inv);
      rgba[i + 1] = Math.round(g * inv);
      rgba[i + 2] = Math.round(b * inv);
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size, maskable] of [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],
]) {
  const png = render(size, maskable);
  writeFileSync(resolve(OUT, name), png);
  console.log(`  ✓ ${name} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
