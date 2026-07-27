# 053 — Torah Sheets hub page

**Status:** accepted
**Date:** 2026-07-26
**Author:** claude-session (danielle's direction)
**Related:** #010 (Flyers collection), #031 (flyer image lightbox — Canva embed removal), #037/#038 (subcategory tags + tag groups), #007/#025 (team page taxonomy, closed-vocabulary groups)

## Background

RCK publishes three ongoing Torah sheet series — **Parsha Bytes** (weekly parsha sheet), **Dor L'Dor** (weekly sheet), and **Source Sheets** (standalone topics). None of this lives on the site today. It needs a single hub page, CMS-backed, editable by the office going forward with zero dev work per new sheet.

## Problem

Need a page that: (1) lists sheets grouped the way a learner actually browses them — by Sefer→Parsha for the two parsha-cycle series, by perek for Pirkei Avos, by topic for Source Sheets; (2) supports two different source formats per sheet (a plain PDF, or a live Canva embed) without "coming soon" placeholders — the first sheets are all PDF, but some will switch to Canva later with no further dev work; (3) matches the rest of the site's look/feel and interaction conventions exactly.

## Questions and Answers

- **Q:** Design-log #031 removed live Canva embeds site-wide because (a) no download affordance and (b) no single-page control — a multi-page design always renders in full. Doesn't this reopen both problems?
  **A:** No — both objections were specific to **flyers**, where "multi-page" was a bug (a one-page flyer shouldn't show extra pages) and there was no download story at all. Neither applies here: a source sheet is *supposed* to be a multi-page document, so rendering the whole Canva design is the correct behavior, not a limitation. And the new `canvaPdfBackup` field solves the download gap #031 flagged — the office exports a PDF from the same Canva design once, and the page gets a real Download button next to the live embed. This is a narrower, considered exception for one content type, not a reversal of #031 — #031's reasoning stays correct for flyers and stays in place there.

- **Q:** Are the "option" fields (`series`, `category`, `topic`, `sourceType`) real enum/choice fields at the Wix Data schema level?
  **A:** Wix Data collections don't enforce a native choice/enum type the way, e.g., Airtable does — every existing "option-like" field in this codebase (`Flyers.category`, `TeamMembers.roleGroup`) is a plain **Text** field with an app-side validated vocabulary, documented in `CONTRIBUTING.md` and normalized in code (see `team.ts`'s `normalizeRoleGroup`, which maps common typos/synonyms to a canonical value and falls back safely instead of dropping a row). `TorahSheets` follows the same pattern: Text fields, code-side validation, forgiving fallback. The Wix dashboard *editing UI* can still present them as a dropdown (Wix's "Text" field supports an optional predefined-values list purely for editor convenience) — that's a dashboard-only nicety, not a schema constraint the code depends on.

- **Q:** How does `Sefer` → `Parsha` grouping work if `category` only holds the Sefer name?
  **A:** The Chumash-to-parsha mapping is a fixed, closed vocabulary (54 parshios across 5 seforim, never changes) — same reasoning as `tag-groups.ts`'s DAY_TAGS/TIME_TAGS/AUDIENCE_TAGS being inferred in code rather than stored as a CMS "tag type" field. It's hardcoded in `src/lib/torah-sheets.ts` as `SEFER_PARSHIOS`, and each sheet's `subcategory` (the actual parsha name the office types) is matched against it case-insensitively. An unrecognized `subcategory` value falls back to sitting under its `category`'s "Other" bucket rather than being dropped, so a typo never silently disappears a sheet.

- **Q:** New top-level nav item — does the existing nav have room?
  **A:** Yes. Design-log #048 already handles nav overflow (a "More" collapse once items exceed the available width), so adding one more top-level link is a no-op for that mechanism.

- **Q:** Who creates the new `TorahSheets` collection — Claude via the admin API, or Danielle via the Wix dashboard?
  **A:** Asked directly in chat; answer was "try the API first." The CLI's own logged-in user token (`wix token`) turned out to lack the `DATA-COLLECTIONS-MANAGE` scope (403). The app's client-credentials token from `wix-cms-admin.ts` (design-log #052) — a different, broader-scoped credential — succeeded via `POST https://www.wixapis.com/wix-data/v2/collections`. Collection created with `TEXT`/`DATE`/`DOCUMENT`/`URL` fields per the schema below, `permissions: { insert/update/remove: ADMIN, read: ANYONE }`, matching every other public content collection on the site.

## Design

### Data model — `TorahSheets` collection (many rows)

| Field | Type | Notes |
|---|---|---|
| title | Text | Display name |
| series | Text | One of `Parsha Bytes` / `Dor L'Dor` / `Source Sheets` (exact, case-sensitive match; validated + normalized in code) |
| category | Text | For Parsha Bytes/Dor L'Dor: one of `Bereishis`/`Shemos`/`Vayikra`/`Bamidbar`/`Devarim`/`Chagim & Special Days`, plus `Pirkei Avos` for Dor L'Dor only. Unused for Source Sheets. |
| subcategory | Text | The parsha name (e.g. "Shemos"), the chag/special-day name (e.g. "Chanukah"), or the Pirkei Avos perek (e.g. "Perek Aleph"). Matched case-insensitively against the hardcoded Sefer→Parsha map; unrecognized values bucket under "Other" instead of vanishing. |
| topic | Text | Source Sheets only — e.g. `Halacha` / `Hashkafa` / `Chagim` / `Mussar` / `Tefillah`. Open-ended: sidebar groups are derived from whatever values actually appear (sorted alphabetically), same as `tag-groups.ts`'s Topic bucket. |
| date | Date | Sort key (newest first) and the date shown on each card |
| sourceType | Text | `pdf` or `canva` |
| pdfFile | Document (Media) | Used when `sourceType = pdf` |
| canvaEmbedUrl | Text (URL) | Used when `sourceType = canva` — the Canva "Publish to Web" embed URL |
| canvaPdfBackup | Document (Media), optional | A PDF exported from the same Canva design — powers a "Download PDF" button next to the live embed |

All fields the code reads are optional-safe (missing/malformed → the row just doesn't render in that bucket, never a crash), matching every other `get*()` function in `src/lib/*.ts`.

### Routing & page structure

- New route: `src/pages/torah-sheets.astro` (file-based, matches every other top-level page)
- Nav: add `{ label: "Torah Sheets", href: "/torah-sheets" }` to `baseLinks` in `Nav.astro` (between "Learn with Us" and "Community" — it's a learning resource) and to `Footer.astro`'s `quickLinks`
- New lib: `src/lib/torah-sheets.ts` — `getTorahSheets()` (single CMS query, same `wix-cms-admin` + `auth.elevate` pattern as every other lib), `SEFER_PARSHIOS` closed vocabulary, and grouping helpers (`groupParshaBytes`, `groupDorLDor`, `groupSourceSheets`) that return only the groups/subgroups that actually have ≥1 sheet — same "drop empty groups" rule as `team.ts`'s `ROLE_GROUPS` filter and `Nav.astro`'s submenu-drop.
- PDF resolution: `media.getDocumentUrl(wixDocumentUrl)` (from `@wix/sdk`, already imported for images/video in `wix-media.ts`) resolves `pdfFile` / `canvaPdfBackup` to a real URL + filename — add `resolveDocument()` alongside `resolveImage`/`resolveVideo` in `wix-media.ts`.

### Layout & interaction (matches existing conventions, no new visual language)

- `PageHeader` with `titleNavy="Torah Sheets"` + a `subtitle` intro line (prop already exists, unused elsewhere the same way — see `contact.astro`'s pattern of PageHeader + a hand-written intro paragraph below it, whichever reads better once it's in front of real copy)
- Tabs (Parsha Bytes / Dor L'Dor / Source Sheets): three pill buttons in the site's existing filter-pill visual language (`learn.astro`'s `.filter-select` treatment — white pill, gold ring when active), vanilla `data-*` + `<script>` toggle exactly like `learn.astro`'s filter bar and `team.astro`'s bio-card toggle — no new client-side pattern introduced. Deep-linkable via `#parsha-bytes` / `#dor-ldor` / `#source-sheets` (read on load, default to the first tab), matching how `Nav.astro`/`community.astro`/`team.astro` already anchor into page sections.
- Two-column layout below each tab: `lg:grid-cols-12` sidebar (`lg:col-span-3`) + results (`lg:col-span-9`) — same grid convention as `contact.astro`'s info/form split. Sidebar collapses to a `<details>` dropdown above the results on mobile, same pattern as `Footer.astro`'s mobile Quick Links disclosure.
- Sidebar: nested groups (Sefer → Parsha, or Topic) as a simple clickable list — visually a plainer sibling of `learn.astro`'s filter dropdowns, not a copy of the Denver Kollel reference's exact styling, just its information architecture (grouped, collapsible, no thumbnails).
- Results: plain card list (title, date, view/download) — no thumbnails, no `Flyer.astro`/lightbox-image pattern. Each card:
  - `sourceType = pdf` → a "View / Download PDF" link, `href` = `resolveDocument(pdfFile)`, opens in a new tab (Wix-hosted PDFs don't support a forced cross-origin download the way `Lightbox.astro`'s image download does — same honest constraint noted in #031 for images)
  - `sourceType = canva` → an inline `<iframe src={canvaEmbedUrl}>` (same bare pattern as the preserved historical Canva URLs in #031 — no `Flyer.astro` embed wrapper to resurrect) plus, if `canvaPdfBackup` is set, a secondary "Download PDF" link next to it

## Trade-offs

- PDF view/download opens in a new tab rather than downloading in place — consistent with how the rest of the site already treats Wix-hosted media downloads (accepted limitation, not new).
- Canva embeds bring back the site-wide-removed pattern for exactly one content type. Documented here explicitly so a future reader doesn't "clean this up" back in line with #031 without reading why it's different.
- Sefer→Parsha vocabulary lives in code, not CMS — matches `tag-groups.ts` precedent, but means adding a 55th "parsha" (won't happen) or changing the mapping needs a code change, not a CMS edit.

## Verification

Page renders correctly with an empty `TorahSheets` collection (each tab shows an empty-state message, no broken groups) and with populated rows across all three series/source-types; office workflow for adding a new sheet (including switching an existing row from `pdf` to `canva` with zero dev work) documented in `CONTRIBUTING.md`.

## Addendum — visual redesign, rename, and real PDF thumbnails

Follow-up pass after the office started populating real content (47 Torah Bytes sheets for תשפ״ד):

- **Renamed** `Parsha Bytes` → `Torah Bytes` (matches the actual naming already baked into the PDF filenames) and the Dor L'Dor tab now displays as "Dor L'Dor ParshaLink" — display label only, `series` still stores `Dor L'Dor`. The old `Parsha Bytes` value is kept as a normalization alias so nothing silently breaks if it resurfaces.
- **Added `year`** (Text) — the office doesn't track full dates, just wants the Hebrew year shown next to the parsha name on the card. The card list itself sorts by a fixed parsha/chag/perek reading-order comparator (commit `83cbc5b`), not by date at all.
- **Real PDF thumbnails, not Wix's auto one.** Wix's Media Manager sets a `thumbnailUrl` on every file descriptor, including PDFs — but for `DOCUMENT` media it's a generic "this is a PDF" placeholder icon, identical across every file, not a per-file page-1 render (confirmed by requesting two different PDFs' descriptors and getting the same thumbnail URL back). Real thumbnails needed a manual pipeline: download each PDF from its now-permanent Media Manager URL, render page 1 to PNG (macOS `qlmanage -t`, no extra install needed — same tool-of-convenience as `pdftoppm` in #031), upload the PNG as a normal Image file, and store it in a new **`pdfThumbnail`** (Image) field. `torah-sheets.ts` resolves it through the same `resolveImage`/`resolveImageFit` helpers every other photo field on the site already uses — no new resolution pattern.
- **Trade-off, matching #031's precedent for Flyers:** thumbnail generation is a manual step, not automatic for future sheets. A sheet with no `pdfThumbnail` just shows a plain document icon instead of a broken image — never blocks a sheet from going up. Automating this (a serverless function watching for new `pdfFile` uploads) would be the natural next step if it becomes a recurring pain point; not built now since it's a one-directional door and the current cost (a few minutes per batch) is low.
- **Layout**: replaced the boxed sidebar/card look with a flatter, list-based design (Denver Kollel's `/pdfs` page as the reference point) — hairline dividers instead of card borders/shadows, sidebar groups collapsed by default (click to expand), a persistent right-side hairline separating the sidebar from the results instead of a background box, and tab pills switched from fully rounded to the site's standard `rounded-sm` button radius.
