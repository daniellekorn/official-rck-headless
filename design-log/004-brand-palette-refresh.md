# 004 — Brand palette refresh: anchor + derive

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

1. The brand list gives 2 navies and 3 yellow/golds. Picking which step each anchors is a judgment call.
2. `#F6ED49` is a bright, saturated yellow that doesn't sit on the same hue arc as the existing warm gold scale. Forcing it into `--color-gold-100` would skew the entire light end of the scale yellow and clash with `--color-mist` section bands.
3. Several components use raw hex in gradient `style=` attributes — they don't go through the token system, so token swaps alone won't update them.

## Questions and Answers

- **Q:** Why not collapse the system to just five tokens matching the brand spec literally?
  **A:** Components reference mid/edge tints (`bg-navy-50`, `ring-navy-100`, `text-navy-300`) throughout. The brand spec is the *anchor*, not the entire system.

- **Q:** Where does `#F6ED49` go?
  **A:** New `--color-accent` token. **Not part of the gold scale.** Reserved for sparse highlights (focus rings, badges, CTAs-on-dark) — *not* an auto-substitute for any gold-* usage. The hue and saturation are off the gold arc; substituting it for `gold-100` would shift the warm-off-white feel toward neon yellow.

- **Q:** Should `--color-mist` (`#f7f5f0`) change?
  **A:** No. It's a warm off-white for section bands, not a gold tint. Independent of the brand palette change.

- **Q:** Are the brand colors locked, or anchors?
  **A:** The four mid-step values (`navy-400`, `navy-600`, `gold-200`, `gold-500`) are **locked anchors** — they are the brand spec. The other tints are *derived* so the scale remains coherent. If the brand spec expands to include explicit light/dark tints, the derived values get overwritten.

- **Q:** What about `rgba(15, 23, 42, …)` in shadow declarations (Nav, daven, team modal scrim)?
  **A:** **Not updated.** At 0.25–0.6 alpha the difference between old navy-700 and new is sub-perceptual, and these reads function as neutral shadow darkening rather than tinted brand color. Updating them touches files for invisible change. Leave them.

## Design

Final palette in `src/styles/global.css`:

```
navy-50  = #eaedf3   (derived)
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
gold-300 = #ebbf42   (derived)
gold-400 = #dfb030   (derived)
gold-500 = #D6A21E   *** anchor (brand, primary gold) ***
gold-600 = #a47915   (derived)
gold-700 = #6f510e   (derived)

accent   = #F6ED49   *** new token, sparse-use only ***
```

## Trade-offs

- **Derived tints are interpolations, not designer-blessed values.** If a designer reviews and wants e.g. `gold-100` warmer/less yellow, those need overriding by hand.
- **Future palette swaps still need to update the 6 components carrying raw hex** (Hero, PageHeader, SplitFeature, JoinUs, Slideshow, team.astro). Long-term fix: convert all gradient `style=` blocks to reference CSS variables. Out of scope for this change.
- **`--color-accent` is opt-in only.** Don't auto-substitute it for any `gold-*` usage; if you reach for accent yellow, do it deliberately on a single focus ring / badge / CTA-on-dark.

## Implementation Results

Shipped in commit `74b4f73` ("Brand refresh: palette, type, half-highlight component").
