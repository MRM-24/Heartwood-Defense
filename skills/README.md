# Skills

Design/engineering references kept in-repo so agents and humans share one source of truth.

## `ui-ux-pro-max.skill`

The original upload (a zip archive) — kept verbatim for provenance.

## `ui-ux-pro-max/SKILL.md`

The same skill, unpacked to plain markdown so it is readable (and greppable) in the repo.

> **Note:** the uploaded archive only contained `SKILL.md`; the `data/` and `scripts/`
> entries were relative-link placeholders (`../../../src/ui-ux-pro-max/...`) to the
> skill's generator (161 palettes / 99 UX rules / `search.py`). Those datasets are *not*
> part of this repo, so the `--design-system` CLI cannot be run here. The rule set in
> `SKILL.md` (priorities 1–10, quick reference, pre-delivery checklist) is what this
> project follows for UI work.

### How this project applies it

`Heartwood Defense` is a game UI, so the skill's app-UI rules carry the most weight:
44×44pt touch targets, safe-area compliance, no hover-only affordances, pressed-state
feedback, reduced-motion support, escape routes on every modal, 150–300ms micro-motion,
token-driven colours, and no emoji-as-icons (every glyph is a Lucide SVG or a hand-drawn
game sprite).
