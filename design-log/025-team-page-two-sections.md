# 025 — Team page: cut taxonomy to two sections

**Status:** implemented
**Date:** 2026-06-24
**Author:** claude-session (danielle directing)
**Related:** [#007](007-team-page-taxonomy-and-hover-reveal.md) (supersedes its taxonomy), [#002](002-role-groups-rename-and-harden.md), [#017](017-events-and-youth-pages.md)

## Background

#007 settled on a seven-group taxonomy (`founder_director`, `roshei`, `kollel`, `rabbis`, `youth`, `staff`, `board`, `other`) with most groups "dormant" — rendering only when populated. In practice the kollel only ever fills two of them, and the dormant groups added cognitive load (the editor sees a menu of options that don't apply) without ever paying off.

## Decision

The /team page is exactly **two** sections:

1. **Kollel Leadership** — founder/director, roshei kollel, roshei chaburah, titled rabbeim.
2. **Our Avreichim** — the kollel members.

`roleGroup` keys reduced to `leadership | avreichim`. The alias map routes all the old leadership-tier terms (founder, director, rosh kollel, rosh chaburah, rabbi, rav, maggid shiur, …) to `leadership`; everything else — including unrecognized values and blanks — **falls through to `avreichim`** (see `normalizeRoleGroup`). There is no `other` catch-all and no dormant group, so a third section can never appear and a member is never dropped.

The page eyebrow ("Our People") was removed; the header is just "Meet the Team".

## Questions and Answers

- **Q:** Where do the dropped groups (`rabbis`, `youth`, `staff`, `board`) go?
  **A:** Folded into the two survivors via aliases — titled rabbeim → leadership, the rest → avreichim. Youth programming already lives on /youth via the separate `YouthPrograms` collection (#017), so removing the /team "Youth" section loses nothing.

- **Q:** Default for an unrecognized `roleGroup`?
  **A:** `avreichim`, not a catch-all section. The rank-and-file is the safe default; it guarantees the "exactly two sections" invariant and keeps members from vanishing.

- **Q:** Migrate existing CMS rows?
  **A:** Not needed — old recognized values still map correctly through the alias map. The collection held only one demo row (`Demo Rabbi`, role "Rosh Kollel", `roleGroup: "Kollel"`); its stored value was updated to `Leadership` so its section matches its role.

## Trade-offs

- **No editor-facing flexibility for new groups.** Adding a "Board" section later means a code change again. Accepted: the previous flexibility was never used, and YAGNI beat the menu clutter.
- **Unknown values silently become Avreichim.** A leadership member with an unlisted title lands in Avreichim with no warning. Mitigated by the documented leadership term list in CONTRIBUTING.md.

## Implementation

- `src/lib/team.ts` — `RoleGroup` type, `ROLE_GROUPS`, `ROLE_GROUP_ALIASES`, `normalizeRoleGroup`, `groupByRole` all reduced to the two keys; default fallback `avreichim`.
- `src/pages/team.astro` — removed the `eyebrow="Our People"` prop. The render loop and the right-edge section pager are taxonomy-agnostic (they iterate `ROLE_GROUPS`), so they pick up the two sections with no other change.
- `src/components/Nav.astro` — the Team submenu builds from `ROLE_GROUPS`; now shows the two sections automatically.
- `CONTRIBUTING.md` — `TeamMembers` / `roleGroup` table rewritten for the two-section scheme.
- CMS — the single demo row's `roleGroup` updated `Kollel` → `Leadership` on the "RCK Official Headless" site.

## Verification

`astro check` is clean for the team files (the only error is the pre-existing `process` type issue in `astro.config.mjs`). With an empty collection the page shows the "coming soon" block; with the demo row it renders a single **Kollel Leadership** section. The CONTRIBUTING workflow still holds — the editor types a role term and lands in one of two sections.
