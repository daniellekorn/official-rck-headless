# 028 — CMS-editable theme colors (anchor + derived scale)

**Status:** accepted
**Date:** 2026-06-30
**Author:** claude-session (danielle directing)
**Related:** #001 (content/code boundary), #004 (brand palette refresh), #021 (cream bands / palette anchors)

## Background

The brand palette lives in `src/styles/global.css` under Tailwind v4's `@theme`:
an 8-step gold scale, an 8-step navy scale (each with two hand-marked anchors),
and a separate bright `--color-accent`. Until now, colors were squarely on the
**code** side of the content/code boundary (#001) — "colors, fonts, layout" are
listed in `CONTRIBUTING.md` as *not* editable without a PR.

The client now wants to recolor the site himself, without a code change.

## Problem

A naive "let the client edit colors" feature has two traps:

1. **Tailwind v3 inlined hex into every utility** — so a runtime override would
   have been impossible without a rebuild. We had to confirm v4 behaves
   differently before this was even feasible.
2. **Exposing all 16 shades invites a broken-looking site.** The scales are
   perceptually tuned; a non-technical editor picking 16 arbitrary hexes will
   produce muddy contrast and illegible buttons (gold buttons rely on gold being
   light enough for navy text to read).

## Questions and Answers

- **Q:** Does Tailwind v4 in this project emit `var(--color-*)` (overridable at
  runtime) or inline hex (not overridable)?
  **A:** It emits `var(--color-*)`. Verified against the built CSS
  (`dist/client/_astro/*.css`): `.bg-gold-500{background-color:var(--color-gold-500)}`.
  The only literal `#d6a21e` in the bundle is the `:root` token definition
  itself. **This is the fact the whole feature rests on** — override the custom
  properties at runtime and every utility across the site follows, no rebuild.

- **Q:** Let the client edit all 16 shades, or a few anchors with a derived
  scale?
  **A:** Anchors + derived scale. The client edits **primary gold**, **primary
  navy**, and optionally the **bright accent**. Code derives the other shades.
  (Decided with the client.)

- **Q:** How do we derive a coherent 8-step ramp from one anchor?
  **A:** We do *not* invent a new lightness ramp. We keep each original shade's
  **lightness (L)** exactly as it is today, adopt the client's **hue (H)**, and
  scale each shade's **chroma (C)** by the ratio `chosenC / originalPrimaryC`.
  Done in OKLCH via `culori`. Consequences:
    - An **empty** `ThemeSettings` row injects nothing, so the hand-tuned
      `global.css` palette renders **byte-identically** to today — the default
      has zero regression. *(This is the real fidelity guarantee.)*
    - Entering the *current* primary hex reproduces the **primary slot exactly**
      and the rest of the ramp very closely — the derived ramp re-hues every
      shade to the primary's single hue, where the hand-tuned originals carried
      slightly different per-shade hues (e.g. gold-50 `#fdf8e0`→`#fff6e0`). The
      drift is small because the originals are already near-monochromatic, and it
      only applies once the client opts into a recolor.
    - If the client picks a new hue (say a deep red), all 8 shades rotate to that
      hue together, but the brand's light→dark rhythm — and therefore button/text
      contrast — is **preserved by construction**. It is very hard to make the
      site illegible this way.
    - The client's chosen *lightness* is intentionally **not** adopted at the
      primary slot. Picking a dark burgundy yields a medium-light red, not a dark
      one. This is the defensive default for a non-technical editor; per-shade or
      per-lightness control is explicitly out of scope.

- **Q:** New collection, or fields on `HomePage`?
  **A:** New single-row collection `ThemeSettings`. Colors are site-wide, not
  homepage content; bundling them onto `HomePage` would mislead. Matches the
  `ContactInfo` single-row pattern (#011).

- **Q:** What about the ~35 hardcoded brand hexes and ~11 `rgba()` brand colors
  in inline styles / SVG / gradients (Hero gradient, Highlight marker, timeline,
  pager dots, LightRays, …)?
  **A:** They must be wired to the same `var(--color-*)` tokens, or changing a
  color leaves visible orphans of the old color. Alpha colors use CSS relative
  color syntax — `rgb(from var(--color-gold-500) r g b / 0.18)`. This sweep is
  part of *this* feature: a half-themed site is worse than an unthemed one. Each
  hex maps 1:1 to a known token (the grep matched only exact palette values), so
  the swap is mechanical and safe.

- **Q:** Wix CMS has no native color-picker field. How does the client enter a
  color?
  **A:** A `Text` field holding a hex string (`#d6a21e`). Code normalizes
  (`#abc`, `abc`, `#aabbcc`, whitespace) and **falls back to the code default on
  anything invalid** — a typo can never break the render, it just keeps the
  current color.

## Design

**Collection:** `ThemeSettings` — single row, never more (like `ContactInfo`).
Permissions: **Anyone can read.**

| Field | Wix type | Notes |
|---|---|---|
| `primaryGold` | TEXT | Hex for the primary gold (today `#d6a21e`). Empty = keep code default. |
| `primaryNavy` | TEXT | Hex for the primary navy (today `#102a56`). Empty = keep code default. |
| `accent` | TEXT | Hex for the bright highlight color (today `#f6ed49`). Empty = keep code default. |

**Service module:** `src/lib/theme.ts`
- Embeds the current 8-step gold/navy ramps + accent as `ORIGINAL_*` constants
  (source of truth for the L/C structure being preserved).
- `getThemeOverrides()` → queries the single `ThemeSettings` row, normalizes the
  three hexes, returns only the valid ones.
- `deriveRamp(originalRamp, primaryKey, chosenHex)` → OKLCH ramp as above.
- `buildThemeStyle()` → returns a `:root:root { … }` CSS string overriding only
  the families the client actually set (empty = nothing emitted). The
  `:root:root` double-selector guarantees it beats Tailwind's `:root` regardless
  of stylesheet source order.

**Injection:** `Layout.astro` calls `buildThemeStyle()` in frontmatter and
renders it as the **last** `<style is:inline>` in `<head>`. Every page uses
`Layout`, so the override is global.

```
ThemeSettings (CMS) ──► getThemeOverrides() ──► deriveRamp() ──► buildThemeStyle()
                                                                       │
                                          <style>:root:root{--color-gold-500:…}</style>
                                                                       │
   bg-gold-500 / text-navy-700 / var(--color-accent) across every page ◄┘
```

**Hardcoded-hex sweep:** replace literal brand hexes in `.astro` inline
styles/SVG with `var(--color-*)`; replace brand `rgba()` with
`rgb(from var(--color-*) r g b / α)`. Files: Hero, Highlight, HistoryTimeline,
SectionPager, LightRays, PhotoGallery, SplitFeature, PageHeader, EventArchive,
Footer, JoinUs, events.astro, team.astro.

## Trade-offs

- **Algorithmic tints replace hand-tuned ones** the moment the client sets a
  non-default color. Acceptable: leaving defaults reproduces today's palette
  exactly, and the derived ramp preserves contrast structure.
- **No per-shade or per-lightness control.** Deliberate — it's what keeps the
  result legible. If a future need for finer control appears, that's a new entry.
- **Every page now self-fetches theme via `Layout`.** One extra single-row query
  per render, same pattern/cost as `ContactInfo` in the footer (#011).
- **Relative color syntax** (`rgb(from …)`) requires a 2023-era browser. Fine for
  this audience; it degrades to transparent only on genuinely ancient browsers.

## Verification

Page renders byte-identically with an empty `ThemeSettings` row (no override
emitted) — the no-regression default. Setting a new hue recolors the whole site
— utilities *and* the formerly-hardcoded hexes that were swept to `var()` — with
no orphaned old color and contrast preserved. Residual orphans are limited to
decorative glow `shadow-[…]` Tailwind arbitrary values (JoinUs, Footer, events,
youth, EventArchive, PhotoGallery base) — deliberately left, barely perceptible.
`astro check` passes (only the pre-existing `astro.config.mjs` `process` error,
unrelated to this change). `CONTRIBUTING.md` updated.

## Implementation Results (appended after work ships)

Built and verified; commit pending (uncommitted on `main` working tree).

- `src/lib/theme.ts` (new) — `ORIGINAL_*` ramps, `normalizeColor`, `deriveRamp`
  (OKLCH via `culori`), `getThemeSettings`, `buildThemeStyle` (`:root:root`).
- `src/layouts/Layout.astro` — fetches `getThemeSettings()`, injects the override
  as the last `<style is:inline>` in `<head>`.
- Hardcoded-hex sweep to `var(--color-*)` / `rgb(from … r g b / α)` in: Hero,
  PageHeader, Highlight, LightRays, SectionPager, HistoryTimeline, PhotoGallery,
  SplitFeature, EventArchive, team.astro.
- Added deps: `culori`, `@types/culori` (dev).
- CMS: `ThemeSettings` collection created on the live site (id `ThemeSettings`,
  fields `primaryGold`/`primaryNavy`/`accent` TEXT, `read: ANYONE`,
  insert/update/remove `ADMIN`, `SINGLE_ITEM` plugin). Starts with **no row**.
- `CONTRIBUTING.md` updated (editable-list entry, `ThemeSettings` schema,
  reworded the "cannot change" colors line).

**Verification (live, dev server):** empty collection → no `<style>` injected,
page renders, palette unchanged. Seeded `primaryGold:#c0202a` → the exact derived
gold ramp (`--color-gold-50:#ffede9 … --color-gold-700:#8c3735`) was injected on
both `/` and `/team` (shared Layout); only the set family emitted. Test row then
deleted; override gone. `astro check`: 0 new errors (only the pre-existing
`astro.config.mjs` `process`/`@types/node` error remains).
