# 067 — Selichos times computed from Shacharis, not hand-entered

**Status:** implemented
**Date:** 2026-09-06
**Author:** claude-session (Yosef directing)
**Related:** [#040](040-computed-davening-times.md)

## Background

#040 computes weekday Shacharis/Mincha/Maariv from zmanim and left Selichos
as a `DaveningTimes` CMS "extra" (`service = Selichos`, `dayType = Weekday`),
hand-typed by the office each Elul.

## Problem

Yosef asked for Selichos times to be computed automatically: always 20
minutes before each Shacharis minyan, except erev Rosh Hashana (40 minutes
before) and erev Yom Kippur (only 15 minutes before).

## Questions and Answers

- **Q:** When does the "before Shacharis" Selichos schedule start — the
  Sunday right after Leil Selichos (Motzei Shabbos), or later?
  **A:** The *second* weekday morning after Leil Selichos, i.e. the Monday —
  the Sunday morning's Selichos is a special late-night one, not the regular
  before-Shacharis slot. (Yosef, Sept 2026 — this is today's own week: Leil
  Selichos was Motzei Shabbos Sep 5; Selichos-before-Shacharis rows should
  start appearing Mon Sep 7, not Sun Sep 6.)
- **Q:** How to compute "Leil Selichos" without a full holiday-calendar scan?
  **A:** Reproduced `@hebcal/core`'s own internal rule —
  `HDate.dayOnOrBefore(Saturday, (1 Tishrei).abs() − 4)` — using this file's
  existing TZ-safe civil-date arithmetic rather than `HDate.greg()`, which
  resolves through the *runtime's* local timezone (unsafe: Wix's serverless
  TZ isn't ours to control, see #040).
- **Q:** What about Rosh Hashana itself, and the days after it (Aseres Yemei
  Teshuva)?
  **A:** No Selichos row on Rosh Hashana's two days (Yom Tov). The regular
  20-minutes-before rule resumes automatically on the weekdays between Rosh
  Hashana and Yom Kippur — no special case needed, since the season window is
  just "Monday-after-Leil-Selichos through Erev Yom Kippur, minus the two RH
  days."

## Design

`src/lib/zmanim-schedule.ts`:

- `selichosWindowForYear()` / `selichosWindows()` compute, for a given
  Hebrew year's Rosh Hashana, the season's `seasonStart` (Monday after Leil
  Selichos), `erevRoshHashana`, `roshHashana1`/`2`, and `erevYomKippur`. Both
  the current and next Hebrew year are checked per call (cheap, avoids
  picking the wrong candidate right at the Rosh Hashana boundary).
- `selichosInfoFor(day, windows)` classifies one civil day: `null` outside
  the season or on Rosh Hashana itself, `{ offset: 20 }` on a regular
  in-season weekday, or `{ offset: 40 | 15, label }` on erev Rosh Hashana /
  erev Yom Kippur.
- `getComputedWeekdaySchedule()` walks the displayed week's Sun–Fri days
  (mirroring the existing Rosh Chodesh scan), buckets the "regular" in-season
  days into one dynamically-labeled row (`formatDaySpec()`, e.g. `Mon – Fri`
  the first partial week, `Sun – Fri` most weeks) at Shacharis − 20, and adds
  a separate one-off row for erev Rosh Hashana / erev Yom Kippur when either
  falls in that week.
- `src/lib/davening.ts`'s `SERVICE_ORDER` now lists `Selichos` **before**
  `Shacharis` (davening order), not after Maariv.

**Assumption:** no in-season day is ever also Rosh Chodesh — the only Rosh
Chodesh anywhere near the season is Rosh Chodesh Tishrei, which *is* Rosh
Hashana and is already excluded. Not defensively handled if that assumption
is ever wrong (it can't be, within one Hebrew year's Tishrei).

**Content-vs-code boundary:** `DaveningTimes`'s `Selichos` extra-row escape
hatch is no longer needed for the normal season — CONTRIBUTING.md updated.
Any active legacy Selichos CMS row for the current season must be
deactivated by the office or it renders twice, same caveat as #040's legacy
Shacharis/Mincha/Maariv rows.

## Verification

`node -e` against `getComputedWeekdaySchedule()` for five 2026 weeks (Aug 30,
Sep 6, Sep 13, Sep 20, Sep 27) matched the hand-derived expectation exactly:
no Selichos before the season, `Mon – Thu` + `Erev Rosh Hashana (Fri)` the
first week (Sunday correctly excluded), `Mon – Fri` through Aseres Yemei
Teshuva, `Erev Yom Kippur (Sun)` alone the last week (Monday's Yom Kippur and
the days after correctly show nothing), and no rows the week after Yom
Kippur. `npx tsc --noEmit` and `npm run check:design-log` both clean.
