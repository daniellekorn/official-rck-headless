# 002 — Rename team role groups + make matching forgiving

**Status:** taxonomy superseded by [#007](007-team-page-taxonomy-and-hover-reveal.md); the *pattern* (alias map + forgiving normalize + catch-all) still applies
**Date:** 2026-05-27
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md), [#007](007-team-page-taxonomy-and-hover-reveal.md)

## Background

#001 shipped the team page with role groups matched by exact key; mismatches were silently dropped. We flagged that exact concern in #001's Trade-offs as a known risk: "field names are stringly-typed contracts."

The risk hit first try. Danielle added Rabbi Horwitz via the dashboard with `roleGroup: "Rabbi"` and he didn't render on /team — exact-match dropped him silently.

## Problem

Two things in one:

1. The canonical keys didn't match the editor's natural vocabulary. She typed "Rabbi", not the canonical key.
2. Even if she'd typed the "right" key, mismatches anywhere (typo, case, plural) silently drop members. **Silent drops are the worst failure mode** — no error, no warning, just missing data.

## Questions and Answers

- **Q:** Constrain `roleGroup` via a reference collection (controlled vocabulary) instead of free text?
  **A:** Not now. Adds a second collection to manage, plus a reference field is more friction in the dashboard. Free text + forgiving code is the better trade-off for a small editorial team.

- **Q:** Why a `Team` label for the `other` catch-all bucket instead of literally "Other"?
  **A:** Public-facing. A visitor seeing "Other" would parse it as "people we couldn't categorize," which sounds dismissive. "Team" is a neutral, complete-sounding catch-all. Internally the code key stays `other` to make the intent obvious.

- **Q:** Should we emit a dev warning when a row hits `other`?
  **A:** Not in this iteration. The page renders the row, so the editor sees it isn't where they expected and can fix it.

## Design (pattern — taxonomy itself moved on in #007)

Three pieces in `src/lib/team.ts`:

1. A `ROLE_GROUPS` taxonomy (canonical keys + display labels).
2. A `ROLE_GROUP_ALIASES` map covering common spellings (English, yeshivish, Hebrew transliterations). Single source of truth — extend the map in code when an unmatched value should be recognized.
3. A `normalizeRoleGroup()` helper that lowercases + trims the raw CMS value, looks up in the alias map, falls back to `"other"`. Returns a typed `RoleGroup` — no silent drops; everything lands somewhere.

`getTeam()` also stores `roleGroupRaw` (what the editor actually typed) on the member for debugging. Not rendered on the page.

## Trade-offs

- **Alias map drifts.** Every new variant the editor wants to type is a code change. Mitigated by the catch-all bucket — the member still renders, just in a less-specific section.
- **No CMS-side validation.** The dashboard doesn't enforce a vocabulary, so the editor can type anything. Acceptable because the catch-all + design log keeps the system from breaking silently.

**Follow-up:** if `other` accumulates members frequently, that's a signal the alias map is missing common terms. Extend the map; don't expand the canonical key list every time.

## Implementation Results

Shipped together with a bio click-to-expand UX fix. See #007 for the current taxonomy — the pattern in this entry endures, but the specific groups changed.
