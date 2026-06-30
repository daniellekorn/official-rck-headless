# 012 — Learn With Us page + CoverflowCarousel component

> **Note (#031, 2026-06-30):** the `embedUrl` path described below was removed.
> The `Item` shape and render chain are now `imageUrl → pdfUrl → placeholder`,
> and the carousel/grid flyers use the shared `Flyer` + `Lightbox` components.

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** #010 (Flyers CMS collection), #001 (content/code boundary)

## Background

The `Flyers` collection (#010) needed a page. `/learn` is the first, showing `category = learning` flyers in a 3D coverflow carousel with a sub-topic filtered grid below.

## Questions and Answers

- **Q:** Should the carousel show only the filtered subset, or all learning flyers?
  **A:** Always all — carousel is a showcase. Filter only affects the grid below.

- **Q:** Sub-topic filtering: one tag per flyer (TEXT) or multiple (array)?
  **A:** One tag (`subCategory` TEXT field). Wix CMS API rejected `ARRAY_OF_STRINGS`. A single TEXT field is editor-friendlier. Multi-tagging can be revisited later.

- **Q:** Canva API automation?
  **A:** Rejected. The Connect API can detect new designs in a folder but can't produce a public embed URL, and the office still needs CMS access for tags. Full manual entry wins.

- **Q:** Carousel library?
  **A:** None. Swiper v12 was attempted but npm module imports don't resolve in the Wix Astro build. All carousel logic is vanilla JS following the `Slideshow.astro` pattern (`data-*` attributes, `setInterval`, `classList` toggling).

- **Q:** Crossfade or 3D coverflow?
  **A:** 3D coverflow. Initial design session produced a "center item scales up" crossfade first (one card at a time), which the user rejected in favor of seeing 3 cards simultaneously with the side cards tilted back in 3D perspective. Coverflow implemented from scratch in vanilla JS + CSS `perspective`/`rotateY`.

- **Q:** Arrow buttons for prev/next, or side-card-click only?
  **A:** Both. Side cards are clickable to navigate; arrows provide explicit prev/next control and make looping obvious. A round of removing and restoring arrows happened mid-session due to a misdiagnosed cause (arrows were blamed for a visual regression that was actually caused by sparse CMS data). Arrows are correct; keep them.

- **Q:** Where should the arrows be positioned?
  **A:** Flanking the center card, not the page edges. `left/right: calc(50% - min(120px, 27.5vw) - 3.25rem)` — derived from card half-width so they stay adjacent to the card at all viewport sizes.

- **Q:** Why did Astro scoped CSS break the carousel after extracting to a component?
  **A:** Astro scopes `<style>` blocks by appending a hash attribute to selectors. JS-toggled classes like `pos-active` need the hash attribute on the element to match — which should work since the attribute is added at render time. But in the Wix build this was unreliable. Fixed with `<style is:global>`. The carousel class names (`coverflow-*`, `pos-*`) are specific enough that global scope is safe.

- **Q:** Why doesn't hover-pause work correctly on mobile?
  **A:** Mobile browsers synthesize `mouseenter`/`mouseleave` events around touch interactions. This caused the pause (from `mouseenter`) and resume (from `mouseleave`) to fire before the `click` event, fighting the click handler. Fixed by gating hover events behind `window.matchMedia("(hover: hover)")` — touch devices use click-only control.

- **Q:** CMS `category` field is case-sensitive?
  **A:** Yes. The code queries `category === "learning"` (lowercase). Entries typed as `"Learning"` in the dashboard won't appear. Document the valid slugs clearly in CONTRIBUTING.md and use lowercase consistently.

## Design

**Route:** `/learn` → `src/pages/learn.astro` (thin page — just fetches data and composes components)

**Carousel component:** `src/components/CoverflowCarousel.astro`
- Props: `items: Item[]`, `autoplayMs?: number` (default 3000)
- `Item`: `{ title?, imageUrl?, embedUrl?, pdfUrl? }`
- Three cards visible simultaneously: center `scale(1) rotateY(0)`, sides `translateX(±82%) scale(0.78) rotateY(±38deg) opacity(0.6)`
- `perspective: 1100px` on `.coverflow-stage`
- Hover on active card (desktop only): `scale(1.4)` zoom-in, cursor: zoom-in
- Click active card: toggle locked zoom (`is-zoomed`), pause/resume autoplay
- Click side card: navigate to it
- Autoplay: 3s interval, pauses on active-card hover (desktop), resumes on mouseleave or click-outside
- Gold dot pagination below stage
- Prev/next arrows flanking the center card (not page edges)
- `<style is:global>` required — scoped CSS doesn't reliably match JS-toggled classes in this build

**Filter:** Server-rendered pills from `uniqueSubCategories(allLearning)`. `?sub=` URL param. Gold active state.

**Grid:** 1→2→3 col, `aspect-[3/4]` cards. Renders `imageUrl` as `<img>`, `embedUrl` as Canva iframe, `pdfUrl` via Google Docs Viewer iframe. All `loading="lazy"`.

**Flyer content types:** Three paths in priority order — `imageUrl` → `embedUrl` → `pdfUrl`. Canva embeds block on localhost (Canva's CSP); test on a preview deployment.

## Trade-offs

- **CSS scoping:** `is:global` is required. If another component ever uses `.coverflow-card` or `.pos-active`, there will be a conflict. Unlikely given the specific naming.
- **Single subCategory per flyer.** A flyer tagged with two topics needs a duplicate row. Acceptable at current scale.
- **No thumbnail.** All three visible carousel cards load their full embed/image. `loading="lazy"` on side cards mitigates this but they're still in the DOM.
- **Canva embeds break on localhost.** This is Canva's restriction, not a code bug. Always test Canva embeds on a preview deployment.
- **`category` is case-sensitive.** Editors must use lowercase slugs exactly. CONTRIBUTING.md documents this.

## Verification

`/learn` with ≥3 learning flyers shows full 3D coverflow. With 1 item, only center card shows (no side cards — expected). Filter pills appear only when subCategories exist. Empty collection → "coming soon." Arrows loop correctly in both directions. Mobile tap navigates and toggles zoom; hover-pause is desktop-only.

## Implementation Results

- `src/pages/learn.astro` — created; later simplified to one-liner `<CoverflowCarousel>`
- `src/components/CoverflowCarousel.astro` — extracted from learn.astro for reuse
- `src/lib/flyers.ts` — `subCategory`, `imageUrl` added to `Flyer` interface; `uniqueSubCategories` helper
- `Flyers` CMS collection — `subCategory` and `imageUrl` fields added via API
- Swiper v12 installed but unused; can be uninstalled
