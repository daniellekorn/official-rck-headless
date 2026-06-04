# 016 — Visual refresh: bold/dramatic direction, JoinUs→Footer seam, light-ray motif

**Status:** accepted (in progress — pass is staged, see Implementation Results)
**Date:** 2026-06-04
**Author:** claude-session (danielle directing)
**Related:** #004 (brand palette), #005 (typography), #006 (animated highlight), #012 (JoinUs into homepage)

## Background

The site read as clean but generic — "design blah." Danielle flagged specific symptoms from homepage/interior screenshots: (1) the `JoinUs` section's navy→gold *diagonal* gradient bled straight into the navy `Footer` with no seam, reading as one muddy dark block; (2) the `JoinUs` cards were stock translucent-gold rectangles with no hierarchy; (3) too much dead white and a repeated centered-dash header on interior pages; (4) nav links felt undersized. She also shared [yukollella.com](https://www.yukollella.com/) as a reference for a **light-ray / sunburst** motif spreading from behind images, ideally animating in a loop.

## Problem

Two dark sections (`JoinUs` gradient + `Footer` `navy-700`) kissing with no divider, plus a "rainbow" navy→gold gradient that is the canonical generic-AI tell. Cards lacked depth/identity. No reusable atmospheric motif existed to lift the design.

## Questions and Answers

- **Q:** Overall art direction — warm editorial, heritage motif, or bold/dramatic?
  **A:** **Bold & dramatic.** Deep navy canvases, oversized display type, glowing gold accents, more motion. Consistent with the standing "bold over generic" bias.

- **Q:** The two dark zones bleed together — recolor one, or add a divider?
  **A:** Both. The `JoinUs` canvas now fades toward a *lighter* navy (`#102a56`) at its base while the `Footer` stays the darkest navy (`navy-700`/`#07173a`), and a gold-glow hairline rule sits at the top of the footer as an explicit seam. Tone contrast + the gold rule = clear separation between two dark sections.

- **Q:** Is a looping light-ray sunburst feasible / not time-consuming?
  **A:** Yes — pure SVG + CSS. A new `LightRays.astro` draws N rays outward from a center via `stroke-dashoffset`, staggered around the circle, fading and looping. No JS, no library. Honors `prefers-reduced-motion` (rays render static).

## Design

**Background system (`JoinUs.astro`).** Retired the `linear-gradient(135deg, navy → gold)` rainbow. New canvas = layered radials (gold glow behind the heading, deep-navy pool bottom-right) over a `180deg` navy ramp that *lightens* toward the base, plus the same fine 45° line texture the hero's no-image fallback uses. Atmosphere/depth, not a flat gradient.

**Cards (`JoinUs.astro`).** Dark-glass cards (`from-white/[0.09] to-white/[0.02]`, `backdrop-blur`, `ring-white/10`) with: an oversized faint-gold editorial index number (01/02/03), a solid `gold-500` icon tile (high contrast against the dark glass), a gold underline rule that grows on hover, and an "Explore →" affordance. Hover lifts the card and adds a gold-tinted glow ring.

**Seam (`Footer.astro`).** A `1px` gold gradient rule (`via-gold-500/70`) with a soft glow shadow at the very top of the footer, marking the break.

**Light-ray motif (`LightRays.astro`, new).** Reusable, decorative, pointer-transparent. Props: `count`, `color` (default brand `gold-400`), `opacity`, `duration`, `class` (sizing/placement). Drop it as the first child of a `relative` wrapper; rays radiate from center and overflow past the wrapper's edges. Wired into `SplitFeature.astro` behind an opt-in `rays` prop (`<SplitFeature ... rays />`), currently enabled on the first homepage feature in `index.astro`.

**Nav (`Nav.astro`).** Link/Contact/Donate text bumped `text-sm` → `text-[15px] lg:text-base`; they read undersized in the wide pill.

## Trade-offs

- The `LightRays` SVG runs an infinite CSS animation; capped to opt-in placements (not global) to avoid many simultaneous animations on one page. Reduced-motion users get a static sunburst.
- Dark-glass cards rely on `backdrop-blur` over the textured navy; on browsers without backdrop-filter they fall back to the semi-transparent white tint, which is still legible.

## Verification

`astro check` clean for all touched/new files (the lone error, `process` in `astro.config.mjs`, is pre-existing and unrelated). Homepage renders with empty CMS (JoinUs uses fallback cards; SplitFeature uses placeholder image with rays behind it). Footer seam visible between the lightened JoinUs base and the darker footer.

## Implementation Results

This is the first commit of a staged refresh. Shipped here: `JoinUs` background + cards, `Footer` seam, new `LightRays` component + `SplitFeature` `rays` opt-in, nav text size.

**Planned next passes (not in this commit):** interior `PageHeader` presence / less dead white; `--color-mist` warm bands to break up all-white stretches; spreading the light-ray motif to other placements (e.g. team photos) pending Danielle's direction. Append commit SHAs once merged.
