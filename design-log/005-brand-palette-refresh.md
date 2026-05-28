# 005 — Brand palette refresh: anchor + derive

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md)

## Background

The brand owner provided five hex values as the new brand palette:

| Hex | Role (as given) |
|---|---|
| `#102A56` | deep navy |
| `#3E4D6B` | mid navy |
| `#D6A21E` | primary gold |
| `#F6D66B` | light gold |
| `#F6ED49` | bright yellow |

The existing system (set up in #001) defines two 8-step scales — `--color-navy-50…700` and `--color-gold-50…700` — plus `--color-ink`, `--color-paper`, `--color-mist`. Components consume these tokens via Tailwind v4 utility classes (`bg-navy-600`, `text-gold-500`, etc.) and a handful of raw hex literals in gradient `style=` attributes.

Five colors do not map 1:1 to a 16-step palette, so the question was *how* to merge the brand list into the existing token system without breaking the scale.

## Problem

Three sub-problems:

1. The brand list gives 2 navies and 3 yellow/golds. Picking which step each anchors is a judgment call.
2. `#F6ED49` is a bright, saturated yellow that doesn't sit on the same hue arc as the existing warm gold scale. Forcing it into `--color-gold-100` would skew the entire light end of the scale yellow and clash with `--color-mist` section bands.
3. Several components (`Hero.astro`, `PageHeader.astro`, `SplitFeature.astro`, `JoinUs.astro`, `Slideshow.astro`, `team.astro`) use raw hex in gradient `style=` attributes — they don't go through the token system, so token swaps alone won't update them.

## Questions and Answers

- **Q:** Why not collapse the system to just five tokens matching the brand spec literally?
  **A:** Rejected. Components reference `bg-navy-50`, `ring-navy-100`, `text-navy-300` and similar mid/edge tints throughout (cards, rings, placeholder backgrounds, eyebrow text). Pulling those out would force a rewrite of every component for marginal benefit — the brand spec is the *anchor*, not the entire system.

- **Q:** Why not swap only the five tokens that the brand colors match closest, and leave the others alone?
  **A:** Considered, rejected. The given navy primary (`#102A56`) is appreciably bluer and more saturated than the old `#16213d`. Leaving the old `navy-700` at `#0f172a` would put a near-black-grey alongside a saturated mid-blue and break the visual progression. The other tints need to be re-derived to stay on the new hue arc.

- **Q:** Where does `#F6ED49` go?
  **A:** New `--color-accent` token. Not part of the gold scale. Reserved for sparse highlights (focus rings, badges, CTAs-on-dark) — *not* an auto-substitute for any gold-* usage. Decided this way because the hue and saturation are off the gold arc; substituting it for `gold-100` would shift the warm-off-white feel of the page toward neon yellow.

- **Q:** Should `--color-mist` (`#f7f5f0`) change?
  **A:** No. It's a warm off-white for section bands, not a gold tint. Independent of the brand palette change.

- **Q:** What about hex literals inside `style=` attributes (gradients in Hero, JoinUs, Slideshow, etc.)?
  **A:** Updated in-place to the new equivalents. These references were originally chosen to *match* `navy-700`/`gold-500`/etc.; leaving them stale would create silent drift between component gradients and tokens.

- **Q:** What about `rgba(15, 23, 42, …)` in shadow declarations (Nav, daven, team modal scrim)?
  **A:** **Not updated.** At 0.25–0.6 alpha the difference between old `navy-700` (`rgb(15,23,42)`) and new (`rgb(7,23,58)`) is sub-perceptual, and these reads function as neutral shadow darkening rather than tinted brand color. Updating them touches Nav/daven for invisible change. Scope decision: leave them.

- **Q:** Are the brand colors locked, or anchors?
  **A:** The four mid-step values (`navy-400`, `navy-600`, `gold-200`, `gold-500`) are **locked anchors** — they are the brand spec. The other tints are *derived* so the scale remains coherent. If the brand spec ever expands to include explicit light/dark tints, the derived values get overwritten.

## Design

Final palette in `src/styles/global.css`:

```
navy-50  = #eaedf3   (derived, very pale)
navy-100 = #c8cfdc   (derived)
navy-200 = #98a3b9   (derived)
navy-300 = #6b7790   (derived)
navy-400 = #3E4D6B   *** anchor (brand) ***
navy-500 = #243c63   (derived, midpoint 400↔600)
navy-600 = #102A56   *** anchor (brand, primary navy) ***
navy-700 = #07173a   (derived, darker than 600)

gold-50  = #fdf8e0   (derived)
gold-100 = #fbeaa8   (derived)
gold-200 = #F6D66B   *** anchor (brand) ***
gold-300 = #ebbf42   (derived, midpoint 200↔500)
gold-400 = #dfb030   (derived)
gold-500 = #D6A21E   *** anchor (brand, primary gold) ***
gold-600 = #a47915   (derived)
gold-700 = #6f510e   (derived)

accent   = #F6ED49   *** new token, sparse-use only ***
```

Old → new hex mapping for gradient-literal swaps:

| Old (token) | Old hex | New hex |
|---|---|---|
| navy-50  | `#eef1f7` | `#eaedf3` |
| navy-100 | `#cfd5e3` | `#c8cfdc` |
| navy-300 | `#677697` | `#6b7790` |
| navy-400 | `#3d4d6f` | `#3e4d6b` |
| navy-500 | `#1f2c4b` | `#243c63` |
| navy-600 | `#16213d` | `#102a56` |
| navy-700 | `#0f172a` | `#07173a` |
| gold-100 | `#f3e6b3` | `#fbeaa8` |
| gold-200 | `#e8d27f` | `#f6d66b` |
| gold-300 | `#dcbb4d` | `#ebbf42` |
| gold-400 | `#cea531` | `#dfb030` |
| gold-500 | `#b9902a` | `#d6a21e` |
| gold-600 | `#957021` | `#a47915` |

## Implementation Plan

1. Rewrite `--color-navy-*` and `--color-gold-*` in `src/styles/global.css`. Add `--color-accent`. Anchors marked in a comment.
2. Replace raw hex literals in component gradient `style=` blocks (Hero, PageHeader, SplitFeature, JoinUs, Slideshow, team.astro) using the table above. Includes the `rgba(…)` derivatives where they tracked an old palette color (e.g. the gold-tinted radial highlights in Hero).
3. Leave shadow rgba (Nav, daven, team modal) unchanged — see Q&A.
4. No component logic, no Tailwind class changes, no CMS schema changes.

## Trade-offs

- **What we gave up:** The derived tints are interpolations, not designer-blessed values. If a designer reviews and wants e.g. `gold-100` to be warmer/less yellow, those will need overriding by hand.
- **What we made harder:** Future palette swaps still need to update the 6 components carrying raw hex. Long-term fix would be to convert all gradient `style=` blocks to reference CSS variables — out of scope for this change. Worth a follow-up if palette swaps happen again.
- **What we made easier:** The accent yellow is now a first-class token, so introducing it on a focus ring or a "new" badge is a single utility class away (`bg-accent` / `text-accent` via Tailwind v4 theme).

## Verification

- `src/styles/global.css` contains the new anchor values, marked.
- `rg -n '#16213d|#1f2c4b|#0f172a|#3d4d6f|#677697|#eef1f7|#cfd5e3|#b9902a|#957021|#dcbb4d|#cea531|#e8d27f|#f3e6b3' src/components src/pages` returns no matches (all gradient literals swapped).
- `rg -n 'rgba\(15,\s*23,\s*42|rgba\(15, 23, 42' src` *still* returns Nav/daven/team — intentional, see Q&A.
- Spot-check: Hero hero, JoinUs band, Slideshow placeholder slides, team.astro photo placeholders all render with the new palette.
- Browser verification deferred to the user per their preference.

## Implementation Results

Shipped in commit `74b4f73` ("Brand refresh: palette, type, half-highlight component").
