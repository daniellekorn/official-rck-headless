# 021 — Cream homepage bands, bright-yellow highlight, low-radius rule

**Status:** implemented
**Date:** 2026-06-24
**Author:** claude-session
**Related:** #004 (brand palette), #005 (typography), #006 (animated highlight), #016 (bold visual refresh), #019 (generic split-section field names)

## Background
A batch of art-direction adjustments on top of the bold refresh (#016). The
homepage had settled into a white ↔ navy ("blue") alternation: the two
SplitFeature bands are white, but Join Us and Who We Are/History were full navy,
so scrolling read dark → white → blue → white → blue. The client wanted the
calmer white ↔ cream rhythm already used on the Youth page, a brighter highlight
color, larger eyebrows, and a generally less-rounded UI.

## Decisions

### 1. Homepage bands → white/cream, not navy
Join Us (`JoinUs.astro`) and Who We Are (`WhoWeAre.astro` + `HistoryTimeline.astro`)
moved from `bg-navy-700` to `bg-mist` (the same warm off-white the Youth page
bands use). The hero stays dark. Page now reads: dark hero → white → cream →
white → cream → navy footer.

- **Gold cards kept as-is** (client's explicit choice): the Join Us gold gradient
  cards were *not* restyled, only the section chrome around them (navy canvas +
  diagonal texture removed; eyebrow `gold-300 → gold-600`, heading
  `white → navy-600`).
- **Timeline could not be kept literally "as-is."** Its text/chrome were
  white-on-navy and would be invisible on cream, so the timeline was recolored
  dark-on-light (titles `navy-700`, captions `navy-500`, year node + edge fades
  keyed to `mist`, spine to `navy-600/15`). The *layout* and motion are
  unchanged.
- `index.astro` pager themes for `#join` and `#history` flipped `dark → light`
  so the right-edge dots stay legible.
- **Extended to interior pages.** Daven's flyer band, and the Learn/Events
  gallery sections (`bg-navy-900 → bg-mist`, with cards/pills/captions recolored
  dark-on-light), now use the same white/cream scheme. The dark 3D
  `CoverflowCarousel` on Learn/Events was **kept dark** — it's the showpiece
  anchor of those pages, the same way the homepage hero stays dark.

### 2. Bright yellow is the highlight color
`Highlight.astro` default changed `#D6A21E` (gold-500) → `#f6ed49` (the existing
`--color-accent`). It now drives the animated sweep on the SplitFeature
headings (navy text over bright yellow = high contrast).

- **Bright yellow is not safe as text on light backgrounds** (near-invisible on
  white/cream), so it is *not* used for eyebrows/dividers on light sections —
  those stay gold. The "yellow" word in the blue-yellow-blue eyebrow (below) is
  rendered `gold-600`, not accent yellow, for legibility.
- **Hero "RCK"** is intentionally *not* highlighted. An earlier pass made it a
  solid-yellow tag; the client reverted it to plain white, dropped the "Welcome
  to" lead-in (so the headline is just "RCK"), and asked for the hero image's
  bottom gradient to be lightened (`via-black/40 to-black/80` →
  `via-black/25 to-black/55`). The bright-yellow highlight now lives only on the
  SplitFeature headings.

### 3. Eyebrows enlarged; Section 2 gains a third word
- Hero eyebrow bumped to match the hero subtitle size (`text-base sm:text-lg`,
  `!`-forced to beat the `eyebrow` utility's fixed `font-size`).
- SplitFeature section eyebrows: `text-sm md:text-base → text-base md:text-lg`.
- Join Us eyebrow bumped to match.
- **New CMS field `imageTextSection{1,2}EyebrowLead`** (see schema note): an
  optional leading word rendered navy *before* the gold word, so a section can
  read navy → gold → navy. Section 2 defaults its lead to "VIBRANT", giving
  VIBRANT · TORAH · VISION = blue · yellow · blue. Section 1 lead defaults empty
  (unchanged: UNIQUE · IMPACTFUL).

### 4. Low-radius rule (site-wide)
The hero CTAs use `rounded-sm` and the client wanted everything to match that
rectangular feel — the nav pill, buttons, the section-pager hover labels, etc.
**Rule going forward:** controls (buttons, pills, nav, labels, inputs, icon
tiles) → `rounded-sm`; larger surfaces (cards, images, map, menus) → `rounded-md`.
Don't reach for `rounded-full`/`-xl`/`-2xl`/`-3xl`. Applied as a sweep across
`src/` (including the pager CSS `9999px → 0.125rem`).

### 5. Misc
- Removed the literal `→` arrows from copy (`team.astro` "Read bio", `daven.astro`
  "Explore our learning opportunities") and the Join Us "Explore" CTA. **No
  text/glyph arrows in content.**
- Footer flattened: smaller logo/tagline, less vertical padding, the duplicate
  small subtext under the logo removed (kept the bold tagline only), and the
  square map replaced with a short full-width horizontal strip (`h-28`).

## Schema note
`imageTextSection1EyebrowLead` and `imageTextSection2EyebrowLead` added to the
`HomePage` collection (`src/lib/homepage.ts` interface + `CONTRIBUTING.md`
table). Both optional; empty falls back to the code defaults above, so the page
renders correctly whether or not the office adds the fields.

## Trade-offs
- Gold-on-cream Join Us cards lose the glow they had on navy (the client
  accepted this to avoid a card redesign). Revisit if they read flat.
- `rounded-sm` everywhere is a strong, sharp look; some big photos now have
  near-square corners by design.

## Verification
`astro check` passes (only the pre-existing `process` typing error in
`astro.config.mjs`, unrelated). Homepage renders the white/cream rhythm with the
gold cards intact; SplitFeature headings highlight in bright yellow; eyebrows are
larger and Section 2 reads VIBRANT · TORAH · VISION. Defaults keep everything
rendering with an empty CMS.
