// Hand-drawn vector art for every unit. Cohesive style: near-black organic
// outlines, luminous fills, glow supplied by parent CSS drop-shadows.
import type { EnemyKey, FloraKey } from '../game/types';

const O = '#0a140f'; // outline
const O2 = '#0d1b13';

// ─────────────────────────────── FLORA ─────────────────────────────────────
function Thornvine() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="tv-stem" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#2f8f5b" />
          <stop offset="1" stopColor="#5fe39b" />
        </linearGradient>
        <radialGradient id="tv-mouth" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#123526" />
          <stop offset="1" stopColor="#0a221a" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="26" ry="7" fill="#152b1d" />
      <g className="anim-sway" style={{ transformOrigin: '50px 92px' }}>
        <path d="M50 90 C 44 74 42 62 46 48 C 49 38 52 32 52 26" fill="none" stroke={O} strokeWidth="11" strokeLinecap="round" />
        <path d="M50 90 C 44 74 42 62 46 48 C 49 38 52 32 52 26" fill="none" stroke="url(#tv-stem)" strokeWidth="7" strokeLinecap="round" />
        <path d="M47 62 C 36 60 28 52 26 42 C 36 44 46 50 47 62 Z" fill="#3fae6a" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M50 74 C 62 72 70 64 72 54 C 60 56 52 62 50 74 Z" fill="#4cc97e" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        {/* bud head */}
        <g className="anim-nod" style={{ transformOrigin: '52px 30px' }}>
          <path d="M40 22 C 38 12 46 4 58 6 C 72 8 80 16 78 26 C 76 36 62 40 52 37 C 44 34 41 30 40 22 Z" fill="#5fe39b" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M60 13 C 70 15 75 20 74.5 25.5 C 69 23 63 22 57 23 C 57 19 58 15 60 13 Z" fill="url(#tv-mouth)" />
          <path d="M74 25 L 90 25 L 74 21 Z" fill="#eaffd9" stroke={O} strokeWidth="2" strokeLinejoin="round" />
          <path d="M46 10 l -4 -7 M 55 7 l -1 -7" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="48" cy="18" r="3.4" fill="#0b1f16" />
          <circle cx="49" cy="17" r="1.2" fill="#a8ffcf" />
        </g>
      </g>
    </svg>
  );
}

function Glowbulb() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="gb-bulb" cx="0.42" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.55" stopColor="#ffd76a" />
          <stop offset="1" stopColor="#e89b2e" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="24" ry="6.5" fill="#152b1d" />
      <g className="anim-sway-slow" style={{ transformOrigin: '50px 92px' }}>
        <path d="M50 90 C 48 76 48 66 50 56" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M50 90 C 48 76 48 66 50 56" fill="none" stroke="#3f9e68" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M49 72 C 38 71 32 65 30 57 C 39 58 47 63 49 72 Z" fill="#3fae6a" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M50 66 C 60 65 67 59 69 51 C 60 52 52 57 50 66 Z" fill="#4cc97e" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="50" cy="36" r="24" fill="url(#gb-bulb)" stroke={O} strokeWidth="3" className="anim-breathe" />
        <ellipse cx="43" cy="28" rx="7" ry="4.4" fill="#fffbe8" opacity="0.9" transform="rotate(-24 43 28)" />
        <g className="anim-twinkle">
          <circle cx="28" cy="18" r="1.8" fill="#ffe9a8" />
          <circle cx="74" cy="30" r="1.5" fill="#ffe9a8" />
          <circle cx="62" cy="10" r="1.6" fill="#ffe9a8" />
        </g>
        <circle cx="50" cy="36" r="5.5" fill="#c97f1e" opacity="0.55" />
      </g>
    </svg>
  );
}

function Bramblewall({ hpFrac }: { hpFrac: number }) {
  const cracks = hpFrac < 0.66 ? 1 : 0;
  const cracks2 = hpFrac < 0.33 ? 1 : 0;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <ellipse cx="50" cy="92" rx="30" ry="7" fill="#152b1d" />
      <g className="anim-settle" style={{ transformOrigin: '50px 92px' }}>
        <path d="M24 88 C 18 64 20 40 30 24 C 40 10 62 10 72 24 C 82 40 84 66 76 88 Z" fill="#5d4128" stroke={O} strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M28 84 C 24 62 28 40 38 26" fill="none" stroke="#7a5636" strokeWidth="6" strokeLinecap="round" />
        <path d="M72 84 C 76 60 72 38 60 24" fill="none" stroke="#7a5636" strokeWidth="6" strokeLinecap="round" />
        <path d="M30 52 C 44 44 58 44 72 54" fill="none" stroke="#8a6540" strokeWidth="6" strokeLinecap="round" />
        <path d="M32 70 C 46 62 58 64 70 72" fill="none" stroke="#8a6540" strokeWidth="6" strokeLinecap="round" />
        {/* thorns */}
        {[
          [26, 46, -0.5], [74, 48, 0.5], [36, 22, -0.2], [64, 22, 0.2], [50, 14, 0], [24, 66, -0.6], [76, 66, 0.6],
        ].map(([x, y, r], i) => (
          <path key={i} d={`M${x} ${y} l ${6} ${-12} l ${2} ${12} Z`} fill="#d7f7c0" stroke={O} strokeWidth="1.8" transform={`rotate(${(r as number) * 30} ${x} ${y})`} strokeLinejoin="round" />
        ))}
        {/* moss glow between thorns */}
        <circle cx="44" cy="52" r="4" fill="#8fe07c" opacity="0.5" />
        <circle cx="58" cy="70" r="3" fill="#8fe07c" opacity="0.4" />
        {cracks > 0 && <path d="M48 24 L 52 40 L 46 52 L 53 66" fill="none" stroke="#20140a" strokeWidth="2.4" strokeLinecap="round" />}
        {cracks2 > 0 && <path d="M64 34 L 58 48 L 64 60 M36 60 L 42 70 L 38 80" fill="none" stroke="#20140a" strokeWidth="2.2" strokeLinecap="round" />}
      </g>
    </svg>
  );
}

