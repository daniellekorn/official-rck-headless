# 071 — Selichos offset varies by period (20 / 30 / 60 / 15 min)

**Status:** implemented
**Date:** 2026-09-07
**Author:** claude-session (Yosef directing)
**Related:** [#067](067-computed-selichos-times.md), [#069](069-flier-monday-next-week-taanis-date.md)

## Problem

#067 set Selichos-before-Shacharis at a flat 20 minutes for every regular
in-season day, with only erev Rosh Hashana (40 min) and erev Yom Kippur (15
min) as exceptions. Yosef corrected this: the 20-minute offset is only
correct for the Elul days (season start through erev Rosh Hashana) — once
Aseres Yemei Teshuva begins, Selichos runs longer (the added piyutim) and
needs 30 minutes before Shacharis. Erev Rosh Hashana is also longer than
#067 had it: 60 minutes, not 40. Erev Yom Kippur's 15 minutes was already
correct and unchanged.

Asked to confirm one ambiguous point directly (not a guess): whether the
Elul period itself changes too. Yosef confirmed it stays 20 minutes — only
the post-Rosh-Hashana period and erev Rosh Hashana's own offset changed.

## Decision

`zmanim-schedule.ts`: `SELICHOS_BEFORE` split into `SELICHOS_BEFORE_ELUL`
(20, unchanged) and `SELICHOS_BEFORE_ASERES_YEMEI_TESHUVA` (30, new).
`SELICHOS_BEFORE_EREV_ROSH_HASHANA` changes 40 → 60.
`SELICHOS_BEFORE_EREV_YOM_KIPPUR` stays 15.

`selichosInfoFor()` now branches on which side of Rosh Hashana `day` falls:
`seasonStart..erevRoshHashana` → Elul offset, `roshHashana2..erevYomKippur`
→ Aseres Yemei Teshuva offset (the erev-RH/erev-YK/Yom-Tov-itself cases are
still checked first and unchanged).

This surfaced a real gap in the original bucketing: `getComputedWeekdaySchedule`
collapsed every non-labeled ("regular") Selichos day of the week into one
bucket at a single hardcoded offset. A week where Rosh Hashana falls
mid-week (e.g. Tuesday) has both Elul days *and* post-RH days as "regular"
in the same week, now at two different offsets — collapsing them would have
silently used the wrong offset for half the days. Fixed by bucketing regular
days by their own `offset` (a `Map<number, number[]>`) instead of a single
list, so a straddling week now correctly renders two regular buckets instead
of one wrong one.

Both the flier and `/daven` read this from the same `getComputedWeekdaySchedule`
call, so the correction applies to both without a separate change.

## Known gap

A week with *three* Selichos buckets (Elul + erev Rosh Hashana + post-RH —
only possible when Rosh Hashana falls on a Tuesday) combined with a fast day
that same week (Tzom Gedaliah, which lands mid-week when Rosh Hashana starts
early) overflows the Shacharis card on the flier — too much content for the
compact 4-column layout. Confirmed with `2025-09-23` (Rosh Hashana 5786, a
Tuesday). Not fixed — doesn't affect any upcoming real week and is rare
(Rosh Hashana rarely falls on Tuesday); flagged here rather than adding more
compaction logic for a scenario that may not recur for years.

## Verification

`npx tsc --noEmit` and `npm run check:design-log` both clean. Checked
`getComputedWeekdaySchedule()` output: an Elul week (20 min, unchanged), the
post-Rosh-Hashana week (30 min, was 20), an erev Yom Kippur week (15 min,
unchanged), and the Rosh-Hashana-on-Tuesday straddle week (correctly split
into Elul/erev-RH/post-RH buckets at 20/60/30, chronologically ordered).
Rendered and visually confirmed the flier for the straddle week's simpler
sibling cases and the ordinary weeks above; the triple-bucket-plus-fast
overflow is the one exception, noted above.
