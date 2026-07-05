# 041 — Shabbos davening times computed from zmanim

**Status:** implemented
**Date:** 2026-07-05
**Author:** claude-session (danielle directing)
**Related:** [#040](040-computed-davening-times.md), [#003](003-davening-schedule-restructure.md)

## Problem

#040 automated the weekday table, but `/daven`'s Shabbat section was a static
"Join us at KBA" blurb with no times at all. R' Postelnek confirmed the weekday
rules and supplied the Shabbos rules by email (July 2026), asking that times
roll over on Motzei Shabbos — which the #040 week-rolling logic already does.

## Decision

Shabbos times join the weekday ones in **code**: `getComputedShabbosSchedule()`
in `src/lib/zmanim-schedule.ts`, rendered as Friday Night / Shabbos Day blocks
in the same list styling as the weekday table, with a "Parshas … · date"
caption mirroring "Week of …".

**The rules** (R' Postelnek, July 2026):

| Item | Rule |
| --- | --- |
| Hadlakas Neiros | exactly what hebcal publishes for Ra'anana = sea-level shkiya − 18 min, nearest minute |
| Mincha & Kabbalos Shabbos | hadlakas neiros − 10 min on the **summer clock**, + 10 min on the **winter clock** |
| Midrash Shiur / Shacharis / Tefillat Yeladim | fixed 8:00 / 8:45 / 10:00 |
| Beis Medrash & Shiur | posted Shabbos mincha − 30 min |
| Mincha (Shabbos day) | erev-Shabbos hadlakas neiros − 10 min |
| Maariv | tzeis hakochavim = hebcal's tzeit (sun 8.5° below horizon), nearest minute |

Interpretation choices worth flagging:

- **"Summer/winter"** is implemented literally as the Israel clock change
  (IDT = GMT+3 vs IST = GMT+2 on erev Shabbos), per the rav's "around the
  times the clock changes". Transition weeks verified: Friday 2027-03-26
  (DST starts that morning) counts as summer; Friday 2026-10-23 (DST ends
  that Sunday) still summer.
- **"Tzeis hakochavim"** = hebcal's 8.5° tzeit, the figure behind hebcal.com's
  havdalah for Ra'anana. Verified July 10–11 2026 against hebcal.com API:
  candles 19:31 ✓, tzeit 20:31 ✓. If the flyer uses a different tzeis
  (e.g. fixed minutes after shkiya), `TZEIS_ANGLE` is a one-line change.
- **Which Shabbos shows:** erev Shabbos = the Friday closing the #040 schedule
  week, so the whole page (weekday + Shabbos) rolls together on Shabbos and is
  current by Motzei Shabbos — matching the rav's expectation.
- **Parsha caption** uses `Sedra` with the Ashkenazi locale ("Matos–Masei",
  not "Matot"); omitted when the week's reading is a Yom Tov's (`chag`).

**Content-vs-code boundary:** `active` CMS rows with `dayType: "Shabbat"`
(none exist today) render after the computed Shabbos Day rows — same escape
hatch as weekday. v1 does not special-case Yom Tov, chagim, or summer-clock
edge minhagim beyond the rules above; the office covers those via CMS rows.

## Consequences

- `/daven`'s static Shabbat blurb is gone; the KBA location note (Tel Chai 8)
  survives as a footnote under the schedule.
- `scripts/verify-zmanim.mjs` now also prints the Shabbos schedule plus raw
  erev-shkiya / candles / tzeis for comparison with hebcal.com.
- Rule tweaks are constant edits at the top of `zmanim-schedule.ts`
  (`CANDLES_BEFORE_SHKIYA`, `EREV_MINCHA_VS_CANDLES`, `TZEIS_ANGLE`, …).

## Verification

`node scripts/verify-zmanim.mjs 2026-07-05 2026-12-06 2026-10-19 2027-03-22`:
summer (mincha before candles), deep winter (after candles), and both
DST-transition Shabbosos ordered correctly; candles/tzeit match hebcal.com's
Ra'anana feed (geonameid 293807) to the minute. `npx astro check` clean.
