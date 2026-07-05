# 040 — Weekday davening times computed from zmanim

**Status:** implemented
**Date:** 2026-07-05
**Author:** claude-session (danielle directing)
**Related:** [#003](003-davening-schedule-dayspec.md), [#008](008-davening-flat-layout.md), [#020](020-homepage-stale-cache.md)

## Problem

`/daven`'s weekday times were hand-typed text in the `DaveningTimes` CMS
collection — some literally read "Mincha Gedolah" or "10 minutes before
Shkiah" instead of a clock time. The real minyan times move with shkiya week
to week, so the site was permanently vaguer than the weekly flyer. #003
flagged "we don't compute zmanim" as the known gap.

## Decision

Weekday times move from content to **code**: `src/lib/zmanim-schedule.ts`
computes them per request (the site is SSR) using **`@hebcal/core`**.

**Why @hebcal/core** (over the Hebcal REST API or kosher-zmanim): it is the
library that powers Hebcal's own API — same numbers with zero network calls
per page view — and its `HDate` handles Rosh Chodesh detection. Verified
against the office's source of truth (myzmanim.com, location Raanana): with
elevation 0, sunset and "Earliest mincha" (= standard mincha gedolah) match
myzmanim's "level region at sea level" figures to within ~4 seconds, and
match Hebcal's hosted API to the second.

**The rules** (confirmed by the rav via Danielle, July 2026). Times are fixed
for a whole **Sun–Thu week**, aggregated from the week's most restrictive day,
then rounded down to the minute. The page rolls to the coming week on Shabbos:
Friday still shows the current week (a Friday Rosh Chodesh must display), and
by Motzei Shabbos the new week is up.

| Minyan | Rule |
| --- | --- |
| Shacharis (Sun–Fri) | 7:00 & 8:15, never change |
| Shacharis on Rosh Chodesh | 7:00 & 8:05, extra line naming the day(s) |
| Early Mincha (Sun–Thu) | latest mincha gedolah of the week, **never before 12:50** |
| 6:00 pm Mincha (Sun–Thu) | listed only while late mincha is after 6:10 pm |
| Late Mincha (Sun–Thu) | earliest shkiya of the week − 10 min |
| Maariv (Sun–Thu) | latest shkiya of the week + 18 min |
| 8:00 pm Maariv (Sun–Thu) | dropped once shkiya+18 reaches 8:00 pm (i.e. in summer) |
| 9:30 pm Maariv | Sunday & Wednesday only |

All wall-clock math runs in `Asia/Jerusalem` via `Intl` — output is identical
under UTC/New York/Jerusalem server timezones (Wix serverless TZ is not ours
to control).

**Content-vs-code boundary:** computed rows render first; any `active`
Weekday CMS rows still render after them, so the office keeps an escape hatch
for seasonal extras (Selichos) and special notes. The nine legacy weekday
rows must be deactivated **after** this ships (the live site reads them until
then).

## Consequences

- New dependency `@hebcal/core`; new module `src/lib/zmanim-schedule.ts`;
  `groupByService()` extracted in `src/lib/davening.ts`; `/daven` shows a
  "Week of …" caption so the office can eyeball it against the flyer.
- `scripts/verify-zmanim.mjs` (Node ≥22.18) prints any week's schedule plus
  the raw daily zmanim for line-by-line comparison with myzmanim — the first
  tool to reach for if a flyer ever disagrees with the site.
- **v1 limitations:** fast days, erev Yom Tov, chol hamoed, and Chanukah are
  *not* special-cased — the office covers those via CMS extra rows or the
  flyer. CMS rows can add lines but cannot remove computed ones.
- Rule changes (e.g. the 12:50 floor, the 6:10 cutoff) are one-line constant
  edits at the top of `zmanim-schedule.ts` — a code change, not a CMS edit.

## Verification

`scripts/verify-zmanim.mjs` checked five scenario weeks: summer (12:50 floor
off, 8 pm maariv dropped), deep winter (floor on, 6 pm mincha dropped, three
maarivs), spring (6 pm mincha live), a two-day Rosh Chodesh (Thu & Fri, Dec
2026), and the Israel DST-change week (Oct 2026). Today's live myzmanim page
matched to seconds. `npx astro check` clean; `/daven` on the dev server
renders computed rows followed by the legacy CMS rows.
