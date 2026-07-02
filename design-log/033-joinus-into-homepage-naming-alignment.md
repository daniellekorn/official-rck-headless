# 033 — Merge JoinUsCards into HomePage; align Homepage naming

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md), [#011](011-contact-info-collection.md), [#018](018-homepage-layout-config-fields.md)

> **Renumbered 2026-07-02:** this entry originally shipped as a second `012`
> (its frontmatter even claimed `011`, which was already taken). Filed here as
> 033 per the numbering rule — content unchanged, date kept. Cross-references
> to "#012 (JoinUs into homepage)" in #016 and #023 now point here; plain
> "#012" still means [012-learn-page](012-learn-page.md).

## Background

Two issues were cleaned up together because they both touch the `HomePage` collection definition:

1. **Naming inconsistency** — the Wix collection IDs `HomePage` (capital P, implying "Home Page") and `HomepageSlides` (lowercase p, implying "Homepage" as one word) were inconsistent. TypeScript symbols throughout the codebase now use the `Homepage` convention (`HomepageContent`, `getHomepage`) to match `HomepageSlides`. The actual Wix collection ID `"HomePage"` is kept as-is in `COLLECTION_ID`; only the display name in the Wix dashboard needs to be manually updated to "Homepage" for visual consistency.

2. **JoinUsCards collection eliminated** — the `JoinUsCards` collection held exactly 3 rows, always shown in the same order, with no reorder/hide logic needed in practice. Keeping a separate multi-row collection for 3 static items added complexity (extra SDK query, extra lib module, extra editor screen). The 12 fields (`joinUsCard1Title/Subtitle/Href/Icon` × 3) are now flat fields on the single `HomePage` row. The fallback in `JoinUs.astro` still fires when the fields are empty, so the page renders correctly before the Wix fields are populated.

## Decision

Fold into `HomePage`. No `active`/`sortOrder` needed — if a card slot should be hidden, leave its `title` empty and the page filter drops it, falling back to hardcoded defaults if all three are empty.

## Wix dashboard changes required

- Add the 15 new fields to the `HomePage` collection (see CONTRIBUTING.md schema).
- Populate the three card slots from the values previously in `JoinUsCards` rows.
- The old `JoinUsCards` collection can be left in place or deleted — the code no longer queries it.
- Update the `HomePage` collection display name from "Home Page" to "Homepage" for visual alignment with "Homepage Slides".
