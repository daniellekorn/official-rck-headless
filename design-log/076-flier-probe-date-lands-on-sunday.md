# 076 — Flier's "next week" probe date must land on Sunday, not mid-week

**Status:** implemented
**Date:** 2026-09-29
**Author:** claude-session
**Related:** #069, #073, #074

## Background

[#069](069-flier-monday-next-week-taanis-date.md) made the weekly flier always
render next week via `weekly-flier.sh` passing `render.mjs` a probe date 7
days out. [#074](074-past-days-drop-from-label-no-fixed-mincha-yk-sukkos.md)
later made `getComputedWeekdaySchedule()` drop already-past days from the
Shacharis/Mincha/Maariv day-range label, using that same probe date as
"today" — correct for the live `/daven` page, which passes the real current
instant.

## Problem

A flat `+7 days` from a Monday run lands on *next week's Monday*, not its
Sunday. `getComputedWeekdaySchedule()` treats that Monday as "today," so
Sunday — the first day of the target week — looks like it's already past and
gets dropped from the label. The flier shipped Oct 4 showing "Mon – Fri"
(Shacharis) and "Mon – Thu" (Mincha/Maariv) instead of "Sun – Fri" / "Sun –
Thu," even though Shacharis/Mincha/Maariv all correctly run starting Sunday.

## Design

`weekly-flier.sh` now computes the exact date of next week's Sunday (days
until the next calendar Sunday, forced to 7 if today already is one) instead
of a flat `+7d`. Landing the probe exactly on that Sunday means
`civilDateOf(probe)` equals the target week's first day, so no day in the
displayed week is ever "before today" and none gets dropped. Still robust to
launchd firing a day or two late (any Mon–Sat resolves to the same target
Sunday).

## Verification

Reran `getComputedWeekdaySchedule()` with the old `+7d` probe (Oct 5) vs. the
new Sunday probe (Oct 4): old produced "Mon – Fri"/"Mon – Thu", new produced
"Sun – Fri"/"Sun – Thu". Re-ran `weekly-flier.sh` end to end and confirmed the
regenerated JPG/PDF in `~/Downloads/RCK Flier/` show the corrected labels.
