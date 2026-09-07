# 069 — Weekly flier moves to Monday/next-week delivery; fast banners get a day+date

**Status:** implemented
**Date:** 2026-09-07
**Author:** claude-session (Yosef directing)
**Related:** [#068](068-computed-taanis-times.md), [#040](040-computed-davening-times.md)

## Problem

Two asks from Yosef:

1. The flier should land in his hands Monday morning already carrying the
   *following* week's times, not the current week's. (A prior, uncommitted
   attempt had moved the schedule to Friday "for the coming week" but
   `getComputedWeekdaySchedule`'s roll-forward only actually triggers on
   Saturday, not Friday — that attempt would have kept posting the week that
   had *just ended*. Superseded here, never shipped.)
2. The fast-day ("Start of Fast" / "End of Fast") banners on the flier name
   the fast but not which calendar day it falls on — a reader has to already
   know the date.

## Decision

**Scheduling:** rather than lean on `getComputedWeekdaySchedule`'s implicit
day-of-week rolling (fragile — only Saturday actually rolls forward, and a
late/delayed run could land on a different weekday than intended),
`weekly-flier.sh` and the GitHub Actions workflow now compute an explicit
date 7 days out and pass it to `render.mjs`. +7 days from any weekday inside
the intended run window still lands inside *next* week's Sun–Fri span, so it
always resolves to next week's Sunday regardless of which day the job
actually fires on. `render.mjs`'s own no-argument default ("current week")
is untouched — it's still the right behavior for ad-hoc/manual renders.

Both the macOS LaunchAgent (`com.rckollel.weeklyflier.plist`) and the GitHub
Actions cron move from Friday to Monday 06:30 local (Israel).

**Fast day display:** `ComputedTaanisRow` gains `startDateLabel`/`endDateLabel`
("Monday, September 14" — full weekday + month/day, via a new
`weekdayDateFmt` in `zmanim-schedule.ts`), computed from the same
`startDay`/`endDay` the existing `startDayLabel`/`endDayLabel` already use.

Went through two flier layouts before landing (see #069's own history —
writing the conclusion, not the diary): first, a per-card banner above
Shacharis ("Start of Fast") and Maariv ("End of Fast"), each led by its date
label. Yosef then asked for a different treatment: a 4th column, solid gold,
to the right of the three minyan cards — `taanisColumn()` in
`automation/flier-html.mjs` — showing the fast's day+date, name, and
Start/End of Fast together in one place (24-hour time, matching the rest of
the flier — `to24()` applied the same as everywhere else). The three minyan
cards pick up a `compact` mode (tighter card padding and body margins) only
on fast weeks, to absorb the width the 4th column takes from a 3-column
1920px grid — landed on trimming whitespace first rather than shrinking the
time text itself. `taanisEdgeBlock` (the superseded per-card design) was
deleted along with `card()`'s now-unused `prefix` param. The `/daven` page
and its short day labels are untouched — this was scoped to the flier only,
per the request.

Yosef's next round of feedback, both applied directly (no further layout
churn): the solid `#dfb030` gold column read as too heavy and used its own
navy/weight-600 text treatment instead of the flier's existing styles, so it
became a pale tint (`#faf1d9`) with times in the *exact* `#1a1a1a` Oswald
style every other time on the flier already uses and captions reusing
the flier's existing gold caption style verbatim (the same one "SUN – THU"
uses) — the box now reads as
part of the same design system, distinguished only by its background.
Separately, the Shacharis card's Selichos day-range caption ("Selichos" +
daySpec, stacked inside the paired grid) split in two: the day range moved
to the same position and style Mincha/Maariv use for theirs — directly under
the card header — via a new shared `daySpecCaption()` helper `defaultBody()`
and `selichosBlock()` both call, while a plain "Selichos" label stayed
in place directly over the gold time column (Yosef asked for it back after
an initial pass removed it, worried the gold color alone wouldn't read as
"Selichos" without it). This only reads correctly because of
[#070](070-computed-schedule-yom-tov-exclusion.md),
built the same day: before that fix, a Yom-Tov-shortened week could give
Shacharis "Sun – Fri" while Selichos's own bucket was "Mon – Fri" — two
different day ranges that a single shared caption would have conflated. The
Erev Rosh Hashana / Erev Yom Kippur "extra" bucket (no paired Shacharis
column next to it) keeps its "Selichos · " label, since without the pairing
there's nothing else marking those gold numbers as Selichos.

Two more follow-ups, same session: the Taanis column's date line was sized
like the flier's small 17px gold caption and vertically centered in the box,
reading smaller and lower than the other three cards' day-range caption; it
now uses the same 22px caption style (factored into a shared constant,
reused by `daySpecCaption()`), the column's `justify-content:center` was
dropped, and a fixed 76px spacer was added above the date line — the exact
height the other three cards' own header line + margin takes before their
day-range caption starts, since the Taanis column has no header of its own
to push its content down by the same amount. The two numbers have to be
kept in sync by hand if the header's font-size/line-height or the caption's
margin-top ever change; there's no shared source for that 76px. Confirmed
pixel-level: "MONDAY, SEPTEMBER 14" now sits exactly level with "MON – THU"
in the Maariv card next to it. Separately, on a week with
both Selichos and a fast, the Shacharis card (header + day-range caption +
"Selichos" label + paired grid) was visibly tighter than Mincha/Maariv in
the equal-width 4-column grid; the grid now gives Shacharis 1.3fr and
Mincha/Maariv 0.85fr each (Taanis column unchanged at 1fr) specifically when
both conditions hold (`hasSelichosAndTaanis`) — an ordinary fast-only week
(no Selichos) keeps the four equal columns, since Shacharis has no extra
content to make room for there.

## Verification

`npx tsc --noEmit` and `npm run check:design-log` both clean. Rendered and
visually inspected: a normal week (pixel-unchanged 3-column grid), the Tzom
Gedaliah week (`2026-09-14` — gold 4th column, one date line since start/end
land the same day), and both halves of a split Tisha B'Av
(`2029-07-14`/`2029-07-21` — each week's gold column shows only its own
Start-or-End half with its own date, never both). Ran `./automation/weekly-
flier.sh` on the actual date this shipped (Monday, Sep 7 2026) and confirmed
it produced `daven-flier-2026-09-13.jpg` (next week, not the current one).
LaunchAgent reloaded from the updated plist; `launchctl list` confirms it's
loaded. Re-rendered and inspected after the color/caption follow-up: the
Tzom Gedaliah week (pale gold column, dark times matching Mincha/Maariv,
Shacharis/Selichos sharing one "Mon – Fri" caption up top), the Erev Rosh
Hashana week (main "Mon – Thu" caption up top, "Selichos · Erev Rosh
Hashana (Fri)" extra block below its rule, unaffected), and the Erev Yom
Kippur week (single special bucket still renders correctly as the sole top
caption).
