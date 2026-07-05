# 039 — Carousel band and flyer letterboxes go light (white / cream)

**Status:** implemented
**Date:** 2026-07-05
**Author:** claude-session (danielle directing)
**Related:** [#021](021-cream-bands-bright-yellow-low-radius.md), [#034](034-design-review-cleanup.md)

## Problem

#034 restored the navy-800 surfaces behind flyers — the coverflow band and
`Flyer.astro`'s letterbox gradient — after discovering the token had never
been defined and the surfaces had silently rendered light. Seeing both
versions live, Danielle prefers the light look: the navy backdrop behind
flyers reads as a mistake, and the flyer pages should keep the white ↔ cream
rhythm of #021.

## Decision

Partially reverses #034's restoration (the *token* stays; several *usages*
change):

- **CoverflowCarousel band: `bg-navy-800` → `bg-white`**, with its
  white-on-dark chrome recolored for a light band — card letterbox is paper
  with a navy-100 hairline and a navy-tinted (not black) shadow, labels
  navy-400, inactive dots navy-200, arrows white with navy icons and gold
  hover (same idiom as the flyer action buttons).
- **`Flyer.astro`'s letterbox: navy gradient → flat `--color-mist` (cream)**,
  so grid flyers on `/learn` and `/events` letterbox onto the site's cream.
  This applies wherever `Flyer.astro` renders, including inside the navy-800
  outer frames on `/youth` and the events archive — cream-in-navy is already
  the placeholder's look there, so those frames were left navy.
- **navy-800 keeps** the lightbox, photo gallery, and the youth/archive outer
  frames. Only the surfaces directly behind flyer artwork went light.

Page rhythm on `/learn` and `/events` is now: white header → white carousel
band (blends into the page) → cream (`bg-mist`) flyer grid → footer.

## Verification

`wix build` + `astro check` pass; dev server shows the white band with
readable labels/dots/arrows on `/learn` and `/events`, and cream letterboxes
in the grids. Lightbox and youth/archive frames unchanged.

## Implementation Results

Shipped in 1d3b161.
