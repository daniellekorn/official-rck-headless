# 072 — Aseres Yemei Teshuva Selichos is 25 min; Shacharis card names its own days

**Status:** implemented
**Date:** 2026-09-14
**Author:** claude-session (Yosef directing)
**Related:** [#067](067-computed-selichos-times.md), [#069](069-flier-monday-next-week-taanis-date.md), [#070](070-computed-schedule-yom-tov-exclusion.md), [#071](071-selichos-offset-by-period.md)

## Problem

Two corrections from Yosef after reading the real fliers for the weeks of
September 13 and September 20, 2026 — the first two weeks the #071 offsets
and the #070 Yom Tov exclusion actually shipped against live dates.

**1. The Aseres Yemei Teshuva offset was 5 minutes too early.** #071 set
Selichos at 30 minutes before Shacharis for the weekdays between Rosh
Hashana and erev Yom Kippur. The week of September 13 rendered 6:30 / 7:45;
the shul davened 6:35 / 7:50. The offset is 25 minutes. (This is the second
correction to this one number — #067 had it at a flat 20 — so it is worth
saying plainly that it comes from what was davened, not from a derivation.)

**2. The flier's Shacharis card captioned itself with the *Selichos* days.**
`selichosBlock()` in `automation/flier-html.mjs` took its day-range caption —
the gold line under the card header, the one Mincha and Maariv use to say
"SUN, TUE – THU" — from the first Selichos row's `daySpec`. That was written
when the two were assumed to coincide, and they routinely don't:

| week | Shacharis runs | Selichos runs | old caption |
|---|---|---|---|
| Sep 20, 2026 (Yom Kippur on Monday) | Sun, Tue – Fri | Erev Yom Kippur (Sun) | `EREV YOM KIPPUR (SUN)` |
| Sep 6, 2026 (erev Rosh Hashana on Friday) | Sun – Fri | Mon – Thu | `MON – THU` |

So on the week the flier was *most* needed to be clear — Yom Kippur knocking
Monday out of the week — the Shacharis card was the only one of the three
that didn't say which days it meets, while Mincha and Maariv both did.
Yosef's ask: "the shacharis should be clear which days it's meeting (i.e.
sun, tues-fri) like the mincha and maariv are clear."

Note this was only ever a *flier* bug. `/daven` renders each service's rows
under that service's own `daySpec`, so it has always shown Shacharis' real
days; the two outputs were not in disagreement about data, only about which
of two correct values the flier's one caption slot printed.

## Decision

**Offset:** `SELICHOS_BEFORE_ASERES_YEMEI_TESHUVA` 30 → 25 in
`src/lib/zmanim-schedule.ts`. One constant; the period boundaries, the other
three offsets, and the per-offset bucketing from #071 are untouched. Because
`/daven` and the flier share `getComputedWeekdaySchedule()`, the live site
corrected itself for the current week the moment this landed.

**Caption:** `selichosBlock()` now takes the Shacharis `daySpec` as an
argument and always uses it for the card caption. The Selichos times keep
their paired gold column, but their label carries its own days whenever they
differ from Shacharis':

```
Shacharis                          Shacharis
SUN, TUE – FRI                     MON – FRI
SELICHOS · EREV YOM KIPPUR (SUN)   SELICHOS
06:45 | 07:00                      06:35 | 07:00
08:00 | 08:15                      07:50 | 08:15
```

Left: days differ, so the gold column says whose days its times are, and the
pairing can't be misread as "Selichos before every Shacharis this week".
Right: days coincide (the ordinary in-season week), so the label stays the
bare `SELICHOS` — saying "MON – FRI" twice on one card is noise.

Two details worth keeping:

- The qualified label spans both grid columns and uses `GOLD_CAP` (17px)
  rather than `DAYSPEC_CAP` (22px). The grid is `auto 1fr`, so a long daySpec
  left in column 1 would widen the gold time column and squeeze the 92px
  Shacharis times beside it. Spanning keeps it left-aligned at the same x as
  the bare `SELICHOS` while costing the layout nothing.
- It reuses the exact `Selichos · {daySpec}` wording the *extra*-bucket rows
  below the gold rule already use (#067), so a card showing both reads as one
  convention, not two.

## Verification

Re-rendered three weeks through `node automation/render.mjs <date>` and read
the JPGs. Week of Sep 13 (post-Rosh-Hashana, plus the Tzom Gedaliah column):
Selichos now 06:35 / 07:50, caption `MON – FRI`, bare `SELICHOS` label —
i.e. the coinciding-days case renders pixel-identically to before except for
the corrected times. Week of Sep 20 (Yom Kippur Monday): caption now
`SUN, TUE – FRI`, matching Mincha's and Maariv's `SUN, TUE – THU`, with
`SELICHOS · EREV YOM KIPPUR (SUN)` over 06:45 / 08:00. Week of Sep 6 (erev
Rosh Hashana Friday, the two-bucket case): caption now `SUN – FRI` (was the
wrong `MON – THU`), `SELICHOS · MON – THU` over the paired column, and the
existing `SELICHOS · EREV ROSH HASHANA (FRI)` block below the rule unchanged
— no overflow. `npx tsc --noEmit` and `npm run check:design-log` clean.

#071's known gap (Rosh Hashana on a Tuesday: three Selichos buckets plus a
fast day overflow the Shacharis card) is unaffected and still open.
