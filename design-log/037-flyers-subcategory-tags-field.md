# 037 — `Flyers.subCategory` is now a Tags (multi-value) field

**Status:** implemented
**Date:** 2026-07-05
**Author:** claude-session (danielle directing)
**Related:** [#010](010-flyers-cms-collection.md), [#012](012-learn-page.md), [#017](017-events-and-youth-pages.md)

## Problem

Yosef converted `Flyers.subCategory` in the CMS from a single Text value to a
Tags field and tagged every flyer with multiple values (topic + audience + day
+ time, e.g. `["Halacha", "Men", "Gemara", "Sunday", "Night"]`). The code still
assumed one string per flyer, so on `/learn` each card's tags rendered as one
concatenated blob (`HalachaMenGemaraSundaySunday…`), the filter bar offered
that blob as a single "choice," and `/events`' `?sub=` filter plus
`/daven`'s `schedules`+`daily` lookup compared a string against an array.

## Decision

The CMS field type wins — the office already retagged everything, and
multi-tagging (one shiur is both `Gemara` and `Sunday`) is strictly more
useful for filtering than one value. Code adapted to the field, not reverted:

- `Flyer.subCategory` is `string[]`. `getFlyers()` normalizes on read
  (legacy plain string → one-element array, empty array → `undefined`) so
  templates can keep simple truthiness guards.
- The optional `subCategory` filter runs **in memory** after the category
  query, not via the DB's `hasSome` — see #038: `hasSome` is case-sensitive
  and office-entered tags mix case.
- `uniqueSubCategories()` flattens across flyers — every distinct tag becomes
  a filter chip.
- `/learn` cards carry their tag list in `data-sub` (joined with `|`; tag
  values must therefore never contain a pipe) and the multi-select filter
  shows a card when **any** of its tags is selected (OR semantics).
- `/events` `?sub=` matches by array membership; cards on both pages render
  tags as individual small gold pills.

## Consequences

- Tags may not contain `|` (used as the `data-sub` delimiter on `/learn`).
- CONTRIBUTING.md `Flyers` schema updated in the same change.
- Tag identity, grouping, and the filter-panel UI are refined in
  [#038](038-tag-groups-and-case-insensitivity.md).

## Verification

Live CMS queried via the Wix API to confirm every row now stores an array;
`npm run build` passes; `/learn` and `/events` render individual pills and the
filter chips list each tag once.
