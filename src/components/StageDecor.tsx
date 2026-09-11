/**
 * The forest that fills the stage frame around the playfield.
 *
 * `Board`'s playfield is a fixed 1080×600 box, but the frame around it grows to
 * whatever aspect the player's screen has (see `utils/stageFit.ts`). This paints
 * that extra room so a wide monitor or a landscape phone gets a full-bleed
 * battlefield instead of black bars: the vale's own trees to the west, the
 * Blight's dead wood to the east, canopy overhead and undergrowth in front.
 *
 * It is pure decoration — no game state, nothing that changes per frame. The
 * caller memoises it on the margin size, so a resize rebuilds it once and the
 * 60fps loop never reconciles a single node of it.
 */
import { STAGE_H, STAGE_W, type StagePad } from '../utils/stageFit';

/** Deterministic jitter, so the forest does not reshuffle on every resize. */
const rnd = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** How many pieces fit along `len`, spaced roughly `step` apart. */
const spread = (len: number, step: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(len / step)));

// ── pieces ──────────────────────────────────────────────────────────────────

/** A living vale tree: dark trunk, layered canopy, a whisper of rim light. */
function ValeTree({ h, seed, flip }: { h: number; seed: number; flip?: boolean }) {
  const w = h * 0.46;
  const lean = (rnd(seed, 3) - 0.5) * 10;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 200"
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d={`M45 200 L48 ${86 + lean} L55 ${86 + lean} L58 200 Z`} fill="#08130d" />
      <path
        d={`M49 154 L31 126 M53 136 L71 110 M50 114 L37 94`}
        stroke="#08130d"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="50" cy="66" rx="46" ry="36" fill="#102314" />
      <ellipse cx="25" cy="54" rx="27" ry="22" fill="#0d1d11" />
      <ellipse cx="75" cy="56" rx="25" ry="21" fill="#132817" />
      <ellipse cx="50" cy="32" rx="28" ry="21" fill="#0f2113" />
      <path
        d="M76 78 C 84 62 86 46 80 32"
        stroke="rgba(163,242,160,.09)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Blightwood: bare, twisted, faintly luminous where the rot blooms. */
function BlightTree({ h, seed }: { h: number; seed: number }) {
  const w = h * 0.42;
  const bend = (rnd(seed, 5) - 0.5) * 16;
  return (
    <svg width={w} height={h} viewBox="0 0 100 200" aria-hidden>
      <path
        d={`M46 200 C 50 156 42 130 50 96 C 56 68 ${48 + bend} 46 ${52 + bend} 16`}
        stroke="#1d1526"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 132 C 34 122 26 102 22 80 M50 106 C 66 98 76 80 80 58 M52 74 C 42 64 38 50 38 34 M52 56 C 62 48 68 36 68 24"
        stroke="#251a30"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="22" cy="80" r="5" fill="rgba(195,143,184,.30)" />
      <circle cx="80" cy="58" r="4" fill="rgba(255,150,220,.22)" />
      <circle cx="38" cy="34" r="3.4" fill="rgba(195,143,184,.26)" />
      <path d="M38 200 C 45 188 57 188 64 200 Z" fill="#150f1c" />
    </svg>
  );
}

/** Canopy hanging into the frame from above. */
function CanopyCluster({ w, h, seed }: { w: number; h: number; seed: number }) {
  const drop = 0.55 + rnd(seed, 7) * 0.75;
  return (
    <svg width={w} height={h} viewBox="0 0 120 100" aria-hidden>
      <path
        d="M0 0 H120 V16 C 104 30 92 18 76 30 C 60 42 46 24 30 34 C 16 42 8 28 0 32 Z"
        fill="#0c1a11"
      />
      <ellipse cx="34" cy="34" rx="21" ry="13" fill="#102214" />
      <ellipse cx="86" cy="30" rx="23" ry="14" fill="#0e1f13" />
      <ellipse cx="60" cy="24" rx="18" ry="11" fill="#122718" />
      <path
        d={`M60 26 C 58 ${44 * drop} 63 ${62 * drop} 58 ${88 * drop}`}
        stroke="#13291a"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx="58"
        cy={90 * drop}
        rx="8"
        ry="4.5"
        fill="#16321d"
        transform={`rotate(18 58 ${90 * drop})`}
      />
    </svg>
  );
}

/** Ferns, grass and the odd toadstool — the frame's foreground floor. */
function Undergrowth({ w, h, seed }: { w: number; h: number; seed: number }) {
  const cap = rnd(seed, 11) > 0.55 ? '#2b2038' : '#1d3520';
  return (
    <svg width={w} height={h} viewBox="0 0 100 80" aria-hidden>
      <path
        d="M22 80 C 18 58 10 46 0 38 M22 80 C 24 56 30 44 44 34 M50 80 C 50 58 50 46 50 26 M78 80 C 76 58 84 46 98 38 M78 80 C 74 56 66 46 58 40"
        stroke="#102314"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 44 l -6 -6 M14 52 l -8 -4 M38 42 l 6 -8 M50 34 l -6 -8 M50 46 l 7 -6 M88 44 l 8 -6 M64 48 l -7 -6"
        stroke="#15301c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="66" cy="70" rx="10" ry="6" fill={cap} />
      <rect x="64" y="70" width="4.5" height="10" rx="2" fill="#16281a" />
      <ellipse cx="30" cy="74" rx="7" ry="4" fill="#14291a" />
    </svg>
  );
}

/** A slow, soft mist bank. */
function Mist({
  style,
  tone = 'rgba(150,220,170,.1)',
  delay,
}: {
  style: React.CSSProperties;
  tone?: string;
  delay?: string;
}) {
  return (
    <div
      className="anim-mist pointer-events-none absolute rounded-[50%]"
      style={{
        background: `radial-gradient(circle, ${tone} 0%, transparent 70%)`,
        animationDelay: delay,
        ...style,
      }}
    />
  );
}

// ── the whole margin ────────────────────────────────────────────────────────

export default function StageDecor({ pad, frameH }: { pad: StagePad; frameH: number }) {
  const west = pad.left;
  const east = pad.right;
  const north = pad.top;
  const south = pad.bottom;
  const fieldTop = pad.top;
  const fieldBottom = frameH - pad.bottom;

  // Trees stand a little below the field's floor line so the undergrowth in
  // front of them overlaps their roots, and their crowns reach past the top.
  const rootLine = Math.min(frameH, fieldBottom + Math.min(south, 150) + 14);
  const crownLine = Math.max(0, fieldTop - Math.min(north, 120));

  const westTrees = spread(west, 100, 1, 9);
  const eastTrees = spread(east, 100, 1, 9);
  const canopy = spread(STAGE_W, 190, 2, 12);
  const floor = spread(STAGE_W, 130, 2, 14);

  return (
    <div data-stage-decor className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* ── west: the vale's own wood ─────────────────────────────────────── */}
      {west > 6 && (
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: west }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, #050b07 0%, #0a1710 52%, rgba(10,23,16,0) 100%)',
            }}
          />
          {Array.from({ length: westTrees }).map((_, i) => {
            const h = Math.max(240, rootLine - crownLine - rnd(i, 1) * 110);
            const w = h * 0.46;
            const x = ((i + 0.5) / westTrees) * west - w / 2 + (rnd(i, 2) - 0.5) * 26;
            return (
              <div
                key={i}
                className="absolute"
                style={{ left: x, top: rootLine - h, opacity: 0.5 + rnd(i, 4) * 0.5 }}
              >
                <ValeTree h={h} seed={i} flip />
              </div>
            );
          })}
          <Mist style={{ left: -west * 0.25, top: fieldTop + STAGE_H * 0.34, width: west * 1.6, height: west * 0.95 }} />
          <Mist
            style={{ left: -west * 0.1, top: fieldTop - 24, width: west * 1.3, height: west * 0.8 }}
            tone="rgba(120,200,150,.08)"
            delay="-1.4s"
          />
          {Array.from({ length: spread(west, 78, 1, 7) }).map((_, i) => (
            <div
              key={`f${i}`}
              className="anim-twinkle absolute rounded-full"
              style={{
                width: 3,
                height: 3,
                left: rnd(i, 13) * Math.max(8, west - 6),
                top: fieldTop + rnd(i, 17) * STAGE_H,
                background: 'rgba(214,255,190,.8)',
                boxShadow: '0 0 7px 2px rgba(180,255,170,.35)',
                animationDelay: `${-rnd(i, 19) * 2.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── east: dead wood, and the Blight's own weather ─────────────────── */}
      {east > 6 && (
        <div className="absolute inset-y-0 right-0 overflow-hidden" style={{ width: east }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(270deg, #0d0710 0%, #150d1a 48%, rgba(21,13,26,0) 100%)',
            }}
          />
          {Array.from({ length: eastTrees }).map((_, i) => {
            const h = Math.max(220, rootLine - crownLine - rnd(i, 21) * 130);
            const w = h * 0.42;
            const x = ((i + 0.5) / eastTrees) * east - w / 2 + (rnd(i, 23) - 0.5) * 26;
            return (
              <div
                key={i}
                className="absolute"
                style={{ left: x, top: rootLine - h, opacity: 0.45 + rnd(i, 25) * 0.5 }}
              >
                <BlightTree h={h} seed={i} />
              </div>
            );
          })}
          <Mist
            style={{ right: -east * 0.25, top: fieldTop + STAGE_H * 0.18, width: east * 1.7, height: east * 1.05 }}
            tone="rgba(195,143,184,.13)"
          />
          <Mist
            style={{ right: -east * 0.1, top: fieldTop + STAGE_H * 0.6, width: east * 1.4, height: east * 0.85 }}
            tone="rgba(150,60,130,.14)"
            delay="-2.1s"
          />
          {Array.from({ length: spread(east, 70, 1, 8) }).map((_, i) => (
            <div
              key={`s${i}`}
              className="anim-drift absolute rounded-full"
              style={{
                width: 3 + (i % 3),
                height: 3 + (i % 3),
                left: rnd(i, 29) * Math.max(8, east - 6),
                top: fieldTop + rnd(i, 31) * STAGE_H,
                background: 'rgba(255,190,240,.4)',
                animationDuration: `${13 + i * 2.6}s`,
                animationDelay: `${-i * 2.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── north: canopy over the clearing ───────────────────────────────── */}
      {north > 6 && (
        <div className="absolute overflow-hidden" style={{ left: west, top: 0, width: STAGE_W, height: north }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, #060d09 0%, #0b1a10 55%, rgba(11,26,16,0) 100%)',
            }}
          />
          {Array.from({ length: canopy }).map((_, i) => {
            const w = 150 + rnd(i, 33) * 150;
            const h = Math.min(north + 40, 74 + rnd(i, 35) * 140 + north * 0.45);
            const x = ((i + 0.5) / canopy) * STAGE_W - w / 2 + (rnd(i, 37) - 0.5) * 44;
            return (
              <div
                key={i}
                className="absolute"
                style={{ left: x, top: -10, opacity: 0.55 + rnd(i, 39) * 0.45 }}
              >
                <CanopyCluster w={w} h={h} seed={i} />
              </div>
            );
          })}
          <Mist
            style={{ left: STAGE_W * 0.16, top: north * 0.25, width: STAGE_W * 0.42, height: north * 1.7 }}
            tone="rgba(160,225,180,.07)"
          />
        </div>
      )}

      {/* ── south: undergrowth at the frame's near edge ───────────────────── */}
      {south > 6 && (
        <div
          className="absolute overflow-hidden"
          style={{ left: west, top: fieldBottom, width: STAGE_W, height: south }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(0deg, #050b07 0%, #0a1710 48%, rgba(10,23,16,0) 100%)',
            }}
          />
          <Mist
            style={{ left: STAGE_W * 0.08, top: -south * 0.25, width: STAGE_W * 0.5, height: south * 1.5 }}
            tone="rgba(150,215,170,.08)"
          />
          <Mist
            style={{ left: STAGE_W * 0.5, top: south * 0.05, width: STAGE_W * 0.45, height: south * 1.3 }}
            tone="rgba(140,205,160,.07)"
            delay="-1.8s"
          />
          {Array.from({ length: floor }).map((_, i) => {
            const w = 100 + rnd(i, 41) * 100;
            const h = Math.min(south + 26, 56 + rnd(i, 43) * 120 + south * 0.5);
            const x = ((i + 0.5) / floor) * STAGE_W - w / 2 + (rnd(i, 45) - 0.5) * 40;
            return (
              <div
                key={i}
                className="absolute"
                style={{ left: x, bottom: -8, opacity: 0.55 + rnd(i, 47) * 0.45 }}
              >
                <Undergrowth w={w} h={h} seed={i} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