function Cactus() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="ct-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3fae7f" />
          <stop offset="0.5" stopColor="#5fd8a2" />
          <stop offset="1" stopColor="#2f8f66" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="25" ry="6.5" fill="#152b1d" />
      <g className="anim-sway" style={{ transformOrigin: '50px 92px' }}>
        <path d="M36 88 L36 26 C 36 14 64 14 64 26 L64 88 Z" fill="url(#ct-body)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M44 86 L44 22 M56 86 L56 22" stroke="#2a7c5b" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        {/* arm with flower */}
        <path d="M36 46 C 26 46 22 38 24 30 L 30 30 C 29 36 31 40 36 40 Z" fill="url(#ct-body)" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <circle cx="27" cy="27" r="5" fill="#ff8fb3" stroke={O} strokeWidth="2.2" />
        {/* spikes */}
        {[[40, 30], [52, 38], [44, 52], [58, 58], [42, 70], [56, 78]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} l 7 -1.2 l -6 -3.4 Z`} fill="#eef9e9" stroke={O} strokeWidth="1.4" strokeLinejoin="round" />
        ))}
        {/* face */}
        <circle cx="46" cy="34" r="3" fill="#0b1f16" />
        <circle cx="58" cy="34" r="3" fill="#0b1f16" />
        <circle cx="47" cy="33" r="1" fill="#b6ffe0" />
        <circle cx="59" cy="33" r="1" fill="#b6ffe0" />
        <ellipse cx="52" cy="43" rx="3.4" ry="2.4" fill="#103626" />
      </g>
    </svg>
  );
}

function Frostcap() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="fr-cap" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#d9f4ff" />
          <stop offset="0.55" stopColor="#8fd0f5" />
          <stop offset="1" stopColor="#4f8fc9" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="24" ry="6" fill="#152b1d" />
      <g className="anim-sway-slow" style={{ transformOrigin: '50px 92px' }}>
        <path d="M42 90 C 40 74 41 62 44 52 L 56 52 C 59 62 60 74 58 90 Z" fill="#cfe8e4" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M20 52 C 20 30 34 18 50 18 C 66 18 80 30 80 52 C 66 46 34 46 20 52 Z" fill="url(#fr-cap)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <circle cx="38" cy="30" r="3.4" fill="#eefbff" opacity="0.95" />
        <circle cx="58" cy="26" r="2.6" fill="#eefbff" opacity="0.9" />
        <circle cx="66" cy="38" r="2" fill="#eefbff" opacity="0.85" />
        <path d="M28 44 l 4 6 M 46 40 l 0 7 M 70 40 l -4 7" stroke="#eaf9ff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        {/* face under cap */}
        <circle cx="45" cy="62" r="3" fill="#0b1f16" />
        <circle cx="55" cy="62" r="3" fill="#0b1f16" />
        <circle cx="46" cy="61" r="1" fill="#c8ecff" />
        <circle cx="56" cy="61" r="1" fill="#c8ecff" />
        <path d="M46 70 C 49 72 52 72 55 70" stroke="#0b1f16" strokeWidth="2" fill="none" strokeLinecap="round" />
        <g className="anim-mist">
          <circle cx="24" cy="58" r="2.4" fill="#bfe9ff" opacity="0.7" />
          <circle cx="78" cy="62" r="2" fill="#bfe9ff" opacity="0.6" />
        </g>
      </g>
    </svg>
  );
}

function Sentinel() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="sn-disc" cx="0.5" cy="0.45" r="0.65">
          <stop offset="0" stopColor="#a06a2c" />
          <stop offset="1" stopColor="#6e451a" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="92" rx="24" ry="6" fill="#152b1d" />
      <g className="anim-nod" style={{ transformOrigin: '50px 90px' }}>
        <path d="M50 92 C 48 78 48 66 50 54" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M50 92 C 48 78 48 66 50 54" fill="none" stroke="#4c9e57" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M49 76 C 36 76 28 68 26 58 C 38 60 46 66 49 76 Z" fill="#3fae6a" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M51 70 C 62 68 70 62 72 52 C 61 54 53 60 51 70 Z" fill="#57c178" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        {/* petals */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x = 50 + Math.cos(a) * 26;
          const y = 32 + Math.sin(a) * 26;
          return (
            <ellipse key={i} cx={x} cy={y} rx="9" ry="5" fill="#ffcf4d" stroke={O} strokeWidth="2" transform={`rotate(${i * 30} ${x} ${y})`} />
          );
        })}
        <circle cx="50" cy="32" r="21" fill="url(#sn-disc)" stroke={O} strokeWidth="3" />
        {/* seed spiral hint */}
        <circle cx="50" cy="32" r="13" fill="none" stroke="#7d5220" strokeWidth="1.4" opacity="0.7" />
        <circle cx="50" cy="32" r="6.5" fill="none" stroke="#7d5220" strokeWidth="1.2" opacity="0.7" />
        {/* eyes — vigilant */}
        <circle cx="43" cy="29" r="3.4" fill="#12200f" />
        <circle cx="57" cy="29" r="3.4" fill="#12200f" />
        <circle cx="44.2" cy="27.8" r="1.2" fill="#ffe9a8" />
        <circle cx="58.2" cy="27.8" r="1.2" fill="#ffe9a8" />
        <path d="M40 24 l 5 2 M60 24 l -5 2" stroke="#12200f" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─────────────────── FLORA BATCH 1: ANSWERS FROM THE DEPTHS ────────────────
function Cinderpod() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="cp-pod" cx="0.42" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#ffbe72" />
          <stop offset="0.45" stopColor="#d9602e" />
          <stop offset="1" stopColor="#71241a" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="25" ry="6.5" fill="#152b1d" />
      <g className="anim-sway" style={{ transformOrigin: '50px 92px' }}>
        {/* woody stem */}
        <path d="M50 90 C 45 78 45 70 50 62" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M50 90 C 45 78 45 70 50 62" fill="none" stroke="#6b5230" strokeWidth="6" strokeLinecap="round" />
        {/* leaves */}
        <path d="M48 76 C 36 75 29 68 27 59 C 38 61 46 67 48 76 Z" fill="#3fae6a" stroke={O} strokeWidth="2.3" strokeLinejoin="round" />
        <path d="M51 70 C 62 68 69 61 71 52 C 60 54 52 60 51 70 Z" fill="#4cc97e" stroke={O} strokeWidth="2.3" strokeLinejoin="round" />
        {/* the pod */}
        <ellipse cx="50" cy="38" rx="25" ry="27" fill="url(#cp-pod)" stroke={O} strokeWidth="3.2" />
        <path d="M50 12 C 36 14 27 24 28 38" fill="none" stroke="#ffdca0" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
        {/* glowing seams — the bang inside */}
        <path d="M32 30 L 45 40 L 33 50 M 68 28 L 56 40 L 67 52 M 50 52 L 50 62" stroke="#ffd76a" strokeWidth="2.6" fill="none" strokeLinecap="round" className="anim-breathe" />
        <path d="M30 24 L 26 18 M 70 22 L 75 15" stroke="#c9a86a" strokeWidth="3" strokeLinecap="round" />
        {/* fuse */}
        <path d="M50 11 C 47 5 52 3 49 -2" fill="none" stroke={O} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M50 11 C 47 5 52 3 49 -2" fill="none" stroke="#8a6f4c" strokeWidth="2" strokeLinecap="round" />
        <g className="anim-twinkle">
          <circle cx="48" cy="-4" r="4" fill="#ff9a3d" opacity="0.9" />
          <circle cx="48" cy="-4" r="2" fill="#fff3c4" />
        </g>
        {/* wary eyes */}
        <circle cx="41" cy="36" r="3.4" fill="#2a0f08" />
        <circle cx="59" cy="36" r="3.4" fill="#2a0f08" />
        <circle cx="42" cy="35" r="1.2" fill="#ffd6a8" />
        <circle cx="60" cy="35" r="1.2" fill="#ffd6a8" />
        <path d="M44 46 C 48 49 52 49 56 46" stroke="#2a0f08" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function DeeprootSentry() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="ds-stalk" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#2f8f5b" />
          <stop offset="1" stopColor="#7fe0a8" />
        </linearGradient>
        <radialGradient id="ds-bulb" cx="0.45" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#f0ffe0" />
          <stop offset="0.6" stopColor="#8fd8b8" />
          <stop offset="1" stopColor="#3f8f74" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="27" ry="7" fill="#152b1d" />
      {/* disturbed soil */}
      <path d="M22 90 C 32 82 68 82 78 90 Z" fill="#4a3a22" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
      <g className="anim-sway-slow" style={{ transformOrigin: '50px 90px' }}>
        {/* leafy crown */}
        <path d="M50 88 C 47 74 48 62 50 54" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M50 88 C 47 74 48 62 50 54" fill="none" stroke="url(#ds-stalk)" strokeWidth="6.4" strokeLinecap="round" />
        <path d="M48 66 C 36 66 28 60 26 50 C 38 52 46 57 48 66 Z" fill="#4cc97e" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M52 60 C 63 58 70 51 72 42 C 61 44 53 50 52 60 Z" fill="#3fae6a" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        {/* listening head — a downward funnel of roots */}
        <path d="M50 54 C 38 50 32 40 34 30 C 42 33 49 40 50 48 C 51 40 58 33 66 30 C 68 40 62 50 50 54 Z" fill="#9fe8c0" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <ellipse cx="50" cy="34" rx="9" ry="10" fill="url(#ds-bulb)" stroke={O} strokeWidth="2.6" />
        <circle cx="50" cy="34" r="4" fill="#123526" />
        <circle cx="48.6" cy="32.6" r="1.5" fill="#c8ffe8" />
        {/* the ear beneath the soil: a glowing taproot */}
        <g opacity="0.95">
          <path d="M50 92 C 50 104 52 116 56 126 C 50 128 44 126 40 122 C 44 112 46 102 46 92 Z" fill="#7a6142" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M40 108 C 32 110 26 116 24 124 M 60 110 C 68 112 74 118 76 126" stroke={O} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="56" cy="118" r="4.4" fill="#d9ffb0" className="anim-breathe" />
          <circle cx="34" cy="118" r="3" fill="#a3f2a0" opacity="0.8" className="anim-breathe" />
          <circle cx="70" cy="122" r="2.6" fill="#a3f2a0" opacity="0.7" />
        </g>
      </g>
    </svg>
  );
}

function BulwarkBramble({ hpFrac }: { hpFrac: number }) {
  const cracked = hpFrac < 0.6;
  const broken = hpFrac < 0.3;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <ellipse cx="50" cy="92" rx="34" ry="7.5" fill="#152b1d" />
      <g className="anim-settle" style={{ transformOrigin: '50px 92px' }}>
        {/* the reach: boughs sweeping out to either side */}
        <path d="M30 62 C 14 58 4 48 2 34" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M30 62 C 14 58 4 48 2 34" fill="none" stroke="#6b4c2c" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M70 62 C 86 58 96 48 98 34" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M70 62 C 86 58 96 48 98 34" fill="none" stroke="#6b4c2c" strokeWidth="5.6" strokeLinecap="round" />
        {/* bark body */}
        <path d="M22 88 C 16 62 18 38 30 22 C 42 8 60 8 72 22 C 84 38 86 64 78 88 Z" fill="#6a4a2c" stroke={O} strokeWidth="3.6" strokeLinejoin="round" />
        <path d="M28 84 C 24 60 28 38 38 24" fill="none" stroke="#8a6540" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M72 84 C 76 58 72 36 60 24" fill="none" stroke="#8a6540" strokeWidth="6.5" strokeLinecap="round" />
        {/* shield plates */}
        <path d="M34 40 C 42 32 58 32 66 40 C 64 54 58 62 50 66 C 42 62 36 54 34 40 Z" fill="#5d7a4a" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M50 36 L 50 66 M 38 42 C 46 46 54 46 62 42" stroke="#3f5a33" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.9" />
        {/* thorn crown */}
        {[[24, 40, -0.55], [76, 40, 0.55], [34, 18, -0.25], [66, 18, 0.25], [50, 10, 0]].map(([x, y, r], i) => (
          <path key={i} d={`M${x} ${y} l 6 -13 l 3 13 Z`} fill="#d7f7c0" stroke={O} strokeWidth="1.8" transform={`rotate(${(r as number) * 32} ${x} ${y})`} strokeLinejoin="round" />
        ))}
        {/* moss + creeping light */}
        <circle cx="42" cy="52" r="4" fill="#8fe07c" opacity="0.5" />
        <circle cx="62" cy="74" r="3.2" fill="#8fe07c" opacity="0.4" />
        {cracked && <path d="M40 24 L 45 42 L 38 54 L 44 70" fill="none" stroke="#20140a" strokeWidth="2.6" strokeLinecap="round" />}
        {broken && <path d="M64 30 L 58 46 L 66 60 L 60 76 M32 60 L 38 72" fill="none" stroke="#20140a" strokeWidth="2.4" strokeLinecap="round" />}
        {/* watchful face */}
        <circle cx="43" cy="30" r="2.8" fill="#12200f" />
        <circle cx="57" cy="30" r="2.8" fill="#12200f" />
        <path d="M44 24 l 4 2 M56 24 l -4 2" stroke="#12200f" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function SnaptrapRoot() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="st-maw" cx="0.5" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#ff9fb8" />
          <stop offset="0.55" stopColor="#c7385f" />
          <stop offset="1" stopColor="#6e1632" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="28" ry="7" fill="#152b1d" />
      <g className="anim-settle" style={{ transformOrigin: '50px 92px' }}>
        {/* root buttress */}
        <path d="M32 90 C 26 74 32 62 50 58 C 68 62 74 74 68 90 Z" fill="#5d4128" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M38 88 C 34 76 38 68 50 66 C 62 68 66 76 62 88" fill="none" stroke="#7a5636" strokeWidth="4" strokeLinecap="round" />
        {/* lower jaw */}
        <path d="M18 52 C 30 40 70 40 82 52 C 72 62 62 66 50 66 C 38 66 28 62 18 52 Z" fill="url(#st-maw)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        {/* upper jaw, hinged open */}
        <g className="anim-nod" style={{ transformOrigin: '50px 46px' }}>
          <path d="M16 48 C 26 22 68 16 84 40 C 72 34 58 34 50 40 C 40 34 26 38 16 48 Z" fill="#a42c50" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
          {[[26, 34], [38, 27], [52, 25], [66, 29], [78, 37]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} l 7 10 l -9 1 Z`} fill="#fff3e0" stroke={O} strokeWidth="1.7" strokeLinejoin="round" />
          ))}
        </g>
        {/* lower teeth */}
        {[[26, 48], [38, 43], [50, 42], [62, 43], [74, 48]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} l -2 10 l 6 -8 Z`} fill="#fff3e0" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        ))}
        {/* lure: a sweet-smelling pip */}
        <path d="M50 62 C 48 54 50 48 54 44" fill="none" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="55" cy="41" r="4.6" fill="#ffd76a" stroke={O} strokeWidth="2" className="anim-breathe" />
        {/* half-lidded eyes */}
        <circle cx="34" cy="72" r="3.2" fill="#2a0f18" />
        <circle cx="66" cy="72" r="3.2" fill="#2a0f18" />
        <path d="M30 68 l 8 1 M70 68 l -8 1" stroke="#2a0f18" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Watchvine() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="wv-stem" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#2f7f52" />
          <stop offset="1" stopColor="#63d99a" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="24" ry="6.5" fill="#152b1d" />
      <g className="anim-sway-slow" style={{ transformOrigin: '50px 92px' }}>
        {/* twin coil */}
        <path d="M42 90 C 30 76 34 62 46 54 C 56 46 58 36 52 28" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M42 90 C 30 76 34 62 46 54 C 56 46 58 36 52 28" fill="none" stroke="url(#wv-stem)" strokeWidth="6.4" strokeLinecap="round" />
        <path d="M58 90 C 68 78 66 66 56 58" fill="none" stroke={O} strokeWidth="8" strokeLinecap="round" />
        <path d="M58 90 C 68 78 66 66 56 58" fill="none" stroke="#3fae6a" strokeWidth="5" strokeLinecap="round" />
        {/* leaves */}
        <path d="M44 72 C 32 72 25 65 23 56 C 34 58 42 63 44 72 Z" fill="#4cc97e" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M58 66 C 70 64 77 57 79 48 C 68 50 60 56 58 66 Z" fill="#3fae6a" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        {/* the watching eye — front and back */}
        <path d="M30 26 C 30 12 44 4 58 6 C 74 8 84 20 82 32 C 80 44 66 50 52 47 C 38 44 30 38 30 26 Z" fill="#8fe07c" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="56" cy="26" r="13" fill="#f6fff0" stroke={O} strokeWidth="2.6" />
        <circle cx="52" cy="26" r="7.4" fill="#123526" />
        <circle cx="50" cy="23.6" r="2.4" fill="#d9ffb0" />
        <path d="M40 12 L 34 4 M 68 12 L 74 3" stroke={O} strokeWidth="2.2" strokeLinecap="round" />
        {/* thorns that face both ways */}
        <path d="M28 34 L 16 30 L 28 24 Z" fill="#eaffd9" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M84 30 L 96 32 L 84 38 Z" fill="#eaffd9" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function BindweedSnare() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="bw-vine" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2f8f7a" />
          <stop offset="1" stopColor="#8fe0c8" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="25" ry="6.5" fill="#152b1d" />
      <g className="anim-sway-slow" style={{ transformOrigin: '50px 92px' }}>
        <path d="M50 90 C 42 80 40 70 46 62 C 52 54 62 50 68 42" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M50 90 C 42 80 40 70 46 62 C 52 54 62 50 68 42" fill="none" stroke="url(#bw-vine)" strokeWidth="5.6" strokeLinecap="round" />
        {/* the loop, coiled and ready */}
        <g className="anim-spin-slow" style={{ transformOrigin: '46px 30px', animationDuration: '9s' }}>
          <ellipse cx="46" cy="30" rx="20" ry="17" fill="none" stroke={O} strokeWidth="7" />
          <ellipse cx="46" cy="30" rx="20" ry="17" fill="none" stroke="url(#bw-vine)" strokeWidth="4" />
        </g>
        {/* barbs along the loop */}
        {[[26, 26], [34, 12], [54, 12], [66, 24], [64, 40], [30, 40]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} l -1 -9 l 6 7 Z`} fill="#eaffd9" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        ))}
        <path d="M68 42 C 74 46 76 52 74 58" fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" />
        {/* leaves */}
        <path d="M44 74 C 32 74 24 67 22 57 C 34 59 42 65 44 74 Z" fill="#4cc97e" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="46" cy="30" r="5.5" fill="#123526" />
        <circle cx="44.4" cy="28.4" r="1.8" fill="#a8fff0" />
      </g>
    </svg>
  );
}

function NectarLotus({ hpFrac }: { hpFrac: number }) {
  const full = hpFrac > 0.5;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="nl-pool" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff8dd" />
          <stop offset="0.55" stopColor="#ffd76a" />
          <stop offset="1" stopColor="#e08f22" />
        </radialGradient>
        <linearGradient id="nl-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd7ef" />
          <stop offset="1" stopColor="#d97fb4" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="25" ry="6.5" fill="#152b1d" />
      <g className="anim-sway-slow" style={{ transformOrigin: '50px 92px' }}>
        <path d="M50 90 C 46 78 46 70 50 62" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M50 90 C 46 78 46 70 50 62" fill="none" stroke="#3f9e68" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M48 76 C 36 76 28 69 26 59 C 38 61 46 67 48 76 Z" fill="#4cc97e" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        {/* petals — a broad open bloom */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = -180 + i * 22.5;
          return (
            <ellipse
              key={i}
              cx={50 + Math.cos((a * Math.PI) / 180) * 21}
              cy={52 + Math.sin((a * Math.PI) / 180) * 13}
              rx="15"
              ry="7.5"
              fill="url(#nl-petal)"
              stroke={O}
              strokeWidth="2.2"
              transform={`rotate(${a + 90} ${50 + Math.cos((a * Math.PI) / 180) * 21} ${52 + Math.sin((a * Math.PI) / 180) * 13})`}
            />
          );
        })}
        {/* nectar bowl */}
        <ellipse cx="50" cy="50" rx="17" ry="13" fill="url(#nl-pool)" stroke={O} strokeWidth="2.8" />
        <ellipse cx="44" cy="45" rx="5" ry="3.4" fill="#fffdf0" opacity="0.85" transform="rotate(-22 44 45)" />
        {/* rising droplets — the rebate, visibly ripening */}
        {full && (
          <g className="anim-twinkle">
            <circle cx="34" cy="30" r="2.6" fill="#ffe9a8" />
            <circle cx="66" cy="26" r="2.2" fill="#ffe9a8" />
            <circle cx="50" cy="18" r="1.9" fill="#fff6cf" />
          </g>
        )}
        <circle cx="45" cy="60" r="2.6" fill="#2a1d08" />
        <circle cx="55" cy="60" r="2.6" fill="#2a1d08" />
        <path d="M46 66 C 49 68 51 68 54 66" stroke="#2a1d08" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─────────────────────────── FLORA BATCH 2 ─────────────────────────────────
function IronbarkTitan() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="ib-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b563a" />
          <stop offset="0.45" stopColor="#4a3a26" />
          <stop offset="1" stopColor="#2e2418" />
        </linearGradient>
        <linearGradient id="ib-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9c2cc" />
          <stop offset="1" stopColor="#5d6a78" />
        </linearGradient>
      </defs>
      <g className="anim-settle">
        {/* roots */}
        <path d="M28 92 C 22 84 20 78 22 72 M 72 92 C 78 84 80 78 78 72" stroke={O} strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* trunk */}
        <path d="M26 92 C 22 66 24 34 38 22 C 52 12 70 18 74 34 C 78 52 76 76 72 92 Z" fill="url(#ib-wood)" stroke={O} strokeWidth="3.6" strokeLinejoin="round" />
        <path d="M34 84 C 32 62 33 40 40 28 M 52 88 C 51 64 52 42 56 30 M 66 84 C 66 64 66 46 64 34" stroke="#241b10" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* iron banding — the reason nothing sticks to it */}
        <path d="M25 66 C 42 60 62 60 75 66 L 75 76 C 62 70 42 70 25 76 Z" fill="url(#ib-iron)" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <circle cx="36" cy="69" r="2.4" fill="#2c333c" />
        <circle cx="52" cy="67" r="2.4" fill="#2c333c" />
        <circle cx="66" cy="69" r="2.4" fill="#2c333c" />
        {/* the fist */}
        <g className="anim-nod">
          <path d="M62 44 C 78 40 92 46 94 56 C 95 66 84 72 72 68 C 64 65 60 54 62 44 Z" fill="#5d6a78" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M70 48 l 16 4 M 68 56 l 18 3 M 70 63 l 14 2" stroke="#2c333c" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        {/* eye slit */}
        <path d="M36 40 C 42 36 52 36 58 40 C 52 45 42 45 36 40 Z" fill="#120c06" stroke={O} strokeWidth="2" />
        <circle cx="47" cy="40" r="3.4" fill="#ffcf6b" className="anim-breathe" />
      </g>
    </svg>
  );
}

