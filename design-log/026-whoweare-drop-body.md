# 026 — "Who We Are": drop the body paragraph

**Status:** implemented
**Date:** 2026-06-24
**Author:** claude-session (danielle directing)
**Related:** [#015](015-history-timeline.md), [#001](001-cms-driven-content-architecture.md)

## Decision

The "Who We Are" / history timeline section keeps only a **title** and a **subtitle** (the Hebrew Pirkei Avot tagline). The descriptive body paragraph is removed — the timeline itself now carries the section, and the extra prose read as filler above it.

## Changes

- `src/components/WhoWeAre.astro` — removed the `body` prop and its paragraph markup. Component now takes `title`, `hebrew`, `entries`.
- `src/pages/index.astro` — dropped `body={homepage?.whoWeAreBody}` from the `<WhoWeAre>` call.
- `src/lib/homepage.ts` — removed `whoWeAreBody` from `HomepageContent`.
- `CONTRIBUTING.md` — removed the `whoWeAreBody` row from the HomePage field table; noted `whoWeAreHebrew` is the subtitle.
- **CMS schema:** deleted the `whoWeAreBody` field from the `HomePage` collection on the "RCK Official Headless" site (`3360b9e1…`) via the Data Collections `delete-field` API. Remaining who-we-are fields: `whoWeAreTitle`, `whoWeAreHebrew`.

## Notes

Field deletion also deletes its stored value — irreversible, and done deliberately at the user's request. The `imageTextSection*Body` fields on the two SplitFeature bands are unrelated and untouched.
