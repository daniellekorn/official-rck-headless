# 070 — Weekday schedule excludes Yom Tov days

**Status:** implemented
**Date:** 2026-09-07
**Author:** claude-session (Yosef directing)
**Related:** [#040](040-computed-davening-times.md), [#068](068-computed-taanis-times.md), [#069](069-flier-monday-next-week-taanis-date.md)

## Problem

`getComputedWeekdaySchedule()` always labeled Shacharis "Sun – Fri" and
Mincha/Maariv "Sun – Thu" and aggregated their times across all five/six of
those days unconditionally — even a day that's actually Yom Tov, when none
of the fixed weekday minyanim run at all (Yom Tov davening replaces them).
Yosef caught this on the flier for the week of Sep 13 2026: Rosh Hashana II
falls on that Sunday, so Shacharis/Mincha/Maariv should only show Mon–Fri /
Mon–Thu that week, not Sun–Fri / Sun–Thu. Same shared function backs
`/daven`, so the site had the identical inaccuracy.

## Decision

New `isChag(day)` in `zmanim-schedule.ts`: true for a day Ra'anana (Israel)
actually observes as Yom Tov. Implemented as `getHolidaysOnDate()` filtered
to events with the `CHAG` flag set and `CHUL_ONLY` (diaspora-only second
day) *not* set — verified against 2026–2027 that this yields exactly one day
per holiday (Rosh Hashana is the one exception, two days even in Israel):
Rosh Hashana I & II, Yom Kippur, Sukkot I, Shmini Atzeret/Simchat Torah
(combined in Israel onto one day), Pesach I & VII, Shavuot. Chol HaMoed
carries no `CHAG` flag at all, so it's correctly left as a regular weekday —
deliberately unaffected by this change.

`getComputedWeekdaySchedule()` now builds two day-index lists at the top —
`shacharisDays` (Sun–Fri, Shacharis's own extra day) and `minchaMaarivDays`
(Sun–Thu) — each filtered through `isChag`, and uses them everywhere a day
range previously was: the Mincha/Maariv zmanim aggregation loop, the Rosh
Chodesh scan (intersected with `shacharisDays` rather than rescanning
Sun–Fri), and every row's `daySpec` (via `formatDaySpec`, replacing the
hardcoded `"Sun – Fri"`/`"Sun – Thu"` strings). Selichos rows were already
correct — the season logic in #067 already excludes Rosh Hashana's own days
by construction — so `isChag` isn't wired into that path.

Fixing this in the shared function means `/daven` picks up the same
correction for free — same call, same data, can't drift from the flier (the
whole point of #040's original design).

## Verification

`npx tsc --noEmit` and `npm run check:design-log` both clean. Checked
`getComputedWeekdaySchedule()` output across the week of Sep 13 2026 (Rosh
Hashana II Sunday → Shacharis/Selichos "Mon – Fri", Mincha/Maariv
"Mon – Thu"), the Erev Yom Kippur week (Yom Kippur Monday excluded →
"Sun, Tue – Fri"), a Pesach week (Pesach VII Wednesday excluded → "Sun – Tue,
Thu – Fri"), a Sukkot week and a Shavuot-adjacent week (both unaffected,
confirming Chol HaMoed and a holiday landing on Shabbat correctly change
nothing), and several ordinary weeks (byte-for-byte "Sun – Fri"/"Sun – Thu"
as before). Rendered the actual flier for the Sep 13 week and inspected it
visually.