function EmberlashVine({ beamOn }: { beamOn: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="el-ember" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ff9a3d" />
          <stop offset="1" stopColor="#c9410f" />
        </radialGradient>
      </defs>
      <g className="anim-sway">
        {/* coiled base */}
        <path d="M32 92 C 24 84 26 74 36 72 C 46 70 52 78 48 86" fill="none" stroke={O} strokeWidth="7" strokeLinecap="round" />
        <path d="M32 92 C 24 84 26 74 36 72 C 46 70 52 78 48 86" fill="none" stroke="#7a4a22" strokeWidth="4" strokeLinecap="round" />
        {/* the lash */}
        <path d="M42 80 C 40 60 46 44 60 34 C 72 26 84 28 88 36" fill="none" stroke={O} strokeWidth="7" strokeLinecap="round" />
        <path d="M42 80 C 40 60 46 44 60 34 C 72 26 84 28 88 36" fill="none" stroke="#b4551f" strokeWidth="4" strokeLinecap="round" />
        {/* leaves */}
        <path d="M44 62 C 32 58 26 48 30 40 C 40 42 46 52 44 62 Z" fill="#8f5a26" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M58 44 C 52 34 54 24 62 20 C 68 28 66 38 58 44 Z" fill="#a8631f" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        {/* the ember maw */}
        <g className={beamOn ? 'anim-breathe' : 'anim-breathe-slow'}>
          <circle cx="90" cy="38" r={beamOn ? 12 : 9} fill="url(#el-ember)" stroke={O} strokeWidth="2.6" />
          <circle cx="90" cy="38" r={beamOn ? 5 : 3.6} fill="#fff8e0" />
          {beamOn && (
            <g className="anim-twinkle">
              <path d="M90 20 l 0 -8 M 102 30 l 7 -5 M 104 44 l 8 2 M 96 52 l 4 7" stroke="#ffcf6b" strokeWidth="2.6" strokeLinecap="round" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

function NeedleReed() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <g className="anim-sway-slow">
        {/* the reeds */}
        {[
          { x: 30, y: 92, t: 26, w: 3 },
          { x: 44, y: 94, t: 16, w: 3.4 },
          { x: 58, y: 92, t: 22, w: 3 },
          { x: 72, y: 94, t: 32, w: 2.6 },
        ].map((r, i) => (
          <g key={i}>
            <path d={`M${r.x} ${r.y} C ${r.x - 3} ${r.y - 24} ${r.x + 2} ${r.y - 44} ${r.x + 4} ${r.t + 34}`} fill="none" stroke={O} strokeWidth={r.w + 2.4} strokeLinecap="round" />
            <path d={`M${r.x} ${r.y} C ${r.x - 3} ${r.y - 24} ${r.x + 2} ${r.y - 44} ${r.x + 4} ${r.t + 34}`} fill="none" stroke="#9fbf5a" strokeWidth={r.w} strokeLinecap="round" />
          </g>
        ))}
        {/* needle tips */}
        <path d="M34 60 l 6 -14 l 5 13 Z M48 50 l 5 -16 l 5 15 Z M62 56 l 6 -15 l 4 14 Z M76 66 l 5 -13 l 4 12 Z" fill="#e8f0c8" stroke={O} strokeWidth="2" strokeLinejoin="round" />
        {/* sheath */}
        <path d="M26 94 C 36 84 64 84 76 94 Z" fill="#6f8f3a" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function GaleFern() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <g className="anim-sway">
        {/* fronds curling into a wind spiral */}
        <path d="M50 94 C 48 74 48 58 50 44" fill="none" stroke={O} strokeWidth="7" strokeLinecap="round" />
        <path d="M50 94 C 48 74 48 58 50 44" fill="none" stroke="#5f9a6a" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 62 C 34 60 22 50 20 38 C 34 38 46 48 50 62 Z" fill="#7fc08a" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M50 54 C 66 52 78 42 80 30 C 66 30 54 40 50 54 Z" fill="#7fc08a" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M50 74 C 36 74 26 68 22 60 C 34 58 44 64 50 74 Z" fill="#6aab78" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        {/* the gust */}
        <g className="anim-spin-slow" style={{ transformOrigin: '50px 30px' }}>
          <path d="M22 30 C 30 18 52 14 66 22 C 76 28 74 40 62 40 C 54 40 52 32 58 30" fill="none" stroke="#dff5ff" strokeWidth="3.4" strokeLinecap="round" opacity="0.95" />
          <path d="M30 40 C 40 32 58 30 70 36" fill="none" stroke="#a8e0f0" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
        </g>
        <g className="anim-twinkle">
          <circle cx="84" cy="26" r="2.6" fill="#dff5ff" />
          <circle cx="14" cy="44" r="2.2" fill="#dff5ff" />
          <circle cx="88" cy="44" r="1.8" fill="#a8e0f0" />
        </g>
      </g>
    </svg>
  );
}

function SentinelBloom({ flash }: { flash: number }) {
  const lit = flash > 0;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="sb-petal" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor={lit ? '#fff3c4' : '#e8d9ff'} />
          <stop offset="1" stopColor={lit ? '#ff9a3d' : '#7a5cc4'} />
        </radialGradient>
      </defs>
      <g className="anim-sway-slow">
        <path d="M50 94 C 48 78 48 66 50 56" fill="none" stroke={O} strokeWidth="7" strokeLinecap="round" />
        <path d="M50 94 C 48 78 48 66 50 56" fill="none" stroke="#4f8f5a" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 80 C 38 78 30 70 30 62 C 40 62 48 70 50 80 Z" fill="#6aab78" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        {/* petals */}
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx="50"
            cy="26"
            rx="10"
            ry="18"
            fill="url(#sb-petal)"
            stroke={O}
            strokeWidth="2.4"
            transform={`rotate(${a} 50 40)`}
          />
        ))}
        {/* the watching eye */}
        <circle cx="50" cy="40" r="12" fill="#150f28" stroke={O} strokeWidth="2.6" />
        <circle cx="50" cy="40" r={lit ? 8 : 6} fill={lit ? '#ff5d7c' : '#ffd76a'} className="anim-breathe" />
        <circle cx="50" cy="40" r="2.6" fill="#150f28" />
        {/* barbs — what actually does the counter-striking */}
        <path d="M28 40 l -12 -6 M 72 40 l 12 -6 M 32 58 l -11 6 M 68 58 l 11 6" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <path d="M16 34 l -5 -2 M 84 34 l 5 -2" stroke={lit ? '#ff9a3d' : '#c9b8ee'} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function AmbushFern({ armed }: { armed: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <g className={armed ? 'anim-breathe-slow' : 'anim-settle'}>
        {/* soil mound */}
        <path d="M20 92 C 30 82 70 82 80 92 Z" fill="#5a4630" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        {armed ? (
          <g>
            {/* folded shut — a fist waiting */}
            <path d="M34 84 C 28 66 34 48 50 44 C 66 48 72 66 66 84 Z" fill="#4f8f4a" stroke={O} strokeWidth="3" strokeLinejoin="round" />
            <path d="M50 46 L 50 82" stroke="#2c5a2c" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M38 58 C 44 54 56 54 62 58 M 36 70 C 44 66 56 66 64 70" stroke="#2c5a2c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* the tell: a single pale trigger hair */}
            <path d="M50 44 C 48 34 50 26 54 20" fill="none" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="54" cy="19" r="3.4" fill="#ffd76a" className="anim-twinkle" />
          </g>
        ) : (
          <g>
            {/* sprung open and spent */}
            <path d="M30 84 C 18 70 14 54 20 44 C 30 50 34 66 34 82 Z" fill="#3f7a3c" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
            <path d="M70 84 C 82 70 86 54 80 44 C 70 50 66 66 66 82 Z" fill="#3f7a3c" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
            <path d="M40 84 C 38 74 40 66 46 62 M 60 84 C 62 74 60 66 54 62" fill="none" stroke="#2c5a2c" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="50" cy="70" r="4" fill="#2c5a2c" opacity="0.7" />
          </g>
        )}
      </g>
    </svg>
  );
}

function PrismBud({ fire }: { fire: boolean }) {
  const a = fire ? '#ff9a3d' : '#7fd4ff';
  const b = fire ? '#ffd76a' : '#c9b8ee';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="pb-crystal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={b} />
          <stop offset="0.5" stopColor="#f4fbff" />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <g className="anim-sway-slow">
        <path d="M50 94 C 48 78 48 66 50 54" fill="none" stroke={O} strokeWidth="7" strokeLinecap="round" />
        <path d="M50 94 C 48 78 48 66 50 54" fill="none" stroke="#4f8f7a" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 78 C 38 76 30 68 30 60 C 40 60 48 68 50 78 Z" fill="#6aab98" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M50 72 C 62 70 70 62 70 54 C 60 54 52 62 50 72 Z" fill="#6aab98" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        {/* the bud: a cut crystal splitting its own light */}
        <g className="anim-breathe">
          <path d="M50 12 L 70 34 L 62 58 L 38 58 L 30 34 Z" fill="url(#pb-crystal)" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M50 12 L 50 58 M 30 34 L 70 34 M 38 58 L 62 34 M 62 58 L 38 34" stroke={O} strokeWidth="1.8" opacity="0.55" />
          <circle cx="50" cy="36" r="6" fill="#fff" opacity="0.85" />
        </g>
        {/* the two beams it alternates between */}
        <g className="anim-twinkle">
          <path d="M70 34 L 90 24" stroke="#7fd4ff" strokeWidth={fire ? 2.2 : 4} strokeLinecap="round" opacity={fire ? 0.45 : 0.95} />
          <path d="M70 34 L 90 46" stroke="#ff9a3d" strokeWidth={fire ? 4 : 2.2} strokeLinecap="round" opacity={fire ? 0.95 : 0.45} />
        </g>
      </g>
    </svg>
  );
}

export function FloraSprite({
  k,
  hpFrac = 1,
  beamOn = false,
  armed = true,
  fire = false,
  riposteFlash = 0,
}: {
  k: FloraKey;
  hpFrac?: number;
  beamOn?: boolean; // Emberlash Vine: currently holding its beam on something
  armed?: boolean; // Ambush Fern: folded and waiting vs. sprung and recharging
  fire?: boolean; // Prism Bud: the next shot is the fire half of the alternation
  riposteFlash?: number; // Sentinel Bloom: just counter-struck something
}) {
  switch (k) {
    case 'thornvine': return <Thornvine />;
    case 'glowbulb': return <Glowbulb />;
    case 'bramble': return <Bramblewall hpFrac={hpFrac} />;
    case 'cactus': return <Cactus />;
    case 'frostcap': return <Frostcap />;
    case 'sentinel': return <Sentinel />;
    case 'cinderpod': return <Cinderpod />;
    case 'deeproot': return <DeeprootSentry />;
    case 'bulwark': return <BulwarkBramble hpFrac={hpFrac} />;
    case 'snaptrap': return <SnaptrapRoot />;
    case 'watchvine': return <Watchvine />;
    case 'bindweed': return <BindweedSnare />;
    case 'lotus': return <NectarLotus hpFrac={hpFrac} />;
    case 'ironbark': return <IronbarkTitan />;
    case 'emberlash': return <EmberlashVine beamOn={beamOn} />;
    case 'needlereed': return <NeedleReed />;
    case 'gale': return <GaleFern />;
    case 'sentinelbloom': return <SentinelBloom flash={riposteFlash} />;
    case 'ambush': return <AmbushFern armed={armed} />;
    case 'prism': return <PrismBud fire={fire} />;
  }
}

// ─────────────────────────────── ENEMIES ───────────────────────────────────
function Gnat() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <g className="anim-bob">
        <ellipse cx="24" cy="34" rx="14" ry="7" fill="#c9b8ee" opacity="0.5" stroke={O} strokeWidth="1.8" className="anim-flutter" />
        <ellipse cx="26" cy="46" rx="11" ry="5" fill="#c9b8ee" opacity="0.4" stroke={O} strokeWidth="1.6" className="anim-flutter2" />
        <path d="M40 62 C 28 60 20 50 22 38 C 24 26 38 20 50 24 C 62 28 68 40 64 50 C 60 60 50 64 40 62 Z" fill="#a478d8" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M60 52 C 66 54 70 58 71 64 C 65 63 60 60 58 56 Z" fill="#8a5cc4" stroke={O} strokeWidth="2" />
        {/* legs */}
        <path d="M40 60 l -4 9 M 50 61 l -1 9 M 58 58 l 3 9" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
        {/* eye */}
        <circle cx="38" cy="40" r="9" fill="#f3ecff" stroke={O} strokeWidth="2.4" />
        <circle cx="36" cy="41" r="4.4" fill="#2a1040" />
        <circle cx="37.4" cy="39.6" r="1.5" fill="#ffb1e1" />
        <path d="M24 30 L 16 22 M 28 26 L 24 15" stroke={O} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Beetle() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="bt-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f6fb8" />
          <stop offset="1" stopColor="#5e4383" />
        </linearGradient>
      </defs>
      {/* legs */}
      <path d="M28 62 l -8 12 M 40 66 l -4 12 M 60 66 l 4 12 M 70 60 l 9 11" stroke={O} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M22 58 C 18 36 34 18 52 18 C 70 18 84 36 80 58 C 66 68 36 68 22 58 Z" fill="url(#bt-shell)" stroke={O} strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M30 44 C 44 38 60 38 74 44 M 34 30 C 46 26 58 26 68 30" stroke="#4a3266" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* moss patches */}
      <circle cx="40" cy="52" r="4" fill="#7fae62" opacity="0.55" />
      <circle cx="62" cy="34" r="3" fill="#7fae62" opacity="0.45" />
      {/* head + mandibles */}
      <path d="M22 52 C 14 50 10 44 12 38 C 18 40 23 44 24 50 Z" fill="#6e4f95" stroke={O} strokeWidth="2.4" />
      <path d="M16 44 l -9 -2 M 17 49 l -8 3" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="19" cy="44" r="3" fill="#ffd6f4" stroke={O} strokeWidth="1.6" />
    </svg>
  );
}

