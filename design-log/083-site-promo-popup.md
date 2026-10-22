# 083 — Site-wide promo pop-up (weekly featured shiur + campaign)

**Status:** accepted
**Date:** 2026-10-14
**Author:** claude-session (Yosef directing)
**Related:** [#010](010-flyers-cms-collection.md), [#012](012-learn-page.md), [#031](031-flyer-image-lightbox.md), [#045](045-flyer-image-cdn-scaling.md)

## Background

RCK wants to put one thing in front of every visitor, on whichever page they
land on. Most weeks that's a featured shiur from `/learn`; during a fundraising
campaign it's the campaign (a flyer or a video) with a donate link.

## Design

One component, `src/components/PromoPopup.astro`, mounted in
`src/layouts/Layout.astro` so every page gets it. `getActivePopup()` in
`src/lib/popup.ts` picks the mode on every request (the site is SSR, so dates
take effect without a redeploy) and returns one `PopupConfig` shape for both:

1. **Campaign** — an `isActive` row in the new `PopupCampaigns` collection whose
   `startDate`–`endDate` contains today (Israel time). Wins over the shiur.
2. **Weekly featured flyer** — the active, unexpired `learning` **or `events`**
   row in `Flyers` whose new `featuredWeekOf` date falls in this Sun–Sat week
   (Israel time). One slot per week across both categories; ties → lowest
   `displayOrder`. Lookup is `getFeaturedFlyer()` in `src/lib/flyers.ts`.
3. Neither → nothing renders.

Schemas are in `CONTRIBUTING.md` (Flyers table + `PopupCampaigns` section).

| | Shiur (`learning` flyer) | Event (`events` flyer) | Campaign |
|---|---|---|---|
| On-screen text | none on the flyer — only the button | same | same (`heading` is the screen-reader label, default "Support RCK") |
| Media | flyer `imageUrl` (CDN-scaled) | same | `image`, or `youtubeUrl` when `mediaType = video` |
| Button | "Learn with us!" → `/learn`, whose carousel leads with the featured flyer | "Join us!" → `/events`, whose carousel leads with the featured flyer | `buttonLabel` (default "Donate now!") → `buttonUrl`, new tab |
| × | closes it | closes it | collapses to a "Donate" tab that reopens it |
| Later pages in the session | nothing | nothing | the "Donate" tab |
| Landing directly on the button's page | no pop-up (counts as first page) | same | n/a |

Look (Yosef): just the flyer — no card, frame, or heading around it. A **white**
button strip with **black** text runs along the flyer's bottom edge, set in the
menu bar's font (Onest / `--font-sans`, medium weight, normal case — matching
the Nav links). It replaced an earlier gold strip with white uppercase Oswald
text. A round white × sits on the flyer's top corner. Desktop: the bare flyer
bottom-right (wider for 16:9 video). Under 640px: full screen on a 65% navy
backdrop (lighter than first shipped, so the page shows through and it reads as
a pop-up) with a 3rem × in the screen corner, page scroll locked while open. On
a video the strip sits *under* the player so it doesn't cover it. The minimized
campaign "Donate" tab matches the strip (white, black Onest text).

## Questions and Answers

- **Q:** Rotate the shiur automatically through the Learning flyers, or have the office pick?
  **A:** Office picks (Yosef). A date field rather than a `featured` checkbox, so weeks can be lined up in advance and the Sunday switchover needs nobody. No flyer dated for this week = no pop-up, not a fallback — an unexpected flyer is worse than none.
- **Q:** "Only on the first page" — per session, per week, or once ever?
  **A:** Per browsing session, in `sessionStorage`. The key is `rck-popup-<kind>-<rowId>`, so a new week's flyer or a new campaign is unseen even mid-session. Set when the pop-up is *shown*, not when it's closed, so page two never shows it. Landing on `/learn` (shiur mode) shows nothing but still counts as the first page. If storage is blocked the pop-up can't remember, and shows on each page.
- **Q:** Why a separate `PopupCampaigns` collection instead of another `Flyers` category?
  **A:** A campaign has its own button text, external link, video, and date range — none of which a flyer has — and a `Flyers` category would also put it on a page grid.
- **Q:** How does the button show the visitor *that* flyer on `/learn`?
  **A:** The carousel at the top of `/learn` always leads with this week's featured flyer (`pickFeaturedFlyer` in `learn.astro`; the rest keep `displayOrder`), so it's the first thing on the page for every visitor, pop-up or not. A first build deep-linked to the grid (`/learn#flyer-<_id>`, scrolling ~3000px down and ringing the card) — Yosef preferred the carousel; don't reach for the grid anchor again. If one is ever needed, anchor by `_id`, not `slugify(title)`, which strips Hebrew titles to empty.
- **Q:** Video hosting and autoplay?
  **A:** YouTube (`extractYouTubeId`, same as Past Events), via `youtube-nocookie.com`, `autoplay=1&mute=1&loop=1`. Browsers only allow *muted* autoplay, so there's an Unmute button driving the player through `postMessage` (`enablejsapi=1`). The iframe `src` is set on open and removed on minimize, so a closed pop-up never loads YouTube and minimizing stops playback.

Event flyers were added after first ship (Yosef): the office wanted to put an
event (e.g. a trip) in the weekly slot. It reuses `featuredWeekOf` rather than a
second field, so "one featured flyer per week" stays a single rule — an event
week simply replaces the shiur that week. Event flyers usually carry a
`removeAfter`; one that expires mid-week drops out of the pop-up the next
morning like everywhere else, leaving no pop-up for the rest of that week.

## Trade-offs

- The office has to remember to date next week's flyer — mitigated by a weekly Sunday reminder (a scheduled Claude task, outside this repo) that asks Yosef for the following Sunday's pick and writes `featuredWeekOf` via the Wix MCP.
- Overlapping campaigns aren't ranked; the first row returned wins. Documented as "avoid overlapping dates".

## Verification

To be filled in after ship: shiur mode, campaign (flyer + video), mobile
full-screen, empty-CMS (no pop-up, no errors), Hebrew-titled deep link.
