# 003 — Rename team role groups + make matching forgiving

**Status:** implemented
**Date:** 2026-05-27
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md)

## Background

#001 shipped the team page with four role groups: `rabbeim`, `kollel`, `administration`, `board`. `groupByRole()` matched by exact key; mismatches were silently dropped. We flagged that exact concern in #001's Trade-offs as a known risk: "field names are stringly-typed contracts."

The risk hit first try. Danielle added Rabbi Horwitz via the dashboard with `roleGroup: "Rabbi"` and he didn't render on /team. The exact-match drop kicked in.

## Problem

Two things in one:

1. The chosen keys (`rabbeim`, `kollel`, `administration`, `board`) didn't match the editor's natural vocabulary. She typed "Rabbi", not "rabbeim".
2. Even if she'd typed the "right" key, mismatches anywhere (typo, case, plural) silently drop members. Silent drops are the worst failure mode — no error, no warning, just missing data.

## Questions and Answers

- **Q:** Should we constrain `roleGroup` in the CMS via a reference collection (controlled vocabulary) instead of free text?
  **A:** Not now. Adds a second collection to manage, plus a reference field is more friction in the dashboard. Free text + forgiving code is the better trade-off for a small editorial team.

- **Q:** What's the new taxonomy?
  **A:** Five groups: `leadership`, `rabbis`, `kollel`, `staff`, `board`, with `other` as a catch-all. Plus an alias map so editors can type "Rabbi" / "Rabbis" / "Rabbeim" / "Rav" / "Maggid Shiur" and they all route to `rabbis`. Same pattern for the other groups.

- **Q:** Why a `Team` label for the `other` bucket instead of literally "Other"?
  **A:** Public-facing. A visitor seeing "Other" would parse it as "people we couldn't categorize," which sounds dismissive. "Team" is a neutral, complete-sounding catch-all. Internally the code key stays `other` to make the intent obvious.

- **Q:** Do we need to backfill Rabbi Horwitz's existing row to match the new taxonomy?
  **A:** No — his existing value of "Rabbi" is in the alias map and routes to `rabbis`. Zero migration. If we wanted him in `leadership` instead (he's "Founder and Director"), Danielle would change his row in the dashboard.

- **Q:** Should we emit a warning in dev when a row hits `other`?
  **A:** Not in this iteration. The page renders the row, so the editor sees it isn't where they expected and can fix it. A dev-mode warning is nice-to-have; skipping for now.

- **Q:** Is "Leadership" needed if we have "Rabbis"? Rabbi Horwitz could fit either.
  **A:** Per the editor's call: "we don't have to use all of them right? we can edit the code of the site to present them differently". The unused groups don't render (the page skips groups with zero members). Including `leadership` upfront is free; we can drop it later if it stays empty.

## Design

Three pieces:

1. **New `ROLE_GROUPS` taxonomy** in `src/lib/team.ts`:
   ```ts
   leadership | rabbis | kollel | staff | board | other
   ```
   With display labels `Leadership / Rabbis / Kollel / Staff / Board / Team`.

2. **`ROLE_GROUP_ALIASES` map** with ~25 entries covering common spellings (English, yeshivish, Hebrew transliterations). Single source of truth — extend the map in code when an unmatched value should be recognized.

3. **`normalizeRoleGroup()` helper** that lowercases + trims the raw CMS value, looks up in the alias map, falls back to `"other"`. Returns a typed `RoleGroup`.

`groupByRole()` is unchanged in shape but no longer can produce silent drops — everything lands somewhere.

`getTeam()` also stores `roleGroupRaw` (what the editor actually typed) on the member for debugging. Not rendered on the page.

## Implementation Plan

1. Rewrite `src/lib/team.ts` — new taxonomy + alias map + normalize.
2. `src/pages/team.astro` — no changes needed; it already iterates `ROLE_GROUPS` and skips empty groups, so the new `other` slot Just Works.
3. `CONTRIBUTING.md` — replace the old 4-value list with the alias table and a note that the field is forgiving.
4. This entry.

## Examples

✅ **Right** — alias-aware normalize:
```ts
const ROLE_GROUP_ALIASES = { "rabbi": "rabbis", "rav": "rabbis", "maggid shiur": "rabbis", ... };
function normalizeRoleGroup(raw: unknown): RoleGroup {
  const key = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return ROLE_GROUP_ALIASES[key] ?? "other";
}
```

❌ **Wrong** — exact-match against canonical keys:
```ts
const key = (m.roleGroup ?? "kollel") as RoleGroup;
if (key in groups) groups[key].push(m);   // silently drops everything else
```
This is what #001 shipped. It's the failure mode we're fixing.

## Trade-offs

- **Alias map drifts.** Every new variant the editor wants to type ("Rebbe"? "Mashgiach"?) is a code change. Mitigated by the catch-all bucket — the member still renders, just in a less-specific section.
- **No CMS-side validation.** The dashboard doesn't enforce a vocabulary, so the editor can type anything. Acceptable because the catch-all + design log keeps the system from breaking silently.
- **Five groups is more than the four we started with.** Empty groups don't render, so this only adds visible complexity if the editor uses them.

## Verification

- [x] Rabbi Horwitz (`roleGroup: "Rabbi"`) renders on /team under "Rabbis" without changing the row.
- [x] Page still renders cleanly with all groups empty (empty state from #001 still works).
- [x] Adding a typo'd row (`roleGroup: "Rabbeem"`) lands the member in "Team" (catch-all) instead of dropping them.
- [ ] Friend tries the dashboard, finds the field forgiving in practice. (Pending real use.)

## Implementation Results

Shipped with the bio click-to-expand UX fix (separate concern, same commit for convenience — captured in the commit message).

**Deviations from design:** none.

**Follow-up:** if `other` (the catch-all) accumulates members frequently, that's a signal the alias map is missing common terms. Extend the map; don't expand the canonical key list every time.
