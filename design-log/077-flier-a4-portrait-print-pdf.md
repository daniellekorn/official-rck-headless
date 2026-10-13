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

## Addendum — Rosh Chodesh, labels, margins (2026-10-07)

Both fliers (screen and A4) were reworked after the first A4 version:

- **Rosh Chodesh gets its own labelled row inside the Shacharis card.** The old
  wide flier stacked a second Shacharis block under "Rosh Chodesh (Sun & Mon)"
  and overflowed into the footer on every Rosh Chodesh week (12 of the next 60).
  Now the Rosh Chodesh days (navy "Rosh Chodesh" under the gold days) lead when
  they open the week (Sun/Mon) and follow the regular days otherwise. The
  regular row's label drops the Rosh Chodesh days instead of overlapping them.
- **Day labels never take more than two lines.** Runs of 3+ consecutive days
  collapse to a range ("Sun – Wed & Fri"); the "&" is glued to the last day so
  it never ends a line.
- **A4 only: the two Shacharis rows on a Rosh Chodesh week are width-matched.**
  `alignRowWidths()` (run in the page by `render.mjs`) spreads a sub-pixel
  letter-spacing so 07:00 08:05 and 07:00 08:15 share left and right edges.
- **Header reads "Week of …"** on both fliers ("Weekday Minyanim" dropped), at a
  larger size; page margins were cut (wide 60/64 → 36/40 px, A4 32/40 → 22/24 px)
  so times and day labels could grow.
- **A4 time sizing:** 80 px on plain weeks; a third Mincha time drops to its own
  line rather than shrinking the row. Selichos/fast weeks use compact cards.

Checked against the 60 weeks from 2026-10-04 (every Rosh Chodesh, Selichos and
fast week in that span): all fit one A4 page and the wide flier clears the
footer. `render.mjs` still refuses to write the A4 PDF if a week overflows.

## Addendum — Downstairs marker, larger screen layout, fitted A4 times (2026-10-13)

- **Downstairs rule.** The second Mincha (when it starts before 18:00) and the
  early Maariv (when it starts before 18:00) are held downstairs, so both
  fliers mark them. In the next 64 weeks that is 30 weeks for Mincha, and every
  week with an early Maariv (23) also has an early Mincha. A three-time Mincha
  (the fixed 18:00 minyan present) is never marked: its second time is 18:00.
  The rule lives in the two builders, keyed on the printed times, not in
  `zmanim-schedule.ts` — if the rule changes (a different cut-off, a third
  downstairs minyan), change both `dsIndex()` in `a4-html.mjs` and `isDown` in
  `flier-html.mjs`.
- **Wide flier:** a navy down-arrow and gold staircase beside the time, no words
  (the screen is read from a distance and the words did not fit beside the time).
  The icon is sized at 0.92 × the time's font size (it was 0.44 and read too small
  on a TV); Dec 20 (fast day, four columns) is the tightest fit, about 24 px from
  the card edge.
- **A4 flier:** the words "Down Stairs" and a gold staircase (no arrow) hang
  under the time, right-aligned, so every time keeps the same right edge. The
  marker is positioned under the time rather than in the flow so the pair of
  times stays centred on the "Mincha" title; Rosh Chodesh weeks (shorter cards)
  use a smaller marker and tighter gap.
- **Wide flier enlarged:** page margins 36/40 → 18/20 px, footer shortened (QR
  128 → 96 px, text smaller) and every time, label and heading scaled up; plain
  weeks' times went 124 → 150 px.
- **A4 times are fitted on crowded weeks.** Weeks with Selichos, a fast or both
  used a fixed 50 px and left a gap above the footer. `fitTimes()` now raises the
  time size one pixel at a time (50 up to 100) until the next step would
  overflow, so those weeks fill the page (Dec 20: 76 px; a three-Mincha fast
  week stays near 57 px because that row fills its card's width).
- **Safety check is stricter.** `a4Overflows()` now also rejects content that
  pokes out the bottom of a card (the Down Stairs marker did) or past a card's
  side padding (a three-time Mincha row did). `render.mjs` still writes no A4
  files on failure. The wide flier has no equivalent guard — a possible
  follow-up, since its Rosh Chodesh overflow (see the addendum above) went
  unnoticed for weeks.
- The page helpers run in the browser as one injected script
  (`A4_PAGE_SCRIPT`), because Playwright serialises each function separately and
  they call each other.

Verified by rendering 64 weeks (2026-09-06 through 2027-11-21, every Rosh
Chodesh, Selichos, fast and downstairs week) through `render.mjs`: no failures,
all four files written each week.

## Implementation Results

Verified against weeks of Sept 6, 13, 20, 27 and Oct 4 2026 (plain, Selichos,
Selichos + Tzom Gedaliah): all fit one A4 page. Output also lands in the
GitHub workflow artifact (it uploads `automation/out/*`).
