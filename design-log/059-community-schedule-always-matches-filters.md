# 059 — Community Schedule bypasses /learn's filter panel

**Status:** implemented
**Date:** 2026-08-02
**Author:** claude-session (Yosef directing)
**Related:** #038 (filter panel groups), #057 (linkedFlyerTitle exact-title matching precedent)

## Background

`/learn`'s filter panel (`src/pages/learn.astro`) applies AND logic across
active tag selections — a flyer must match every currently-picked filter to
show (`src/pages/learn.astro`'s client `apply()`). The "Community Schedule"
row (`Flyers`, category `learning`) is only tagged `Schedule`/`Daily`, so
picking e.g. "Men" or "Evening" hides it like any other non-matching flyer.

## Problem

Yosef wants the community schedule to be reachable no matter what a visitor
filters by — it's the one flyer that answers "what's on, generally" regardless
of audience/day/time/topic, so it should never disappear behind a filter, and
should lead the results when it is showing alongside filtered matches.

## Questions and Answers

- **Q:** Tag the row with every possible filter value so it matches
  everything?
  **A:** Rejected — fragile (a new tag added to the vocabulary later, e.g. a
  new Topic tag, wouldn't automatically apply retroactively) and would pollute
  the filter-count badges with a match that isn't really about that tag.
- **Q:** Identify the row by a stable ID/new boolean CMS field, or by its
  exact `title` text?
  **A:** Exact title (`"Community Schedule"`), matching the existing
  precedent set by #057's `linkedFlyerTitle` — this codebase already accepts
  title-as-key for this exact row. A new boolean field would be more robust to
  a rename, but adds CMS schema surface for a single special-cased row; not
  worth it unless a second row needs the same treatment.
- **Q:** Reorder via CMS `displayOrder`, or in code?
  **A:** In code (DOM reorder in the client script), not `displayOrder`. The
  ask was specifically about the *filtered* result set having Community
  Schedule first; changing `displayOrder` would also reorder the plain,
  unfiltered `/learn` grid, which wasn't requested and isn't obviously wanted.

## Design

- `src/pages/learn.astro`: the flyer card whose `title === "Community
  Schedule"` gets `data-always-match="true"` (server-rendered).
- Client script: on load, that card is `grid.prepend()`-ed to the front of
  `[data-flyer-grid]`, once — it's always visually first regardless of filter
  state. In `apply()`, `card.dataset.alwaysMatch === "true"` short-circuits the
  per-card AND-match check, so the card is never hidden by any filter
  combination.

## Trade-offs

- Renaming the `Flyers` "Community Schedule" row silently breaks this (the
  card becomes a normal filterable flyer, no error) — the same fragility
  #057 already accepted for `linkedFlyerTitle`. Documented in `CONTRIBUTING.md`
  next to the existing rename warning.
- `CONTRIBUTING.md`'s `subCategory` row previously said a flyer shows when
  **any** selected tag matches — that was already stale (the code has always
  used AND/`every`); corrected while touching this row of the doc.

## Verification

Verified in dev: with the "Community Schedule" card present, selecting any
single filter tag (including ones it isn't tagged with) still shows it, first
in the grid, alongside the filtered matches; clearing filters leaves it first
too. `astro check`: no new errors.
