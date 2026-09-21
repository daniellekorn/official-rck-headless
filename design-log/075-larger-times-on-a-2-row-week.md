# 075 — Bigger header/times on a 2-row week (no Taanis, ≤2 rows)

**Status:** implemented
**Date:** 2026-09-21
**Author:** claude-session (Yosef directing)
**Related:** [#069](069-flier-monday-next-week-taanis-date.md), [#072](072-selichos-25-minutes-shacharis-dayspec.md), [#074](074-past-days-drop-from-label-no-fixed-mincha-yk-sukkos.md)

## Problem

After #074 dropped the fixed 6:00pm Mincha for the Yom-Kippur-to-Sukkos gap,
the week of September 20's Mincha card fell to 2 rows, matching Shacharis
and Maariv — every card on that flier had visible empty space below its
times. Yosef, reading that flier: make Shacharis/Mincha/Maariv's names and
times bigger, since there's more room now.

## Decision

In `automation/flier-html.mjs`, `card()`'s service-name header goes 68px →
80px, and `defaultBody()`'s time size goes 104px → 124px — but **only** when
`compact` is false (no Taanis column this week) **and** the card has 2 or
fewer time rows. `compact` (Taanis weeks) and the 3-row case are both left
at their exact original numbers:

- **Taanis weeks** are already narrower (a 4th column), so they're already
  tight at the old size — confirmed unaffected by re-rendering the week of
  Sept 13 (Tzom Gedaliah) and diffing against the pre-change render.
- **The 3-row case is the *normal* year-round cadence** (early/fixed/late
  Mincha), not a special case — bumping it to 112px was tried first and
  overflowed into the footer on the week of Sept 27 (confirmed by
  re-rendering and reading the JPG: the third time, 18:15, sat on top of the
  footer's divider line). Reverted that tier back to 96px, its original
  value.

So only the 2-row case — Shacharis and Maariv always, Mincha only on a week
like this one where the fixed 6pm minyan doesn't run — gets bigger. Gap
between rows (10px → 16px) and the top margin above the first time (24px →
30px) got a matching small bump in that same 2-row/non-compact case, so the
larger digits don't look cramped against the caption above them.

## Verification

Re-rendered three weeks and read each JPG:
- Week of Sep 20 (2-row Mincha, this week): all three cards bigger, no overflow.
- Week of Sep 27 (3-row Mincha, back to normal cadence): unchanged from
  before this change — confirms the 3-row revert.
- Week of Sep 13 (Taanis/compact): pixel-identical sizing to before this
  change.

`npx tsc --noEmit` and `npm run check:design-log` clean.
