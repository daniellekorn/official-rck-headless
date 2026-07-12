# 049 — Community page: content refinements, inline contact links, dropped "moving here"

**Status:** implemented
**Date:** 2026-07-12
**Author:** claude-session (danielle directing)
**Related:** [#047](047-community-page.md) (original page design, superseded in part here)

## Background

After #047 shipped, Danielle reviewed the live page and gave more specific direction: exact copy for two topics, real address/phone data for the Taharas HaMishpacha rabbonim, a request to remove the "Looking to move here?" topic entirely, and — the notable new pattern — that certain names inside the FAQ body copy (the gabbai, his wife, the Beis Din contact) should themselves be links to the contact page with a pre-set subject line, not just plain text.

## Problem

#047's `gabbaiDescription` and `beisDinDescription` were plain Rich Text fields rendered through `ricosToPlainText` (which strips all formatting/links — see `src/lib/ricos.ts`). That can't produce a sentence with a clickable name in the middle of it. Something had to give: either build rich-text-with-links parsing, or move the sentence itself into code.

## Decision

The sentence *templates* for the gabbai and Beis Din topics are now hardcoded in `community.astro`, with only the person's name pulled from a CMS field and spliced in as a link:

- Gabbai: *"Contact our gabbai, **{gabbaiName}**, regarding yahrtzeits, special simchas, and other gabbai matters. His wife, **{gabbaiWifeName}**, also leads our popular and exciting Tefillat Yeladim!"* — `gabbaiName` links to `/contact?subject=Re: Gabbi`, `gabbaiWifeName` to `/contact?subject=Re: Tefillat Yeladim` (the wife sentence is skipped entirely if `gabbaiWifeName` is empty).
- Beis Din: *"At RCK we have a professional and well-trained team of dayanim ready to serve the community with sensitivity, professionalism, and full halachic integrity. Contact **{beisDinContactName}** to schedule an appointment."* — the name links to `/contact?subject=Re: Beis Din`. Below it, a fixed "Our Services" checklist (Monetary Disputes, Arbitration & Mediation, Halachic Wills, Shalom Bayis, Halachic Contracts) — also hardcoded, since it's a fixed list of what the Beis Din offers, not something that varies row to row.

This retires the `gabbaiDescription` and `beisDinDescription` Rich Text fields (deleted from the live `CommunityPage` collection — they held only placeholder/interim text from #047, no real office-entered content, so nothing was lost) and adds one new field, `gabbaiWifeName`.

**Contact-page subject prefill** reuses the existing mechanism in `contact.astro` (`?subject=` query param, shown locked/read-only) built for the Youth page's per-program "Contact" buttons — no new plumbing needed, just a `contactHref(subject)` helper in `community.astro`.

## Questions and Answers

- **Q:** Why not keep the paragraph in CMS Rich Text and add link support to `ricosToPlainText`?
  **A:** Rejected as overkill for two sentences with one fixed shape each. Ricos link nodes are a distinct node type from plain text runs; teaching the plain-text extractor to detect and preserve just link nodes (while still flattening everything else) is real parsing work for content that, per Danielle's own instructions, is actually fixed copy with one variable (a name) — not free-form editorial text. Code is the right place for a sentence whose wording is dictated, not the office's to rewrite.

- **Q:** "Looking to move here?" — hide it, or remove it?
  **A:** Remove entirely, per direction. The topic, its `<details>` block, its Nav anchor ("Moving Here"), and its five CMS fields (`movingDescription`, `movingContactName`, `movingContactPhone`, `movingContactEmail`, `movingPhoto`) are all deleted — not just hidden — since there's no indication it's coming back later, and dormant fields for a topic that doesn't exist would be pure confusion for the office.

- **Q:** Should the Beis Din services checklist be a CMS field (e.g. one line per service) instead of hardcoded?
  **A:** Hardcoded. It's a fixed list of five named services Danielle dictated verbatim, not an open-ended list the office is expected to curate or reorder — same reasoning as the FAQ question titles themselves (#047).

## Trade-offs

- **The gabbai/Beis Din sentences are now code, not office-editable copy.** If the exact wording needs to change again, it's a code change, not a CMS edit — accepted, since the wording itself was dictated as fixed content, and the only thing that should vary (who's named) still lives in CMS.
- **`gabbaiName`/`beisDinContactName` now serve double duty** — displayed inline in a sentence *and* used as link text. A very long name would read awkwardly in the fixed sentence; not a concern for the names in use today.

## Verification

`astro check` clean (same 3 pre-existing, unrelated `index.astro` errors). Confirmed via the dev server: the new sentences render with working `/contact?subject=...` links, the Taharas rabbis' updated phone/address values appear correctly, the Beis Din services checklist renders, and the "moving" topic/anchor no longer exist in the page or Nav output. The four placeholder rows Danielle had added to `CommunityMembers` to test the carousel (mistakenly deleted during an earlier cleanup pass) were restored with identical content.
