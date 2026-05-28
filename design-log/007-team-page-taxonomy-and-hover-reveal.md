# 007 — Team page: tighter taxonomy + hover-reveal bios

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md), [#002](002-role-groups-rename-and-harden.md)

## Background

#002 settled on six role groups (`leadership`, `rabbis`, `kollel`, `staff`, `board`, `other`) with a forgiving alias map. The "empty groups don't render" rule from that entry stays — but the active taxonomy was too generic for how the kollel actually thinks about its people.

The team page previously used a click → full-screen modal to show bios. Functional, but heavy for a "scan + read a paragraph" flow.

## Problem

1. **Generic labels muddy hierarchy.** "Leadership" lumped the Founder/Director together with Roshei Kollel; "Kollel" doesn't distinguish Roshei from Avreichim. Visitors don't see how the institution is actually structured.
2. **Modal feels heavier than the content.** Bios are a paragraph. A full-screen dialog with backdrop + close button is overkill, and puts the bio one click away from a page mostly designed for browsing.

## Questions and Answers

- **Q:** Reuse `leadership` or introduce a more specific group key?
  **A:** Introduce `founder_director`. The Founder & Director role is structurally singular — one person, one section. A `leadership` bucket invites future drift (board chair? major donor?) into a slot meant for one specific role.

- **Q:** What single key covers both Rosh Kollel and Rosh Chaburah?
  **A:** `roshei`, displayed as **Roshei Kollel**. Both posts are "heads" within the kollel structure. The display label leans on "Roshei Kollel" because most visitors recognize it; the alias map routes both `rosh kollel` and `rosh chaburah` to the same key.

- **Q:** What about the existing `rabbis`, `staff`, `board`, `other` groups — drop them?
  **A:** Keep them dormant. Per #002 they only render if populated. Removing them is a one-way door for content the editor might legitimately want later (e.g., visiting Maggidei Shiur). Cost of keeping them is zero LOC and zero render time.

- **Q:** Hover reveal — what happens on touch devices?
  **A:** Tap-to-toggle. Same DOM, same overlay, driven by a `data-expanded` attribute that JS flips on click. Desktop hover works via CSS `:hover`; the click handler doubles as "pin overlay open" on desktop (useful for long bios) and as the only reveal mechanism on touch. No separate mobile markup.

- **Q:** Bios might be long. Can the hover overlay scroll?
  **A:** Yes, `overflow-y: auto` on the overlay's inner body. On desktop, moving the cursor off the card closes the overlay; users who want to read a long bio click the card to pin it open. This sidesteps the "mouse-out kills scroll" trap.

- **Q:** Keyboard / screen-reader users?
  **A:** Card is a `<button>` with `aria-expanded`. Enter/Space toggles. Bio is in the DOM either way, just visually hidden when collapsed; screen readers read it from the expanded state.

- **Q:** Why drop the modal entirely instead of keeping it as a "View full bio" path?
  **A:** Two ways to view the same bio is one too many. The card already grows to fit the bio on tap (mobile) or pins open on click (desktop).

## Design

Three pieces:

1. **`ROLE_GROUPS` reordered + new keys** in `src/lib/team.ts`:
   ```ts
   founder_director | roshei | kollel | rabbis | staff | board | other
   ```
   Display labels:
   - `founder_director` → **Founder & Director**
   - `roshei` → **Roshei Kollel**
   - `kollel` → **Kollel Avreichim**
   - `rabbis` → **Rabbis** (dormant)
   - `staff` → **Staff** (dormant)
   - `board` → **Board** (dormant)
   - `other` → **Team** (catch-all)

2. **Alias map extensions:**
   - `founder`, `director`, `founder and director`, `executive director` → `founder_director`
   - `rosh kollel`, `rosh chaburah`, `roshei`, `roshei kollel`, `roshei chaburah` → `roshei`
   - `kollel`, `avreich`, `avrech`, `avreichim`, `avrechim`, `yungerman`, `yungerleit` → `kollel`
   - `leadership`, `leader`, `president` → `founder_director` ⚠️ deliberate: route generic "leadership" to the only active leadership slot. Editor types something natural, member lands somewhere sensible.

3. **Team page rewrite** in `src/pages/team.astro`:
   - Replace `<button>` + `<dialog>` pairs with a single `<button>` per member containing the photo, name/role, and a bio overlay.
   - CSS: photo greyscale on `:hover` and on `[aria-expanded="true"]`; bio overlay opacity 0 → 1 on hover/expanded; card grows on `[aria-expanded="true"]` to fit bio on mobile.
   - JS: single click handler toggling `aria-expanded`. No modal API, no backdrop.

## Trade-offs

- **Click on desktop pins the overlay.** Mostly a feature (long bios become readable), but a user expecting click to navigate somewhere will be surprised. Mitigated by the card's strong "info card" visual.
- **`founder_director` is a name, not a category.** If the org ever has a co-founder + separate director, the section header still reads correctly for both but the key still says "_and_". Acceptable; cheaper than designing for a hypothetical future.
- **Routing generic "leadership" to `founder_director`.** Could surprise an editor who types "Leadership" expecting a broader bucket. Mitigated by CONTRIBUTING.md doc + the catch-all `other` bucket if someone really wants a separate label.

## Implementation Results

Shipped in commit `614c4ad` on `main` (2026-05-28). Bio overlay opacity tuned through two passes — landed on `from-navy-700/80 → via-navy-700/75 → to-navy-700/70` so the greyscale image bleeds through faintly behind the bio text. 95% (initial pass) was too dark; the lighter blend gives the photo a ghosted presence without compromising readability.

**Follow-up for editor:** existing CMS rows may need `roleGroup` updates to land in the new active sections. When Rabbi Horwitz is added, his row should use `roleGroup: "Founder"` (or `"Director"`) to land in Founder & Director.
