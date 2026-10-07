# 078 — Candle lighting: round to the nearest minute, don't truncate

**Status:** implemented
**Date:** 2026-10-07
**Author:** claude-session (Yosef directing)
**Related:** [#066](066-candle-lighting-20-minutes.md), [#041](041-computed-shabbos-times.md)

## Problem

#041/#066 specify Hadlakas Neiros as sea-level shkiya − 20, **rounded to the
nearest minute**. The code called `zFri.sunsetOffset(-CANDLES_BEFORE_SHKIYA, true)`.
For a *negative* offset, @hebcal/core's `roundMinute = true` doesn't round —
it zeroes the seconds of sunset (it only rounds up for positive, havdalah-style
offsets). So any week whose exact time had ≥ 30 seconds was posted a minute
early.

Found while comparing `/daven` with the printed luach, the "Shabbos Times
Magnet 5787" (Canva `DAHOvOc576g`, page 1 — the same luach #066 was checked
against). Of its 52 weekly rows, the site matched only 22. In the other 29 it
was 1 minute early, and the 1 remaining row is the Dec 11 outlier below.
This Friday (Oct 9, 2026) the magnet says 17:56 and the site said 17:55.

## Decision

Pass `roundMinute = false` and let the existing `minutesOf()` (nearest-minute)
do the rounding. One argument changes, in `getComputedShabbosSchedule`. The
rule itself (20 min, sea level) is unchanged. Mincha & Kabbalos Shabbos,
Shabbos-day Mincha and Beis Medrash & Shiur are derived from `candles`, so they
move with it automatically.

The raw diagnostic line in `scripts/verify-zmanim.mjs` gets the same change, so
it shows the exact time instead of a truncated one.

Not touched: the Taanis end time (`sunsetOffset(TAANIS_END_AFTER_SHKIYA, true)`)
uses a positive offset, where hebcal's rounding *is* nearest-minute. Maariv
uses `tzeit()` + `minutesOf()` and was already rounded correctly.

## How the luach relates to Itim LeBinah and hebcal (for future reference)

Yosef built the magnet from Itim LeBinah. Comparing all 52 rows with Itim's
own data (Ra'anana luach) and with hebcal:

- Itim prints Ra'anana candle lighting at sea-level sunset − **22**, with
  seconds truncated.
- The magnet = Itim's exact time **+ 2 min, rounded to the nearest minute** =
  sea-level sunset − 20, nearest minute. Compared with Itim's printed minute,
  the magnet shows +2 when Itim's seconds are small and +3 otherwise (37/52).
- Itim's sea-level sunset runs 1–21 s earlier than hebcal's, which only matters
  on borderline seconds. Motzash is 8.5° tzeis in all three sources.

So hebcal, rounded correctly, reproduces the luach. There's no reason to switch
sources.

## Verification

Ran `getComputedShabbosSchedule` for each of the magnet's 52 weeks:

- Before: 22/52 candle times match.
- After: **45/52** match.

Remaining 7:
- **Dec 11, 2026 (Mikeitz):** the magnet's 16:14 is Itim's raw number (its +2
  was skipped). The rule gives 16:16, and so does the site.
- **6 weeks (Oct 9, Nov 6, Jan 22, Feb 5, Feb 26, Sep 17):** the exact time
  falls at :23–:28 seconds, and the magnet rounded up where hebcal rounds down.
  This is a few seconds' difference between Itim's and hebcal's solar
  calculations. It isn't a rule difference, so it's left alone rather than
  curve-fit with a seconds offset.

## Implementation Results

`src/lib/zmanim-schedule.ts` (`getComputedShabbosSchedule`) and
`scripts/verify-zmanim.mjs`: `sunsetOffset(-20, true)` → `false`.

Commit: `9bd60c0`.
