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

export function FloraSprite({ k, hpFrac = 1 }: { k: FloraKey; hpFrac?: number }) {
  switch (k) {
    case 'thornvine': return <Thornvine />;
    case 'glowbulb': return <Glowbulb />;
    case 'bramble': return <Bramblewall hpFrac={hpFrac} />;
    case 'cactus': return <Cactus />;
    case 'frostcap': return <Frostcap />;
    case 'sentinel': return <Sentinel />;
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

export function EnemySprite({
  k,
  shellFrac = 0,
  phase = 1,
}: {
  k: EnemyKey;
  shellFrac?: number;
  phase?: number;
}) {
  switch (k) {
    case 'gnat': return <Gnat />;
    case 'beetle': return <Beetle />;
    case 'skitter': return <Skitter />;
    case 'warden': return <Warden shellFrac={shellFrac} />;
    case 'drifter': return <Drifter />;
    case 'brute': return <Brute />;
    case 'colossus': return <Colossus phase={phase} />;
  }
}

// ─────────────────────────────── PROJECTILES ───────────────────────────────
export function ProjSprite({ kind }: { kind: 'thorn' | 'spike' | 'frost' | 'ray' }) {
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
