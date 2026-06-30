# 030 — Hero background: one source of truth (HeroMedia supersedes heroImage)

**Status:** accepted
**Date:** 2026-06-30
**Author:** claude-session (danielle directing)
**Related:** #029 (introduced HeroMedia), #009 (heroTitle deprecation precedent), #001 (content/code boundary)

## Background

#029 added the `HeroMedia` collection for a crossfading image/video hero
sequence, but kept `HomePage.heroImage` as a **fallback**: the hero used
`HeroMedia` when it had rows, else `heroImage`. Both fields fed the hero.

## Problem

Two CMS fields controlling "the hero background" is confusing for the office:
the precedence (`HeroMedia` overrides `heroImage`) is invisible in the dashboard,
so an editor could set `heroImage`, see no change once `HeroMedia` has rows, and
not know why. The fallback was a developer convenience, not an editor-legible
model. (Raised by danielle on seeing both in the CMS.)

## Decision

`HeroMedia` is the **single source of truth** for the hero background. The hero
reads `HeroMedia` only; `HomePage.heroImage` is no longer read.

- A collection (not `HomePage` fields) is still correct: the hero is now a
  variable-length ordered list of mixed image/video slides — the same
  one-row-per-item shape as `OurHistory`, `PastEvents`, `YouthPrograms`,
  `Flyers`. A single image is just a one-row `HeroMedia`.
- `HomePage.heroImage` (and `heroImageUrl`) are kept in the schema but
  **unused**, exactly like `heroTitle` (#009) — removing a CMS field is more
  disruptive than leaving a documented dead field.
- The current `heroImage` value was **migrated** into a `HeroMedia` image row
  (`sortOrder` 1, `active` true) so the homepage is visually unchanged.
- Empty `HeroMedia` now falls through to the brand **gradient placeholder** (not
  `heroImage`). After migration it isn't empty, so this is only the
  nothing-configured state.

## Trade-offs

- The dead-simple "set one image field on HomePage" path is gone; even a single
  static hero image is now a one-row `HeroMedia` entry. Acceptable — the office
  already manages every other list this way, and it removes the two-places
  ambiguity.
- `heroImage` lingering in the schema is mild clutter, mitigated by the doc +
  comment marking it legacy.

## Verification

After migration, the homepage hero renders the same image via `HeroMedia` (one
slide layer; the old `-z-10` single-image branch is gone). `astro check` passes.
`CONTRIBUTING.md` updated (heroImage marked legacy; HeroMedia is the hero
background source for single image or sequence).

## Implementation Results

- `src/components/Hero.astro` — dropped the `imageUrl` prop and its branch; hero
  is now `slides` → gradient placeholder.
- `src/pages/index.astro` — stopped passing `imageUrl`.
- `src/lib/homepage.ts` — `heroImage`/`heroImageUrl` marked legacy/unused.
- CMS: migrated `HomePage.heroImage` → a `HeroMedia` image row.
- `CONTRIBUTING.md` updated.
