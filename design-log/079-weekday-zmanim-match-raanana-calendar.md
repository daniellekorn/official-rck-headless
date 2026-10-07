# 079 — Weekday zmanim: match the Ra'anana calendar (mincha gedolah + rounding)

**Status:** implemented
**Date:** 2026-10-07
**Author:** claude-session (Yosef directing)
**Related:** [#040](040-computed-davening-times.md), [#078](078-candle-lighting-rounding.md)

## Problem

Before the site computed weekday times, the office worked them out by hand
from the Ra'anana religious council's calendar ("לוח רעננה", mdrn.org.il —
the weekly זמני היום table). Compared with 7 weekly pages of that calendar
(Oct 2026 – Jul 2027, 49 days; photos supplied by Yosef), the site's weekday
Mincha/Maariv times didn't match the calendar in any of the 7 weeks. The
site was never later and usually a minute earlier. There were two causes:

1. **Mincha gedolah definition.** The site used 6.5 sha'os zmaniyos (GRA)
   only. The calendar, like Itim LeBinah, uses the **later of** 6.5 sha'os
   zmaniyos and **chatzos + 30 min**. In summer they coincide. On the winter
   side chatzos + 30 is later, by up to ~5 min in December. Calendar vs
   "later of", rounded: 42/49 days (±1 noise both ways). Calendar vs 6.5h:
   21/49. In the October week this posted early Mincha at 12:58 while the
   calendar's mincha gedolah was 12:59, i.e. before the zman.
2. **Rounding.** #040 aggregated exact times and then **rounded down**. The
   calendar rounds to the **nearest** minute: its shkiya = hebcal sea-level
   sunset rounded to nearest in 45/49 days (with 4 borderline :25–:28 s
   misses where it rounded up).

## Decision

In `getComputedWeekdaySchedule`:

- Mincha gedolah = `minchaGedolaSeconds(z)` = max(6.5 sha'os zmaniyos,
  chatzos + 30 min).
- The aggregated latest mincha gedolah, earliest shkiya and latest shkiya are
  rounded to the **nearest** minute (`Math.round`) instead of down.

Unchanged: the 12:50 floor, late Mincha = shkiya − 10, Maariv = shkiya + 18,
the fixed 18:00 / 20:00 minyanim and their cutoffs, Shacharis, Selichos, fast
days, and all Shabbos rules (Shabbos candle rounding was fixed separately in
#078).

**Rounding choice:** nearest-minute was chosen to match the calendar the
office always used. Trade-off accepted: on some days the posted early Mincha
can be up to 29 s before the exact mincha gedolah. Truncation (the old
behavior) could be up to 59 s early. The alternative, always rounding early
Mincha up, was offered and not chosen.

## Consequences

Over a full year (Oct 2026 – Sep 2027), the posted early Mincha changes:

- **Last summer-clock weeks after Sukkos (e.g. Oct 4/11/18, 2026):** 1–2
  min later, because of the new definition.
- **Winter clock:** no change. Mincha gedolah is ~12:00–12:25 under either
  definition, below the 12:50 floor.
- **Summer clock:** about 1 min later in roughly half the weeks, from
  rounding only.

Late Mincha and Maariv are often 1 min later year-round, from rounding.
The weekly flier reads the same function, so it changes identically.

## Verification

For each of the 7 calendar weeks, compared the site against the #040 rules
applied to the calendar's printed zmanim:

- Before: 0/7 weeks fully match.
- After: **5/7** match.

The remaining two (Dec 6 and Mar 21 weeks) are late Mincha only: the week's
earliest shkiya falls at :25–:26 seconds, and the calendar rounded up. This
is a few seconds' difference in solar calculation, the same pattern seen in
#078. It isn't a rule difference, so it isn't curve-fit.

## Implementation Results

`src/lib/zmanim-schedule.ts`: new `minchaGedolaSeconds()`; nearest-minute
rounding in `getComputedWeekdaySchedule`. `scripts/verify-zmanim.mjs`: daily
line shows both mincha gedolah candidates. #040 amended.
