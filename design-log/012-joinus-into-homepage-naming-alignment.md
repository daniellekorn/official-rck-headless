---
id: "011"
title: "Merge JoinUsCards into HomePage; align Homepage naming"
date: 2026-05-28
status: shipped
---

## Context

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

## Files changed

- `src/lib/homepage.ts` — renamed `HomePageContent` → `HomepageContent`, `getHomePage` → `getHomepage`; added `joinUsCard{1,2,3}*` fields
- `src/lib/join-us-cards.ts` — deleted
- `src/pages/index.astro` — removed `getJoinUsCards` import/call; derives join-us cards from `homepage` fields
- `CONTRIBUTING.md` — updated content table, `HomePage` schema, removed `JoinUsCards` schema section
