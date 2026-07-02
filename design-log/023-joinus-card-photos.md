# 023 — Optional photos behind Join Us cards

**Status:** implemented
**Date:** 2026-06-24
**Author:** claude-session
**Related:** #033 (Join Us into homepage), #021 (visual refresh)

## Background
The three Join Us cards (Daven / Learn / Our Programs) were solid gold gradient
tiles. The office wanted to put a real photo behind each, while keeping the gold
brand feel and the hover sheen.

## Decision
Each card gets an optional CMS image; when set, it renders behind the card with
a **lightened yellow wash** over it instead of the solid gold fill:

- New `HomePage` fields `joinUsCard{1,2,3}Image` (Image), resolved to
  `…ImageUrl` in `homepage.ts` and passed through `index.astro` → `JoinUs.astro`
  (`CardInput.imageUrl`). Empty = the original solid gold card (unchanged).
- Overlay is a bottom-weighted gold gradient (`from-gold-500/85 via-gold-400/35
  to-gold-300/15`): light at the top so the photo reads, stronger at the base so
  the navy text stays legible.
- The hover sheen sweep is preserved (it sits above the wash).
- Card text (subtitle + title + rule) moved to the bottom via `mt-auto`, and
  cards got a `min-h` so the photo has room above the text.

Also: the Daven card's default icon changed `minyan` → `book` (open book); Learn
keeps `reader`, Our Programs keeps `people`. Icon set documented as `book`,
`reader`, `people`, `minyan`.

## Trade-offs
Navy-on-photo legibility depends on the bottom wash; very busy/dark photos may
need the wash strengthened. Revisit if a chosen photo fights the text.

## Verification
`astro check` passes (only the pre-existing `astro.config.mjs` `process` error).
Cards render the solid gold fallback with no image and the washed photo with one;
hover sheen and text-at-bottom layout hold either way.
