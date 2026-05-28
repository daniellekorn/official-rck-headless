# 011 — ContactInfo CMS collection for footer contact details

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** #001 (content/code boundary)

## Background

The Footer component contained entirely hardcoded placeholder content: a fake address, placeholder phone and email, and five social links all pointing to `#`. Contact details and social links are exactly the kind of operational content the office needs to update without a code PR.

## Problem

No CMS path existed for address, phone, email, or social links. When real contact details are available, updating them would require a code PR — wrong abstraction for content the office owns.

## Questions and Answers

- **Q:** `SiteSettings` vs. `ContactInfo`?
  **A:** `ContactInfo` — more semantically precise and matches how an editor thinks about the data. `SiteSettings` implies a generic catch-all that could accumulate unrelated fields.

- **Q:** Separate collection for social links (one row per platform) vs. inline fields on ContactInfo?
  **A:** Inline fields. The set of platforms is finite and structurally identical — there's no benefit to a separate collection for 5 optional URL strings. A one-row-per-platform approach would add query complexity for no gain.

- **Q:** Should inactive social platforms use an `active` boolean or just an empty URL field?
  **A:** Empty URL = hidden. No separate boolean needed. Consistent with how optional fields work elsewhere in this project.

- **Q:** Should the footer tagline ("A Sacred Home for Growth and Shared Connection") move to ContactInfo?
  **A:** No. It reads as brand voice, not operational content — similar to the hero lockup decision in [#009](009-rck-brand-identity.md). It stays hardcoded.

## Design

**Collection name:** `ContactInfo` — single row, like `HomePage`.

| Field | Wix type | Notes |
|---|---|---|
| `address` | TEXT | Full address. Rendered as-is; use newlines if needed. |
| `phone` | TEXT | Display string (e.g. "+972 9-123-4567"). Code strips spaces/hyphens for the `tel:` href. |
| `email` | TEXT | Rendered as both display text and `mailto:` href. |
| `facebookUrl` | TEXT | Full URL. Leave empty to hide the icon. |
| `instagramUrl` | TEXT | Full URL. Leave empty to hide the icon. |
| `youtubeUrl` | TEXT | Full URL. Leave empty to hide the icon. |
| `twitterUrl` | TEXT | Full URL. Leave empty to hide the icon. |
| `linkedinUrl` | TEXT | Full URL. Leave empty to hide the icon. |

**Service module:** `src/lib/contact-info.ts` — exports `getContactInfo(): Promise<ContactInfo | null>`.

**Footer behavior when CMS is empty:** address, phone/email block, and social icons are all hidden (each guarded by a conditional). The tagline and copyright line always render. No broken layout on an empty collection.

**Permissions:** "Anyone can read."

## Trade-offs

- **Footer self-fetches.** Rather than having every page query ContactInfo and pass it as props, `Footer.astro` calls `getContactInfo()` in its own frontmatter. This avoids touching every page file, at the cost of the component not being purely prop-driven. Acceptable: Footer is a layout primitive used identically on every page, not a reusable content component.

## Implementation Results

- `src/lib/contact-info.ts` — new service module
- `src/components/Footer.astro` — now CMS-driven; all placeholder content removed
