# 077 — Weekly flier also produces an A4 portrait PDF

**Status:** implemented
**Date:** 2026-10-03
**Author:** claude-session
**Related:** #069, #073, #075, #076

## Background

The weekly flier ([#069](069-flier-monday-next-week-taanis-date.md)) is a
1920×1080 landscape design for the television screen. For printing, the office
wanted an A4 portrait sheet with the same times.

## Design

- A second builder, `automation/a4-html.mjs`, lays the same rows out for a
  794×1123 px page: header photo + logo, Shacharis / Mincha / Maariv as stacked
  full-width cards, Selichos in gold under Shacharis, a gold-tint card per fast
  day, footer with the QR code. Palette and self-hosted fonts match
  `flier-html.mjs`.
- `render.mjs` builds both from the same `getComputedWeekdaySchedule()` call,
  so the A4 sheet can never disagree with the screen flier or `/daven`. It
  writes `RCK-DaveningTimes_A4_<sunday>.pdf` and `.jpg` next to the existing JPG and PDF.
- Plain weeks (no Selichos, no fast) stretch the cards to fill the page with
  larger times; busy weeks use compact cards. If a week still overflows the
  page, `render.mjs` exits non-zero and writes no A4 PDF instead of shipping a
  clipped sheet.
- `weekly-flier.sh` now copies that week's four files by exact name
  (`<sunday>` is the same date it already computes, see
  [#076](076-flier-probe-date-lands-on-sunday.md)) rather than "newest of each
  extension", which would have picked the wrong PDF once there were two.

## Alternatives considered

- **One responsive design for both formats.** Rejected: the screen layout is
  tuned in columns for 16:9 (see #075); stretching it to portrait would mean
  rebuilding it either way, and the screen version should not be disturbed.

## Addendum — A4 JPG

The office also wanted the A4 sheet as a JPG (for sharing as an image), so
`render.mjs` writes `RCK-DaveningTimes_A4_<sunday>.jpg` (1588×2246) from the
same page, and `weekly-flier.sh` copies it too.

## Implementation Results

Verified against weeks of Sept 6, 13, 20, 27 and Oct 4 2026 (plain, Selichos,
Selichos + Tzom Gedaliah): all fit one A4 page. Output also lands in the
GitHub workflow artifact (it uploads `automation/out/*`).