function Skitter() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <g className="anim-skitter">
        <path d="M30 54 l -12 8 M 34 60 l -8 10 M 70 54 l 12 8 M 66 60 l 8 10 M 50 62 l 0 11" stroke={O} strokeWidth="2.6" strokeLinecap="round" className="anim-legs" />
        <ellipse cx="50" cy="48" rx="22" ry="15" fill="#e069b9" stroke={O} strokeWidth="3" />
        <ellipse cx="63" cy="44" rx="10" ry="8" fill="#c24fa0" stroke={O} strokeWidth="2.2" />
        <circle cx="40" cy="44" r="4" fill="#2a1040" />
        <circle cx="41.3" cy="42.8" r="1.4" fill="#ffe1f2" />
        {/* motion arcs */}
        <path d="M18 30 q 6 4 8 10 M 24 22 q 8 5 10 13" stroke="#ff9ad6" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M70 40 l 8 -8 M 73 46 l 10 -4" stroke={O} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Warden({ shellFrac }: { shellFrac: number }) {
  const shelled = shellFrac > 0.01;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <path d="M26 64 l -6 12 M 42 68 l -2 12 M 62 68 l 3 12 M 76 62 l 8 11" stroke={O} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M18 60 C 16 40 30 24 52 24 C 74 24 86 40 84 60 C 68 70 34 70 18 60 Z" fill="#6f528f" stroke={O} strokeWidth="3.4" strokeLinejoin="round" />
      {/* armor plates */}
      <g opacity={shelled ? 1 : 0.35}>
        <path d="M26 54 C 24 40 34 30 48 29 C 46 40 44 48 40 56 C 34 57 29 56 26 54 Z" fill={shelled ? '#67e0c6' : '#4a6e66'} stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M52 29 C 60 30 68 34 74 42 C 68 48 60 52 50 54 C 51 45 52 36 52 29 Z" fill={shelled ? '#4fc9ae' : '#41635b'} stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M76 44 C 78 50 78 54 76 58 C 70 60 62 60 56 58 C 62 52 68 47 76 44 Z" fill={shelled ? '#67e0c6' : '#4a6e66'} stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        {shelled && <path d="M32 40 l 6 6 M 60 36 l 5 7" stroke="#c8fff2" strokeWidth="2.2" strokeLinecap="round" />}
      </g>
      {!shelled && <path d="M40 34 L 48 44 L 42 52 M 60 36 l -6 10 l 8 8" stroke="#241533" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      {/* head */}
      <path d="M18 54 C 10 52 6 46 8 40 C 14 40 20 44 22 50 Z" fill="#5e4383" stroke={O} strokeWidth="2.6" />
      <path d="M12 46 l -10 -3 M 13 52 l -9 4" stroke={O} strokeWidth="3" strokeLinecap="round" />
      <circle cx="15" cy="45" r="3.4" fill="#9dffe9" stroke={O} strokeWidth="1.8" />
    </svg>
  );
}

function Drifter() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <radialGradient id="dr-cap" cx="0.45" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f2d7ff" />
          <stop offset="0.5" stopColor="#cf8bf7" />
          <stop offset="1" stopColor="#8f52c9" />
        </radialGradient>
      </defs>
      {/* tendrils */}
      <g className="anim-tendrils">
        <path d="M36 56 C 34 66 36 74 33 84" fill="none" stroke="#8f52c9" strokeWidth="4" strokeLinecap="round" />
        <path d="M48 58 C 47 68 49 78 46 88" fill="none" stroke="#a468d8" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 56 C 61 66 58 74 61 84" fill="none" stroke="#8f52c9" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 52 C 72 60 70 68 72 76" fill="none" stroke="#a468d8" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* bell */}
      <path d="M22 54 C 18 32 34 14 52 14 C 70 14 84 32 80 54 C 66 48 60 52 52 50 C 44 52 36 48 22 54 Z" fill="url(#dr-cap)" stroke={O} strokeWidth="3" strokeLinejoin="round" opacity="0.96" />
      <ellipse cx="42" cy="26" rx="8" ry="5" fill="#fdf2ff" opacity="0.7" transform="rotate(-18 42 26)" />
      {/* spores inside */}
      <g className="anim-twinkle">
        <circle cx="42" cy="42" r="2.4" fill="#ffd6f4" />
        <circle cx="58" cy="38" r="2" fill="#ffe1f2" />
        <circle cx="64" cy="46" r="1.6" fill="#ffd6f4" />
      </g>
      <circle cx="40" cy="50" r="3.4" fill="#2a1040" />
      <circle cx="41.4" cy="48.8" r="1.2" fill="#ffc9ee" />
    </svg>
  );
}

