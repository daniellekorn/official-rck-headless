# 080 — Erev Shabbos Mincha set by candle time, not by the clock change

**Status:** implemented
**Date:** 2026-10-07
**Author:** claude-session (Yosef directing)
**Related:** [#041](041-computed-shabbos-times.md), [#078](078-candle-lighting-rounding.md)

## Problem

#041 set "Mincha & Kabbalos Shabbos" to hadlakas neiros − 10 min on the
summer clock and + 10 min on the winter clock. Yosef gave the actual rule,
which depends on the candle-lighting time itself, not on which clock is in
effect.

## Decision

Mincha & Kabbalos Shabbos (erev Shabbos only):

| Hadlakas neiros | Mincha & Kabbalos Shabbos |
| --- | --- |
| after 6:45 pm | 10 min **before** hadlakas neiros |
| 6:05 – 6:45 pm (both ends inclusive) | the **same time** as hadlakas neiros |
| before 6:05 pm | 10 min **after** hadlakas neiros |

The 6:05 and 6:45 boundaries count as "same time". Yosef said "between 6:45
and 6:05" and "below 6:05 … 10 minutes later", so 6:05 itself is not below.

Constants: `EREV_MINCHA_VS_CANDLES` (10), `EREV_MINCHA_SAME_FROM` (6:05 pm),
`EREV_MINCHA_SAME_TO` (6:45 pm). The clock-change helper `isSummerClock` had
no other caller and is removed. When the two times coincide, the Friday rows
list Mincha & Kabbalos Shabbos first (stable sort).

**Unchanged:** Shabbos-day Mincha stays erev-Shabbos hadlakas neiros − 10 min
(`SHABBOS_MINCHA_BEFORE_CANDLES`), and Beis Medrash & Shiur stays Shabbos
Mincha − 30. Both were explicitly kept by Yosef.

## Consequences

Year-long check (Oct 2026 – Oct 2027). Only 10 Fridays change, all on the
summer clock with early candle times:

- **Candles before 6:05 on the summer clock** (post-Sukkos October, e.g.
  Oct 9/16/23, 2026): Mincha moves from 10 min before to **10 min after**
  (e.g. Oct 9: 5:45 → 6:05 pm, candles 5:55).
- **Candles 6:05–6:45** (late March/early April and September, e.g. Mar 26,
  Apr 2, Sep 3–Oct 1, 2027): Mincha moves from 10 min before to the **same
  time**.
- **Winter clock:** candles are always before 6:05, so it stays + 10, same as
  before.
- **Summer, candles after 6:45:** stays − 10, same as before.

## Implementation Results

`src/lib/zmanim-schedule.ts` (`getComputedShabbosSchedule`); #041 amended.

Commit: `99d00ef`.
