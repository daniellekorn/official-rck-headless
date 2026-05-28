# 007 — Animated highlight component

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#005](005-brand-palette-refresh.md), [#006](006-typography-refresh.md)

## Background

The brand owner asked for "animated highlighting or offset highlighting" on emphasized words "that appears as the words come into view on the screen." Two scopes were chosen together: (1) auto-apply to the existing emphasis word in `SplitFeature` subheads (currently set in `text-gold-500`), and (3) build a reusable opt-in component so any heading or body span can request the effect.

Before this entry, emphasis was static: a `<span class="text-gold-500">` flagged the accented word in each subhead. That's a quantitative signal — a color shift — without any motion or sense of arrival.

## Problem

Three things to design at once:

1. The visual style of the highlight (sweep vs. offset block vs. underline draw).
2. The trigger mechanism (one-shot on viewport entry, idempotent, motion-sensitive).
3. The API surface so it's easy to opt non-SplitFeature text into the effect later.

## Questions and Answers

- **Q:** Why the highlighter-sweep style rather than an offset block or underline draw?
  **A:** User selection in design conversation. The sweep reads as "marker pen" — it carries the connotation of someone highlighting important text, which aligns with how the underlying content uses it (the *emphasis* word of each subhead). Offset block was rejected as too stickerlike; underline draw was rejected as too restrained for headings already styled in light-weight Oswald.

- **Q:** What color does the highlight bar use?
  **A:** `--color-accent` (`#F6ED49`) at 70% opacity. This is the first real consumer of the accent token introduced in #005 — see "where should F6ED49 be used" Q&A there. A "highlighter pen" look canonically uses neon yellow at moderate opacity; at 70% the bright color reads as a marker pad behind navy text without overwhelming it. Earlier feedback ("the bright yellow underline is too light") was for a 1–2px decoration line where saturated yellow on white disappears; a 0.55em-tall bar behind dark text is the opposite case and reads strongly.

- **Q:** Why not `gold-500` (`#D6A21E`) like the Nav underline?
  **A:** Different role. The nav underline is a single thin line on a white pill — needs saturated dark color to register. The highlight bar sits *behind* dark text in a heading — the bar is the canvas, the text is the figure. Neon yellow at 70% reads "marker mark", gold-500 at 70% reads "old paper background." If the user wants a brand-restrained version, swap the `--rck-highlight-color` CSS variable to `rgba(214, 162, 30, 0.35)` (gold-500 wash).

- **Q:** How does the bar render with text that wraps to multiple lines?
  **A:** Uses `box-decoration-break: clone` plus `background-image: linear-gradient(…)` on the inline element itself, not a `::before` pseudo. That means the bar repeats on each line-box of wrapped text, instead of stretching across the bounding box of the parent (which would draw a single bar across both lines including the wrap gap). Already tested at SplitFeature widths where short phrases like "in Israel" stay on one line, but "Torah and Growth" might wrap on narrow viewports — both cases handled.

