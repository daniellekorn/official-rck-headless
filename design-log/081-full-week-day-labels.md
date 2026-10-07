# 081 — Weekday minyan labels always show the full week

**Status:** implemented
**Date:** 2026-10-07
**Author:** claude-session (Yosef directing)
**Related:** [#074](074-past-days-drop-from-label-no-fixed-mincha-yk-sukkos.md), [#070](070-computed-schedule-yom-tov-exclusion.md)

## Problem

#074 dropped days already behind us from the Shacharis and Mincha/Maariv
day-range labels. So on a Wednesday `/daven` read "Wed – Fri" for Shacharis
and "Wed – Thu" for Mincha/Maariv instead of "Sun – Fri" / "Sun – Thu".
Yosef asked why, and said he wants the full label every week.

## Decision

The labels are the full in-session day list again: `formatDaySpec(shacharisDays)`
and `formatDaySpec(minchaMaarivDays)`. The `isPastDay`/`labelDays` helpers
are removed.

Not changed:
- Yom Tov days are still left out of the labels and the times (#070).
- The rest of #074 stays: no fixed 6:00 pm Mincha between Yom Kippur and Sukkos.
- Past one-off Selichos rows (erev RH / erev YK) are still skipped.
- The weekly flier always renders next week, so its labels were already full.

## Verification

`getComputedWeekdaySchedule` for Wed 2026-10-07 and Fri 2026-10-09 15:00
gives Shacharis "Sun – Fri" and Mincha/Maariv "Sun – Thu" with the same times
as before.
