# 005 — Typography refresh: Oswald display + Onest body

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#001](001-cms-driven-content-architecture.md), [#004](004-brand-palette-refresh.md)

## Background

Original type stack from #001 used Inter for both body and display (set at different weights — `font-black`/900 for headings, `font-normal`/`font-medium` for body) and Heebo for Hebrew. The brand owner specified a new pairing:

- **Onest** for body and UI ("most of the text", weights left to discretion).
- **Oswald Medium** (500) for "main heading style text".
- Heebo retained implicitly — neither Onest nor Oswald supports Hebrew, and the site has Hebrew on team bio names and the WhoWeAre subtitle.

## Problem

Three issues surfaced when planning the swap:

1. **The `--font-display` token was nearly unused.** Every heading component applied `class="font-sans … font-black"` rather than `class="font-display"`. The base rule `h1,h2,h3,h4 { font-family: var(--font-display); }` only kicked in when the utility classes didn't override it (which they always did). So swapping the token value alone would not produce any visible change.
2. **Weight mismatch.** Oswald's heaviest weight is 700; the codebase used 900 (`font-black`) and 800 (`font-extrabold`) on headings. The user's spec is explicitly *Medium* (500), so the heavy-weight classes had to come off, not just be capped.
3. **Tracking was tuned for Inter.** Most heading classes carried `tracking-[-0.025em]`, `tracking-[-0.02em]`, or `tracking-[-0.015em]` — tight negative tracking that suits Inter's geometric wide letterforms. Oswald is condensed by design; the same negative tracking makes it look pinched.

## Questions and Answers

- **Q:** Why not also switch the Nav wordmark and Footer site name to Oswald?
  **A:** Decided against. They're `<p>`/`<a>` elements styled as display text. Keeping them on Onest (heavier weights — `font-black` / `font-extrabold`) keeps the wordmark feeling solid and distinct from the body's lighter Onest weights, while reserving Oswald for true semantic headings. Cleaner mental model: Oswald = `<h1>`/`<h2>`/`<h3>`, Onest = everything else.

- **Q:** Why only Oswald 500 and not also 400 / 600 / 700?
  **A:** The user spec is "Oswald Medium" specifically. Loading additional Oswald weights now is speculative — they'd ship bytes to users for variants we don't use. If a designer later wants Light/Bold variants for a hierarchy, add the weights then.

- **Q:** What about eyebrows and small uppercase labels?
  **A:** Stay on Onest. They're not semantic headings; they're navigation/eyebrow patterns set with `font-sans text-xs uppercase tracking-[0.22em]`. Onest at the existing weights (400/500/700) handles them fine, and uppercase Onest is visually distinct from uppercase Oswald — keeps the hierarchy readable.

- **Q:** Hebrew text rendering — what happens inside an Oswald heading that contains Hebrew?
  **A:** Heebo fallback. `--font-display: "Oswald", "Heebo", system-ui, …` — Oswald has no Hebrew glyphs, so the browser falls back to Heebo for any Hebrew code points. Same fallback chain on `--font-sans` (Onest → Heebo). Hebrew lines that need pure Heebo styling (like the `&rlm;` subtitle in WhoWeAre) keep their explicit `style="font-family: var(--font-hebrew)"` override.

- **Q:** Should `--font-display` keep `Heebo` as a fallback even though Oswald doesn't share its character set?
  **A:** Yes. Per-glyph fallback is fine — Oswald handles Latin, Heebo handles Hebrew, no override needed at the component level for mixed-script headings. (We do this in WhoWeAre's headline, which is Latin.)

- **Q:** Should the @layer base rule for `h1–h4` keep `letter-spacing: -0.02em`?
  **A:** No — removed. Tight tracking suited Inter; Oswald reads better with neutral tracking. Component-level `tracking-[…]` classes were also stripped from each h1/h2/h3.

- **Q:** What weights of Onest should we load?
  **A:** 400, 500, 600, 700, 800. Enough range to support body (400), UI accents (500/600), bold body (700), and the Nav/Footer "wordmark" display style (800). Skipped 900 — current `font-black` consumers in Nav/Footer/Slideshow will degrade gracefully to 800 which is the closest available.

## Design

Final state in `src/styles/global.css`:

```
--font-display: "Oswald", "Heebo", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-sans:    "Onest",  "Heebo", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-hebrew:  "Heebo",  "Onest", system-ui, sans-serif;

h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 500; }
```

`Layout.astro` `<link>` loads:

```
Onest:wght@400;500;600;700;800
Oswald:wght@500
Heebo:wght@400;500;700;800
```

Component-level changes — all `<h1>`/`<h2>`/`<h3>` elements:

- `font-sans` → `font-display`
- `font-black` / `font-extrabold` → `font-medium`
- `tracking-[-0.025em]` / `tracking-[-0.02em]` / `tracking-[-0.015em]` → removed (omitted)
- Other modifiers (`text-*`, `leading-*`, `uppercase`, `text-white`, …) preserved

Files touched: `Hero.astro`, `PageHeader.astro`, `JoinUs.astro` (×2), `WhoWeAre.astro`, `SplitFeature.astro`, `team.astro` (×2), `daven.astro` (×3).

Files **not** touched (intentional, see Q&A):
- `Nav.astro:29` — site wordmark `<a>`, stays Onest Black.
- `Footer.astro:19` — site name `<p>`, stays Onest Extrabold.
- `Slideshow.astro:62` — slide title `<p>`, not semantic heading, stays Onest Black.
- All eyebrows / uppercase labels — stay on `font-sans` (Onest).
- Hebrew-styled spans with explicit `var(--font-hebrew)` — unchanged.

## Trade-offs

- **What we gave up:** Visual weight on headings. Inter Black 900 → Oswald Medium 500 is a dramatic shift; every heading is thinner and more vertically compressed. If the site reads too "light" overall, the fix is either bumping Oswald to 600/700 (still loaded? no — we loaded only 500; would need to expand the Google Fonts URL) or layering Onest 800 on a sub-heading underneath.
- **What we made harder:** Adding new headings now requires remembering to use `font-display font-medium` rather than the previous shorthand `font-sans font-black`. Worth a CONTRIBUTING.md note if more headings get added by hand.
- **What we made easier:** Headings are now properly distinct from body — Oswald vs Onest creates a clear typographic axis where Inter at different weights only created a quantitative one. Lays the groundwork for clearer hierarchy decisions.

## Verification

- `Layout.astro` requests the three font families with the expected weights.
- `global.css` `--font-display` is Oswald, `--font-sans` is Onest, `--font-hebrew` is Heebo.
- `rg -n '<h[1-6]' src --type-add 'astro:*.astro' -t astro` shows every heading using `font-display` (PageHeader/Hero h1s have class on next line — verified by file read).
- No remaining `font-black` / `font-extrabold` / `tracking-\[-0\.0` on heading elements.
- Body, eyebrows, and Nav/Footer wordmarks deliberately preserve their current weight classes; they'll render in Onest at those weights.
- Hebrew script inside English headings should fall back to Heebo via the `--font-display` fallback chain.
- Browser verification deferred to the user.

## Implementation Results

Shipped in commit `74b4f73` ("Brand refresh: palette, type, half-highlight component").
