# 018 — Editor-configurable layout knobs on the homepage split sections

**Status:** implemented
**Date:** 2026-06-09
**Author:** claude-session
**Related:** #001 (CMS-driven content), #009 (brand-vs-content boundary)

## Background

Yosef (the non-technical collaborator) asked to do more of the editing himself.
Most *content* is already CMS-driven, but *layout* choices on the homepage's two
`SplitFeature` sections — which side the photo sits on, and which headline line
gets the animated gold marker — were hardcoded as props in `index.astro`. These
are exactly the kind of low-risk, high-satisfaction knobs an editor can own
without a code PR, and the `SplitFeature` component already accepted them as
props (`imageOn`, `subheadAccent`). They just weren't wired to the CMS.

## Problem

Flipping a photo from left to right, or moving the highlight to a different line,
required a developer + a PR. That is disproportionate effort for a reversible,
purely visual toggle.

## Questions and Answers

- **Q:** Add a font-size knob too (the original ask mentioned it)?
  **A:** No. A per-block font-size field is a real footgun for visual
  consistency — it lets the page drift off the type scale defined in
  `global.css`. The two knobs we shipped are constrained enums (left/right,
  line1/line2) that can't make the page look broken. Decided with Danielle.

- **Q:** Add a section show/hide toggle?
  **A:** Deferred. It introduces empty-state edge cases (pager dots, section
  reveal animation) that aren't worth it for sections that are always shown today.

- **Q:** Free-text fields or a real enum/dropdown in the CMS?
  **A:** Text fields, normalized forgivingly in code (`normalizeImageOn`,
  `normalizeAccentLine` in `src/lib/homepage.ts`). Wix's create-field API made
  plain TEXT the path of least resistance, and the normalizers accept `Left`,
  `RIGHT`, `first`, `second`, etc., so a typo degrades to the default rather
  than breaking the page.

## Design

Four new TEXT fields on the `HomePage` collection:

| Field | Values | Empty falls back to |
|---|---|---|
| `uniqueImpactfulImageOn` | `left` / `right` | `left` |
| `uniqueImpactfulAccentLine` | `line1` / `line2` | `line2` |
| `torahVisionImageOn` | `left` / `right` | `right` |
| `torahVisionAccentLine` | `line1` / `line2` | `line2` |

`src/lib/homepage.ts` exports `normalizeImageOn(value, fallback)` and
`normalizeAccentLine(value, fallback)`; `index.astro` calls them and passes the
result to `SplitFeature`'s existing `imageOn` / `subheadAccent` props. No change
to `SplitFeature.astro` itself.

The fallbacks are the *exact* values that were previously hardcoded, so the page
renders identically when the fields are empty.

## Trade-offs

Layout is now split across two places (CMS values + the component that consumes
them). That's the intended cost of the content/code boundary — same as every
other CMS-driven knob. The normalizers are the seam that keeps a bad CMS value
from reaching the component.

## Verification

`astro check` clean (the one pre-existing `process` error in `astro.config.mjs`
is unrelated). The four fields were created live on the RCK Official Headless
CMS and the single HomePage row was pre-filled with the current live values
(`left`/`line2`/`right`/`line2`), so the dashboard shows real state, not blanks.
Empty fields fall back to the previous hardcoded layout, so the page is
unchanged until an editor flips a value. CONTRIBUTING.md HomePage schema table
updated.

## Implementation Results

- Code: `src/lib/homepage.ts` (interface + two normalizers), `src/pages/index.astro` (wiring).
- CMS: four TEXT fields added to `HomePage` via the Data Collections
  `create-field` API; HomePage row pre-filled with current layout values.
- Docs: CONTRIBUTING.md "What you can change" table + HomePage schema table.
- A plain-language editor guide for Yosef was written to Google Docs (covers what
  a CMS is, the two editing paths, and these knobs).