function Brute() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <g className="anim-lurch">
        {/* legs */}
        <path d="M32 70 l -4 18 M 62 70 l 4 18" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M32 70 l -4 18 M 62 70 l 4 18" stroke="#4a5e33" strokeWidth="5.6" strokeLinecap="round" />
        {/* body */}
        <path d="M18 66 C 12 44 20 22 42 16 C 64 10 84 24 84 46 C 84 62 70 72 50 72 C 36 72 24 72 18 66 Z" fill="#5e6e3a" stroke={O} strokeWidth="3.6" strokeLinejoin="round" />
        {/* arms */}
        <path d="M24 44 C 12 48 8 60 12 70" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M24 44 C 12 48 8 60 12 70" fill="none" stroke="#556632" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M78 46 C 88 50 90 60 86 68" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M78 46 C 88 50 90 60 86 68" fill="none" stroke="#556632" strokeWidth="6.5" strokeLinecap="round" />
        {/* rot holes */}
        <circle cx="56" cy="38" r="7" fill="#33121f" stroke={O} strokeWidth="2" />
        <circle cx="56" cy="38" r="3.6" fill="#ff5d8f" className="anim-breathe" />
        <circle cx="34" cy="56" r="5" fill="#33121f" stroke={O} strokeWidth="2" />
        <circle cx="34" cy="56" r="2.4" fill="#ff8561" className="anim-breathe" />
        {/* moss */}
        <circle cx="40" cy="24" r="4" fill="#8fbf4f" opacity="0.6" />
        <circle cx="70" cy="28" r="3" fill="#8fbf4f" opacity="0.5" />
        {/* sunken head */}
        <path d="M20 34 C 16 26 20 18 30 18 C 38 18 42 26 38 34 C 32 39 24 39 20 34 Z" fill="#4c5c2e" stroke={O} strokeWidth="3" />
        <circle cx="26" cy="27" r="3.6" fill="#ffd2e0" stroke={O} strokeWidth="1.6" />
        <circle cx="25" cy="27.6" r="1.6" fill="#3d0a1d" />
        <path d="M22 34 l 3 3 l 3 -3" stroke={O} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Colossus({ phase }: { phase: number }) {
  const glow = phase === 1 ? '#ff5d8f' : phase === 2 ? '#ff9a3d' : '#ff3d3d';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <g className="anim-lurch-slow">
        {/* legs */}
        <path d="M30 74 l -5 18 M 66 74 l 5 18" stroke={O} strokeWidth="11" strokeLinecap="round" />
        <path d="M30 74 l -5 18 M 66 74 l 5 18" stroke="#3d3348" strokeWidth="7" strokeLinecap="round" />
        {/* body */}
        <path d="M16 72 C 10 48 16 24 38 14 C 58 5 82 16 88 38 C 92 56 80 74 52 76 C 36 77 22 76 16 72 Z" fill="#4b3d59" stroke={O} strokeWidth="3.6" strokeLinejoin="round" />
        {/* plate ridges */}
        <path d="M22 56 C 36 48 62 46 82 52 M 26 40 C 40 32 62 30 80 36" stroke="#382c46" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        {/* spore crown */}
        {[[30, 12], [44, 6], [60, 7], [74, 14]].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x} ${y + 8} L ${x} ${y}`} stroke={O} strokeWidth="5" strokeLinecap="round" />
            <circle cx={x} cy={y - 2} r={5 - (i % 2)} fill="#7c5aa8" stroke={O} strokeWidth="2.2" />
            <circle cx={x} cy={y - 2} r={1.8} fill={glow} className="anim-breathe" />
          </g>
        ))}
        {/* core eye */}
        <circle cx="34" cy="38" r="13" fill="#1c0f26" stroke={O} strokeWidth="3" />
        <circle cx="34" cy="38" r="7.5" fill={glow} className="anim-breathe" />
        <circle cx="31" cy="35" r="2.2" fill="#fff" opacity="0.85" />
        {/* rot vents */}
        <circle cx="62" cy="56" r="6" fill="#241430" stroke={O} strokeWidth="2" />
        <circle cx="62" cy="56" r="3" fill={glow} opacity="0.85" className="anim-breathe" />
        <circle cx="48" cy="66" r="4" fill="#241430" stroke={O} strokeWidth="2" />
        <circle cx="48" cy="66" r="1.8" fill={glow} opacity="0.8" />
        {/* arms */}
        <path d="M20 48 C 6 54 4 68 10 78" fill="none" stroke={O} strokeWidth="11" strokeLinecap="round" />
        <path d="M20 48 C 6 54 4 68 10 78" fill="none" stroke="#433650" strokeWidth="7" strokeLinecap="round" />
        <path d="M84 46 C 94 52 94 64 88 72" fill="none" stroke={O} strokeWidth="11" strokeLinecap="round" />
        <path d="M84 46 C 94 52 94 64 88 72" fill="none" stroke="#433650" strokeWidth="7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─────────────────────── BATCH 1: ROOTBOUND DEPTHS ─────────────────────────
function MiteVaulter() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <radialGradient id="mv-body" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#e4ff9c" />
          <stop offset="0.55" stopColor="#b8e04a" />
          <stop offset="1" stopColor="#7fa32c" />
        </radialGradient>
      </defs>
      <g className="anim-skitter">
        {/* colossal coiled hind legs — the whole point of this little horror */}
        <path d="M62 58 C 84 56 94 42 88 26 C 84 16 74 14 70 22 C 74 26 78 30 76 36 C 73 44 66 48 60 50 Z" fill="#9ccb36" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M64 60 C 82 64 92 78 84 90 C 78 96 68 92 70 84 C 72 78 70 72 62 66 Z" fill="#8ab52e" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        {/* body */}
        <ellipse cx="46" cy="52" rx="22" ry="17" fill="url(#mv-body)" stroke={O} strokeWidth="3" />
        <path d="M52 40 C 60 42 66 48 67 55 M 50 62 C 58 62 64 58 66 53" stroke="#5f7f1e" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* head + eye */}
        <path d="M26 46 C 18 44 12 48 12 54 C 12 60 20 64 28 62 C 32 60 34 56 33 52 Z" fill="#cdef7a" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M16 50 l -9 -3 M 16 57 l -8 4" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="22" cy="52" r="5" fill="#f4ffe0" stroke={O} strokeWidth="1.8" />
        <circle cx="20.6" cy="52.6" r="2.6" fill="#2a1f04" />
        <circle cx="19.8" cy="51.6" r="0.9" fill="#eaffb0" />
        {/* front legs */}
        <path d="M34 64 l -3 10 M 44 68 l -1 9 M 54 66 l 4 9" stroke={O} strokeWidth="2.4" strokeLinecap="round" className="anim-legs" />
        {/* leap motion arcs */}
        <path d="M12 34 q 10 -8 24 -6 M 10 24 q 12 -10 30 -7" stroke="#d3f77e" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.65" />
      </g>
    </svg>
  );
}

function StonebackGrub({ stoneFrac }: { stoneFrac: number }) {
  const slab = stoneFrac > 0.01;
  const cracked = stoneFrac < 0.55;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="sb-slab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9b3a4" />
          <stop offset="0.5" stopColor="#8f8a7c" />
          <stop offset="1" stopColor="#6b675c" />
        </linearGradient>
        <radialGradient id="sb-body" cx="0.42" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#f0c9d8" />
          <stop offset="0.6" stopColor="#cf9ab5" />
          <stop offset="1" stopColor="#a06e8c" />
        </radialGradient>
      </defs>
      <g className="anim-lurch">
        {/* stub legs */}
        <path d="M30 72 l -4 8 M 42 76 l -2 8 M 58 76 l 3 8 M 70 70 l 6 7" stroke={O} strokeWidth="3.4" strokeLinecap="round" className="anim-legs" />
        {/* pale grub body */}
        <path d="M22 70 C 14 56 18 40 34 34 C 52 26 74 30 82 46 C 88 58 82 70 68 74 C 52 78 32 80 22 70 Z" fill="url(#sb-body)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M34 40 C 30 48 30 58 34 66 M 50 36 C 47 46 47 58 50 70 M 66 40 C 64 48 64 58 66 66" stroke="#8a5a74" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
        {/* the stone slab */}
        {slab ? (
          <g>
            <path d="M20 44 C 18 26 34 12 52 12 C 70 12 86 26 84 44 C 66 38 36 38 20 44 Z" fill="url(#sb-slab)" stroke={O} strokeWidth="3.4" strokeLinejoin="round" />
            <path d="M34 16 L 40 30 L 33 38 M 62 15 L 56 28 L 64 36" stroke="#4d4a41" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.85" />
            {cracked && <path d="M50 12 L 47 26 L 53 34 L 48 42" stroke="#2e2c26" strokeWidth="2.8" fill="none" strokeLinecap="round" />}
            {/* moss crust */}
            <circle cx="30" cy="30" r="3.4" fill="#8fae62" opacity="0.6" />
            <circle cx="72" cy="28" r="2.8" fill="#8fae62" opacity="0.5" />
          </g>
        ) : (
          <g>
            {/* shattered stubs */}
            <path d="M24 42 l 4 -12 l 6 12 Z M 68 42 l 5 -10 l 5 10 Z" fill="#8f8a7c" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
          </g>
        )}
        {/* head */}
        <path d="M16 62 C 8 60 4 54 6 48 C 13 48 19 53 21 59 Z" fill="#cf9ab5" stroke={O} strokeWidth="2.6" />
        <path d="M8 52 l -8 -2 M 9 58 l -7 4" stroke={O} strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="13" cy="53" r="3.4" fill="#ffe4ef" stroke={O} strokeWidth="1.8" />
        <circle cx="12" cy="53.6" r="1.6" fill="#43222f" />
      </g>
    </svg>
  );
}

function TunnelLarva({ burrowed }: { burrowed: boolean }) {
  if (burrowed) {
    // underground: just a traveling ridge of disturbed earth
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
        <g className="anim-lurch-slow">
          <path d="M14 88 C 24 70 40 62 56 64 C 72 66 84 76 90 88 Z" fill="#5a4630" stroke={O} strokeWidth="3" strokeLinejoin="round" opacity="0.95" />
          <path d="M26 84 C 34 74 46 70 58 72 M 40 82 C 50 76 62 76 72 80" stroke="#3d2f1e" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.8" />
          {/* dirt spray at the head of the ridge */}
          <g className="anim-twinkle">
            <circle cx="16" cy="80" r="2.6" fill="#7a6142" />
            <circle cx="22" cy="72" r="2" fill="#8a6f4c" />
            <circle cx="12" cy="72" r="1.7" fill="#7a6142" />
          </g>
          {/* faint outline of the beast beneath */}
          <path d="M30 86 C 42 82 62 82 76 86" stroke="#2a1040" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="tl-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9fd8c8" />
          <stop offset="1" stopColor="#5e9c8c" />
        </linearGradient>
      </defs>
      <g className="anim-lurch">
        {/* drill head */}
        <path d="M28 56 C 12 52 4 44 6 34 C 7 27 13 24 18 28 C 14 36 18 46 32 50 Z" fill="#c8ecdf" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M12 30 l 10 6 M 10 38 l 12 4 M 14 46 l 11 2" stroke="#3d6b5e" strokeWidth="2.2" strokeLinecap="round" />
        {/* segmented body */}
        <path d="M28 50 C 26 34 44 26 60 30 C 76 33 88 44 86 58 C 84 70 70 76 54 74 C 40 72 30 64 28 50 Z" fill="url(#tl-body)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M44 32 C 41 42 41 56 45 70 M 60 34 C 58 44 58 56 61 70 M 74 40 C 73 48 73 58 75 64" stroke="#467a6a" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* dirt clods clinging on */}
        <circle cx="52" cy="34" r="3" fill="#7a6142" stroke={O} strokeWidth="1.6" />
        <circle cx="70" cy="46" r="2.4" fill="#8a6f4c" stroke={O} strokeWidth="1.4" />
        {/* eye */}
        <circle cx="36" cy="44" r="4" fill="#e8fff8" stroke={O} strokeWidth="1.8" />
        <circle cx="35" cy="44.6" r="2" fill="#12332b" />
      </g>
    </svg>
  );
}

function LocustRanger() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="lr-wing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8c88a" />
          <stop offset="1" stopColor="#a8934e" />
        </linearGradient>
      </defs>
      <g className="anim-bob">
        {/* folded wing shells */}
        <path d="M40 44 C 56 30 78 30 88 42 C 90 46 88 52 82 54 C 66 58 48 56 40 44 Z" fill="url(#lr-wing)" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M50 42 C 60 36 74 36 82 44 M 48 48 C 60 44 74 44 84 49" stroke="#7c6a34" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* hind leg — the hopper */}
        <path d="M66 58 C 82 56 88 66 80 74 C 74 79 66 75 68 68" fill="none" stroke={O} strokeWidth="7" strokeLinecap="round" />
        <path d="M66 58 C 82 56 88 66 80 74 C 74 79 66 75 68 68" fill="none" stroke="#96a04a" strokeWidth="4" strokeLinecap="round" />
        {/* body */}
        <path d="M30 56 C 26 42 38 32 52 34 C 64 36 72 44 72 54 C 72 64 62 70 50 70 C 40 70 32 66 30 56 Z" fill="#b3bd62" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M42 40 C 40 48 40 58 43 66 M 56 38 C 55 48 55 58 57 66" stroke="#7c8840" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.75" />
        {/* head */}
        <path d="M24 50 C 16 48 10 52 11 58 C 12 64 20 66 27 63 C 31 60 32 54 30 51 Z" fill="#c9d178" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        {/* crimson eye */}
        <circle cx="20" cy="55" r="4.6" fill="#ff5d5d" stroke={O} strokeWidth="1.8" />
        <circle cx="18.8" cy="54" r="1.4" fill="#ffd6d6" />
        <path d="M14 62 l -9 2 M 16 65 l -8 5" stroke={O} strokeWidth="2.2" strokeLinecap="round" />
        {/* antennae */}
        <path d="M16 48 C 10 42 8 36 10 30 M 20 46 C 18 40 20 34 24 30" stroke={O} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* thorn javelin, held ready */}
        <g className="anim-nod" style={{ transformOrigin: '40px 52px' }}>
          <path d="M40 54 L 2 46 L 40 62 Z" fill="#efe3b0" stroke={O} strokeWidth="2" strokeLinejoin="round" />
          <path d="M44 54 L 52 57 L 46 62 Z" fill="#c9b878" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
        </g>
        {/* mid legs */}
        <path d="M40 68 l -4 9 M 52 70 l 0 9" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function SporeImp() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <radialGradient id="si-belly" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#e9b8ff" />
          <stop offset="0.6" stopColor="#c07ce8" />
          <stop offset="1" stopColor="#8f52c9" />
        </radialGradient>
      </defs>
      <g className="anim-bob">
        {/* spore-puff head */}
        <g className="anim-twinkle">
          <circle cx="34" cy="30" r="7" fill="#d8a8f5" stroke={O} strokeWidth="2.2" />
          <circle cx="48" cy="24" r="6" fill="#c795ee" stroke={O} strokeWidth="2.2" />
          <circle cx="60" cy="30" r="5.4" fill="#d8a8f5" stroke={O} strokeWidth="2.2" />
          <circle cx="41" cy="19" r="4.6" fill="#c795ee" stroke={O} strokeWidth="2" />
        </g>
        {/* horns */}
        <path d="M32 26 C 26 22 22 16 22 10 M 60 25 C 64 20 66 14 65 8" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
        {/* body */}
        <ellipse cx="48" cy="54" rx="21" ry="18" fill="url(#si-belly)" stroke={O} strokeWidth="3" />
        {/* spore spots on the belly */}
        <circle cx="56" cy="50" r="3.4" fill="#f2d9ff" stroke={O} strokeWidth="1.4" />
        <circle cx="42" cy="58" r="2.6" fill="#f2d9ff" stroke={O} strokeWidth="1.2" />
        {/* mischievous face */}
        <circle cx="36" cy="42" r="3.6" fill="#2a1040" />
        <circle cx="52" cy="42" r="3.6" fill="#2a1040" />
        <circle cx="37" cy="41" r="1.2" fill="#ffd6f4" />
        <circle cx="53" cy="41" r="1.2" fill="#ffd6f4" />
        <path d="M38 52 C 42 56 48 56 51 52" stroke={O} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M40 52 l 1 3 l 2 -2 M 47 52 l 1 3 l 2 -2" stroke={O} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* claws + tail */}
        <path d="M28 60 C 20 62 16 66 16 70 M 28 64 C 23 67 21 70 21 73" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M68 62 C 78 66 82 72 80 80 C 78 86 72 86 72 80" fill="none" stroke={O} strokeWidth="4.4" strokeLinecap="round" />
        <path d="M68 62 C 78 66 82 72 80 80 C 78 86 72 86 72 80" fill="none" stroke="#a468d8" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function GargantHusk({ windupFrac }: { windupFrac: number }) {
  const winding = windupFrac > 0;
  const glow = winding ? (windupFrac > 0.6 ? '#ff3d3d' : '#ff9a3d') : '#ffcf6b';
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full overflow-visible -scale-x-100 ${winding ? 'anim-cellshake' : ''}`}>
      <g className="anim-lurch-slow" style={winding ? { transform: 'translateY(-2px)' } : undefined}>
        {/* legs */}
        <path d="M34 78 l -5 14 M 66 78 l 5 14" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M34 78 l -5 14 M 66 78 l 5 14" stroke="#4a3b2a" strokeWidth="6.4" strokeLinecap="round" />
        {/* hollow bark torso */}
        <path d="M18 78 C 10 54 14 26 38 18 C 60 11 84 24 86 46 C 88 64 76 78 54 80 C 40 81 24 82 18 78 Z" fill="#5e4a30" stroke={O} strokeWidth="3.8" strokeLinejoin="round" />
        <path d="M26 64 C 40 56 64 54 82 60 M 28 44 C 42 34 62 32 80 40" stroke="#3d2f1c" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.85" />
        {/* hollow chest — the wind-up core */}
        <path d="M40 40 C 34 46 34 58 40 64 C 46 69 58 69 63 63 C 68 57 67 46 61 41 C 55 36 46 36 40 40 Z" fill="#1c130a" stroke={O} strokeWidth="2.6" />
        <circle cx="51" cy="52" r={winding ? 7 + windupFrac * 3 : 6} fill={glow} className="anim-breathe" />
        <circle cx="48.5" cy="49" r="2" fill="#fff" opacity="0.8" />
        {/* glowing fissures — brighten as the smash charges */}
        <path d="M30 32 l 6 10 l -4 8 M 74 36 l -6 8 l 5 9" stroke={glow} strokeWidth={winding ? 2.4 + windupFrac * 1.6 : 2} fill="none" strokeLinecap="round" opacity={winding ? 0.55 + windupFrac * 0.45 : 0.5} />
        {/* moss */}
        <circle cx="34" cy="26" r="4" fill="#8fbf4f" opacity="0.55" />
        <circle cx="72" cy="28" r="3" fill="#8fbf4f" opacity="0.45" />
        {/* head — a hollow helm */}
        <path d="M18 36 C 12 26 16 14 28 13 C 38 12 44 20 41 30 C 37 38 24 40 18 36 Z" fill="#4c3c25" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <ellipse cx="28" cy="25" rx="6" ry="5" fill="#160e06" stroke={O} strokeWidth="1.8" />
        <circle cx="26" cy="24" r="2" fill={glow} className="anim-breathe" />
        {/* the smashers: raised while winding, hanging while walking */}
        {winding ? (
          <g>
            <path d="M20 44 C 6 34 2 18 10 8" fill="none" stroke={O} strokeWidth="12" strokeLinecap="round" />
            <path d="M20 44 C 6 34 2 18 10 8" fill="none" stroke="#55432c" strokeWidth="8" strokeLinecap="round" />
            <circle cx="10" cy="8" r="8" fill="#55432c" stroke={O} strokeWidth="3" />
            <path d="M80 44 C 94 34 98 18 90 8" fill="none" stroke={O} strokeWidth="12" strokeLinecap="round" />
            <path d="M80 44 C 94 34 98 18 90 8" fill="none" stroke="#55432c" strokeWidth="8" strokeLinecap="round" />
            <circle cx="90" cy="8" r="8" fill="#55432c" stroke={O} strokeWidth="3" />
          </g>
        ) : (
          <g>
            <path d="M18 50 C 5 56 2 70 8 80" fill="none" stroke={O} strokeWidth="12" strokeLinecap="round" />
            <path d="M18 50 C 5 56 2 70 8 80" fill="none" stroke="#55432c" strokeWidth="8" strokeLinecap="round" />
            <circle cx="8" cy="80" r="7.4" fill="#55432c" stroke={O} strokeWidth="3" />
            <path d="M82 50 C 95 56 98 70 92 80" fill="none" stroke={O} strokeWidth="12" strokeLinecap="round" />
            <path d="M82 50 C 95 56 98 70 92 80" fill="none" stroke="#55432c" strokeWidth="8" strokeLinecap="round" />
            <circle cx="92" cy="80" r="7.4" fill="#55432c" stroke={O} strokeWidth="3" />
          </g>
        )}
      </g>
    </svg>
  );
}

