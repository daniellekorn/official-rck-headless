# 062 — Second Taharas rabbi + every named rabbi links to his /team bio

**Status:** implemented
**Date:** 2026-08-24
**Author:** claude-session (yosef directing)
**Related:** [#047](047-community-page.md), [#049](049-community-content-refinements.md), [#061](061-community-page-aliya-faq.md), [#025](025-team-page-two-sections.md) (`/team#leadership` / `/team#avreichim` anchors)

## Background

Yosef asked for two things on `/community`:

1. A second English-speaking rav under Rabbi Horwitz in the Taharas HaMishpacha topic — Rabbi Yosef Postelnek, with his own phone and address — and the Beis Din phone number's font size brought down to match the (smaller) Taharas phone size.
2. Mid-session, three more additions in the same spirit: a second Meals contact (Rabbi Yisroel Zaslow, alongside Yael Bernstein), the Aliya topic's "Contact **Rabbi Isaac Bernstein** with any questions" sentence split onto its own line, and — the broadest ask — **every rabbi named anywhere on this page should be a link to his `/team` bio, with a hover color change**.

## Design

**New `CommunityPage` fields:** `taharasEnglishRabbi2Name` / `taharasEnglishRabbi2Phone` / `taharasEnglishRabbi2Address`, same shape as the existing `taharasEnglishRabbi*` fields, rendered right under the first English rabbi in the same column (divider + `mt-5` gap), hidden entirely when empty. Seeded with Rabbi Yosef Postelnek (0557738379, "13 Har Sinai, Apartment 5" — Ra'anana is intentionally omitted from the stored/displayed address per `src/lib/maps.ts`'s `withRaanana()`, which appends it only to the map-query URL, never to on-page text).

**Rabbi → `/team` linking, made systematic.** `/team` has exactly two bio sections (`#leadership` / `#avreichim`, see #025) and no per-person anchor, so "link to his bio" means "scroll to whichever section his `TeamMembers` row is actually in." Added a `TEAM_ANCHOR = { leadership: "/team#leadership", avreichim: "/team#avreichim" }` const and a shared `rabbiLinkClass` in `community.astro`, and pointed every rabbi mention at the correct one (checked live against `TeamMembers` rather than assumed):

- Taharas English/Hebrew rabbi names, Beis Din contact name — already links, previously hardcoded to `/team#leadership` for all three. Still correct for Horwitz/Yogel (both `Leadership`), now routed through `TEAM_ANCHOR.leadership` instead of a literal string.
- Taharas 2nd rabbi (Postelnek, `Avreich`) — new, `TEAM_ANCHOR.avreichim`.
- Aliya contact (Rabbi Isaac Bernstein, `Avreich`) — previously a plain unlinked `<span>`; now a link, `TEAM_ANCHOR.avreichim`.
- Meals 2nd contact (Rabbi Yisroel Zaslow, `Avreich`) — new, `TEAM_ANCHOR.avreichim`.

Non-rabbi names (Yael Bernstein for Meals, Saul Kaplan the gabbai) are untouched — the ask was specifically about rabbis, and neither has a `TeamMembers` bio to link to anyway. The gabbai's existing link to the contact page (not `/team`) is also untouched — different purpose, out of scope here.

**Meals 2nd contact.** Same hardcoded-fallback pattern as `MEALS_CONTACT` (see #047/#049 precedent — no CMS field, promote later if it needs to be office-editable): `MEALS_CONTACT_2 = { name: "Rabbi Yisroel Zaslow", phone: "053-347-8419" }`, rendered as a second "Or **{name}**" line with its own Call/WhatsApp buttons directly under Yael Bernstein's line.

**Aliya sentence split.** "We would love to help! Contact **Rabbi Isaac Bernstein** with any questions." is now two `<p>` elements instead of one — the contact sentence reads as its own line, matching what Yosef asked for.

**Beis Din phone size.** The Beis Din contact phone link had no explicit text size (inheriting the panel's base size) while every other contact phone on this page is `text-sm`. Added `text-sm` to match.

## Trade-offs

Same as #049/#061: `MEALS_CONTACT_2` and the Aliya contact are code, not CMS — if either rav's number changes, it's a code edit, not a dashboard edit. Consistent with the existing precedent for this page, not a new pattern.

## Verification

`astro check` clean for `community.astro` (the one pre-existing `index.astro` error predates this change). Rendered the page via `npm run dev` and confirmed in the raw HTML: both Taharas English rabbis render with their own tel/address blocks and `/team#avreichim` + `/team#leadership` links respectively; the new Zaslow meals line and split Aliya paragraph render with working tel/wa.me links and a `/team#avreichim` link; the Beis Din phone link carries `text-sm`. Cross-checked every named rabbi's actual `roleGroup` against the live `TeamMembers` collection rather than assuming — Horwitz and Yogel are `Leadership`, Postelnek/Bernstein/Zaslow are `Avreich`.
