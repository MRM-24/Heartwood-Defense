# 🌳 Heartwood Defense — *Flora vs. the Blightspawn*

A lane-defense game set in a living forest. Plant Flora across five lanes, harvest
Nectar to fund your garden, and hold back ten waves of Blightspawn before they reach
the Heart Tree. Every sprite is hand-drawn SVG and every sound is synthesized at
runtime — the whole game ships as a single self-contained HTML file with **zero
binary assets**.

## ✨ Features

- **3 worlds, 15 levels** — *Verdant Vale* teaches the basics; *Frostmire Hollow*
  throws flying, armored, splitting, and boss enemies at you; *Rootbound Depths*
  debuts **Batch 1**: seven new Blightspawn built to punish lazy strategies — and
  seven new Flora built to answer them.
- **13 Flora, 14 Blightspawn** — each with distinct roles, counters, and attack patterns.
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
| **Cinderpod** | 125 | Splash | Explosive seed every 2.5s: 25 dmg to the target *and* everything in the adjacent tile. Real area damage — the reliable way through a Stoneback's slab. |
| **Deeproot Sentry** | 150 | Burrow Guard | Fires underground every 2s for 16 dmg at anything tunnelling through its lane — the only Flora that can touch a burrowed Tunnel Larva. Above ground it is just a slow single-target shooter. |
| **Bulwark Bramble** | 100 | Shield Wall | A 350 HP wall with reach: Locust Ranger spines that cross its tile are snatched out of the air instead of landing on the Flora behind it. |
| **Snaptrap Root** | 175 | Trap | Passive jaws, no cooldown between bites: instantly swallows any Blightspawn below 100 HP that enters its tile. Zero damage above that threshold, and a stone slab is too hard to bite. |
| **Watchvine** | 150 | Rearguard | Plantable in any tile, front or back. Always strikes the Blightspawn furthest along its lane — even one that has slipped behind it. 20 dmg every 1.5s. |
| **Bindweed Snare** | 125 | Control | Every 4s it pins the leading foe for 3s: no damage, total immobilise, and a winding-up Gargant Husk loses its smash entirely. |
| **Nectar Lotus** | 100 | Economy | Ripens +40 Nectar every 15s; each harvest also rebates 1s off the recharge of the next Flora you plant within 5s. |

## 👾 The Blightspawn

| Enemy | Gimmick |
| --- | --- |
| Creeper Gnat | Baseline blightling. No tricks, just teeth. |
| Husk Beetle | Slow and dense; tests sustained damage. |
| Skitter Swarm | Fast, fragile, arrives in threes. |
| Carapace Warden | Armored shell absorbs 50% of every hit until it shatters. Wants burst fire. |
| Spore Drifter | Flies over your walls — immune to ground fire. |
| Rotback Brute | Splits into two Skitter Swarms on death. |
| Withered Colossus | Three-phase boss. Faster and hungrier as it dies. |
| **Mite Vaulter** | Springs over the *first* Flora blocking it — once. Punishes single thin walls. |
| **Stoneback Grub** | A 150-point stone slab blocks 100% of single-target damage; only splash (Cactus volley, Frostcap spores) cracks it. The mirror of the Carapace Warden — one wants AoE, the other burst. |
| **Tunnel Larva** | Burrows untouchable under columns 7–9 and surfaces at column 6, ignoring everything planted there. Forces mid-board defense. |
| **Locust Ranger** | Ranged — halts two tiles out and hurls spines at Flora in reach. Punishes glass cannons with no wall in front. |
| **Spore Imp** | Catapulted mid-wave into a random back-half tile, behind your wall entirely. 15 HP, but teeth where you have none. |
| **Gargant Husk** | Doesn't chip damage: a telegraphed 1.5s wind-up, then the Flora it's attacking is destroyed in one hit — regardless of HP. Appears sparingly, late. |
| **Root Thief** | Never attacks. Every 6s it snatches the most wounded Flora in its lane and hauls it off-board over 3s. Kill it mid-heist and the plant drops back unharmed; let it escape and it's gone for good. |

**Batch 1 design notes** — Stoneback Grub and Carapace Warden pull loadouts in
opposite directions (splash vs burst). Tunnel Larva, Locust Ranger, and Spore Imp
all punish "one wall in front, everything stacked behind it." Gargant Husk and
Root Thief are "answer me now or lose something" spikes beyond raw HP totals.

**Flora Batch 1 design notes** — every new plant answers something specific in
that roster rather than adding raw damage: **Cinderpod** cracks the slabs that
shrug off single-target fire; **Deeproot Sentry** is the only way to touch a
burrowed Tunnel Larva; **Bulwark Bramble** intercepts Locust Ranger spines;
**Watchvine** and **Snaptrap Root** punish Spore Imps and Root Thieves that get
behind the wall; **Bindweed Snare** roots a Gargant Husk that no HP total can
tank; and **Nectar Lotus** snowballs an aggressive opening. Batch 1 Flora unlock
across World 3 (levels 11–14).

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

`scripts/sim.ts` bundles a scripted average-skill player and plays all 15 levels
headlessly — useful after tuning enemy stats:

```bash
npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs --outfile=/tmp/sim.cjs && node /tmp/sim.cjs
```

---

Made with 🌿 and entirely too many oscillators.
