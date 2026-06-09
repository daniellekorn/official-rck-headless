# 019 — Rename the split-section CMS fields to position-based names

**Status:** implemented
**Date:** 2026-06-09
**Author:** claude-session
**Related:** #001 (CMS-driven content), #018 (layout config fields)

## Background

The homepage has two stacked "image + text" bands, rendered by `SplitFeature`.
Their CMS fields were named after what the bands *currently say* —
`uniqueImpactful*` (the "UNIQUE / IMPACTFUL" band) and `torahVision*` (the
"TORAH / VISION" band).

## Problem

Content-shaped names lie the moment the content changes. If the office
repurposes the second band into, say, an events teaser, every field still
reads `torahVision…` — misleading both in the dashboard label and in the field
key Claude uses for connector edits. The names encode a meaning the editor is
free to change.

## Design

Rename both bands to position-based, content-neutral keys:

| Old prefix | New prefix |
|---|---|
| `uniqueImpactful` | `imageTextSection1` |
| `torahVision` | `imageTextSection2` |

Eight fields per band (`EyebrowGold`, `EyebrowNavy`, `TitleLine1`, `TitleLine2`,
`Body`, `Image`, `ImageOn`, `AccentLine`). Dashboard display names become
"Section 1 — …" / "Section 2 — …". "Section 1" is the first band top-to-bottom,
"Section 2" the second. Dropped "With" from the editor's suggested
`imageWithTextSection1` to keep combined keys readable.

## Questions and Answers

- **Q:** Rename the field *keys*, or just the dashboard *display names*?
  **A:** Both. Display names fix what the editor sees while clicking; but the
  keys also surface in the Claude/connector editing path (and the editor guide),
  so a content-shaped key is misleading there too. Renamed both.

- **Q:** How to avoid breaking the live (released) site, which still reads the
  old keys?
  **A:** Non-destructive migration. Create the new fields, copy the existing
  row's values across, and ship code that reads the new key with a fallback to
  the legacy key (`new ?? legacy`). The old fields are **not** deleted by this
  change — they're removed only after the rename is released and verified, so a
  released-but-not-yet-redeployed production never loses content.

## Trade-offs

During the transition the dashboard shows both the new "Section 1/2 —" fields
and the legacy `Unique/Impactful…`/`Torah Vision…` fields. The editor should
ignore the legacy ones; they get deleted post-release. The code fallback means
an empty new field still renders legacy content rather than the hardcoded
default.

## Verification

`astro check` clean (the lone `process` error in `astro.config.mjs` is
pre-existing and unrelated). All 16 new fields created on the HomePage
collection and all 16 values migrated from the legacy keys. `homepage.ts` reads
new-with-legacy-fallback; `index.astro` consumes `imageTextSection1` /
`imageTextSection2`. No remaining `uniqueImpactful`/`torahVision` references in
code except the intentional fallback lookups. CONTRIBUTING.md schema + "what you
can change" tables updated.

## Follow-up (not done in this change)

Delete the 16 legacy fields (`uniqueImpactful*`, `torahVision*`) from the
HomePage collection **after** this ships via `wix release` and the homepage is
verified. Until then they remain as the fallback source.
