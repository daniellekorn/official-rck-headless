# 034 — Design-review cleanup: navy-800 token, shared media helpers, log renumbering

**Status:** implemented (retrospective — records a cleanup pass, not an up-front design)
**Date:** 2026-07-02
**Author:** claude-session (danielle directing)
**Related:** [#021](021-cream-bands-bright-yellow-low-radius.md), [#030](030-hero-single-source-of-truth.md), [#033](033-joinus-into-homepage-naming-alignment.md)

## Background

A full-repo design review found dead code, six copies of the same
`resolveImage` helper, docs contradicting the code, and several design-log
entries whose decisions had been silently reversed by later entries.

## Decisions

- **`--color-navy-800` now exists (`#0b1b38`).** `bg-navy-800` was used on the
  coverflow band and the events/youth flyer frames, but the token was never
  defined — in Tailwind v4 that generates *no* utility, so those surfaces
  silently rendered without their dark background (the carousel's white dots
  and labels were designed for it). The shade was already hardcoded in the
  lightbox and photo gallery. Defining the token restores the intended look;
  it was also added to `ORIGINAL_NAVY` in `src/lib/theme.ts` so CMS theme
  recoloring (#028) covers it.
- **`src/lib/wix-media.ts` owns media resolution.** `resolveImage`, the
  `GalleryItem` shape, and the gallery-URL pipeline live there; the six
  per-module copies are gone. New collections should import it, not re-paste.
- **The duplicate `012` was renumbered to #033** (it also internally claimed
  `011`). Plain "#012" now unambiguously means the Learn page entry.
- **Superseded entries are now marked** (003, 006, 009, 010, 029) so no entry
  reads as authoritative after a later entry reversed it.

## Verification

`astro check` and `wix build` pass; no rendered output changes except the
restored navy-800 surfaces (coverflow band, flyer frames), verified against
the intent of the components' own white-on-dark styling.
