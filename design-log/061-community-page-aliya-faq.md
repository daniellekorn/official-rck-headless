# 061 — Community page: new "Just made Aliya?" FAQ topic

**Status:** implemented
**Date:** 2026-08-17
**Author:** claude-session (yosef directing)
**Related:** [#047](047-community-page.md), [#049](049-community-content-refinements.md)

## Background

Yosef asked for a fifth `/community` FAQ accordion topic — "Just made Aliya? Questions?" — with fixed welcome copy and a single contact (Rabbi Isaac Bernstein) reachable via Call/WhatsApp buttons, dictated in the same shape as the existing Meals topic's fallback contact.

## Problem

Same fork as #049: is this CMS-editable content, or fixed code copy with a name/number spliced in?

## Questions and Answers

- **Q:** Add `CommunityPage` fields (`aliyaContactName`, `aliyaContactPhone`) like the gabbai/Beis Din topics, or hardcode?
  **A:** Hardcoded, following the *other* existing precedent in this same file — `MEALS_CONTACT` (`community.astro`), a hardcoded `{ name, phone }` fallback used while `mealsFamilyName` is unpopulated. Yosef gave the full wording and the contact verbatim as fixed content, same as #049's gabbai/Beis Din sentences; no indication the office needs to change the contact without a code edit. If that changes, promote to real `CommunityPage` fields the same way `mealsFamilyName`/`mealsPhone` would replace `MEALS_CONTACT` once populated.
- **Q:** Where in the topic order?
  **A:** Second, right after Meals — both are "welcoming a newcomer" topics, grouped together ahead of the more administrative Gabbai/Taharas/Beis Din topics. Gabbai/Taharas/Beis Din comments renumbered 2→3, 3→4, 4→5 accordingly; no CMS or field renumbering involved, comment-only.

## Design

New `<details id="aliya">` block in `community.astro`, same accordion chrome (`detailsClass`/`summaryClass`/`questionClass`/`chevronClass`/`panelClass`) as the other four topics. A new `ALIYA_CONTACT = { name: "Rabbi Isaac Bernstein", phone: "053-216-4727" }` constant sits next to `MEALS_CONTACT`, reusing the same `telHref`/`whatsappHref` helpers and the identical Call/WhatsApp button markup (SVGs included) as the Meals topic's fallback branch. No new CMS fields, no new `community.ts` code.

## Trade-offs

Same as #049's: the contact and wording are now a code change, not an office CMS edit, if they ever need to change.

## Verification

`astro check` clean (same one pre-existing, unrelated `index.astro` error as before this change). Confirmed the new topic renders between Meals and Gabbai with working `tel:`/`wa.me` links, and that the four renumbered comment labels match their actual position.
