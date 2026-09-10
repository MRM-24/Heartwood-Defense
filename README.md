# 🌳 Heartwood Defense — *Flora vs. the Blightspawn*

A lane-defense game set in a living forest. Plant Flora across five lanes, harvest
Nectar to fund your garden, and hold back ten waves of Blightspawn before they reach
the Heart Tree. Every sprite is hand-drawn SVG and every sound is synthesized at
runtime — the whole game ships as a single self-contained HTML file with **zero
binary assets**.

## ✨ Features

- **2 worlds, 10 levels** — *Verdant Vale* teaches the basics; *Frostmire Hollow*
  throws flying, armored, splitting, and boss enemies at you.
- **6 Flora, 7 enemies** — each with distinct roles, counters, and attack patterns.
- **Loadout system** — pick up to 6 Flora before each level; unlocks grow as you win.
- **Root Snares** — one emergency snare per lane that roots the first enemy to cross
  it. Finish a level with snares in the ground to earn up to ★★★.
- **Boss fights** — the Rotback Brute splits into swarms; the Withered Colossus has
  three phases and calls adds.
- **2× speed toggle, pause, restart, keyboard shortcuts.**
- **Progress saved locally** (stars, unlocks, mute preference) via `localStorage`.
- **Fully procedural audio** — WebAudio-synthesized SFX plus a generated ambient
  soundtrack. No audio files to download.

## 🌱 The Flora

| Flora | Cost | Role | What it does |
| --- | ---: | --- | --- |
| Thornvine | 50 | Shooter | 18 dmg thorns every 1.4s. The backbone of any defense. |
| Glowbulb | 25 | Economy | +20 Nectar every 12s. Plant early, plant often. |
| Bramblewall | 75 | Blocker | 400 HP knot of thorns. Holds the line. |
| Spitting Cactus | 100 | Pierce | Spike volley hits *every* enemy in its lane. |
| Frostcap Mushroom | 100 | Control | Chilled spores slow targets by 40% for 3s. |
| Sunflower Sentinel | 175 | Anti-Air | The only Flora that can strike flying enemies. |

## 👾 The Blightspawn

| Enemy | Gimmick |
| --- | --- |
| Creeper Gnat | Baseline blightling. No tricks, just teeth. |
| Husk Beetle | Slow and dense; tests sustained damage. |
| Skitter Swarm | Fast, fragile, arrives in threes. |
| Carapace Warden | Armored shell absorbs 50% of every hit until it shatters. |
| Spore Drifter | Flies over your walls — immune to ground fire. |
| Rotback Brute | Splits into two Skitter Swarms on death. |
| Withered Colossus | Three-phase boss. Faster and hungrier as it dies. |

## 🎮 Controls

- **Click / tap** a Flora card (or press **1–6**), then click a grid cell to plant.
- **X** or the shovel button — dig up a plant.
- **F** — toggle 2× game speed. **Esc** — pause / deselect.
- **Right-click** cancels the current selection.
- The speaker button in the HUD mutes both music and sound effects.

## 🛠 Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org.org/)
- [Vite 7](https://vite.dev) with [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile) — the production build inlines all JS/CSS into one `dist/index.html`
- [Tailwind CSS 4](https://tailwindcss.com) for UI styling
- Web Audio API for all SFX and the background score (`src/game/sfx.ts`, `src/game/bgm.ts`)
- All art is inline SVG (`src/components/sprites.tsx`)

## 🚀 Getting Started

Requires **Node.js ≥ 20.19**.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check, then build the single-file production bundle
npm run preview  # serve the production build locally
```

The production build lives in `dist/index.html` — you can open it directly in a
browser or host it on any static server.

## ☁️ Deploying to Vercel

The repo ships with a ready-made [`vercel.json`](./vercel.json)
(framework: `vite`, build: `npm run build`, output: `dist`), so deployment is
zero-config.

**Option A — Vercel Dashboard**

1. Push this repository to GitHub / GitLab / Bitbucket.
2. In the [Vercel dashboard](https://vercel.com/new), click **Add New… → Project**
   and import the repo.
3. Vercel auto-detects Vite. Click **Deploy** — done.

**Option B — Vercel CLI**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

Every push to the default branch redeploys automatically; pull requests get
preview URLs.

## 📁 Project Structure

```
src/
├── App.tsx              # screen routing (title → worlds → levels → loadout → game)
├── main.tsx             # React entry point
├── index.css            # Tailwind + custom animations
├── components/
│   ├── Board.tsx        # battle grid, enemies, projectiles, FX rendering
│   ├── GameScreen.tsx   # fixed-tick game loop, input, scaling, overlays
│   ├── Hud.tsx          # nectar counter, flora tray, boss bar, controls
│   ├── Screens.tsx      # title / world / level / loadout / guide / end screens
│   └── sprites.tsx      # every Flora, enemy, and the Heart Tree as SVG
└── game/
    ├── types.ts         # shared types & tuning constants
    ├── data.ts          # Flora/enemy stats, worlds, level definitions
    ├── engine.ts        # pure simulation: spawning, combat, waves, bosses
    ├── save.ts          # localStorage save data (progress, stars, mute)
    ├── sfx.ts           # WebAudio sound-effect synth
    └── bgm.ts           # WebAudio procedural background music
scripts/
├── sim.ts               # headless balance harness: a scripted player runs every level
├── novice.ts            # weaker scripted player for difficulty tuning
├── test.ts              # engine smoke tests
└── ssr.tsx              # render-to-string check
```

## 🎵 Audio

All audio is generated with the Web Audio API at runtime:

- **SFX** (`src/game/sfx.ts`) — oscillators and filtered noise for shots, hits,
  warnings, boss phases, and win/lose stingers.
- **BGM** (`src/game/bgm.ts`) — a slow Am–F–C–G loop of detuned pads, soft bass,
  and echoing plucks. It starts on the first click/keypress (browsers block audio
  before a user gesture) and follows the HUD mute button.

## ⚖️ Balance Tooling

`scripts/sim.ts` bundles a scripted average-skill player and plays all 10 levels
headlessly — useful after tuning enemy stats:

```bash
npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs --outfile=/tmp/sim.cjs && node /tmp/sim.cjs
```

---

Made with 🌿 and entirely too many oscillators.
