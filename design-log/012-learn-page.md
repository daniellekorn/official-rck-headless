# 011 — Learn With Us page

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** #010 (Flyers CMS collection), #001 (content/code boundary)

## Background

The `Flyers` collection (#010) was built without a corresponding page. The first page to use it is `/learn`, surfacing the `learning` category of flyers with a showcase carousel and a filtered grid.

## Problem

No `/learn` route existed. Learning flyers added to the CMS had nowhere to display.

## Questions and Answers

- **Q:** Should the carousel show only the filtered subset, or always all learning flyers?
  **A:** Always all — the carousel is a showcase, not a browsing tool. Filtering only affects the grid below. Changing the carousel on filter would be jarring and defeats the "slow browse" intent.

- **Q:** Sub-topic filtering: one tag per flyer (TEXT) or multiple (array)?
  **A:** One tag per flyer (`subCategory` TEXT field). A flyer is generally about one topic. The Wix CMS API rejected `ARRAY_OF_STRINGS` as a field type, and a single TEXT field is editor-friendlier (editors just type one word). If multi-tagging is needed later it can be added as a second `subCategory2` field or revisited when the Wix API supports arrays.

- **Q:** Canva API automation for populating flyers?
  **A:** Rejected — see the reasoning in #010. The Canva Connect API can detect new designs in a folder but can't produce a public embed URL (only temporary user-scoped URLs). The office would still need CMS access for tags regardless, making the automation save only ~20 seconds per flyer at the cost of significant infrastructure. Full manual CMS entry wins.

- **Q:** Carousel library?
  **A:** Swiper.js (v12). Has `centeredSlides`, CSS-driven scale effect on non-active slides, built-in `pauseOnMouseEnter` autoplay, and clickable pagination dots. Picked over Embla (less built-in, more custom code) and CSS scroll-snap (no autoplay, no pause-on-hover without JS anyway).

## Design

**Route:** `/learn` → `src/pages/learn.astro`

**Carousel:** Swiper, `centeredSlides: true`, 1.15–1.8 slides visible depending on viewport, 5s autoplay with `pauseOnMouseEnter`, loop. Non-active slides scale to 88% / 60% opacity via CSS on `.swiper-slide` vs `.swiper-slide-active`. Gold pagination dots.

**Filter:** Server-rendered tag pills derived dynamically from `uniqueSubCategories(allLearning)` — no hardcoded list. Active tag drives `?sub=` URL param. "All" pill clears the filter. Gold active state, navy-700 inactive.

**Grid:** 1→2→3 column responsive grid. Each card has a `3:4` aspect-ratio iframe container (portrait flyer shape). Canva embeds use `allow="fullscreen"`. PDF-only flyers use Google Docs Viewer as iframe src. Both use `loading="lazy"`.

**Empty states:** "Learning materials coming soon." (no flyers at all) / "No flyers for '…' yet." (filter with no matches).

**CMS schema addition:** `subCategory` (TEXT) added to `Flyers` collection — optional, free-form, lowercase convention (e.g. `kashrus`, `shabbos`, `women`). Filter buttons auto-capitalize for display.

## Trade-offs

- **Single sub-category per flyer.** A flyer that spans two topics (e.g., "Kashrus for Shabbos") can only be tagged once. Acceptable for now; the editor can duplicate the row if genuinely needed for both filters.
- **No thumbnail in carousel.** Iframes load the full Canva embed per slide. `loading="lazy"` defers off-screen loads, but active + adjacent slides will load Canva. If performance becomes a concern, a `thumbnail` IMAGE field could be added to show a static preview until clicked.
- **Swiper CSS is `is:global`.** Swiper injects class names at runtime so scoped styles can't reach them. The `is:global` block is scoped to classes prefixed `learn-swiper` / `flyer-frame` to minimize bleed.

## Verification

`/learn` renders the PageHeader, carousel, filter pills (when subCategories exist), and grid. Empty CMS → "coming soon" message shown, no carousel section. Filter `?sub=kashrus` → only matching rows in grid; carousel unchanged. `wix dev` passes without TypeScript errors.

## Implementation Results

- `src/pages/learn.astro` — page created
- `src/lib/flyers.ts` — `subCategory` added to `Flyer` interface; `getFlyers` accepts optional `subCategory` param; `uniqueSubCategories` helper exported
- `Flyers` CMS collection updated via API: `subCategory` TEXT field added
- Swiper v12 installed (`npm install swiper`)
