# 068 — Fast-day (Taanis) start/end times computed from zmanim

**Status:** implemented
**Date:** 2026-09-06
**Author:** claude-session (Yosef directing)
**Related:** [#040](040-computed-davening-times.md), [#067](067-computed-selichos-times.md)

## Background

#040/#041 compute weekday and Shabbos davening times from zmanim instead of a
hand-typed `DaveningTimes` CMS row; #067 did the same for Selichos. Fast-day
(Taanis) times — Tzom Gedaliah, Asara B'Tevet, Ta'anit Esther, 17 Tammuz
(Tzom Tammuz), and Tisha B'Av — were the last seasonal davening gap #040
explicitly left as "not computed, still a CMS extra."

## Problem

Yosef asked for these five fasts' start and end times to show on `/daven` and
on the weekly zmanim flyer, computed (not hand-entered), and derived from
Hebcal's own fast-day detection so it keeps working without maintenance as
years change.

## Questions and Answers

- **Q:** What's the start-time rule?
  **A:** Four of the five (Tzom Gedaliah, Asara B'Tevet, Ta'anit Esther, 17
  Tammuz) start at *alot hashachar*, sun 16.1° below the horizon — confirmed
  against the printed luach to within 1 minute across all four; a flat 72- or
  90-minute offset before sunrise was off by 4–14 minutes, so neither of
  those substitutes for the real angle. Tisha B'Av starts at plain sunset the
  evening before (Erev Tisha B'Av), no offset.
- **Q:** What's the end-time rule?
  **A:** All five, no exceptions including Tisha B'Av: sunset + 19 minutes on
  the day the fast ends. Confirmed to zero minutes of error across all five.
  This is a different constant from `TZEIS_ANGLE` (8.5°, ~37 min) used for
  Shabbos motzash — the two are not interchangeable, fasts end earlier.
- **Q:** How to detect which day is which fast without hardcoding dates?
  **A:** `getHolidaysOnDate()` on each candidate civil day (via this file's
  own TZ-safe `anchor()`, matching #067's precedent of never trusting
  `Event.getDate().greg()` on a server not necessarily set to
  Asia/Jerusalem), filtered to the five fasts' own `Event.getDesc()` strings.
  `MINOR_FAST`/`MAJOR_FAST` flags alone aren't enough — they also match
  Ta'anit Bechorot (firstborns only) and Yom Kippur, which this page must not
  show as a "fast."
- **Q:** Does a deferred fast (9 Av falling on Shabbat, pushed to Sunday)
  change the description Hebcal returns?
  **A:** Yes, for Tisha B'Av only — Hebcal returns `"Tish'a B'Av (observed)"`
  instead of the plain desc. Verified against 200 years of Hebcal's own
  output that Tzom Gedaliah/Tzom Tammuz keep their plain desc even when
  deferred to Sunday, so only Tisha B'Av needed the second lookup key.
- **Q:** Which week(s) does a fast appear on, when start and end land in
  different weeks?
  **A:** Both. Most fasts start and end the same civil day, so they usually
  touch one week. Tisha B'Av starts the evening before and ends the following
  night; if 9 Av is deferred to Sunday, Erev falls on Saturday (the prior
  week) and the fast ends Sunday night (the next week) — both weeks' pages
  and flyers must show it, not just one.
- **Q:** Where does it render on `/daven` relative to the other services?
  **A:** As its own row above Shacharis — the same position Selichos takes
  when in season (Yosef's direction) — not a separate page section.

## Design

`src/lib/zmanim-schedule.ts`:

- `TAANIS_END_AFTER_SHKIYA = 19` and `TAANIS_DISPLAY_NAME` (Hebcal desc →
  display name, including the `(observed)` Tisha B'Av variant).
- `taanisOnDay(day)` returns the matching Hebcal desc for one civil day, or
  `null`.
- `getComputedTaanisRows(sunday)` scans `sunday` through `sunday + 7`
  (enough to catch every start/end day that can land in the displayed
  Sun–Sat week) and returns a `ComputedTaanisRow[]` — `name`, `startTime`,
  `startDayLabel`, `endTime`, `endDayLabel` — computed via `Zmanim` on the
  fast's own date (`alotHaShachar()`/`sunset()` for start,
  `sunsetOffset(19, true)` for end, the same style as the existing Shabbos
  candle-lighting offset math).
- `getComputedWeekdaySchedule()`'s return now includes `taanis:
  ComputedTaanisRow[]`, computed from the same `sunday` it already derives —
  so the flyer script (`automation/render.mjs`), which already imports this
  one function for its `rows`, gets the fast data from the same call and can
  never drift from what `/daven` shows.
- `src/pages/daven.astro` unshifts a synthetic `{ service: "Taanis", ... }`
  entry onto its weekday display list (ahead of Selichos/Shacharis) only
  when `computed.taanis.length > 0` — reusing the page's existing
  service/daySpec/time/notes rendering verbatim, no template changes. Empty
  weeks render exactly as before.

`automation/flier-html.mjs` (confirmed with Yosef before building): the
Shacharis card's `card()` now takes `{ prefix, overrideBody }` instead of a
single `override` string — `prefix` renders above the card's body
unconditionally (the fast banner's spot), `overrideBody` replaces the body
only (the existing Selichos+Shacharis paired grid). `taanisBlock()` renders a
gold-bordered box (fast name + "Begins … · Ends …") from the same `taanis`
array `render.mjs` already destructures off `getComputedWeekdaySchedule()`
and passes into `buildFlierHtml()` — one call, same data, page and flyer
cannot drift apart. Empty `taanis` renders `""`, so a normal week's flyer is
byte-for-byte what it was before this entry.

## Trade-offs

The Taanis row is page-presentation-only (not folded into the CMS-facing
`ComputedDaveningRow.service` union or `davening.ts`'s `SERVICE_ORDER`) since
it's never CMS-driven and the two fields it needs (start *and* end) don't fit
that flat one-time-per-row shape without encoding both into `daySpec`/`notes`
strings.

## Verification

Checked `getComputedWeekdaySchedule()` against all five fasts across
2026–2027 (dawn/sunset/end times matched the luach's expected ranges) and
against a deferred-Tisha-B'Av year (2029, 9 Av on Shabbat) confirming the
fast appears on both the week ending Saturday and the week starting the
following Sunday, each with the correct half of the info. Rendered the
actual flyer (`node automation/render.mjs <date>`) for Tzom Gedaliah (which
overlaps regular-season Selichos), Asara B'Tevet, Tisha B'Av, and a
no-fast week, and inspected each JPG: the banner sits cleanly above the
Selichos/Shacharis content with no overflow, and the no-fast week is
pixel-identical to before. `npx tsc --noEmit` and `npm run check:design-log`
both clean.