function RootThief({ carrying }: { carrying: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="rt-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fa8c9" />
          <stop offset="1" stopColor="#5c6f94" />
        </linearGradient>
      </defs>
      <g className="anim-skitter">
        {/* sprint legs */}
        <path d="M34 68 l -8 12 M 44 74 l -3 12 M 60 72 l 5 12 M 70 64 l 10 10" stroke={O} strokeWidth="3.2" strokeLinecap="round" className="anim-legs" />
        {/* long weasel body */}
        <path d="M20 56 C 14 44 20 32 34 30 C 48 27 64 30 74 40 C 82 47 84 58 78 64 C 68 72 44 74 30 70 C 24 68 22 62 20 56 Z" fill="url(#rt-fur)" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 38 C 30 46 31 56 35 64 M 50 34 C 48 44 49 56 52 66" stroke="#46587a" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
        {/* bandit mask */}
        <path d="M12 48 C 10 42 14 37 21 38 C 27 39 30 44 29 50 C 28 55 22 57 17 55 C 13 53 12 51 12 48 Z" fill="#3a4560" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M13 44 C 17 46 24 46 28 44" stroke="#222c44" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* gleaming eye */}
        <circle cx="19" cy="46" r="4.2" fill="#ffe9a8" stroke={O} strokeWidth="1.8" />
        <circle cx="18.2" cy="46.4" r="2" fill="#20263a" />
        <circle cx="17.6" cy="45.4" r="0.8" fill="#fff" />
        {/* snout + whiskers */}
        <path d="M13 52 C 8 53 4 56 3 59 C 7 60 12 58 14 56 Z" fill="#5c6f94" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M5 55 l -5 -3 M 6 58 l -5 1" stroke={O} strokeWidth="1.6" strokeLinecap="round" />
        {/* tail */}
        <path d="M78 48 C 88 44 94 36 92 26" fill="none" stroke={O} strokeWidth="6" strokeLinecap="round" />
        <path d="M78 48 C 88 44 94 36 92 26" fill="none" stroke="#8fa8c9" strokeWidth="3.6" strokeLinecap="round" />
        {/* the loot sack — or empty paws, mid-heist */}
        {carrying ? (
          <g className="anim-bob">
            <path d="M58 30 C 54 20 62 12 70 16 C 78 20 76 32 66 34 C 61 35 59 33 58 30 Z" fill="#c9a86a" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M64 16 C 62 12 64 8 68 8 C 72 8 74 12 72 16" fill="none" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M62 24 C 66 22 70 22 74 25" stroke="#8a6f3c" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M56 34 C 50 32 46 34 44 38 M 62 32 C 60 28 56 26 52 28" stroke={O} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        )}
      </g>
    </svg>
  );
}

// ─────────────────────────── ENEMY BATCH 2 ─────────────────────────────────
function MoltWisp({ spent }: { spent: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <radialGradient id="mw-core" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff6d8" />
          <stop offset="0.5" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#e0913f" />
        </radialGradient>
      </defs>
      <g className="anim-bob">
        {/* the husk it has not finished shedding — gone once it has split */}
        {!spent && (
          <path
            d="M62 30 C 84 32 92 50 86 66 C 80 80 62 84 54 76 C 68 72 78 60 76 46 C 74 36 68 32 62 30 Z"
            fill="#e8d9a0"
            opacity="0.75"
            stroke={O}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        )}
        <ellipse cx="34" cy="28" rx="16" ry="8" fill="#ffeec2" opacity="0.55" stroke={O} strokeWidth="1.8" className="anim-flutter" />
        <ellipse cx="36" cy="40" rx="12" ry="6" fill="#ffeec2" opacity="0.45" stroke={O} strokeWidth="1.6" className="anim-flutter2" />
        <path d="M30 66 C 20 60 16 46 24 36 C 33 25 52 24 60 34 C 68 44 66 60 55 66 C 47 70 37 70 30 66 Z" fill="url(#mw-core)" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        {/* the molt seam — where it will come apart */}
        {!spent && <path d="M42 26 C 40 40 40 54 44 68" stroke="#b4762c" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeDasharray="5 4" opacity="0.85" />}
        <circle cx="34" cy="46" r="8.5" fill="#fffdf2" stroke={O} strokeWidth="2.4" />
        <circle cx="32.4" cy="47" r="4.2" fill="#3a2106" />
        <circle cx="33.8" cy="45.4" r="1.5" fill="#ffd98a" />
        <g className="anim-twinkle">
          <circle cx="72" cy="52" r="2.6" fill="#ffd76a" />
          <circle cx="80" cy="44" r="1.8" fill="#ffb15e" />
        </g>
        <path d="M34 66 l -3 8 M 44 68 l 0 8 M 54 64 l 3 8" stroke={O} strokeWidth="2.2" strokeLinecap="round" className="anim-legs" />
      </g>
    </svg>
  );
}

function GrovemawSlug({ shieldFrac }: { shieldFrac: number }) {
  const fed = shieldFrac > 0.01;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="gs-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd08a" />
          <stop offset="0.6" stopColor="#5f9a58" />
          <stop offset="1" stopColor="#3c6b3c" />
        </linearGradient>
      </defs>
      <g className="anim-lurch-slow">
        <path d="M10 86 C 34 80 70 80 94 86 C 70 92 34 92 10 86 Z" fill="#7fc98f" opacity="0.35" />
        <path d="M12 84 C 12 74 30 70 52 70 C 74 70 92 74 92 84 C 74 88 30 88 12 84 Z" fill="#4a7f4a" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M16 80 C 8 62 18 40 42 36 C 66 32 88 44 90 62 C 91 74 80 80 64 80 Z" fill="url(#gs-body)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        {/* the maw on its back — the organ that drinks your control effects */}
        <path d="M46 34 C 40 20 52 8 66 10 C 78 12 84 24 78 34 C 68 30 56 30 46 34 Z" fill="#2c4a2c" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 30 C 52 20 60 14 68 16 M 56 31 C 58 22 64 18 70 20" stroke={fed ? '#a8ffd0' : '#63d99a'} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.9" />
        <path d="M50 26 l 4 6 l -7 1 Z M 62 22 l 3 7 l -7 0 Z M 74 28 l 5 5 l -8 1 Z" fill="#e6ffe9" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M26 46 C 20 38 18 30 20 24" fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <path d="M36 44 C 33 36 33 28 36 22" fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="22" r="4.6" fill="#eaffe0" stroke={O} strokeWidth="2" />
        <circle cx="19" cy="22.4" r="2.2" fill="#26401f" />
        <circle cx="36" cy="20" r="4.6" fill="#eaffe0" stroke={O} strokeWidth="2" />
        <circle cx="35" cy="20.4" r="2.2" fill="#26401f" />
        {/* the absorbed film — thickens with everything it has eaten */}
        {fed && (
          <g>
            <path
              d="M14 78 C 6 58 18 34 44 30 C 70 26 94 40 94 62 C 94 76 80 82 62 82"
              fill="none"
              stroke="#a8ffd0"
              strokeWidth={2 + shieldFrac * 5}
              strokeLinecap="round"
              opacity={0.45 + shieldFrac * 0.4}
            />
            <circle cx="62" cy="16" r={3 + shieldFrac * 3} fill="#a8ffd0" opacity="0.7" className="anim-breathe" />
          </g>
        )}
      </g>
    </svg>
  );
}

function Chitterling() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <g className="anim-skitter">
        <path d="M28 62 l -10 14 M 42 66 l -6 14 M 58 66 l 6 14 M 72 60 l 12 12" stroke={O} strokeWidth="4" strokeLinecap="round" className="anim-legs" />
        <ellipse cx="52" cy="52" rx="26" ry="20" fill="#e0709a" stroke={O} strokeWidth="4" />
        <path d="M40 40 C 38 48 38 58 42 66 M 58 38 C 56 48 56 58 60 66" stroke="#a3406a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M26 48 C 14 46 8 52 10 60 C 12 68 24 70 30 64 Z" fill="#f0a0c0" stroke={O} strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M12 56 l -10 -4 M 12 62 l -10 5" stroke={O} strokeWidth="3.6" strokeLinecap="round" />
        <circle cx="20" cy="54" r="4.4" fill="#fff0f6" stroke={O} strokeWidth="2" />
        <circle cx="19" cy="54.6" r="2.2" fill="#3a0a20" />
        <path d="M40 34 l 3 -10 M 54 32 l 2 -11 M 68 36 l 6 -9" stroke={O} strokeWidth="3.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function BarkskinMarauder() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="bm-bark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6a44" />
          <stop offset="0.5" stopColor="#6a4f30" />
          <stop offset="1" stopColor="#4a3620" />
        </linearGradient>
      </defs>
      <g className="anim-lurch-slow">
        <path d="M36 76 l -6 16 M 64 76 l 6 16" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M36 76 l -6 16 M 64 76 l 6 16" stroke="#4a3620" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M22 78 C 14 56 18 28 40 20 C 62 12 84 26 86 48 C 88 66 76 78 54 80 Z" fill="url(#bm-bark)" stroke={O} strokeWidth="3.6" strokeLinejoin="round" />
        {/* bark plates — living wood, which is why a root finds nothing to hold */}
        <path
          d="M30 34 L 44 30 L 48 44 L 34 48 Z M 52 26 L 68 28 L 66 42 L 52 40 Z M 34 54 L 50 50 L 54 66 L 38 68 Z M 60 50 L 76 54 L 72 68 L 58 64 Z"
          fill="#7a5c38"
          stroke={O}
          strokeWidth="2.4"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path d="M22 46 C 8 52 4 66 10 76" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M22 46 C 8 52 4 66 10 76" fill="none" stroke="#6a4f30" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M84 44 C 96 52 98 66 92 74" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
        <path d="M84 44 C 96 52 98 66 92 74" fill="none" stroke="#6a4f30" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M28 30 C 22 20 26 8 38 8 C 48 8 52 18 48 28 Z" fill="#5d452a" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="36" cy="20" rx="6" ry="4.6" fill="#1a1208" stroke={O} strokeWidth="1.8" />
        <circle cx="34" cy="20" r="2.2" fill="#ff9a3d" className="anim-breathe" />
        <circle cx="58" cy="18" r="4.6" fill="#7fbf5f" opacity="0.6" />
        <circle cx="78" cy="40" r="3.4" fill="#7fbf5f" opacity="0.5" />
        <path d="M44 12 l 4 -8 M 52 14 l 6 -6" stroke="#8fd06a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function NightcapAssassin({ dashing }: { dashing: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full overflow-visible -scale-x-100 ${dashing ? 'anim-cellshake' : ''}`}>
      <defs>
        <radialGradient id="na-cap" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5a4a8c" />
          <stop offset="1" stopColor="#241a3e" />
        </radialGradient>
      </defs>
      <g className={dashing ? undefined : 'anim-skitter'}>
        {dashing && <path d="M96 30 L 66 30 M 98 46 L 72 46 M 94 62 L 68 62" stroke="#c9b8ee" strokeWidth="3" strokeLinecap="round" opacity="0.7" className="anim-twinkle" />}
        <path d="M36 66 l -12 16 M 48 70 l -4 16 M 62 68 l 8 16 M 72 60 l 14 12" stroke={O} strokeWidth="3.4" strokeLinecap="round" className="anim-legs" />
        <path d="M30 60 C 24 48 30 38 44 36 C 58 34 72 40 76 50 C 80 60 72 68 58 68 C 46 68 34 66 30 60 Z" fill="#3c3160" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M14 40 C 14 20 34 8 54 10 C 72 12 82 26 78 40 C 60 32 32 32 14 40 Z" fill="url(#na-cap)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <circle cx="34" cy="24" r="3.4" fill="#e6dcff" opacity="0.75" />
        <circle cx="56" cy="20" r="2.6" fill="#e6dcff" opacity="0.65" />
        <path d="M20 40 C 34 34 60 34 76 40 C 62 46 34 46 20 40 Z" fill="#150f28" stroke={O} strokeWidth="2" />
        <circle cx="30" cy="44" r="4.6" fill="#ff5d7c" className="anim-breathe" />
        <circle cx="29" cy="43.4" r="1.8" fill="#fff" opacity="0.85" />
        <path d="M76 52 C 88 46 96 36 98 26" fill="none" stroke={O} strokeWidth="5" strokeLinecap="round" />
        <path d="M76 52 C 88 46 96 36 98 26" fill="none" stroke="#dfe6ff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M72 56 l 8 -6" stroke={O} strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function FenWretch() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <radialGradient id="fw-belly" cx="0.45" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#8fae5a" />
          <stop offset="0.65" stopColor="#5a7a3a" />
          <stop offset="1" stopColor="#37501f" />
        </radialGradient>
      </defs>
      <g className="anim-lurch">
        {/* the aura: vapour rolling off it */}
        <g className="anim-mist" opacity="0.5">
          <ellipse cx="26" cy="26" rx="16" ry="9" fill="#a8d07a" />
          <ellipse cx="66" cy="18" rx="13" ry="7" fill="#a8d07a" />
          <ellipse cx="86" cy="34" rx="10" ry="6" fill="#a8d07a" />
        </g>
        <path d="M36 74 l -6 16 M 62 74 l 6 16" stroke={O} strokeWidth="6" strokeLinecap="round" className="anim-legs" />
        <path d="M22 74 C 10 56 18 32 42 28 C 66 24 88 38 88 58 C 88 72 72 78 52 78 C 38 78 28 78 22 74 Z" fill="url(#fw-belly)" stroke={O} strokeWidth="3.4" strokeLinejoin="round" />
        {/* stolen nectar sloshing inside it */}
        <path d="M30 58 C 40 52 60 52 76 58 C 66 66 42 66 30 58 Z" fill="#ffd76a" opacity="0.55" className="anim-breathe" />
        <path d="M34 44 C 32 52 32 62 36 70 M 54 40 C 52 50 52 62 56 72" stroke="#2f4419" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M24 48 C 12 54 8 66 12 76" fill="none" stroke={O} strokeWidth="6" strokeLinecap="round" />
        <path d="M86 46 C 96 54 98 66 94 74" fill="none" stroke={O} strokeWidth="6" strokeLinecap="round" />
        <path d="M12 76 l -2 8 M 94 74 l 2 8" stroke="#7fae4a" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 34 C 28 24 34 14 46 14 C 56 14 60 24 56 32 Z" fill="#4a6a2c" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="42" cy="24" rx="7" ry="5" fill="#141c08" stroke={O} strokeWidth="1.8" />
        <circle cx="40" cy="24" r="2.4" fill="#c8ff6a" className="anim-breathe" />
        <path d="M36 30 C 40 34 48 34 52 30" stroke={O} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─────────────────────────── ENEMY BATCH 3 ──────────────────────────────────
// One Blightspawn per Flora Batch 2 trick — read the tells in their art:
// the Husk's seams glow while it knits, the Golem's cracks keep glowing when
// fire lands on it, the Toad grips the ground, the Roach plates every hit
// flat, the Nightstalker's steel pauldron rises with each dash, and the
// Grub's glass dome stands until the first touch shatters it.
function RegrowthHusk({ regrowing }: { regrowing: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="rh-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fae6a" />
          <stop offset="0.6" stopColor="#5c7a42" />
          <stop offset="1" stopColor="#38512a" />
        </linearGradient>
      </defs>
      <g className="anim-lurch-slow">
        <path d="M36 78 l -6 12 M 58 78 l 5 12" stroke={O} strokeWidth="5.6" strokeLinecap="round" />
        <path d="M30 44 C 18 52 14 66 20 78 C 34 84 64 84 78 76 C 84 62 80 48 70 42 C 56 36 42 37 30 44 Z" fill="url(#rh-body)" stroke={O} strokeWidth="3.4" strokeLinejoin="round" />
        {/* the torn chest — an open wound of pale wood */}
        <path d="M40 52 C 48 46 60 47 66 54 C 62 66 46 68 40 52 Z" fill="#c9b878" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M46 54 l 3 10 M 56 53 l 1 11 M 62 56 l -2 8" stroke="#8a6f4c" strokeWidth="2" strokeLinecap="round" />
        {/* knitting seams — sap-bright vines pulling the wound shut */}
        <g className={regrowing ? 'anim-breathe' : undefined} opacity={regrowing ? 1 : 0.55}>
          <path d="M38 50 C 48 42 60 43 68 52 M 40 64 C 50 70 62 69 70 62" fill="none" stroke={regrowing ? '#a3f2a0' : '#6f8f5a'} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M44 46 l 1 8 M 54 44 l 0 9 M 64 47 l -1 8 M 48 68 l 0 -8 M 58 69 l 1 -8" stroke={regrowing ? '#d9ffb0' : '#6f8f5a'} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        {/* head sunk in the shoulders */}
        <path d="M34 40 C 30 30 36 22 46 22 C 56 22 60 32 55 40 C 48 44 40 44 34 40 Z" fill="#6a8a4c" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="44" cy="32" rx="7" ry="4.6" fill="#141c08" stroke={O} strokeWidth="1.8" />
        <circle cx="42.4" cy="32" r="2.1" fill="#c8ff6a" className="anim-breathe" />
        {regrowing && <circle cx="52" cy="56" r="26" fill="none" stroke="#7ee787" strokeWidth="2.4" opacity="0.55" className="anim-pulse-ring" />}
        {/* moss fur growing over the husk */}
        <circle cx="28" cy="60" r="3.4" fill="#7fae62" opacity="0.6" />
        <circle cx="72" cy="66" r="3" fill="#7fae62" opacity="0.5" />
      </g>
    </svg>
  );
}

function CinderGolem() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="cg-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e5a4c" />
          <stop offset="0.55" stopColor="#4a3a32" />
          <stop offset="1" stopColor="#2b211d" />
        </linearGradient>
      </defs>
      <g className="anim-lurch-slow">
        {/* squat kiln-fired frame */}
        <path d="M26 82 C 16 66 18 42 34 32 C 52 21 74 26 82 42 C 90 58 86 76 74 84 C 58 90 38 90 26 82 Z" fill="url(#cg-shell)" stroke={O} strokeWidth="3.8" strokeLinejoin="round" />
        {/* the glaze has cooled matte on the outside… */}
        <path d="M34 40 C 48 34 64 35 74 44 M 30 56 C 42 50 60 50 72 56" stroke="#241b16" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
        {/* …but every crack still glows */}
        <path d="M46 30 L 42 46 L 50 56 L 44 72 M 64 34 L 68 48 L 60 60 L 66 76" stroke="#ff7a3d" strokeWidth="2.8" fill="none" strokeLinecap="round" className="anim-breathe" />
        <path d="M46 30 L 42 46 L 50 56 L 44 72" stroke="#ffd76a" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.9" />
        {/* a chimney crown venting smoke */}
        <path d="M40 26 C 42 16 58 14 62 24 C 55 20 47 21 40 26 Z" fill="#241b16" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <g className="anim-mist" opacity="0.5">
          <circle cx="50" cy="10" r="5" fill="#c9c2b0" />
          <circle cx="60" cy="6" r="3.6" fill="#c9c2b0" />
        </g>
        {/* eyes behind the glaze */}
        <ellipse cx="42" cy="50" rx="6.4" ry="4.4" fill="#160f0b" stroke={O} strokeWidth="2" />
        <circle cx="41" cy="50" r="2.4" fill="#ffb15e" className="anim-breathe" />
        {/* heavy fists planted at its sides */}
        <path d="M22 66 C 14 66 10 72 12 78 C 14 84 22 84 26 80 Z" fill="#4a3a32" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M80 62 C 88 62 92 68 90 74 C 88 80 82 80 78 76 Z" fill="#4a3a32" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <g className="anim-twinkle">
          <circle cx="34" cy="26" r="1.8" fill="#ffb15e" />
          <circle cx="70" cy="24" r="1.5" fill="#ff7a3d" />
        </g>
      </g>
    </svg>
  );
}

function BulwarkRoach() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <linearGradient id="br-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b09a6a" />
          <stop offset="0.5" stopColor="#7c6a45" />
          <stop offset="1" stopColor="#544629" />
        </linearGradient>
      </defs>
      <g className="anim-settle">
        {/* six spiky legs */}
        <path d="M30 62 l -12 6 M 34 70 l -9 10 M 42 76 l -4 8 M 60 76 l 5 8 M 66 68 l 11 9 M 70 60 l 13 4" stroke={O} strokeWidth="3" strokeLinecap="round" className="anim-legs" />
        {/* the broad flattened shield-back — three overlapping plates */}
        <path d="M16 56 C 12 36 32 22 52 22 C 72 22 90 34 88 54 C 74 66 30 68 16 56 Z" fill="url(#br-shell)" stroke={O} strokeWidth="3.6" strokeLinejoin="round" />
        <path d="M22 52 C 20 38 36 28 52 28 C 68 28 84 38 82 52 C 68 60 34 60 22 52 Z" fill="none" stroke="#2e2616" strokeWidth="2.8" strokeLinejoin="round" opacity="0.85" />
        <path d="M30 48 C 30 40 40 34 52 34 C 64 34 74 40 74 48 C 64 54 40 54 30 48 Z" fill="#8f7a4e" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        {/* rivet rows — each plate shrugs a needle */}
        <g fill="#d8cfa8" stroke={O} strokeWidth="1.4">
          <circle cx="38" cy="41" r="2.1" /><circle cx="52" cy="39" r="2.1" /><circle cx="66" cy="41" r="2.1" />
          <circle cx="30" cy="50" r="1.9" /><circle cx="74" cy="50" r="1.9" />
        </g>
        {/* head + antennae below the shield rim */}
        <path d="M20 58 C 12 58 8 64 10 70 C 16 72 24 68 24 62 Z" fill="#463821" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <circle cx="16" cy="63" r="2.6" fill="#ffe07a" stroke={O} strokeWidth="1.5" />
        <path d="M12 60 C 2 54 -2 44 2 36 M 16 58 C 8 48 8 38 14 30" stroke={O} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M2 36 l -3 -5 M 14 30 l 1 -6" stroke="#b09a6a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function BoulderToad() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <radialGradient id="bt-hide" cx="0.42" cy="0.36" r="0.85">
          <stop offset="0" stopColor="#a9a294" />
          <stop offset="0.55" stopColor="#7a7365" />
          <stop offset="1" stopColor="#4a4438" />
        </radialGradient>
      </defs>
      <g className="anim-breathe-slow">
        {/* planted thighs — this thing is not going anywhere */}
        <path d="M18 74 C 10 74 6 80 10 86 C 20 90 34 88 40 82 L 38 72 Z" fill="#6b6250" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M84 74 C 92 74 96 80 92 86 C 82 90 68 88 62 82 L 64 72 Z" fill="#6b6250" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        {/* boulder back */}
        <path d="M14 72 C 8 50 24 30 50 28 C 76 26 92 44 90 68 C 90 78 76 84 50 84 C 28 84 14 80 14 72 Z" fill="url(#bt-hide)" stroke={O} strokeWidth="3.8" strokeLinejoin="round" />
        {/* actual stone slabs grown onto it, with grit */}
        <path d="M28 46 C 38 38 58 36 70 44 C 64 52 38 54 28 46 Z" fill="#8f8a7c" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M40 58 C 52 52 70 52 80 60 C 70 66 50 66 40 58 Z" fill="#6b675c" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
        <g fill="#3c382e" opacity="0.8">
          <circle cx="34" cy="36" r="1.7" /><circle cx="78" cy="38" r="1.6" /><circle cx="58" cy="32" r="1.4" />
        </g>
        {/* toad eyes, unblinking */}
        <path d="M26 34 C 24 26 30 20 38 22 C 42 28 40 34 34 38 Z" fill="#5f5a4a" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <ellipse cx="33" cy="29" rx="4.4" ry="3.4" fill="#1a130c" stroke={O} strokeWidth="1.6" />
        <circle cx="32" cy="29" r="1.7" fill="#ffb15e" />
        {/* wide mouth welded shut under the slab line */}
        <path d="M22 66 C 34 72 54 74 68 70" stroke={O} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        {/* a gust already slid off — scoured lines on the windward side */}
        <path d="M86 50 C 90 54 91 60 89 66" stroke="#d8d2c0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  );
}

