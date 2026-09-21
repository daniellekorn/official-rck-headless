# 074 — Past days drop from the day-spec label; no fixed 6pm Mincha between Yom Kippur and Sukkos

**Status:** implemented
**Date:** 2026-09-21
**Author:** claude-session (Yosef directing)
**Related:** [#040](040-computed-davening-times.md), [#067](067-computed-selichos-times.md), [#073](073-selichos-one-off-drops-once-past.md)

## Problem

Two corrections from Yosef reading the live week-of-September-20 output on
Monday, September 21 (Yom Kippur itself):

**1. The Shacharis/Mincha/Maariv day-spec kept naming already-passed days.**
`getComputedWeekdaySchedule()` builds one `daySpec` label per service for the
whole Sun–Thu(/Fri) week regardless of which days `now` has already reached
— correct for the *times* (one posted time must stay valid the whole week,
see #040), but the label itself doesn't need to keep advertising a day
that's over. Reading Monday's flier, the Sunday in "Sun, Tue – Fri" and
"Sun, Tue – Thu" was already a day behind. Same underlying idea as #073
(drop what's already past), extended from the one-off Selichos exception
rows to the regular recurring labels.

**2. The fixed 6:00pm Mincha doesn't exist between Yom Kippur and Sukkos.**
`FIXED_MINCHA` (6:00pm) is normally added whenever the sunset-anchored late
Mincha falls after `FIXED_MINCHA_CUTOFF` (6:10pm) — a purely time-based
rule. Yosef confirmed the shul doesn't run it at all during the interim
weekdays between Yom Kippur and Sukkos (11–14 Tishrei), independent of what
the sunset math says. The week of September 20 falls right in this gap
(Tue–Thu, Sept 22–24) and the 6:00pm row needed to disappear for both the
flier and `/daven`.

## Decision

**Past-day labels:** added `labelDays()` in `getComputedWeekdaySchedule()` —
filters a day-index list down to the days not yet behind `today`, falling
back to the *full* list if that would empty it out (e.g. Friday afternoon,
once every Sun–Thu Mincha/Maariv day this week is behind us — an empty
label would be worse than a stale one). Applied only to `shacharisDaySpec`
and `minchaMaarivDaySpec` — the underlying `shacharisDays`/`minchaMaarivDays`
lists that the actual posted times are aggregated from are untouched, so
already-published times never retroactively change mid-week.

**Yom-Kippur-to-Sukkos Mincha gap:** `SelichosWindow` (computed once per
Hebrew-year candidate from `tishrei1`, see #067) gained two fields,
`yomKippur` (10 Tishrei) and `sukkos1` (15 Tishrei) — cheap to add since
they derive from the same anchor already computed there. New
`isBetweenYomKippurAndSukkos(day, windows)` checks a day falls strictly
between them (both those days themselves are Chag, already excluded from
weekday davening by `isChag`). In `getComputedWeekdaySchedule`, if *any* of
the week's in-session `minchaMaarivDays` falls in that gap, the `FIXED_MINCHA`
push is skipped for the whole week regardless of the usual cutoff check —
consistent with the file's existing one-posted-time-for-the-whole-week
design.

`selichosWindows(sunday)` is now computed once near the top of the function
(previously built later, just before the Selichos bucket loop) since both
the Selichos buckets and the new gap check need it.

## Verification

```
as of 2026-09-18 (week of Sep 13, pre-Yom-Kippur): Mincha Mon–Thu 1:06/6:00/6:34 PM — 6pm unaffected
as of 2026-09-20 (week of Sep 20, Erev YK):        Shacharis "Sun, Tue – Fri"; Mincha "Sun, Tue – Thu" 1:04/6:00/6:24 PM
as of 2026-09-21 (Yom Kippur itself):               Shacharis "Tue – Fri"; Mincha "Tue – Thu" 1:04/6:24 PM (6pm gone)
as of 2026-09-24 (Thu, same week):                  Shacharis "Thu – Fri"; Mincha "Thu" 1:04/6:24 PM
as of 2026-09-25 (Fri, same week, all Mon–Thu Mincha days past): Mincha label falls back to "Sun, Tue – Thu" (not empty)
as of 2026-09-27 (week of Sep 27, past Sukkos):     Mincha "Sun – Thu" 1:01/6:00/6:15 PM — 6pm back
```

`npx tsc --noEmit` and `npm run check:design-log` clean. Re-rendered the
Sept 20 and Sept 27 fliers and read both JPGs.
