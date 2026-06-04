# 017 — Split Programming into Events + Youth pages

**Status:** implemented
**Date:** 2026-06-04
**Author:** claude-session (danielle directing)
**Related:** #010 (Flyers CMS collection), #012 (Learn page + CoverflowCarousel), #007 (team taxonomy), #016 (bold visual refresh + LightRays)

## Background

The nav and homepage CTAs pointed to a `/programming` route that was never
built. The content splits cleanly into two audiences: the whole community
(Upcoming Events) and parents/teens (Youth Programming). The `Flyers` collection
(#010) already separates `events` from `youth`.

Youth Programming is **program-centric**: the page is a stack of programs (Dor
L'Dor, Matmidim Chaburos, Teen Learning…). Each program always has a description
and a contact rabbi, and *optionally* a photo and/or a flyer. This is richer than
a flat flyer grid, so it gets its own CMS collection rather than overloading
`Flyers` or `TeamMembers`.

## Problem

- `/programming` 404s (referenced in nav, footer, hero + JoinUs CTAs, and two
  CMS fields: `heroSecondaryCtaHref`, `joinUsCard3Href`).
- Youth programming needs editable per-program content — info, optional flyer,
  optional photos, and a contact rabbi — that the office maintains without code.

## Questions and Answers

- **Q:** One `/programming` page, two separate pages, or a hub + sub-pages?
  **A:** Two separate pages — `/events` and `/youth`. Nav "Programming" splits
  into "Events" and "Youth". The two audiences barely overlap; a hub adds a route
  layer the content doesn't justify.

- **Q:** Where does youth content live — a new collection, reuse `TeamMembers`,
  or reuse `Flyers`?
  **A:** A new **`YouthPrograms`** collection. The page is organized by *program*,
  and a program is a distinct shape: title + description + optional flyer +
  optional photo + a contact rabbi. Overloading `TeamMembers.role` (the earlier
  interim idea) made the *rabbi* the primary entity; the program is. Overloading
  `Flyers` can't hold a description or contact. So: dedicated collection.

- **Q:** How is the contact rabbi linked — a reference to `TeamMembers`, or
  plain fields on the program?
  **A:** Plain `contactName` + `contactEmail` text fields on the program row. A
  reference field adds `.include()` query complexity and a dashboard lookup step
  for the office (same reasoning as #010 rejecting a reference for `category`).
  The small cost is that a rabbi who is *also* in `TeamMembers` is named in two
  places — acceptable, since the youth page only needs name + email, not a full
  bio.

- **Q:** Do the youth rabbis still appear on `/team`?
  **A:** Independently, yes — `youth` is a real `RoleGroup` in `TeamMembers`
  (renders a "Youth Programming" section on `/team` when populated). That is
  decoupled from `/youth`, which is driven entirely by `YouthPrograms`. A rabbi
  can be a `TeamMembers` row (for the directory) and a program's contact (for the
  youth page); the two don't share a record.

- **Q:** What contact info is exposed publicly per program?
  **A:** Email link + a generic "Contact" button (to `/contact`). No public phone
  or WhatsApp — a privacy call the office didn't opt into.

- **Q:** Layout — uniform card grid or stacked sections?
  **A:** Stacked, alternating sections (image side flips per row, warm-mist band
  alternates with white), in the bold direction from #016. A program with a photo
  shows it with a `LightRays` sunburst behind it; a flyer renders in a 3:4 frame
  in the same visual column; a program with neither collapses to a centered
  single-column band. This makes each program read as its own "moment," not a
  tile.

- **Q:** Where do the kids/teens images come from, and how many per program?
  **A:** A per-program `gallery` field (Wix Media Gallery) — the office adds as
  many photos as they want to a program. The first is featured (sunburst behind
  it); the rest render as a scattered grid in that program's section. This also
  satisfies the earlier "scattered images of kids/teens" wish without a separate
  decorative-assets step. Started as a single `image` IMAGE field, swapped to
  `MEDIA_GALLERY` so a program isn't capped at one photo. The Media Gallery data
  type is documented as URL strings but the CMS often stores objects
  (`{ src, type }`); `youth-programs.ts` normalizes both and skips non-image
  (video) entries.

- **Q:** How is `/programming` handled, and how do we avoid dead links?
  **A:** `/programming` redirects (308) to `/events`. Separately, **every in-code
  reference to `/programming` is re-pointed to a real page** (nav/footer split to
  `/events` + `/youth`; Hero + JoinUs defaults → `/events`). The redirect only
  catches the two CMS-driven CTA hrefs and external bookmarks — code never relies
  on it to mask a dead link.

- **Q:** How do users find youth content from the events page?
  **A:** `/events` carries a prominent callout linking to `/youth`, so the split
  doesn't bury youth content from someone who lands on Events first.

## Design

**Routes:**
- `/events` → `src/pages/events.astro` — same shape as `/learn`: `getFlyers("events")` →
  `CoverflowCarousel` + sub-category filter pills + grid, plus a youth callout band.
- `/youth` → `src/pages/youth.astro` — stacked program sections from
  `getYouthPrograms()`. Empty CMS → friendly "coming soon".
- `/programming` → `src/pages/programming.astro` — `Astro.redirect("/events", 308)`.

**New collection `YouthPrograms`** (service module `src/lib/youth-programs.ts`,
`getYouthPrograms()`, "Anyone can read"):

| Field | Wix type | Notes |
|---|---|---|
| `title` | TEXT | Program name (e.g. "Dor L'Dor", "Matmidim Chaburos") |
| `description` | RICH TEXT | Program info; rendered as plain text (paragraphs preserved) |
| `gallery` | MEDIA_GALLERY | Optional program/kids photos. First image is featured (sunburst behind it); the rest render as a scattered grid. |
| `flyerEmbedUrl` | TEXT | Optional Canva "Publish to Web" iframe src |
| `flyerPdfUrl` | TEXT | Optional direct PDF URL |
| `flyerImage` | IMAGE | Optional static flyer image |
| `contactName` | TEXT | Contact rabbi name |
| `contactEmail` | TEXT | Contact rabbi email (mailto) |
| `sortOrder` | NUMBER | Section order, lower first |
| `active` | BOOLEAN | Show/hide without deleting |

**Taxonomy (`src/lib/team.ts`):** `youth` added to the `RoleGroup` union,
`ROLE_GROUPS` (label "Youth Programming"), `ROLE_GROUP_ALIASES`, and the
`groupByRole` record — so youth rabbis can appear on `/team`. This is separate
from `YouthPrograms`.

**Nav/Footer:** "Programming" replaced by "Events" (`/events`) and "Youth"
(`/youth`). Hero + JoinUs code defaults re-pointed to `/events`.

## Trade-offs

- **Contact rabbi duplicated.** A rabbi in `TeamMembers` and named on a program
  is entered in both. Chose this over reference-field complexity.
- **CMS CTA hrefs still say `/programming`.** They redirect, so nothing breaks,
  but "Our Programs" lands on Events only. The office can re-point
  `heroSecondaryCtaHref` / `joinUsCard3Href` when convenient.
- **Photos are per-program only.** The `gallery` field gives each program any
  number of photos (featured + scattered grid). There's no page-wide decorative
  imagery independent of a program; if that's ever wanted, add assets to
  `/public/youth/` and place them in code.
- **Two flyer homes.** Event flyers live in `Flyers` (category `events`); youth
  program flyers live on the `YouthPrograms` row. The `Flyers` `youth` category is
  no longer rendered by `/youth` — kept in the schema but effectively unused for
  this page. Documented in CONTRIBUTING.md.

## Verification

`/events` and `/youth` render with empty CMS (carousel hidden / "coming soon")
and with populated CMS. A `YouthPrograms` row with no photo/flyer collapses to a
centered text band; with a photo it shows the sunburst-backed image; with a flyer
it shows the framed embed. Contact block hides when both name and email are
empty. The youth callout on `/events` links to `/youth`. `/programming`
308-redirects to `/events`. No in-code link points at `/programming`. `/team`
shows a "Youth Programming" section once youth rabbis are added there. Editor
workflow per CONTRIBUTING.md holds.
</content>