function IronNightstalker({ dashing, plated }: { dashing: boolean; plated: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full overflow-visible -scale-x-100 ${dashing ? 'anim-cellshake' : ''}`}>
      <defs>
        <radialGradient id="ns-cap" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4e4a68" />
          <stop offset="1" stopColor="#1c1a2e" />
        </radialGradient>
        <linearGradient id="ns-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cdd6de" />
          <stop offset="1" stopColor="#5d6a78" />
        </linearGradient>
      </defs>
      <g className={dashing ? undefined : 'anim-skitter'}>
        {dashing && <path d="M96 30 L 66 30 M 98 46 L 72 46 M 94 62 L 68 62" stroke="#dfe6ff" strokeWidth="3" strokeLinecap="round" opacity="0.7" className="anim-twinkle" />}
        <path d="M36 66 l -12 16 M 48 70 l -4 16 M 62 68 l 8 16 M 72 60 l 14 12" stroke={O} strokeWidth="3.4" strokeLinecap="round" className="anim-legs" />
        <path d="M30 60 C 24 48 30 38 44 36 C 58 34 72 40 76 50 C 80 60 72 68 58 68 C 46 68 34 66 30 60 Z" fill="#33304e" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M14 40 C 14 20 34 8 54 10 C 72 12 82 26 78 40 C 60 32 32 32 14 40 Z" fill="url(#ns-cap)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        {/* the bolt-on pauldron — eats the first hit of the dash */}
        <g>
          <path d="M60 34 C 74 32 84 40 84 52 C 76 56 66 54 62 48 C 66 42 64 37 60 34 Z" fill={plated ? 'url(#ns-plate)' : '#3c4550'} stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
          {plated && <path d="M66 38 L 78 44 M 65 45 L 76 50" stroke="#eef5ff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />}
          {plated && <path d="M60 20 C 84 24 92 44 86 62" fill="none" stroke="#cdd6de" strokeWidth="2.2" opacity="0.6" className="anim-pulse-ring" />}
        </g>
        <path d="M20 40 C 34 34 60 34 76 40 C 62 46 34 46 20 40 Z" fill="#100d1f" stroke={O} strokeWidth="2" />
        <circle cx="30" cy="44" r="4.6" fill="#ff5d7c" className="anim-breathe" />
        <circle cx="29" cy="43.4" r="1.8" fill="#fff" opacity="0.85" />
        {/* clawed hand instead of a fungal blade — iron filings on the knuckles */}
        <path d="M76 52 C 88 46 96 36 98 26" fill="none" stroke={O} strokeWidth="5" strokeLinecap="round" />
        <path d="M98 26 l 2 -8 M 94 30 l 8 -5 M 90 34 l 7 3" stroke="#cdd6de" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function WardshellGrub({ warded }: { warded: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible -scale-x-100">
      <defs>
        <radialGradient id="ws-body" cx="0.42" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#d9c2e8" />
          <stop offset="0.6" stopColor="#b08cc4" />
          <stop offset="1" stopColor="#7a5c92" />
        </radialGradient>
      </defs>
      <g className="anim-lurch">
        <path d="M30 72 l -4 8 M 42 76 l -2 8 M 58 76 l 3 8 M 70 70 l 6 7" stroke={O} strokeWidth="3.4" strokeLinecap="round" className="anim-legs" />
        {/* plump shell-backed grub */}
        <path d="M22 70 C 14 56 18 40 34 34 C 52 26 74 30 82 46 C 88 58 82 70 68 74 C 52 78 32 80 22 70 Z" fill="url(#ws-body)" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M34 40 C 30 48 30 58 34 66 M 50 36 C 47 46 47 58 50 70 M 66 40 C 64 48 64 58 66 66" stroke="#5c3f70" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
        {/* the surprise ward — a glass dome that only stops the first touch */}
        {warded ? (
          <g>
            <path d="M16 62 C 10 40 28 22 52 22 C 76 22 94 38 90 60 C 68 70 34 72 16 62 Z" fill="rgba(216,180,255,0.16)" stroke="#d8b4ff" strokeWidth="2.6" strokeLinejoin="round" opacity="0.85" className="anim-breathe" />
            <path d="M26 34 C 34 26 46 22 56 22" stroke="#f0e2ff" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.9" />
            <g className="anim-twinkle" fill="#d8b4ff">
              <circle cx="22" cy="50" r="1.8" />
              <circle cx="78" cy="36" r="1.6" />
              <circle cx="62" cy="66" r="1.5" />
            </g>
          </g>
        ) : (
          /* spent dome: a cracked ring, re-arming at the next tile */
          <path d="M18 58 C 14 44 26 30 44 26" fill="none" stroke="#d8b4ff" strokeWidth="2" strokeDasharray="6 8" opacity="0.4" />
        )}
        {/* head + eyes */}
        <path d="M20 52 C 12 48 8 40 12 32 C 18 34 24 40 24 48 Z" fill="#8a6aa8" stroke={O} strokeWidth="2.6" />
        <circle cx="16" cy="40" r="3.4" fill="#f3ecff" stroke={O} strokeWidth="1.8" />
        <circle cx="15.4" cy="40.4" r="1.6" fill="#2a1040" />
      </g>
    </svg>
  );
}

function HollowKing({ phase, immune }: { phase: number; immune: boolean }) {
  const rage = phase >= 3;
  const glow = rage ? '#ff3d3d' : immune ? '#7fd4ff' : '#d8a8ff';
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full overflow-visible -scale-x-100 ${rage ? 'anim-cellshake' : ''}`}>
      <defs>
        <linearGradient id="hk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3a5c" />
          <stop offset="1" stopColor="#1d1528" />
        </linearGradient>
      </defs>
      <g className="anim-lurch-slow">
        {/* the crown */}
        <path d="M30 26 L 22 4 L 34 16 L 38 0 L 46 16 L 54 2 L 60 18 L 70 6 L 68 26 Z" fill="#2c2138" stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M20 88 C 10 62 16 30 42 24 C 68 18 90 34 90 58 C 90 78 76 90 52 90 C 38 90 26 90 20 88 Z" fill="url(#hk-body)" stroke={O} strokeWidth="3.6" strokeLinejoin="round" />
        {/* the hollow where a heart would be */}
        <path d="M40 46 C 32 54 32 70 40 78 C 48 85 66 85 73 77 C 80 69 78 53 70 46 C 62 39 48 39 40 46 Z" fill="#0b0713" stroke={O} strokeWidth="2.8" />
        <circle cx="56" cy="62" r={rage ? 11 : 9} fill={glow} className="anim-breathe" />
        <circle cx="52" cy="58" r="3" fill="#fff" opacity="0.8" />
        <path d="M28 40 l 8 12 l -5 12 M 84 44 l -8 10 l 6 12" stroke={glow} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M20 52 C 4 60 0 78 8 90" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M20 52 C 4 60 0 78 8 90" fill="none" stroke="#332743" strokeWidth="6.4" strokeLinecap="round" />
        <path d="M88 50 C 100 60 102 78 96 88" fill="none" stroke={O} strokeWidth="10" strokeLinecap="round" />
        <path d="M88 50 C 100 60 102 78 96 88" fill="none" stroke="#332743" strokeWidth="6.4" strokeLinecap="round" />
        <path d="M28 40 C 22 28 28 14 44 14 C 58 14 64 28 58 38 Z" fill="#241a30" stroke={O} strokeWidth="3.2" strokeLinejoin="round" />
        <ellipse cx="42" cy="28" rx="8" ry="6" fill="#0b0713" stroke={O} strokeWidth="2" />
        <circle cx="40" cy="28" r="3" fill={glow} className="anim-breathe" />
        {/* the ward: a shell of closed light while a damage type is denied */}
        {immune && (
          <g>
            <circle cx="52" cy="56" r="46" fill="none" stroke="#7fd4ff" strokeWidth="3" opacity="0.5" className="anim-pulse-ring" />
            <path d="M52 12 L 84 26 L 84 58 C 84 78 68 90 52 96 C 36 90 20 78 20 58 L 20 26 Z" fill="none" stroke="#7fd4ff" strokeWidth="2.6" opacity="0.45" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function EnemySprite({
  k,
  shellFrac = 0,
  phase = 1,
  stoneFrac = 0,
  burrowed = false,
  windupFrac = 0,
  carrying = false,
  molted = false,
  shieldFrac = 0,
  dashing = false,
  warded = false,
  regrowing = false,
  plated = false,
  domed = false,
}: {
  k: EnemyKey;
  shellFrac?: number;
  phase?: number;
  stoneFrac?: number;
  burrowed?: boolean;
  windupFrac?: number;
  carrying?: boolean;
  molted?: boolean; // Molt Wisp: this body has already split once
  shieldFrac?: number; // Grovemaw Slug: how much damage reduction it is holding
  dashing?: boolean; // Nightcap Assassin: mid-sprint
  warded?: boolean; // Hollow King: a damage channel is currently shut off
  // ── Enemy Batch 3 ──
  regrowing?: boolean; // Regrowth Husk: the knit is close to closing the wound
  plated?: boolean; // Iron Nightstalker: the plate is up — the next hit is eaten
  domed?: boolean; // Wardshell Grub: the surprise ward is standing in this tile
}) {
  switch (k) {
    case 'gnat': return <Gnat />;
    case 'beetle': return <Beetle />;
    case 'skitter': return <Skitter />;
    case 'warden': return <Warden shellFrac={shellFrac} />;
    case 'drifter': return <Drifter />;
    case 'brute': return <Brute />;
    case 'colossus': return <Colossus phase={phase} />;
    case 'vaulter': return <MiteVaulter />;
    case 'grub': return <StonebackGrub stoneFrac={stoneFrac} />;
    case 'larva': return <TunnelLarva burrowed={burrowed} />;
    case 'ranger': return <LocustRanger />;
    case 'imp': return <SporeImp />;
    case 'husk': return <GargantHusk windupFrac={windupFrac} />;
    case 'thief': return <RootThief carrying={carrying} />;
    case 'wisp': return <MoltWisp spent={molted} />;
    case 'slug': return <GrovemawSlug shieldFrac={shieldFrac} />;
    case 'chitter': return <Chitterling />;
    case 'marauder': return <BarkskinMarauder />;
    case 'nightcap': return <NightcapAssassin dashing={dashing} />;
    case 'wretch': return <FenWretch />;
    case 'hollowking': return <HollowKing phase={phase} immune={warded} />;
    // ── Enemy Batch 3 ──
    case 'regrow': return <RegrowthHusk regrowing={regrowing} />;
    case 'golem': return <CinderGolem />;
    case 'roach': return <BulwarkRoach />;
    case 'toad': return <BoulderToad />;
    case 'nightstalker': return <IronNightstalker dashing={dashing} plated={plated} />;
    case 'wardshell': return <WardshellGrub warded={domed} />;
  }
}

// ─────────────────────────────── PROJECTILES ───────────────────────────────
// Locust Ranger spine — enemy ordnance, flies right-to-left.
export function EProjSprite() {
  return (
    <svg viewBox="0 0 40 14" className="h-full w-full overflow-visible -scale-x-100">
      <path d="M4 7 L 30 2 L 38 7 L 30 12 Z" fill="#e8d9a0" stroke={O2} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 4 L 14 7 L 8 10 Z" fill="#c9b878" stroke={O2} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M34 7 L 40 7" stroke="#ffcf6b" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function ProjSprite({ kind }: { kind: 'thorn' | 'spike' | 'frost' | 'ray' | 'cinder' | 'root' | 'bind' | 'bolt' | 'needle' | 'gale' }) {
  if (kind === 'bolt')
    return (
      <svg viewBox="0 0 40 22" className="h-full w-full overflow-visible">
        <path d="M2 11 L 12 11" stroke="#8a7350" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <path d="M12 4 L 34 4 L 38 11 L 34 18 L 12 18 Z" fill="url(#boltIron)" stroke={O2} strokeWidth="2" strokeLinejoin="round" />
        <defs>
          <linearGradient id="boltIron" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cdd6de" />
            <stop offset="1" stopColor="#5d6a78" />
          </linearGradient>
        </defs>
        <path d="M18 7 L 30 7 M 18 15 L 30 15" stroke="#39424d" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  if (kind === 'needle')
    return (
      <svg viewBox="0 0 30 10" className="h-full w-full overflow-visible">
        <path d="M0 5 L 18 5" stroke="#cfe0a0" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M14 1 L 30 5 L 14 9 Z" fill="#e8f0c8" stroke={O2} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  if (kind === 'gale')
    return (
      <svg viewBox="0 0 44 30" className="h-full w-full overflow-visible">
        <path d="M40 8 C 26 4 10 6 4 12" fill="none" stroke="#dff5ff" strokeWidth="3.4" strokeLinecap="round" opacity="0.95" />
        <path d="M42 16 C 28 12 12 14 2 20" fill="none" stroke="#a8e0f0" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M38 24 C 26 22 16 24 10 28" fill="none" stroke="#dff5ff" strokeWidth="2.4" strokeLinecap="round" opacity="0.65" />
      </svg>
    );
  if (kind === 'cinder')
    return (
      <svg viewBox="0 0 32 26" className="h-full w-full overflow-visible">
        <path d="M6 13 L -2 13" stroke="#ff9a3d" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <ellipse cx="19" cy="13" rx="10" ry="9" fill="#d9602e" stroke={O2} strokeWidth="1.8" />
        <path d="M13 8 L 20 13 L 13 18 M 22 7 L 18 13 L 23 19" stroke="#ffd76a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M28 13 C 30 10 30 8 29 6" stroke="#8a6f4c" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="29" cy="5" r="2.6" fill="#fff3c4" />
      </svg>
    );
  if (kind === 'root')
    return (
      <svg viewBox="0 0 40 14" className="h-full w-full overflow-visible">
        <path d="M4 7 L 30 2 L 38 7 L 30 12 Z" fill="#c9b878" stroke={O2} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M2 7 L 14 7" stroke="#8a6f4c" strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
        <path d="M22 2 C 24 5 24 9 22 12" stroke="#6e5a34" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    );
  if (kind === 'bind')
    return (
      <svg viewBox="0 0 32 18" className="h-full w-full overflow-visible">
        <path d="M2 9 C 8 3 14 15 20 9 C 24 5 27 5 30 7" fill="none" stroke={O2} strokeWidth="5" strokeLinecap="round" />
        <path d="M2 9 C 8 3 14 15 20 9 C 24 5 27 5 30 7" fill="none" stroke="#7fe0c0" strokeWidth="3" strokeLinecap="round" />
        <path d="M10 4 l -1 -4 l 4 3 M 24 14 l 0 4 l 3 -3" stroke="#eaffd9" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  if (kind === 'thorn')
    return (
      <svg viewBox="0 0 40 14" className="h-full w-full overflow-visible">
        <path d="M4 7 L 30 2 L 38 7 L 30 12 Z" fill="#d8ffb0" stroke={O2} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M2 7 L 12 7" stroke="#8dffb8" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      </svg>
    );
  if (kind === 'spike')
    return (
      <svg viewBox="0 0 40 14" className="h-full w-full overflow-visible">
        <path d="M4 7 L 24 3 L 36 7 L 24 11 Z" fill="#9df0cd" stroke={O2} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M2 7 L 14 7 M 8 4 L 16 6 M 8 10 L 16 8" stroke="#5fd8a2" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      </svg>
    );
  if (kind === 'frost')
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full overflow-visible">
        <circle cx="12" cy="12" r="8" fill="#bfe9ff" stroke={O2} strokeWidth="1.8" className="anim-spin-slow" />
        <circle cx="10" cy="10" r="3" fill="#eefaff" />
        <path d="M12 2 v20 M2 12 h20" stroke="#e6f7ff" strokeWidth="2" strokeLinecap="round" className="anim-spin-slow" style={{ transformOrigin: '12px 12px' }} />
      </svg>
    );
  return (
    <svg viewBox="0 0 40 16" className="h-full w-full overflow-visible">
      <ellipse cx="20" cy="8" rx="16" ry="5" fill="#ffe07a" stroke={O2} strokeWidth="1.6" />
      <ellipse cx="28" cy="8" rx="6" ry="3" fill="#fff6cf" />
      <path d="M2 8 L 10 8" stroke="#ffcf4d" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

// ─────────────────────────── ENVIRONMENT PIECES ────────────────────────────
export function HeartTree() {
  return (
    <svg viewBox="0 0 160 600" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
      <defs>
        <radialGradient id="ht-core" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.55" stopColor="#ffb84d" />
          <stop offset="1" stopColor="#e0703a" />
        </radialGradient>
        <linearGradient id="ht-bark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2a1c" />
          <stop offset="0.55" stopColor="#57402a" />
          <stop offset="1" stopColor="#2c2015" />
        </linearGradient>
      </defs>
      {/* trunk */}
      <path d="M60 610 C 50 520 44 430 52 340 C 58 270 40 210 30 150 C 22 100 30 40 44 -10 L 130 -10 C 150 60 150 140 138 210 C 128 270 130 330 138 400 C 146 470 142 540 132 610 Z" fill="url(#ht-bark)" stroke={O} strokeWidth="4" />
      {/* bark ridges */}
      <path d="M76 590 C 70 500 66 420 74 330 C 80 260 64 200 56 140 M 112 590 C 118 500 120 420 112 340 C 106 280 116 220 120 160" stroke="#241a10" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* gnarled crown hint */}
      <path d="M30 60 C 10 44 4 24 8 4 M 138 64 C 158 48 164 26 158 6" stroke="#2c2015" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* the Heart */}
      <g className="anim-heartbeat" style={{ transformOrigin: '92px 300px' }}>
        <path d="M92 268 C 76 248 52 258 52 284 C 52 310 74 326 92 342 C 110 326 132 310 132 284 C 132 258 108 248 92 268 Z" fill="url(#ht-core)" stroke="#2c1a10" strokeWidth="4" />
        <circle cx="76" cy="280" r="5" fill="#fff4d6" opacity="0.85" />
      </g>
      {/* luminous root veins running to lanes */}
      {[100, 206, 312, 418, 524].map((y, i) => (
        <path key={i} d={`M124 ${y - 20} C 138 ${y - 8} 146 ${y} 162 ${y}`} fill="none" stroke="#7fd77f" strokeWidth="3" strokeLinecap="round" opacity="0.5" className="anim-vein" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
      {/* fireflies */}
      <g className="anim-twinkle">
        <circle cx="30" cy="220" r="2.2" fill="#ffe9a8" />
        <circle cx="140" cy="150" r="1.8" fill="#d9ffb0" />
        <circle cx="36" cy="430" r="2" fill="#ffe9a8" />
        <circle cx="144" cy="380" r="1.6" fill="#d9ffb0" />
      </g>
    </svg>
  );
}

export function SnareGlyph({ active, flash }: { active: boolean; flash: boolean }) {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full overflow-visible">
      <circle cx="30" cy="30" r="22" fill={active ? '#1d3a24' : '#221522'} stroke={active ? '#7fd77f' : '#59374e'} strokeWidth="3" className={active ? 'anim-pulse-ring' : ''} />
      <path d="M30 14 C 24 22 24 30 30 38 C 36 30 36 22 30 14 Z" fill={active ? '#a3f2a0' : '#5c4150'} />
      <path d="M18 34 C 22 40 26 42 30 40 C 34 42 38 40 42 34" fill="none" stroke={active ? '#a3f2a0' : '#5c4150'} strokeWidth="2.6" strokeLinecap="round" />
      {flash && <circle cx="30" cy="30" r="24" fill="none" stroke="#d9ffb0" strokeWidth="4" className="anim-ringburst" />}
    </svg>
  );
}
