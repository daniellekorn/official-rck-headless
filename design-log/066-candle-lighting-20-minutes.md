# 066 — Candle-lighting offset: 18 min → 20 min

**Status:** implemented
**Date:** 2026-09-06
**Author:** claude-session (Yosef directing)
**Related:** [#041](041-computed-shabbos-times.md), [#040](040-computed-davening-times.md)

## Problem

[#041](041-computed-shabbos-times.md) set Hadlakas Neiros to "exactly what
hebcal publishes for Ra'anana" — sea-level shkiya − 18 min — verified only
against hebcal.com's own feed, not against the shul's printed luach. Yosef
confirmed the luach uses 20 minutes, checked across 10+ weeks of dates.

## Decision

`CANDLES_BEFORE_SHKIYA` in `src/lib/zmanim-schedule.ts` changes from `18` to
`20`. Nothing else moves:

- **Mincha & Kabbalos Shabbos** stays candles ± 10 min (summer/winter) — it's
  defined relative to `candles`, so it shifts automatically with the new
  candle time, per the original #041 rule; the *offset itself* (10 min) is
  unchanged.
- **Shabbos day Mincha** (candles − 10) shifts the same way, for the same
  reason.
- **Maariv/motzash (tzeit, `TZEIS_ANGLE` = 8.5°)** — untouched. Already
  confirmed against the luach in #041 and again now; explicitly out of scope
  for this change.
- **Weekday Late Mincha** (10 min before the week's earliest shkiya) and
  **weekday Maariv** (18 min after the week's latest shkiya) — untouched.
  These are separate constants (`LATE_MINCHA_BEFORE_SHKIYA`,
  `MAARIV_AFTER_SHKIYA`) in the weekday function, unconfirmed either way, and
  not part of this request.

## Consequences

Every Friday's Hadlakas Neiros posted on `/daven` moves 2 minutes earlier
than before. Because Mincha & Kabbalos Shabbos and Shabbos-day Mincha are
both computed *from* `candles`, they shift by the same 2 minutes automatically
— no separate edit needed for them.

## Verification

`node scripts/verify-zmanim.mjs` (raw `candles(−20)` line) — spot-check a
few Fridays against the printed luach.

## Implementation Results

`CANDLES_BEFORE_SHKIYA` changed 18 → 20 in `src/lib/zmanim-schedule.ts`
(comments updated); `scripts/verify-zmanim.mjs` raw-diagnostic comments
updated from −18 to −20; [#041](041-computed-shabbos-times.md) amended with
a status line + addendum.