- **Q:** Why not animate `transform: scaleX(0→1)` on a pseudo-element instead of `background-size`?
  **A:** Considered. Transform on a pseudo would be GPU-friendly but breaks with wrapped text (a single absolutely-positioned ::before can't follow line wraps). `background-size` is CPU-side but works correctly across line boxes because each line draws its own background. The perf cost on a few heading elements is negligible. Trade-off chosen explicitly.

- **Q:** What's the trigger?
  **A:** `IntersectionObserver` with `threshold: 0.5` (half the element must be visible) and `rootMargin: "0px 0px -8% 0px"` (trigger slightly before the element fully enters the viewport, so the animation completes as the user scrolls *into* it rather than after). One-shot via `observer.unobserve(target)` on first intersection — re-entering the viewport does not re-animate. Once highlighted, stays highlighted.

- **Q:** Reduced motion?
  **A:** `@media (prefers-reduced-motion: reduce)` short-circuits: the highlight renders at full width with no transition. Users with motion sensitivity see the same emphasis, just without the sweep.

- **Q:** What if JavaScript is disabled?
  **A:** Failure mode is "no highlight visible at all" — the scroll-trigger variant starts at `background-size: 0 0.55em` and never receives the `.is-visible` class. Mitigation: also covered by reduced-motion's `background-size: 100% …` override, but only for users who set that preference. For no-JS users without reduced motion, the emphasis is invisible. Acceptable: the page's hierarchy still works without the accent (Oswald display vs Onest body carries the structure), and Wix Headless renders all content on the server. Could be fixed by inverting the default state to "shown, then animate in via JS" — deferred until it matters.

- **Q:** How is the SplitFeature emphasis migrated?
  **A:** The `subheadAccent` prop (`"line1" | "line2"`) used to switch a `text-gold-500` color on the matching span. Now it switches whether `<Highlight>` wraps that span. Both `<SplitFeature>` call-sites on the homepage pass `subheadAccent="line2"`, so the accented word ("in Israel", "Torah and Growth") gets the sweep without any prop change at the call site. Public API is unchanged.

- **Q:** Where else could the component be used?
  **A:** Any heading or inline phrase: `<Highlight>some words</Highlight>`. Add `immediate` to skip the scroll trigger and just render the static highlight: `<Highlight immediate>some words</Highlight>`. Possible future targets — hero headline (not auto-applied per user direction), section headers on /daven and /team, the JoinUs section heading.

## Design

New file: `src/components/Highlight.astro`. API:

```astro
<Highlight>emphasized words</Highlight>
<Highlight immediate>render at full width with no animation</Highlight>
```

Generated markup:

```html
<span class="rck-highlight rck-highlight--scroll" data-rck-highlight="">
  emphasized words
</span>
```

CSS (global, scoped via `is:global` Astro directive so the rule applies to all `rck-highlight` spans no matter which component renders them):

```css
.rck-highlight {
  --rck-highlight-color: rgba(246, 237, 73, 0.7);
  background-image: linear-gradient(var(--rck-highlight-color), var(--rck-highlight-color));
  background-repeat: no-repeat;
  background-size: 100% 0.55em;
  background-position: 0 88%;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  padding-inline: 0.05em;
}
.rck-highlight--scroll { background-size: 0 0.55em; transition: background-size 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.rck-highlight--scroll.is-visible { background-size: 100% 0.55em; }
@media (prefers-reduced-motion: reduce) {
  .rck-highlight--scroll { background-size: 100% 0.55em; transition: none; }
}
```

JS (inline `<script is:inline>` so it ships in the initial HTML, no module wait): a single `IntersectionObserver` watches every `[data-rck-highlight]` on the page and adds `.is-visible` on first intersection. Safe for repeated mounts (Astro is static-rendered; this runs once on initial page load).

SplitFeature change: the inline `text-gold-500` color switch on the accented span is replaced with conditional `<Highlight>` wrap. The base text color of the `<h2>` is set to `text-navy-600` instead of being inherited via the per-span class. No prop API change.

## Trade-offs

- **What we gave up:** A single-color visual signal. Before, the emphasis word was a clear gold flag at all times. Now it requires the user to scroll the section into view to see the accent. For users who arrive directly at the bottom of the page and scroll *up*, the SplitFeature subheads will animate as expected. For users with JS disabled and no reduced-motion preference, the highlight is invisible (see Q&A).
- **What we made harder:** Future SplitFeature subheads that need a different emphasis treatment (e.g. "this word should *not* animate") need a new prop. Currently `subheadAccent` is binary line1/line2; no way to opt out of the highlight without removing emphasis entirely. Acceptable until a new use case appears.
- **What we made easier:** Any heading on any page can opt into the effect with one component import — see API above. The accent token is now a properly used part of the palette rather than dead code.

## Verification

- New file: `src/components/Highlight.astro` (62 lines).
- `SplitFeature.astro` imports `Highlight` and wraps the accented subhead line.
- Both homepage `SplitFeature` consumers (`uniqueImpactful`, `torahVision`) pass `subheadAccent="line2"` → highlight applies to "in Israel" and "Torah and Growth" automatically.
- The IntersectionObserver script lives inside `Highlight.astro`'s `<script is:inline>`. It's emitted once per page that imports the component (Astro deduplicates components when used multiple times within a page).
- `prefers-reduced-motion: reduce` returns full-width highlight, no transition.
- Browser verification deferred to the user.

## Implementation Results

**First pass (CSS-only):** built per the Design section above — `background-image` linear-gradient with `background-size` animation, IntersectionObserver trigger. Shipped to the user, who reviewed it in the browser and pushed back hard: *"The animation for the highlight is garbage — not working at all as I expected. The design is weak. Think bold, beautiful, exciting, enticing."*

The flat-rectangle sweep was the lowest-energy interpretation of "highlighter." It rendered as a CSS box wiping across, with no texture, no character, and no sense that anyone had drawn it. Generic.

**Second pass (rough-notation):** swapped the implementation to the [rough-notation](https://roughnotation.com) library — a 3.5KB MIT-licensed annotation library that draws hand-sketched marks (highlight, underline, box, circle, strike-through, bracket) using SVG paths with hand-tremor randomization. Used on Stripe, Notion, and many design-forward sites. Renders with multiple noisy passes that look like marker strokes.

Library API surfaced through the same `<Highlight>` component, with new props exposed:

```astro
<Highlight
  type="highlight"     // also: underline | box | circle | strike-through | crossed-off | bracket
  color="#F6ED49"      // bright yellow accent (the library reduces alpha for "highlight" type)
  duration={2200}      // ms; user feedback was "needs to be slower" — bumped defaults up
  iterations={2}       // number of stroke passes; more = denser, scratchier
  padding={6}          // px around text
  strokeWidth={2}      // for non-highlight types
  multiline            // re-draws per line-box on wrapped text
  immediate            // fire on page load instead of on scroll-into-view
  delay={0}            // ms between trigger and start of draw
>
  …text…
</Highlight>
```

Trigger logic preserved: `data-immediate="true"` fires after `requestAnimationFrame` post-DOMContentLoaded; everything else uses the same `IntersectionObserver` one-shot. `prefers-reduced-motion` short-circuits `animationDuration` to 0 and `animate` to false (instant render, no draw).

**Hero application:** also per user feedback — they wanted the effect on the hero h1 ("would want it even on opening the website on the Ra'anana Community Kollel text like instead of that boring yellow line that is there now"). Wrapped `{title}` in `<Highlight immediate delay={500} duration={2600} padding={10} iterations={3}>`. The 500ms delay lets the page paint before the draw starts; 2.6s duration with 3 iterations makes it feel hand-drawn and deliberate rather than mechanical. The previous static `<span class="mt-6 block h-[3px] w-24 bg-gold-400">` decorative bar below the title was removed (user called it "boring") and the subtitle margin bumped from `mt-6` to `mt-8` to compensate.

**SplitFeature tuning:** duration bumped from 800ms (CSS-era default) to 2800ms with `iterations={3}` and `padding={8}` for the same hand-drawn richness on "in Israel" / "Torah and Growth". Both consumers on the homepage pick this up automatically.

**Color choice:** default switched from `rgba(246, 237, 73, 0.7)` (CSS-era) to the raw `#F6ED49`. rough-notation's `highlight` type applies its own opacity reduction to make the stroke look translucent, so a saturated input color produces the marker-pen look without manually computing alpha. Works on both the dark-navy hero background and white SplitFeature backgrounds.

**What we gave up vs. first pass:** ~3.5KB of JS in the bundle (rough-notation) plus dependency hygiene. Worth it for the visual upgrade — the library is mature, well-maintained, no transitive deps.

**Caveat (not yet fixed):** rough-notation positions strokes using `getBoundingClientRect()` at the moment `.show()` runs. If the user resizes the viewport after the draw, the strokes don't reflow with the text. Acceptable for now — most users don't resize. Fix would be a `resize` listener that calls `annotation.remove()` then re-runs `.show()`. Deferred until it matters.

**Files changed:** `src/components/Highlight.astro` (full rewrite), `src/components/Hero.astro` (wrapped title, removed static rule), `src/components/SplitFeature.astro` (tuned props), `package.json` (rough-notation@^0.5.1).

Pending commit.

---

**Third pass (editorial half-highlight, CSS):** rough-notation reviewed in browser, second round of user pushback: *"Now it is way too much — thinking the bright yellow isn't good better to use the darker yellow maybe or to do less of the highlighting like that was just a bit too covered. ... I don't like how you go back and forth over the highlight again right now."* They attached a reference flyer (RCK Pesach Guide 5786) showing the look they actually want: a solid mustard-yellow bar covering roughly the **lower half** of the text — clean editorial half-highlight, not a sketchy full-coverage marker pass.

Why rough-notation was the wrong tool: the library's `highlight` type is fundamentally sketchy — it always draws multiple parallel marker strokes by design, with hand-tremor noise. Even at `iterations: 1`, the single stroke has the rough character because that's the library's identity. There's no API knob to make it draw a clean editorial bar. Wrong category of effect.

Pivoted back to CSS but with a different design from the first pass:

- **Half-height bar.** Instead of `background-size: 100% 0.55em` covering most of the text, now `background-size: 100% 0.5em` *positioned at the bottom* (`background-position: 0 90%`). The bar sits behind the lower ~half of each letter, leaving the upper portion of the text un-covered. Matches the flyer reference.
- **Darker color.** Default switched from `#F6ED49` (bright accent) to `#D6A21E` (gold-500). Consistent with the user's prior preference on the nav underline ("use the darker one"). Solid, no alpha — the bar is small enough that full saturation works without overwhelming.
- **Single sweep, no repetition.** CSS `transition` (for scroll) or `@keyframes` (for `immediate`) — both produce one clean left-to-right reveal. No iterations, no back-and-forth.
- **Tunable via inline custom properties.** New props `height`, `position`, `color`, `duration`, `delay`, `immediate` — set as `--rck-color`/`--rck-height`/etc. on the span and consumed by the `@layer base` rules. No per-instance class explosion.

Component API after the third pass:

```astro
<Highlight
  color="#D6A21E"      // gold-500 default
  height="0.5em"       // lower-half bar
  position="90%"       // sit near baseline
  duration={2200}      // ms, single sweep
  immediate            // animate on page load instead of scroll
  delay={0}            // ms before sweep begins
>
  …text…
</Highlight>
```

Dropped props (no longer applicable): `type`, `iterations`, `padding`, `strokeWidth`, `multiline`. Multi-line wrapping is now handled automatically by `box-decoration-break: clone` (the bar re-draws per line-box, just like a real highlighter pen across wrapped text).

Hero consumer: `<Highlight immediate delay={500} duration={2600}>`. Defaults to gold-500 half-bar — the boring static gold rule below the title remains removed (from the second pass). On dark navy background, the gold-500 half-bar reads strongly without the neon shock of the prior bright-yellow full coverage.

SplitFeature consumer: `<Highlight duration={2800}>` on "in Israel" / "Torah and Growth". Same gold-500 half-bar, slower 2.8s sweep on scroll-into-view. No iterations means no scratchy back-and-forth.

`rough-notation` uninstalled (`npm uninstall rough-notation` removed the dep cleanly). Bundle is back to plain CSS + a 16-line inline IntersectionObserver script. No third-party deps for this effect.

**Lesson learned:** library choice matters more than animation tuning. The first CSS pass failed because the design was flat (full-rectangle, fast, single-pass). The rough-notation pass failed because the design was *too much* (sketchy, multi-pass, full-coverage). The third pass succeeded by switching the *shape of the mark itself* — lower-half bar, single sweep — which is what the user had in mind from the start but couldn't easily describe until they had a reference (the flyer). When the user reaches for analogies and reference images, the visual aesthetic is the real spec, not the technical word ("highlight" / "animation").

**Files changed (third pass):** `src/components/Highlight.astro` (rewrite — CSS only again, new API), `src/components/Hero.astro` (removed iterations/padding props from the Highlight usage), `src/components/SplitFeature.astro` (removed iterations/padding from both Highlight usages), `package.json` (rough-notation removed).

Pending commit.
