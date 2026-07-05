# 038 — Flyer tags: case-insensitive identity + grouped filter panel

**Status:** implemented
**Date:** 2026-07-05
**Author:** claude-session (danielle directing)
**Related:** [#037](037-flyers-subcategory-tags-field.md), [#012](012-learn-page.md)

## Problem

After #037 every distinct tag became a filter chip, which produced a flat wall
of ~28 chips on `/learn` — topics, audiences, weekdays, and times all jumbled
in one alphabetical strip. Separately, tag identity was case-sensitive, so
`daily` and `Daily` (both present in office-entered data) were two different
tags.

## Decision

**Case-insensitivity is handled in code, on read.** `normalizeTags()` in
`flyers.ts` lowercases, trims, and dedupes every tag, so identity is
case-insensitive everywhere downstream (chips, card matching, `?sub=` links,
the Daven `daily` lookup). Because the DB's `hasSome` operator *is*
case-sensitive, the optional `subCategory` filter in `getFlyers()` moved from
the query to an in-memory `.includes()` over the normalized tags — cheap,
since we already fetch the whole category (≤100 rows) to apply the
`removeAfter` filter. Display re-capitalizes via CSS `text-transform:
capitalize` (which also capitalizes after hyphens: `motzei-shabbos` →
"Motzei-Shabbos"). The CMS rows themselves are left untouched.

**Tag grouping is inferred in code, not stored in the CMS.** A new
`src/lib/tag-groups.ts` splits tags into four rows — Topic / Audience / Day /
Time. Day, Time, and Audience are closed vocabularies (weekdays +
daily/shabbos/motzei-shabbos; morning/afternoon/evening/night;
men/women/boys/girls/kids/teens/youth/family/community); anything
unrecognized falls back to **Topic**, the open-ended group. Rejected
alternative: a "tag type" field or mapping collection in the CMS — that would
make the office classify every tag by hand, and a mistyped group name fails
silently (the exact failure mode CONTRIBUTING.md warns about). The closed
vocabularies are stable enough to live in code; the cost is that a new
*audience-like* tag (say `seniors`) shows under Topic until the vocabulary
array gains a word — a one-line code change.

**Filter UI:** `/learn`'s filter strip became a white panel card with one
labeled row per group. Day and Time rows keep semantic order (Sunday→Friday,
morning→night) instead of alphabetical. The "All" chip is replaced by a
"Clear all" button that appears only while filters are active (kept
`invisible`, not `hidden`, to avoid layout shift). Multi-select OR semantics
from #037 are unchanged. On mobile the expanded rows measured ~500px tall —
taller than the fold — so below the `sm` breakpoint the rows collapse behind
a Show/Hide disclosure (49px collapsed) while desktop always shows them
(`hidden sm:flex` + a `sm:hidden` toggle, with `aria-expanded`).

## Consequences

- Tags render lowercase in the model; anything displaying a tag must apply
  its own capitalization (both current sites of display use CSS `capitalize`).
- `/events` still uses its simpler flat single-select link filter — only two
  (inactive) event rows exist today; regroup it if event tagging grows.
- New audience/day/time-like tags outside the vocabularies land under Topic;
  extend the arrays in `tag-groups.ts` when the office coins one.

## Verification

`npm run build` + `astro check` pass; dev server against live CMS shows
grouped rows on `/learn` with `daily`/`Daily` collapsed to a single Day chip,
and the Daven page still resolves its `schedules` + `daily` flyer.
