# 🌳 Heartwood Defense — *Flora vs. the Blightspawn*

A lane-defense game set in a living forest. Plant Flora across five lanes, harvest
Nectar to fund your garden, and hold back ten waves of Blightspawn before they reach
the Heart Tree. Every sprite is hand-drawn SVG and every sound is synthesized at
runtime — the whole game ships as a single self-contained HTML file with **zero
binary assets**.

## ✨ Features

- **5 worlds, 25 levels** — *Verdant Vale* teaches the basics; *Frostmire Hollow*
  throws flying, armored, splitting, and boss enemies at you; *Rootbound Depths*
  debuts **Batch 1**: seven new Blightspawn built to punish lazy strategies — and
  seven new Flora built to answer them; *The Hollow Crown* debuts **Batch 2**: seven
  more Blightspawn built to punish the *counters* Batch 1 taught you to reach for —
  and **Flora Batch 2** answers those in turn, without using a single status effect;
  *The Hollow Reckoning* debuts **Batch 3**: six Blightspawn with no new Flora at
  all, each one engineered to spend *your Batch-2 favorites* on nothing.
- **20 Flora, 27 Blightspawn, 3 bosses** — each with distinct roles, counters, and attack patterns.
- **Loadout system** — pick up to 6 Flora before each level; unlocks grow as you win.
- **Root Snares** — one emergency snare per lane that roots the first enemy to cross
  it. Finish a level with snares in the ground to earn up to ★★★.
- **Boss fights** — the Rotback Brute splits into swarms; the Withered Colossus has
  three phases and calls adds; the Hollow King switches a whole damage channel off
  for five seconds at a time and enrages below a quarter HP.
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
| **Ironbark Titan** | 250 | Heavy Hitter | 80 raw damage every 3s at one target. No splash, no chill, no poison — a Grovemaw Slug has nothing to swallow. |
| **Emberlash Vine** | 150 | Burn Beam | A continuous **8 dmg/s beam** on whatever is frontmost. No projectile, no wind-up, so a Molt Wisp splitting mid-burn costs it nothing. |
| **Needle Reed** | 125 | Spray | Five 6-damage needles every 2s, dealt across **up to three** enemies rather than piled into one. |
| **Gale Fern** | 150 | Displacement | Every 6s, shoves the leading enemy **back two tiles**. Physical displacement — root immunity does not answer it, and it cancels a Nightcap sprint. Bosses are shoved half as far. |
| **Sentinel Bloom** | 175 | Riposte | Never shoots. Any enemy that **sprints or leaps** across its tile takes an automatic 50-damage counter-strike, once per enemy. Walkers are ignored. |
| **Ambush Fern** | 125 | Trap | Inert until something enters its own tile, then one **120-damage** hit before a 6s recharge. |
| **Prism Bud** | 200 | Alternating | 18 dmg every 1.8s, **alternating channel every other shot** — a focused physical bolt, then a fire burst with splash. Whatever the Hollow King has warded, the next shot is on the other one. |

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
| **Molt Wisp** | 50 HP. The first time it drops below half HP it comes apart into **two 25-HP wisps** that never split again — total HP unchanged, shape of the problem changed. A single big splash hit just makes two targets. |
| **Chitterling Pack** | 20 HP × 4. Arrives as four bodies stacked in **one lane slot** at a dead run (faster than a Skitter). Each is far below Snaptrap's 100-HP jaw threshold, but there are four of them six inches apart. |
| **Nightcap Assassin** | 90 HP. The first Flora to block it doesn't hold it: it **sprints past your front two plants untouched**, puts a single 20-dmg burst into whatever it reaches in the back row, then settles into an ordinary walk. Once per assassin. |
| **Fen Wretch** | 130 HP. An **aura, not an attack**: while it lives in a lane, every Nectar plant there ripens at **half rate**. It never has to reach the plant. Kill it first or your economy stalls. |
| **Barkskin Marauder** | 180 HP, 18 dmg/1.4s. **Immune to root and immobilise** — a Bindweed Snare lashes it and falls away. It cannot be time-stalled, only damaged down. |
| **Grovemaw Slug** | 200 HP, never bites. Any **slow or poison** that lands on it is swallowed instead, and its total value (`pct × seconds`) becomes **25% damage reduction per point**, capped at 85%, for the effect's duration. Frostcap chills are its dinner. |
| **The Hollow King** | 3500 HP world boss. Sheds Molt Wisps across the whole board; below ⅔ HP it **shuts one damage channel off** for 5s at a time, alternating between single-target strikes and splash; below ¼ HP it **enrages** — twice the swing rate, twice the damage taken. |
| **Regrowth Husk** | 100 HP. Knits **15 HP back every 2s it goes unhit** — the clock resets on *any* hit. Ironbark's 3s swing gap is exactly its dinner bell; a Thornvine or Emberlash stream never gives it a beat. |
| **Cinder Golem** | 140 HP, slow. **Half damage from every burn source** — Emberlash beams simmer, Prism fire bursts hit soft. Cinderpod splash and Ironbark swings are concussion, not fire, and go in whole. |
| **Bulwark Roach** | 110 HP. Any **single hit below 10 damage floors to 1** — a whole Needle Reed volley chips it for five. One 18-damage Thornvine bite out-damages the entire spray. Beams are streams, not volleys, and keep full value. |
| **Boulder Toad** | 160 HP. **Immune to every displacement** — Gale Fern gusts wash off granite without breaking stride. There is nothing to shove it with; grind it down. |
| **Iron Nightstalker** | 130 HP. The Nightcap's dash — past your front two plants, one burst into the back row — but each sprint starts with **an iron plate that eats the first hit**, Sentinel Bloom's riposte included. Then it bounds east, re-arms, and comes again. |
| **Wardshell Grub** | 100 HP. **The first hit after entering any new tile deals zero** — once per tile. An Ambush Fern springs on nothing every step it takes; any second hit, or any cheap needle, spends it. |

