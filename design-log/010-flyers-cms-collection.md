# 010 — Flyers CMS collection

**Status:** accepted
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** #001 (content/code boundary)

## Background

The office wants to publish event flyers, schedules, program announcements, and youth programming materials on the site without code changes. Two types of flyers exist: live Canva designs (always current — updated in Canva, no re-upload needed) and static PDFs (permanent or semi-permanent reference documents).

## Problem

No CMS structure exists for flyer content. Without it, flyers would be hardcoded in components and require developer involvement to update.

## Questions and Answers

- **Q:** One collection or four (one per category: Schedules, Learning, Youth Programming, Events)?
  **A:** One collection with a `category` field. A flyer is a flyer — the categories are presentation groupings, not structurally different data shapes. Four collections would mean 4× the schema maintenance, 4 separate queries on any multi-category page, and a more complex editor dashboard. The same field can drive filtering in code.

- **Q:** Can the category field be protected so editors can't type an invalid value?
  **A:** Wix CMS does not have a native enum/select field type. Two options: (1) TEXT field with documented valid slugs, enforced only by convention; (2) Reference field to a small `FlyerCategories` lookup collection, which renders as a searchable dropdown in the dashboard — the editor physically cannot type a free-form value. We chose **TEXT with documented valid slugs** to stay consistent with how every other constrained text field in this project works (`dayType`, `service`, `icon`, `roleGroup`). The cost of a typo is that the flyer doesn't appear (because no page queries for that slug) — low-blast-radius, recoverable. If enforcement needs to get stricter, a reference field is the fallback but adds query complexity (`.include("category")`, resolving the reference ID on every filter).

- **Q:** How should Canva flyers be embedded?
  **A:** Via Canva's "Publish to Web" embed URL, not a PDF export. The embed stays live — editing the Canva design automatically updates the embed on site, with no re-upload or CMS edit needed. The `embedUrl` field stores the Canva `<iframe>` `src` value (the URL only, not the full embed tag). For non-Canva content, `pdfUrl` stores a direct PDF link rendered via Google Docs Viewer.

- **Q:** Should we automate the Canva → CMS pipeline (tag a Canva design → it appears on site)?
  **A:** No, not yet. Canva has no webhook API for tag or folder changes, and the Zapier/Make automation that would approximate it is complex for minimal gain. The manual workflow (publish in Canva → paste embed URL into CMS) adds at most 2 clicks per new flyer. Once the embed URL is in CMS, Canva handles live sync automatically.

## Design

**Collection name:** `Flyers`

| Field | Wix type | Notes |
|---|---|---|
| `title` | TEXT | Display name shown on site |
| `category` | TEXT | One of: `schedules`, `learning`, `youth`, `events` (exact slugs, lowercase) |
| `embedUrl` | TEXT | Canva "Publish to Web" iframe src URL. Preferred. |
| `pdfUrl` | TEXT | Direct public PDF URL. Fallback for non-Canva docs. Only one of the two URLs is required per row. |
| `isActive` | BOOLEAN | Show/hide without deleting. Default: true. |
| `displayOrder` | NUMBER | Sort within a category. Lower numbers appear first. |

One of `embedUrl` or `pdfUrl` must be present; a row with neither renders nothing and should be kept `isActive = false`.

**Valid category slugs:**

| Slug | Displayed as |
|---|---|
| `schedules` | Schedules |
| `learning` | Learning |
| `youth` | Youth Programming |
| `events` | Events |

**Service module:** `src/lib/flyers.ts` — exports `getFlyers(category?)` and `getFlyersByCategory()`.

**Permissions:** "Anyone can read" — same as every other public collection on this site.

## Trade-offs

- **Soft enforcement on `category`.** A typo makes the flyer silently invisible, not a crash. The four slugs are documented in CONTRIBUTING.md and in this log. Consistent with the project's existing pattern for constrained text fields.
- **No expiry date field.** Decided not to add `expiresAfter` now (for auto-hiding past-event flyers). The `isActive` toggle handles this manually. A date field can be added later if the office wants automation — it's a non-breaking schema addition.
- **No image preview field.** Flyers render as the embed itself; no thumbnail needed. If a thumbnail-grid display is added later, an `IMAGE` field can be added without breaking existing rows.

## Verification

Page queries `Flyers` collection filtered by `category` slug; items with `isActive = false` are excluded. Canva embed URL renders in an `<iframe>`; PDF URL falls through to Google Docs Viewer. Empty collection returns empty list, no error.

## Implementation Results

(To be appended after work ships.)
