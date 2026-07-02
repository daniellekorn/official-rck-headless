# 006 — Animated highlight component

**Status:** implemented — default color superseded by #021 (gold-500 → the bright `--color-accent`); component and reveal behavior stand
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#004](004-brand-palette-refresh.md), [#005](005-typography-refresh.md)

## Background

The brand owner asked for "animated highlighting on emphasized words that appears as the words come into view." Two scopes: auto-apply to the existing emphasis word in `SplitFeature` subheads, and build a reusable opt-in component (`<Highlight>`) for any heading or body span.

Before this entry, emphasis was a static `<span class="text-gold-500">` — a color shift with no motion or sense of arrival.

## Problem

Design at once: the visual style of the highlight, its trigger mechanism, and the API surface for opt-in use.

## Questions and Answers

- **Q:** What shape — full-coverage marker pass, offset block, underline draw, half-bar?
  **A:** Editorial half-bar. The bar covers roughly the lower half of the text (positioned near the baseline), leaving the upper portion uncovered. Matches the look on the RCK Pesach Guide 5786 flyer — clean and editorial, not sketchy.

- **Q:** Color — bright accent (`#F6ED49`) or darker gold-500 (`#D6A21E`)?
  **A:** Gold-500. Consistent with the nav underline ("use the darker one"). Solid, no alpha — the bar is small enough that full saturation works without overwhelming. Bright accent on a half-bar reads as neon.

- **Q:** How does the bar render across wrapped text?
  **A:** `box-decoration-break: clone` plus `background-image: linear-gradient(…)` on the inline element itself, not a `::before` pseudo. Each line-box draws its own bar — so "Torah and Growth" wrapping across two lines highlights both lines, not a single bar spanning the wrap gap.

- **Q:** Why not animate `transform: scaleX(0→1)` on a pseudo-element?
  **A:** A single absolutely-positioned `::before` can't follow line wraps. `background-size` is CPU-side but works correctly across line boxes because each line draws its own background. Negligible perf cost on a few heading elements.

- **Q:** Trigger?
  **A:** `IntersectionObserver` (`threshold: 0.5`, `rootMargin: "0px 0px -8% 0px"`) — fires slightly before the element fully enters the viewport, so the animation completes as the user scrolls into it. One-shot via `observer.unobserve(target)`; re-entering doesn't re-animate. `immediate` prop bypasses the observer and runs on page load (used in Hero).

- **Q:** Reduced motion?
  **A:** `@media (prefers-reduced-motion: reduce)` short-circuits to full-width with no transition. Users with motion sensitivity see the same emphasis, just without the sweep.

- **Q:** What if JavaScript is disabled?
  **A:** The scroll-trigger variant stays at `background-size: 0` — no highlight visible. Acceptable: page hierarchy still works without the accent (Oswald display vs Onest body carries structure). Could be fixed by inverting the default to "shown, then animate in via JS" — deferred until it matters.

- **Q:** Where else could the component be used?
  **A:** Any heading or inline phrase: `<Highlight>some words</Highlight>`. Add `immediate` to skip the scroll trigger. Currently used on the hero h1 and both SplitFeature subhead accents.

## Design

`src/components/Highlight.astro`. API:

```astro
<Highlight
  color="#D6A21E"      // gold-500 default
  height="0.5em"       // lower-half bar
  position="90%"       // sit near baseline
  duration={2200}      // ms, single sweep
  immediate            // animate on page load instead of on scroll
  delay={0}            // ms before sweep begins
>
  …text…
</Highlight>
```

Props are passed as CSS custom properties (`--rck-color`, `--rck-height`, etc.) consumed by `@layer base` rules — no per-instance class explosion.

CSS (global, scoped via `is:global`):

```css
.rck-highlight {
  background-image: linear-gradient(var(--rck-color), var(--rck-color));
  background-repeat: no-repeat;
  background-size: 100% var(--rck-height);
  background-position: 0 var(--rck-position);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  padding-inline: 0.05em;
}
.rck-highlight--scroll { background-size: 0 var(--rck-height); transition: background-size var(--rck-duration) cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.rck-highlight--scroll.is-visible { background-size: 100% var(--rck-height); }
@media (prefers-reduced-motion: reduce) {
  .rck-highlight--scroll { background-size: 100% var(--rck-height); transition: none; }
}
```

JS: an inline `<script is:inline>` runs one `IntersectionObserver` watching every `[data-rck-highlight]` on the page, adding `.is-visible` on first intersection.

## Trade-offs

- **No-JS users see no highlight.** Page is readable; the typographic hierarchy still works. Inverting the default (shown-then-animate-in) is the fix if this matters.
- **Bar position is tied to text baseline via `background-position: var(--rck-position)`.** Fine for default text; if a consumer wraps text with unusual line-height, the bar may drift. Tune via the `position` prop.
- **Single binary `subheadAccent` on `SplitFeature`** — no way to opt out of the highlight without removing the emphasis entirely. Acceptable until a new use case appears.

## Historical note — two earlier approaches were rejected

1. **CSS sweep (first pass).** Same `background-size` animation but full-coverage (`0.55em` height at 88% position) with bright accent yellow at 70% opacity. User pushback: "the animation is garbage … the design is weak. Think bold, beautiful, exciting." Flat-rectangle wipe with no character.
2. **`rough-notation` library (second pass).** SVG hand-sketched marker passes via the [rough-notation](https://roughnotation.com) library. User pushback: "way too much … I don't like how you go back and forth over the highlight." The library's `highlight` type is fundamentally sketchy by design — multiple noisy parallel strokes. No API knob to make it draw a clean editorial bar. **Do not reach for rough-notation again for this effect** — it's the wrong category.

The third pass succeeded by changing the *shape of the mark* (lower-half bar, single sweep), not by tuning the animation. When the user reaches for analogies or reference images, the visual aesthetic is the real spec, not the technical word.

## Implementation Results

Shipped in commit `74b4f73` ("Brand refresh: palette, type, half-highlight component"). `rough-notation` uninstalled cleanly; no third-party deps for this effect.
