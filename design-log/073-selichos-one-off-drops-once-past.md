# 073 — Erev Rosh Hashana / Erev Yom Kippur Selichos drops off once that day is past

**Status:** implemented
**Date:** 2026-09-21
**Author:** claude-session (Yosef directing)
**Related:** [#067](067-computed-selichos-times.md), [#071](071-selichos-offset-by-period.md), [#072](072-selichos-25-minutes-shacharis-dayspec.md)

## Problem

Monday, September 21, 2026 is Yom Kippur itself. The week of September 20
(Sun–Thu) had its one Selichos day on Sunday the 20th, Erev Yom Kippur — a
one-off bucket (`selichosInfoFor`'s `label` case), not a recurring in-season
range. That day already happened, but `/daven` and the flier both kept
showing "Selichos · Erev Yom Kippur (Sun)" for the rest of the week, since
`getComputedWeekdaySchedule()` builds every row for the whole Sun–Thu week
regardless of which of those days `now` has already reached.

That's fine for the regular recurring rows (Shacharis "Sun, Tue – Fri" is
still accurate to read on a Wednesday), but a one-off exception day is
different: once it's past, it never recurs later in the same week, so
showing it is just stale information — confirmed with Yosef, who asked for
it removed the morning of Yom Kippur itself, once Erev Yom Kippur's Selichos
was firmly behind the week.

## Decision

In the Selichos bucket loop in `getComputedWeekdaySchedule()`
(`src/lib/zmanim-schedule.ts`), skip a labeled one-off bucket (Erev Rosh
Hashana / Erev Yom Kippur) once its day is before `today` (the civil date of
`now`). The regular in-season buckets (the unlabeled, multi-day case) are
untouched — those still show the full day-range even mid-week, same as
Shacharis/Mincha/Maariv always have.

Same-day is still shown (the row shows the morning of, before that morning's
Selichos necessarily happened yet) — only the day *after* drops it. Verified
across three points in the same week: the day before Erev Yom Kippur (in the
regular Aseres Yemei Teshuva bucket, unaffected), Erev Yom Kippur itself
(shows the labeled row), and the day after (row gone, week otherwise
unchanged).

Because `/daven` and the flier both read this same function, this corrected
both outputs the moment it landed — no separate flier-side change needed.

## Verification

```
as of 2026-09-18 (week of Sep 13): Selichos Mon – Fri 6:35 AM / 7:50 AM
as of 2026-09-20 (week of Sep 20): Selichos Erev Yom Kippur (Sun) 6:45 AM / 8:00 AM
as of 2026-09-21 (week of Sep 20): no Selichos row
```

`npm run check:design-log` clean.
