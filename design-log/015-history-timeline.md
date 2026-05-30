# 015 — "Who We Are" history timeline (rename + auto-pan)

**Status:** accepted
**Date:** 2026-05-30
**Author:** claude-session (danielle directing)
**Related:** #001 (content/code boundary), #002 (homepage sections)

## Background

The client liked the *history* section on [dallastorah.org/about](https://dallastorah.org/about/) — specifically the feel of a slow, automatic pan that travels from start to finish and then glides back again. They wanted the homepage "Who We Are" section to carry that motion, and to read like a **timeline** with a visible **year** on each entry rather than a generic photo carousel.

The existing section used a crossfade carousel (`Slideshow.astro`) fed by the `HomepageSlides` CMS collection (`image`, `title`, `caption`, `sortOrder`, `active`). That collection had no concept of a date, so it couldn't express chronology.

## Problem

Two gaps:

1. **No year in the data.** A timeline implies chronological order and a visible year per milestone. `HomepageSlides` had no such field.
2. **The motion was a crossfade, not a pan.** The brief was a continuous slow horizontal pan (end → start → end), not a one-at-a-time fade.

## Questions and Answers

- **Q:** Auto-scroll the existing slideshow as-is, or rebuild as a real timeline with years?
  **A:** A combination — a **slow horizontal auto-pan** *and* a visible **year** per entry. Years make it read as history; the pan delivers the motion the client liked. (See the option exploration in the session.)

- **Q:** Can we just "rename" `HomepageSlides`?
  **A:** No — Wix Data collection IDs are fixed at creation. "Renaming" means **create a new collection, migrate the rows, repoint the code, delete the old one.** Code only *queries* a collection by ID; it cannot create or rename one. The new collection must exist in Wix with the exact name and the new `year` field, or the query returns nothing and the section renders its built-in placeholder.

- **Q:** What to name the new collection?
  **A:** `OurHistory`. The project names collections by *what the data is* (`Flyers`, `TeamMembers`, `DaveningTimes`, `ContactInfo`), not by the widget that renders it. `RCKTimeline` and `KollelHistory` were considered; `OurHistory` is the clearest description of the content for the office editor. The brand-lead convention ("RCK" first) governs user-facing copy, not internal collection IDs.

- **Q:** `year` as Text or Number?
  **A:** **Number.** It sorts naturally for chronological ordering (`.ascending("year")`) and renders cleanly as a four-digit label. `sortOrder` is kept as a tiebreak when two milestones share a year.

- **Q:** How is the pan implemented — CSS animation or JS?
  **A:** JS driving `scrollLeft` on a native `overflow-x-auto` track via `requestAnimationFrame`. This keeps the container natively scrollable (mouse, trackpad, touch, keyboard), which a pure CSS `transform` animation would fight. The loop ping-pongs with a short dwell at each end.

## Design

**Collection rename:** `HomepageSlides` → `OurHistory`, adding a `year` (Number) field.

| Field | Wix type | Notes |
|---|---|---|
| `image` | IMAGE | Required. Milestone photo (rendered cropped to 4:3). |
| `year` | NUMBER | Milestone year, e.g. `2021`. Drives chronological order; shown as the gold timeline label. |
| `title` | TEXT | Milestone heading. |
| `caption` | TEXT | One-line description. |
| `sortOrder` | NUMBER | Tiebreak within the same year. Lower first. |
| `active` | BOOLEAN | Hide without deleting. |

**Permissions:** "Anyone can read" — same as every public collection here.

**Code changes:**

- `src/lib/homepage-slides.ts` → `src/lib/history.ts`. `getHistory()` queries `OurHistory`, filters `active = true`, orders `year` then `sortOrder`, resolves images at 1200×900 (4:3).
- `src/components/Slideshow.astro` → `src/components/HistoryTimeline.astro`. A horizontal timeline: each milestone is a card with a gold year node on a connecting spine line, the photo, title, and caption. Edge fades on both sides hint at more content.
- `src/components/WhoWeAre.astro` now renders `HistoryTimeline` and passes `entries` (with `year`).
- `src/pages/index.astro` calls `getHistory()` and maps to `entries`.

**Motion / accessibility:**

- Slow auto-pan (~24 px/s) via `requestAnimationFrame` on `scrollLeft`; reverses at each end with a ~1.1 s dwell.
- Pauses on hover and keyboard focus; manual scroll/drag takes over and the pan resumes ~2.8 s after the visitor stops.
- Honors `prefers-reduced-motion` (no auto-pan; the track stays manually scrollable) and stops while the tab is hidden.
- The track is focusable with an `aria-label`, so keyboard users can scroll it.

## Trade-offs

- **The rename is a migration, not a rename.** Old `HomepageSlides` rows must be copied into `OurHistory` (with a `year` added per row). Image assets live in Wix Media and are referenced by the same URL, so they don't need re-uploading. Until the collection exists and is populated, the section shows its built-in placeholder milestones.
- **`year` is required for sensible ordering.** A row with an empty `year` sorts unpredictably. Documented in CONTRIBUTING.md; not enforced in code (consistent with the project's soft-validation pattern — see [#010](010-flyers-cms-collection.md)).
- **Scrollbar hidden.** The native scrollbar is hidden for a cleaner look; the edge fades and motion communicate scrollability. Manual scroll still works on every input.

## Verification

- `astro check`: 0 errors (pre-existing hints in `nav-preview.astro` are unrelated).
- With an empty/missing `OurHistory` collection, `getHistory()` returns `[]` and the component falls back to placeholder milestones — no error, no empty section.

## Implementation Results

**Wix side (done via MCP, 2026-05-30):**

- Created `OurHistory` collection on site `3360b9e1-…821929` with fields `image` (IMAGE), `year` (NUMBER), `title` (TEXT), `caption` (TEXT), `sortOrder` (NUMBER), `active` (BOOLEAN); `read: ANYONE`. Verified queryable via the public `wix-data/v2/items/query` path the site uses.
- **No data migration was needed:** the old `HomepageSlides` collection had **zero rows** — the homepage had been rendering the component's built-in placeholder slides all along.
- **`HomepageSlides` was left in place,** not deleted. The live production site still runs the pre-change code (which queries `HomepageSlides`) until the next `wix release`. Deleting it before release is premature; it should be deleted from the Wix dashboard *after* this change ships. (Deleting it earlier is harmless in practice — the lib's try/catch returns `[]` and the section falls back to placeholders — but cleaner to delete post-release.)

**Open follow-ups before/at ship:**

- ⚠️ **Populate `OurHistory` with real milestones before release.** The component's placeholder entries invent specific years (2019 founding, etc.). Those are factual-looking claims about a real organization and must not go live unverified. Once the office adds real rows, placeholders never render.
- Delete the empty `HomepageSlides` collection after release.
- Append commit SHAs here once merged.
