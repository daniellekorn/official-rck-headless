# 048 — Progressive nav collapse (priority navigation)

**Status:** implemented
**Date:** 2026-07-12
**Author:** claude-session (danielle directing)
**Related:** [#047](047-community-page.md) (added the 7th top-level nav item that triggered this)

## Background

Adding the "Community" item (#047) pushed the desktop nav to 7 top-level items + Contact + Donate. The nav previously had exactly one breakpoint: below `md` (768px) everything hid behind a hamburger, at/above it the full row showed. That gap was too narrow for 7 items, so between roughly 768px and ~1280px the row overflowed its own white pill — Contact and Donate visibly clipped off the right edge instead of collapsing.

## Problem

A single breakpoint can't both (a) show the full bar with reasonably large text at typical desktop widths, and (b) never overflow in between. The bar either has room or it doesn't; there's no in-between state with a binary show/hide.

## Questions and Answers

- **Q:** Simplest fix — just move the single breakpoint out to `xl` (1280px) where 7 items reliably fit?
  **A:** Tried first, shipped as an intermediate step, but Danielle asked for the gradual behavior explicitly: fold items into the hamburger one at a time as the window narrows, rather than a hard all-or-nothing cutover.

- **Q:** Build a full "priority+" pattern (measure widths, move overflowing items into a "More ▾" dropdown, animate)?
  **A:** No — scoped down. The existing hamburger drawer already renders the complete nav (every item + Contact + Donate) unconditionally, so there's no need to dynamically move DOM nodes between an inline list and a separate overflow menu. The inline bar just needs to know how many of its own items it can afford to show; whatever it hides is already reachable one tap away in the drawer that's always there below `xl`.

- **Q:** How to detect overflow without hand-computing padding/gap arithmetic (fragile, breaks silently if spacing classes change)?
  **A:** Compare `navPill.scrollWidth` vs `navPill.clientWidth` on the nav-pill row itself. This single browser-computed comparison already accounts for the logo, every nav item, the CTA buttons, and the hamburger button in one number — no manual width bookkeeping to keep in sync with the Tailwind classes.

- **Q:** Fold order — which items disappear first?
  **A:** From the end of the list backward (Youth, then Events, then Community, …), stopping as soon as it fits. Home and the Contact/Donate CTA group are effectively protected — they're only dropped if hiding every other item still doesn't fit (Contact/Donate as an explicit last-resort step; Home only if the loop runs all the way to index 0). This matches the original complaint: Contact/Donate should be the last thing to go, not the first thing pushed off-screen.

- **Q:** What renders before JS runs (FOUC risk)?
  **A:** Nothing new — the existing Tailwind `hidden … xl:flex` / `xl:hidden` classes stay as the base CSS state and are what paints first. JS then *adds* items back for widths between roughly 768–1280px where they now fit; below that, the CSS default (full hamburger) already looked right and needed no JS. So the pre-JS paint is always the same safe "everything hidden below `xl`" state — never the old overflowing one.

## Design

`src/components/Nav.astro`:
- `data-nav-list` on the `<ul>`, `data-nav-cta` on the Contact/Donate wrapper `<div>` — the two groups the script measures/toggles.
- New `<script>` block, `layout()`:
  1. At `window.innerWidth >= 1280`: clear all inline style overrides, let the CSS classes render as authored.
  2. Below that: force `navList`/`navCta` to `display: flex` and all `<li>` visible, then loop from the last `<li>` backward, hiding one at a time while `navPill.scrollWidth > navPill.clientWidth`.
  3. If even the CTA group alone doesn't fit after that, hide it too.
  4. If everything ended up hidden, remove the forced `display` overrides entirely (falls back cleanly to the plain "hamburger only" CSS state, no stray empty flex row).
  5. Hide the hamburger button itself only when literally nothing got folded (a perfect fit) — otherwise it needs to stay, since it's the only way to reach whatever got hidden.
- Runs once on load, then on `resize` via the same `requestAnimationFrame` debounce pattern already used for the header's scroll-hide behavior in this file.

## Trade-offs

- **A folded item still exists twice in the DOM** (once in the inline `<ul>`, always in the hamburger drawer) — intentional simplification; the drawer doesn't try to show only "the overflow," it always shows everything. Slight redundancy, zero state-sync bugs.
- **No first-paint measurement** — the very first `layout()` call runs after the script parses, not before. On a slow device there's a theoretical few-millisecond window before it applies, but the pre-JS state is the same safe fallback as before this change, so nothing looks broken in that window, just briefly less expanded than its final state.
- **1280px is hardcoded** in the script to match the `xl:` Tailwind classes; if that breakpoint class ever changes, the constant needs updating alongside it (noted in the script's own comment).

## Verification

`astro check` clean (same 3 pre-existing, unrelated `index.astro` errors as before this change). Confirmed via the dev server that both the new script and the original toggle/scroll script compile and load as separate modules, and that the new script's logic (element selectors, the fold loop, the hamburger-visibility toggle) is present in the served output. No headless-browser tool was available in this session to automate an actual resize-and-screenshot check — Danielle verified the live behavior by resizing a real browser window.

## Addendum — Donate button spilling past the pill, just before the hamburger point

Reported directly: narrowing the window on desktop, right around where folding should start, the Donate button was visibly spilling off the white bar rather than getting tucked into the hamburger. Root cause: `Layout.astro`'s web fonts load with `font-display: swap` — `layout()`'s very first call (on script load) measures `navPill.scrollWidth` against the *fallback* font's metrics, which are narrower than Oswald/Onest. If the real font swaps in wider after that measurement, the row that "fit" a moment ago can overflow for real — and nothing re-triggers `layout()` to notice, since a font swap doesn't fire `resize`. `.nav-pill` has no `overflow-hidden` (deliberately, so dropdowns/mega menus aren't clipped), so the overflow was visible as the CTA spilling past the bar's edge instead of folding.

- **Fix**: `document.fonts?.ready?.then(layout)` added right after the initial `layout()` call — re-runs the same fold logic once the real fonts are actually in place, catching the case where font-swap changed the measured widths after the first pass.
- **Verification**: `astro check`/`astro build` clean. Not click-tested live — no headless browser / connected Chrome extension available in this session; recommend confirming by throttling the network (to widen the gap between first paint and font load) while narrowing the window through the fold range.
