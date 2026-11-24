# 085 — Flyers sit in an even frame filled with their own faded colors

**Status:** implemented
**Date:** 2026-11-24
**Author:** claude-session (Yosef directing)
**Related:** #031, #039, #045, #084

## Problem

`Flyer.astro` fit A4 flyers into a 3:4 box, so they touched the top and bottom but left strips of flat cream at the sides. Yosef wanted even space on all four sides, and the leftover space to look like part of the flyer.

## Design

- The picture area is A4 (`794 / 1123`, the shape of nearly every flyer) inside 0.75rem of padding, so the space is identical on all four sides. A landscape flyer still letterboxes inside it.
- `FlyerBackdrop.astro` fills the frame with a 48px-wide CDN copy of the same flyer (~2 KB), blurred and faded over white. It also stands in while the flyer loads.
- Lives in `Flyer.astro`, so `/events`, `/learn`, `/youth` and past events all match. The placeholder and PDF viewer keep no padding. The `/learn` carousel has no frame and is unchanged.

## Questions and Answers

- **Q:** Pick one average color per flyer instead of a blurred copy?
  **A:** No. One color needs per-image analysis or a CMS field, and looks flat on a flyer that changes color from top to bottom.
- **Q:** Shape each frame to its own flyer, so landscape ones have no extra space?
  **A:** No. `imageUrl` is plain text with no dimensions, and cards of different heights would break the row.

## Verification

Checked in local preview on `/events`, `/learn` and `/youth`: measured equal space on all four sides at phone and desktop widths; white, landscape and flipping flyers look right.
