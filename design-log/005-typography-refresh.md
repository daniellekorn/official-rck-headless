# 005 — Typography refresh: Oswald display + Onest body

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md), [#004](004-brand-palette-refresh.md)

## Background

Original type stack from #001 used Inter for both body and display (set at different weights — `font-black`/900 for headings, `font-normal`/`font-medium` for body) and Heebo for Hebrew. The brand owner specified a new pairing:

- **Onest** for body and UI ("most of the text", weights left to discretion).
- **Oswald Medium** (500) for "main heading style text".
- Heebo retained — neither Onest nor Oswald supports Hebrew, and the site has Hebrew on team bio names and the WhoWeAre subtitle.

## Problem

1. **The `--font-display` token was nearly unused.** Every heading component applied `class="font-sans … font-black"` rather than `class="font-display"`. The base `h1,h2,h3,h4` rule only kicked in when utility classes didn't override it (which they always did). Swapping the token value alone would not produce any visible change.
2. **Weight mismatch.** Oswald's heaviest weight is 700; the codebase used 900 (`font-black`) and 800 (`font-extrabold`) on headings. The user's spec is explicitly *Medium* (500), so the heavy-weight classes had to come off, not just be capped.
3. **Tracking was tuned for Inter.** Most heading classes carried tight negative tracking (`-0.025em`, `-0.02em`, `-0.015em`). Oswald is condensed by design; the same negative tracking makes it look pinched.

## Questions and Answers

- **Q:** Why not switch the Nav wordmark and Footer site name to Oswald too?
  **A:** They're `<p>`/`<a>` elements styled as display text, not semantic headings. Keeping them on Onest (`font-black`/`font-extrabold`) keeps the wordmark feeling solid and distinct from body Onest, while reserving Oswald for true semantic headings. Cleaner mental model: **Oswald = `<h1>`/`<h2>`/`<h3>`, Onest = everything else.**

- **Q:** Why only Oswald 500 and not also 400 / 600 / 700?
  **A:** The user spec is "Oswald Medium" specifically. Loading additional Oswald weights now is speculative — they'd ship bytes for variants we don't use. Add weights when a designer wants a hierarchy.

- **Q:** What about eyebrows and small uppercase labels?
  **A:** Stay on Onest. They're not semantic headings; they're navigation/eyebrow patterns. Uppercase Onest is visually distinct from uppercase Oswald — keeps hierarchy readable.

- **Q:** Hebrew text rendering inside an Oswald heading?
  **A:** Heebo fallback via the per-glyph fallback chain (`--font-display: "Oswald", "Heebo", …`). Oswald has no Hebrew glyphs, so the browser falls back to Heebo. Same on `--font-sans` (Onest → Heebo).

- **Q:** Should the base h1–h4 rule keep `letter-spacing: -0.02em`?
  **A:** No — removed. Tight tracking suited Inter; Oswald reads better with neutral tracking. Component-level `tracking-[…]` classes were also stripped from each h1/h2/h3.

- **Q:** What weights of Onest should we load?
  **A:** 400, 500, 600, 700, 800. Enough for body (400), UI accents (500/600), bold body (700), and the Nav/Footer wordmark display (800). Skipped 900 — current `font-black` consumers in Nav/Footer/Slideshow degrade gracefully to 800.

## Design

Final state in `src/styles/global.css`:

```css
--font-display: "Oswald", "Heebo", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-sans:    "Onest",  "Heebo", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-hebrew:  "Heebo",  "Onest", system-ui, sans-serif;

h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 500; }
```

`Layout.astro` `<link>` loads `Onest:wght@400;500;600;700;800`, `Oswald:wght@500`, `Heebo:wght@400;500;700;800`.

**Convention for new headings:** use `<h1|h2|h3 class="font-display font-medium ...">` — not `font-sans font-black` (the old shorthand).

**Deliberately not touched** (stay Onest, not Oswald):
- `Nav.astro` site wordmark `<a>` — Onest Black.
- `Footer.astro` site name `<p>` — Onest Extrabold.
- `Slideshow.astro` slide title `<p>` — not semantic heading, stays Onest Black.
- All eyebrows / uppercase labels.
- Hebrew-styled spans with explicit `var(--font-hebrew)`.

## Trade-offs

- **Visual weight on headings dropped.** Inter Black 900 → Oswald Medium 500 is a dramatic shift; every heading is thinner and more vertically compressed. If the site reads too "light", bump Oswald to 600/700 (requires expanding the Google Fonts URL).
- **New headings need the right classes.** Worth a CONTRIBUTING.md note if more headings get added by hand.

## Implementation Results

Shipped in commit `74b4f73` ("Brand refresh: palette, type, half-highlight component").