**Batch 2 design notes** — Batch 1 taught a set of reflexes; Batch 2 punishes the
reflexes rather than the laziness. **Grovemaw Slug** and **Barkskin Marauder** are
direct counters to the status-effect plants Batch 1 handed out: the Slug *eats*
Frostcap's chill and converts it into armour, the Marauder shrugs off Bindweed's
root outright, so a control-heavy loadout has to keep raw damage in the tray.
**Chitterling Pack** stress-tests Snaptrap Root's "no cooldown between bites" claim
instead of letting it be trivially strong — and the claim holds. **Nightcap
Assassin** and **Fen Wretch** both make the back row a genuine risk zone rather
than free safety for Watchvine / Nectar Lotus / Glowbulb. **Molt Wisp** quietly
taxes one-shot splash: every big hit that crosses the threshold buys the blight two
bodies instead of one. **The Hollow King** is the loadout check — a tray that only
does one kind of damage stalls for five seconds at a time.

**Enemy Batch 3 design notes** — the Reckoning has no new plants, and that is the
point. Batch 2 handed you seven favorite tricks; each Batch-3 enemy spends exactly
one of them on nothing: the **Regrowth Husk** turns Ironbark's burst cadence into a
healing rhythm (only sustained streams deny it), the **Cinder Golem** halves the
burn you reach for against Molt Wisps, the **Bulwark Roach** floors the spray you
reach for against packs, the **Boulder Toad** deletes the gust you reach for against
Marauders, the **Iron Nightstalker** plates over the riposte you reach for against
dashes, and the **Wardshell Grub** spends the ambush you reach for against walkers.
No stat is padded — these six are ordinary on every other axis, so the answer is
always *pair the punished plant with the one it was never meant to fight alone*,
not a new unlock. World 5 (levels 21–25) unlocks no Flora: `FLORA_UNLOCKS` carries
five deliberately empty entries, which reads as a design statement, not an oversight.

**Flora Batch 2 design notes** — the Crown eats statuses and shrugs off roots, so
every new plant does its work with physics instead. **Ironbark Titan** is raw burst
with nothing to absorb; **Gale Fern** is displacement, which Barkskin's root
immunity does not answer; **Emberlash Vine** is a continuous beam with no
projectile to bury, which is precisely what a Molt Wisp split punishes in a
volley shooter; **Needle Reed** spends its damage across a cluster instead of
overkilling one body; **Sentinel Bloom** and **Ambush Fern** make the tile itself
hostile to anything that gets past the wall; and **Prism Bud** is the direct
answer to a boss that switches damage types, because it is never on one type for
long. They unlock across World 4 (levels 16–20), one answer per level.

**The DoT channel** — the engine has a full damage-over-time channel
(`attack.poisonDps` / `poisonDur` → projectile → tick → Grovemaw Slug absorption →
Hollow King ward) wired end to end and covered by tests, but **no Flora produces
poison yet**. Adding an Acidroot later is a two-number change in `data.ts`, with no
engine surgery. Until then the King's ward alternates between the two channels that
are actually live: `physical` (single-target strikes) and `splash` (area damage).

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

`scripts/sim.ts` bundles a scripted average-skill player and plays all 25 levels
headlessly — useful after tuning enemy stats. `scripts/novice.ts` runs the same
levels with only the three starter plants, which is the check that a new world is
actually harder than the last one:

```bash
npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs --outfile=/tmp/sim.cjs && node /tmp/sim.cjs
npx esbuild scripts/novice.ts --bundle --platform=node --format=cjs --outfile=/tmp/novice.cjs && node /tmp/novice.cjs
npx esbuild scripts/test.ts --bundle --platform=node --format=cjs --outfile=/tmp/test.cjs && node /tmp/test.cjs
```

---

Made with 🌿 and entirely too many oscillators.
