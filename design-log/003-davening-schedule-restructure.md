# 003 — Davening schedule: add daySpec field, service-grouped card layout

**Status:** implemented — card layout + Shabbat column superseded by #008 (flat weekday rows, static Shabbat); the `daySpec` field and CMS shape stand
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md)

## Background

#001 shipped `DaveningTimes` with six fields: `service`, `dayType` ("Weekday" or "Shabbat"), `time`, `notes`, `sortOrder`, `active`. The /daven page rendered one card per dayType with a flat row list.

With realistic data, two failure modes surfaced:

1. **`notes` was overloaded.** With no other field to hold day-of-week specificity, editors put "Monday & Thursday (Torah reading)", "Sunday – Thursday, followed by daf yomi" in there. Day-of-week info was the primary information; the actual notes were an aside.
2. **Service variants read as siblings, not children.** Four "Shacharis" rows sat at the same level as Mincha and Maariv, with day-of-week distinction buried in `notes`. People scan by service ("what time is Mincha?"); the flat layout forced them to re-parse the service name on every row.

## Problem

Two coupled problems with a single fix:

1. Schema needs a place for day-of-week specificity that isn't `notes`.
2. Layout needs to group rows by service so the variants read as children of a service header.

## Questions and Answers

- **Q:** Could we just parse `notes` to extract day-of-week info?
  **A:** Fragile. Relies on string convention ("Monday & Thursday" vs "Mon-Thu" vs "Mondays") that drifts the moment an editor types something unexpected. New first-class field is cleaner.

- **Q:** Should `dayType` get more granular values (Sunday, Mon-Thu, Tue-Wed-Fri, Shabbat, …) so we don't need `daySpec`?
  **A:** No — the editor explicitly said "Keep it as is for now." The dayType binary (Weekday / Shabbat) is the *top-level* split the page presents (two columns). Day-of-week specificity is a *secondary* axis within Weekday and belongs in its own field.

- **Q:** What's the right format for `daySpec` values?
  **A:** Short and scannable. Examples documented in CONTRIBUTING: `Sunday`, `Mon, Thu`, `Tue, Wed, Fri`, `Sun – Thu`, `Rosh Chodesh`, `Erev Shabbat`, `Motzei Shabbat`. Free text — no alias map yet because there are only ~7 common values and they tend to be edited rarely. If editors start typing inconsistent variants, reach for the alias-map pattern from #002.

- **Q:** What's shown when `daySpec` is empty (e.g. the one Shabbat Shacharis row)?
  **A:** The card already has a service header, so the row's left label falls back to the column's dayType label ("Shabbat"). For a card with one variant, this reads naturally: SHACHARIS → "Shabbat 9:00 AM".

## Design

**Schema** — append one Text field to `DaveningTimes`:

| Field | Type | Description |
|---|---|---|
| daySpec | Text (optional) | Day-of-week specificity. Free text, e.g. `Sunday`, `Mon, Thu`, `Sun – Thu`. Empty falls back to the dayType label. |

`notes` field's description tightened: explicitly should *not* carry day-of-week info anymore — that's daySpec's job.

**Lib** — `src/lib/davening.ts` exports `getDaveningGrouped()` returning `Record<DayType, ServiceGroup[]>` where each `ServiceGroup` is `{ service, rows: DaveningTime[] }`. Services ordered Shacharis → Mincha → Maariv → Selichos via a canonical rank function.

**Page** — `src/pages/daven.astro` renders two columns side-by-side. Each column has a `WEEKDAY` / `SHABBAT` header, then a vertical stack of service cards. Each card has a navy header bar with the service name and a row list inside: `daySpec` on the left, `time` on the right, `notes` underneath in smaller gray text.

## Trade-offs

- **Schema PUT is brittle.** Adding a field via PUT requires re-sending the whole user-fields array; missing any property loses it on existing fields. Future field additions should use Patch Data Collection if available, or GET the full collection first.
- **No alias-map for `daySpec` values yet.** Editor can drift between "Sunday" and "Sundays" and the page will show them as separate-looking labels. Revisit if it becomes a problem.
- **`time` field is still wall-clock text.** "Candle lighting time" and "After tzeit hakochavim" are display strings; we don't compute zmanim.
- **`daySpec` empty + multi-row card edge case.** If a card had two rows both with empty daySpec, both rows would label as the dayType — confusing. Realistic data doesn't hit this; editors should add a daySpec when there's more than one variant.

## Implementation Results

Schema PUT bumped revision 2 → 3. 10/10 existing rows migrated cleanly (day-of-week info split out of `notes` into `daySpec`).

**Follow-up:** once enough real schedules are entered, evaluate whether `daySpec` values are drifting and need an alias map (à la #002's role groups).
