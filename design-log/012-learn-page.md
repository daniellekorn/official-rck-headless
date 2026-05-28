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
  **A:** None — vanilla JS, following the same pattern as `Slideshow.astro`. Swiper v12 was installed and attempted first but its npm module imports don't work in this project's Wix build. The existing codebase pattern (vanilla JS, `data-*` attribute targeting) is the correct approach.

- **Q:** What does "gets bigger" mean for the active slide — center-scale or 3D coverflow?
  **A:** 3D coverflow. Initial answer during design ("center item scales up") was corrected after implementation. The final design shows 3 cards simultaneously: center card flat and full-size, side cards tilted back at `rotateY(±38deg)` and `scale(0.78)`. Clicking a side card navigates to it. Hovering or clicking the active card zooms it to `scale(1.18)` for readability.

## Design

**Route:** `/learn` → `src/pages/learn.astro`

**Carousel:** Vanilla JS coverflow. Three cards visible simultaneously via absolute positioning + CSS 3D transforms. `perspective: 1100px` on stage. Active: `scale(1) rotateY(0)`. Side cards: `translateX(±82%) scale(0.78) rotateY(∓38deg)`. Hover/click on active card zooms to `scale(1.18)`. Autoplay 3s, pauses on section hover. Gold dot pagination. Side cards clickable to navigate.

**Filter:** Server-rendered tag pills derived dynamically from `uniqueSubCategories(allLearning)` — no hardcoded list. Active tag drives `?sub=` URL param. "All" pill clears the filter. Gold active state, navy-700 inactive.

**Grid:** 1→2→3 column responsive grid. Each card has a `3:4` aspect-ratio iframe container (portrait flyer shape). Canva embeds use `allow="fullscreen"`. PDF-only flyers use Google Docs Viewer as iframe src. Both use `loading="lazy"`.

**Empty states:** "Learning materials coming soon." (no flyers at all) / "No flyers for '…' yet." (filter with no matches).

**CMS schema addition:** `subCategory` (TEXT) added to `Flyers` collection — optional, free-form, lowercase convention (e.g. `kashrus`, `shabbos`, `women`). Filter buttons auto-capitalize for display.

## Trade-offs

- **Single sub-category per flyer.** A flyer that spans two topics (e.g., "Kashrus for Shabbos") can only be tagged once. Acceptable for now; the editor can duplicate the row if genuinely needed for both filters.
- **No thumbnail in carousel.** Iframes load the full Canva embed per slide. `loading="lazy"` defers off-screen loads, but active + adjacent slides will load Canva. If performance becomes a concern, a `thumbnail` IMAGE field could be added to show a static preview until clicked.
- **Swiper abandoned.** Installed but unused — npm module imports don't resolve in this Wix Astro build. Can be uninstalled if desired.

## Verification

`/learn` renders the PageHeader, carousel, filter pills (when subCategories exist), and grid. Empty CMS → "coming soon" message shown, no carousel section. Filter `?sub=kashrus` → only matching rows in grid; carousel unchanged. `wix dev` passes without TypeScript errors.

## Implementation Results

- `src/pages/learn.astro` — page created
- `src/lib/flyers.ts` — `subCategory` added to `Flyer` interface; `getFlyers` accepts optional `subCategory` param; `uniqueSubCategories` helper exported
- `Flyers` CMS collection updated via API: `subCategory` TEXT field added
- Swiper v12 installed (`npm install swiper`)
