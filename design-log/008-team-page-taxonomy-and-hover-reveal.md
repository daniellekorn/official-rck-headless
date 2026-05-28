---
# 008 — Team page: tighter taxonomy + hover-reveal bios

**Status:** proposed
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md), [#003](003-role-groups-rename-and-harden.md)

## Background

#003 settled on six role groups (`leadership`, `rabbis`, `kollel`, `staff`, `board`, `other`) with a forgiving alias map. The "empty groups don't render" rule from that entry stays — but the active taxonomy was too generic for how the kollel actually thinks about its people.

The team page also currently uses a click → full-screen modal to show bios. Functional, but it's a heavy interaction layer for what's mostly a "scan + read a paragraph" flow.

## Problem

1. **Generic labels muddy hierarchy.** "Leadership" lumped the Founder/Director together with Roshei Kollel; "Kollel" doesn't distinguish Roshei from Avreichim. Visitors don't see how the institution is actually structured.
2. **Modal feels heavier than the content.** Bios are a paragraph. A full-screen dialog with backdrop + close button is overkill, and it puts the bio one click away from a page that's mostly designed for browsing.

## Questions and Answers

- **Q:** Reuse `leadership` or introduce a more specific group key?
  **A:** Introduce `founder_director`. The Founder & Director role is structurally singular in this institution — one person, one section. A `leadership` bucket invites future drift (board chair? major donor?) into a slot meant for one specific role.

- **Q:** What single key covers both Rosh Kollel and Rosh Chaburah?
  **A:** `roshei`, displayed as **Roshei Kollel**. Both posts are "heads" within the kollel structure; `roshei` (plural of rosh) is the natural umbrella. The display label leans on "Roshei Kollel" because most visitors recognize it; the alias map routes both `rosh kollel` and `rosh chaburah` to the same key.

- **Q:** What about the existing `rabbis`, `staff`, `board`, `other` groups — drop them?
  **A:** Keep them dormant. Per #003 they only render if populated. Removing them is a one-way door for content the editor might legitimately want later (e.g., visiting Maggidei Shiur, an administrator). Cost of keeping them is zero LOC and zero render time.

- **Q:** Rabbi Horwitz currently has `roleGroup: "Rabbi"` (per #003's resolution). Does he still render after this change?
  **A:** He renders, but in the **Rabbis** bucket — which is now dormant unless someone else lands there too. A single member in a dormant bucket still renders (the empty-group skip only fires when the array is literally empty). However, the *intent* is for him to land in **Founder & Director**. CONTRIBUTING.md will tell the editor to change his `roleGroup` to `Founder` or `Director` (both alias to `founder_director`). Not a code-side migration — editor action.

- **Q:** Hover reveal — what happens on touch devices?
  **A:** Tap-to-toggle. Same DOM, same overlay, driven by a `data-expanded` attribute that JS flips on click. Desktop hover works naturally via CSS `:hover`; the click handler doubles as "pin the overlay open" on desktop (useful for long bios) and as the only reveal mechanism on touch. No separate mobile markup.

- **Q:** Bios might be long. Can the hover overlay scroll?
  **A:** Yes, `overflow-y: auto` on the overlay's inner body. Acceptable: on desktop, moving the cursor off the card closes the overlay; users who want to read a long bio click the card to pin it open (the click toggle works on desktop too). This sidesteps the "mouse-out kills scroll" trap.

- **Q:** What about keyboard / screen-reader users?
  **A:** Card is a `<button>` with `aria-expanded`. Enter/Space toggles. Bio is in the DOM either way, just visually hidden when collapsed; screen readers read it from the expanded state.

- **Q:** Why drop the modal entirely instead of keeping it as a "View full bio" path?
  **A:** Two ways to view the same bio is one too many. The card already grows to fit the bio on tap (mobile) or pins open on click (desktop). A modal layer adds nothing that the in-card overlay doesn't already do.

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
   - `leadership`, `leader`, `president` → keep but reroute → ⚠️ deliberate: route generic "leadership" to `founder_director` since that's the only active leadership slot. Editor types something natural, member lands somewhere sensible.

3. **Team page rewrite** in `src/pages/team.astro`:
   - Replace `<button>` + `<dialog>` pairs with a single `<button>` per member containing the photo, name/role, and a bio overlay.
   - CSS:
     - Photo greyscale on `:hover` and on `[aria-expanded="true"]`.
     - Bio overlay (`absolute inset-0` inside photo wrap) opacity 0 → 1 on hover/expanded.
     - Card grows on `[aria-expanded="true"]` to fit bio on mobile (no separate mobile markup).
   - JS: a single click handler toggling `aria-expanded`. No modal API, no backdrop.
   - Removes the `<dialog>` styles + the modal script.

## Implementation Plan

1. Update `src/lib/team.ts`: new `ROLE_GROUPS` (order + labels), new `RoleGroup` union, extend alias map.
2. Rewrite `src/pages/team.astro`: drop dialog markup + script, add hover/expand pattern, update CSS.
3. Update `CONTRIBUTING.md` alias table for the new taxonomy + note about migrating Rabbi Horwitz's row.
4. Verify with `astro check` + dev server across mobile/desktop viewports.
5. Append Implementation Results with commit SHA.

## Examples

✅ **Right** — hover/expand share the same CSS state:
```css
.team-card:hover .card-photo,
.team-card[aria-expanded="true"] .card-photo {
  filter: grayscale(1);
}
.team-card:hover .bio-overlay,
.team-card[aria-expanded="true"] .bio-overlay {
  opacity: 1;
}
```

❌ **Wrong** — separate hover-only and mobile-only paths:
```css
@media (hover: hover) { .team-card:hover .card-photo { filter: grayscale(1); } }
@media (hover: none)  { .team-card.tapped .card-photo  { filter: grayscale(1); } }
/* Two code paths, two failure modes, hard to keep in sync. */
```

## Trade-offs

- **Click on desktop pins the overlay.** Mostly a feature (long bios become readable), but a user expecting click to navigate somewhere will be surprised. Mitigated by the card's strong "info card" visual — it doesn't look like a navigation tile.
- **`founder_director` is a name, not a category.** If the org ever has a co-founder + separate director, the section header reads correctly for both but the key still says "_and_". Acceptable; cheaper than designing for a future that may not happen (per CLAUDE.md guidance: don't design for hypothetical requirements).
- **Routing generic "leadership" to `founder_director`.** Could surprise an editor who types "Leadership" expecting a broader bucket. Mitigated by CONTRIBUTING.md doc + the catch-all `other` bucket if someone really wants a separate label.

## Verification

- [ ] `astro check` clean.
- [ ] Hover on a card (desktop): photo greyscales, bio fades in.
- [ ] Mouse off: returns to default.
- [ ] Click a card (desktop): overlay stays pinned; click again collapses.
- [ ] Mobile viewport (≤640px): no hover; tap reveals bio inline, tap again collapses.
- [ ] Keyboard: Tab to card, Enter/Space toggles.
- [ ] Empty CMS state still renders the "Coming soon" message.
- [ ] Editor changes Rabbi Horwitz's `roleGroup` to `Founder` (or `Director`) and he renders under **Founder & Director**.

## Implementation Results

_(appended after work ships)_
