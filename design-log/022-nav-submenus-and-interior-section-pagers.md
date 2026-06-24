# 022 — Nav submenus + section pagers on interior pages

**Status:** implemented
**Date:** 2026-06-24
**Author:** claude-session
**Related:** #017 (youth pages), #007 (team taxonomy), #018 (homepage section pager)

## Background
Sections inside long pages (homepage Join Us / History, each youth program,
each team role group) were only reachable by scrolling. We wanted them
discoverable from the nav, and wanted the homepage's right-edge section pager on
the other section-heavy pages.

## Decisions

### Nav submenus are built from the CMS
`Nav.astro` now fetches `getYouthPrograms()` and `getTeam()` and builds dropdown
children so the menu always matches what's actually on those pages:
- **Home** → static anchors: Join Us (`/#join`), Our History (`/#history`).
- **Meet the Team** → one item per populated role group (`/team#<roleGroupKey>`),
  in `ROLE_GROUPS` order, empty groups filtered out.
- **Youth** → one item per active program (`/youth#<slug>`).

Children use **absolute hrefs** so they work from any page, not just the target.
Empty submenus are dropped (no empty dropdown before the CMS is populated). The
nav pays two extra CMS queries per page for this; acceptable for SSR, revisit
with caching if it shows up.

### Anchor ids come from one shared slug
New `src/lib/slug.ts` `slugify()` drives the anchor ids. Youth programs carry a
derived `slug` (added to `YouthProgram` in `youth-programs.ts`, e.g. "Dor L'Dor"
→ `dor-ldor`) so the section id, the nav link, and the pager dot all reference
the same value. Team uses the stable `roleGroup` key directly (no slug needed).
The `slug` is **derived at read time, not stored** — this is not a CMS schema
change.

### Section pager added to Youth and Team
Reused `SectionPager.astro` (now with the scroll-flash labels from #021's
follow-up). Sections carry `id` + `data-pager-section` + `data-pager-theme="light"`
+ `scroll-mt-28` (clears the fixed nav on anchor jumps). Shown only when a page
has more than one section.

### Discretion: which pages
Home, Youth, Team got both submenu + pager. **Daven, Learn, Events were skipped**
— Learn/Events are filterable galleries (no fixed sections), and Daven's
sub-blocks are too small to page between. Easy to add later.

## Examples
✅ Same slug everywhere:
```ts
// youth-programs.ts: slug: slugify(row.title) || `program-${i+1}`
// youth.astro:       <section id={program.slug} data-pager-section ...>
// Nav.astro:         href: `/youth#${p.slug}`
```

## Trade-offs
- Nav does CMS reads on every page (was static before).
- Dropdowns use a chevron caret as the affordance — a functional menu indicator,
  not a directional content arrow (which the brand avoids).

## Verification
`astro check` passes (only the pre-existing `process` typing in
`astro.config.mjs`). Submenus render from CMS and drop when empty; anchor jumps
land below the nav via `scroll-mt-28`; pagers appear on Youth/Team with >1
section and flash labels on scroll.
