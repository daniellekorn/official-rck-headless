# 027 — Past-events interactive gallery (master-detail)

**Status:** proposed — plan for review, no code written yet
**Date:** 2026-06-28
**Author:** claude-session
**Related:** #010 (Flyers collection), #017 (events & youth pages), #023 (joinus card photos)

## Background
Client feedback (Yosef, 2026-06-26): for **past events** on the events page he
wants a master-detail layout like
[lemaan-achai.org.il/attractions-from-the-summer-camp](http://lemaan-achai.org.il/attractions-from-the-summer-camp/)
— a list of event *names* down the side; click a name and that event's **photos
+ flyer** appear in the main panel, no page reload. He also wants the **same
pattern reused later** for Torah content (Parsha sheets, source sheets, Pesach
guide), citing [denverkollel.org/pdfs](https://denverkollel.org/pdfs/?tag_info=Shemos-parsha&cat_info=torah-weekly)
(a tag-filtered document library).

This is bigger than a style tweak: it needs a CMS schema (past events carry
*multiple* photos, which the current `Flyers` collection doesn't model) and a
new interactive component. Hence this entry before any code.

## What already exists (so we mostly compose, not build)
- **`PhotoGallery.astro`** — single big image, or a swipeable/crossfade
  slideshow for multiple. Vanilla JS, multiple instances per page. This is the
  detail-panel gallery, as-is.
- **`getYouthPrograms` (`src/lib/youth-programs.ts`)** — reads a Wix **Media
  Gallery** field into `galleryUrls[]`, resolves a flyer (embed / pdf / image),
  derives a slug. A `PastEvents` lib is a near-clone of this.
- **`/events` `?sub=` filter** — precedent for selecting a subset via the URL.

So the genuinely new parts are: a CMS collection, a `past-events.ts` lib, and a
master-detail wrapper that swaps panels client-side.

## Design

### CMS — new collection `PastEvents` (recommended over extending `Flyers`)
`Flyers` is "one document per row" and the events page actively *expires* rows
via `removeAfter`. A past event is a different object — it happened, and it owns
a set of photos. Overloading `Flyers` with an `isPast` flag + a gallery muddies
the editor's mental model. A dedicated collection keeps editing obvious and
mirrors the proven `YouthPrograms` shape.

| Field | Type | Notes |
|---|---|---|
| `title` | Text | Event name — this is the clickable label in the side list. |
| `eventDate` | Date (opt) | For sort + an optional "Nov 2025" caption. |
| `gallery` | Media Gallery | Event photos. Drives `PhotoGallery` in the panel. |
| `flyerEmbedUrl` | Text (opt) | Canva "Publish to Web" iframe src. |
| `flyerPdfUrl` | Text (opt) | Direct public PDF URL. |
| `flyerImage` | Image (opt) | Static flyer image. Checked image → embed → pdf. |
| `blurb` | Rich Text (opt) | Short description shown above/with the gallery. |
| `sortOrder` | Number | Manual order; falls back to `eventDate` desc. |
| `active` | Boolean | Show/hide without deleting. |

Field names mirror `YouthPrograms` deliberately so the lib and the editor
instructions read the same. **This is a CMS schema change → CONTRIBUTING.md
must be updated in the same PR** (per AGENTS.md).

### Data layer — `src/lib/past-events.ts`
Clone `youth-programs.ts`: `getPastEvents(): Promise<PastEvent[]>`, reusing its
`galleryItemUrl` / `resolveImage` media handling and `slugify(title)` for the
anchor/deep-link id. Sort by `sortOrder` then `eventDate` desc.

### Component — `EventArchive.astro` (master-detail)
- **Side list**: each `PastEvent.title` as a button, keyed by slug. The first is
  active by default.
- **Main panel**: the active event's `blurb` + `<PhotoGallery images={galleryUrls}>`
  + its flyer (reusing the events grid's image→embed→pdf fallback).
- **Interaction**: pure vanilla JS toggles `is-active` on click — no reload, no
  carousel lib (libs don't resolve in the Wix build — see #012). Deep-linkable
  via `#slug` so a specific event can be linked/shared, consistent with the
  `?sub=` precedent.
- **Responsive (required, see team memory):** side list sits left on desktop; on
  mobile it collapses to a horizontal scroll-chip row or a `<select>` above the
  panel. Mobile-first from the start, not retrofitted.
- **RTL/bilingual:** event titles may be Hebrew. Side list + panel must lay out
  correctly RTL — flagged here because RTL is a must-log dimension.
- **Empty state:** zero rows → render nothing (events page stays clean), same as
  the upcoming grid's empty handling.

### Placement
A **"Past Events"** section on `/events`, below the upcoming grid. If the
archive grows long, revisit a dedicated `/events/past` route (not now).

### Torah content (future, not this entry)
The same `EventArchive` master-detail can back a future Torah library, but Torah
sheets are *documents grouped by parsha/category* (closer to the Denver
tag-filter model) than photo galleries. Plan: reuse the component, separate
collection (`TorahSheets`), its own design-log entry when we build it. Out of
scope here.

## Open questions (for the client / Danielle)
1. **Sort**: newest-first by `eventDate`, or fully manual via `sortOrder`?
   (Plan assumes `sortOrder` first, then `eventDate` desc as fallback.)
2. **Flyer + photos together**: show the flyer *inside* the gallery as one more
   slide, or as a separate pinned panel beside the photos? (Plan: separate, so
   the flyer is always visible while browsing photos.)
3. **Mobile side-list**: scroll-chips vs. dropdown `<select>`? (Plan leans
   scroll-chips, matching the existing `?sub=` filter chips on this page.)
4. Dedicated `/events/past` route now, or inline section first? (Plan: inline.)

## Implementation plan (once approved)
1. Create `PastEvents` CMS collection (Wix) with the fields above; document it in
   `CONTRIBUTING.md`.
2. `src/lib/past-events.ts` — clone of `youth-programs.ts`.
3. `src/components/EventArchive.astro` — master-detail, reusing `PhotoGallery`.
4. Wire a "Past Events" section into `src/pages/events.astro`.
5. Verify: renders with empty CMS (section hidden), with one event (no side list
   needed / single item), with several (side list + deep-link), and RTL.
6. Append Implementation Results + commit SHAs; trim this entry once shipped.
