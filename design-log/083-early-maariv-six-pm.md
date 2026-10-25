# 083 — A 6:00 pm Maariv when the first Maariv is early

**Status:** implemented
**Date:** 2026-10-25
**Author:** claude-session (Yosef directing)
**Related:** [#040](040-computed-davening-times.md), [#077](077-flier-a4-portrait-print-pdf.md)

## Rule (Yosef)

The weekday schedule's first Maariv is shkiya + 18 minutes (one posted time for
Sun–Thu, from the latest shkiya of the week). **Whenever that time is more than
15 minutes before 6:00 pm — i.e. earlier than 5:45 pm — a 6:00 pm Maariv runs
as well.** Exactly 5:45 does not qualify. The existing 8:00 pm Maariv rule is
unchanged (it runs while the first Maariv is before 8:00), so a week can now
post three Maariv times, e.g. 5:15 / 6:00 / 8:00.

Not downstairs: the downstairs rule ([#077](077-flier-a4-portrait-print-pdf.md))
applies to a Maariv *before* 18:00, so the 6:00 pm one is never marked.

## Design

`getComputedWeekdaySchedule()` pushes the fixed 18:00 row between the
shkiya-based Maariv and the 20:00 one (`FIXED_EARLY_MAARIV`,
`FIXED_EARLY_MAARIV_GAP`). `/daven` and both fliers read the same rows, so they
agree. Applies on every week, including between Yom Kippur and Sukkos (the
fixed 6:00 pm *Mincha* has its own exemption there; this rule has none).

On the A4 flier a three-time Maariv with a downstairs first time stacks the last
time on its own line. The "Down Stairs" marker is left-aligned with the time it
belongs to (the "1" of 17:15) and sits beside that last line, inside its height,
so it needs no extra vertical room and every time keeps its full 80 px — an
earlier version reserved a line for the marker and had to shrink the Maariv to
50 px on Rosh Chodesh weeks, which was unnecessary. A marker under the *last*
time in a row (the second Mincha) stays right-aligned. Both markers sit the same
distance (about 18 px, measured on the rendered image) below their times.

## Verification

~114 weeks from Oct 2026: 33 have the 6:00 pm Maariv, 81 do not; every one
matches the rule, and the rows are always in increasing order. The two weeks
nearest the boundary (2027-02-14: 5:47, 2028-02-13: 5:46) correctly do not get
the 6:00. 64 weeks render through `render.mjs` with no failures and the wide
flier has no overflow.

## Addendum — wide flier three-row size

A card with three times (a Maariv or Mincha with three rows) uses 132 px on the wide
flier (was 120). 134 is the most that fits all 64 weeks tested; 136 overflows the
footer on 44 of them, so 132 leaves a small margin. Fast-day (compact) weeks are
unchanged.
