# 047 — Community page: FAQ topics + "meet our members"

**Status:** implemented
**Date:** 2026-07-12
**Author:** claude-session (danielle directing)
**Related:** [#025](025-team-page-two-sections.md) (hover-reveal card pattern reused), [#019](019-generic-split-section-field-names.md) (single-row, grouped-field precedent), [#044](044-whatsapp-groups-collection.md) (the previous "Community" nav label)

## Background

Danielle wants a new top-level page answering the practical questions a family new to (or living in) the kollel actually asks: who arranges meals, who's the gabbai, who to call for a taharas hamishpacha shaalah, what the Beis Din does, and who to talk to about apartments — followed by a browsable "meet the community" section so prospective families can see who's already here before they move.

## Problem

Nav already had a "Community" label — a submenu item under Home pointing at the homepage's WhatsApp section (`/#whatsapp`, added in #044/cd67e01 and later demoted back into Home's submenu). Reusing "Community" as the new top-level page's name collides with that.

## Questions and Answers

- **Q:** Keep both "Community" labels, or resolve the collision?
  **A:** Rename the Home ▸ Community submenu item to **"WhatsApp Groups"**; the new top-level **"Community"** nav item owns that name everywhere now. Confirmed with Danielle directly rather than guessing.

- **Q:** Single-row `CommunityPage` collection with per-topic flat fields, or a repeatable "FAQ items" collection?
  **A:** Single-row, following the `HomePage`/`DonatePage` precedent (#019's "Section 1/Section 2" naming). The five topics are structurally fixed and shaped completely differently from each other (a family + photo; a gabbai + a static Shabbos-times link; two rabbonim side by side; a description + one contact; a description + contact + photo) — a generic repeatable "FAQ item" row can't hold that without a pile of unused optional fields per row. The topic **titles** are hardcoded in the page (not a field) for the same reason `/team`'s "Meet the Team" heading is code, not CMS: they're fixed structure, not office-editable copy.

- **Q:** Repeatable `CommunityMembers` collection for section 2 — same shape as `TeamMembers`?
  **A:** Yes, deliberately identical field shape (`familyName`/`hebrewName`/`description`/`photo`/`sortOrder`/`active`) and identical hover-reveal card CSS/JS (see #007/#008) — Danielle asked for "just like we have on the team page." Copied rather than extracted into a shared component: the surrounding card markup differs slightly (no role/eyebrow line here), and duplicating ~60 lines of already-stable CSS/JS was cheaper than parameterizing a shared component for a second, likely-final caller.

- **Q:** Custom JS `aria-expanded` toggle (like the team card) for the FAQ accordion, or native `<details>`?
  **A:** Native `<details>`/`<summary>`. The team card's custom toggle exists specifically to let hover *and* click-to-pin coexist (#007) — the FAQ topics have no hover requirement, just independent open/close per question. `<details>` gives that, plus keyboard support, for zero JS. Chevron rotation is `group-open:rotate-180` (Tailwind's native `[open]` variant).

- **Q:** How does "link back to their bio on the team page" work for the Taharas HaMishpacha rabbonim?
  **A:** Both **Rav Dovid Horwitz** and **Rabbi Shabtai Yogel** already exist in the live `TeamMembers` collection (roleGroup `Leadership`, both with bios) — confirmed by querying the collection directly before building. Their names link to the static anchor `/team#leadership`, matching how the Nav's own Team submenu links to role-group sections (not individual members) — landing on the section, then hover/tap their card, is the existing site convention rather than new machinery for deep-linking to one card.

- **Q:** Where does the gabbai's "Shabbos times" link point?
  **A:** `/daven#shabbos` — a new anchor added to `daven.astro`'s Shabbos block, which previously had none.

## Design

- **`src/lib/community.ts`** — `getCommunityPage()` (single-row query + `resolveImage` on the three photo fields) and `getCommunityMembers()` (list query, `sortOrder` ascending, filters `active !== false`). Same `auth.elevate` + try/catch shape as every other `src/lib/*.ts` module.
- **`src/pages/community.astro`** — `PageHeader titleNavy="Welcome to Our Community!"`; white FAQ section (five `<details>` blocks, each with a `scroll-mt-28` id: `meals`, `gabbai`, `taharas`, `beis-din`, `moving`); `bg-mist` members section (`id="members"`) reusing the team-card pattern with the toggle label changed to "Read about us!" / "Hide".
- **`src/components/Nav.astro`** — static `communityChildren` (same shape as `homeChildren`, not CMS-driven — the six anchors are fixed structure); new top-level nav item after "Meet the Team"; Home's WhatsApp child relabeled.
- **`src/pages/daven.astro`** — added `id="shabbos" class="scroll-mt-28"` to the existing Shabbos wrapper `<div>`.
- CMS: `CommunityPage` (25 fields, one row) and `CommunityMembers` (6 fields, repeatable) created directly on the live site via the Wix connection, both `read: ANYONE` / mutate: `ADMIN` (same shape as every other collection). `CommunityPage`'s single row was seeded with only the facts actually given — `gabbaiName` ("Saul Kaplan"), `gabbaiDescription` (mentions his wife leading Tefillat Yeladim), `taharasEnglishRabbiName`/`taharasHebrewRabbiName` (Rav Horwitz / Rav Yogel), and `beisDinDescription` (close to Danielle's own wording). Every phone/email/address/photo field and the meals/moving descriptions were left empty — no real contact details for these people were given, and inventing them would put wrong information for real rabbeim/gabbai/dayanim on a live site. `CommunityMembers` was left empty entirely (no family profiles given yet); the page shows the same "coming soon" placeholder pattern as `/team` until the office adds rows.

## Trade-offs

- **`CommunityPage` has ~25 flat fields on one row.** Same shape as `HomePage`'s ~40 — accepted per that precedent, but it means the Wix dashboard's single-row editor is a long form. Grouped by topic prefix (`meals*`, `gabbai*`, `taharas*`, `beisDin*`, `moving*`) so it's still scannable.
- **Taharas rabbi links land on the Leadership section, not the specific card.** A visitor still has to hover/tap the right card once there. Matches existing Team-submenu-link behavior; deep-linking to auto-expand one card would need new machinery for a one-off use.
- **The team-card CSS/JS is duplicated, not shared.** Slightly more code to keep in sync if the hover/reveal mechanic ever changes; acceptable since the two cards' surrounding markup already differs and there's no third caller yet.

## Verification

`astro check` is clean for all new/changed files (the 3 pre-existing `index.astro` errors predate this change — confirmed via `git stash`). `/community` renders with the seeded `CommunityPage` row (Saul Kaplan, Rav Horwitz, Rav Yogel, Beis Din description show; empty fields degrade to "coming soon" copy rather than blank space) and an empty `CommunityMembers` "coming soon" placeholder. Nav's new top-level "Community" item and its six anchors, and the renamed "WhatsApp Groups" Home-submenu link, both confirmed in `Nav.astro`.
