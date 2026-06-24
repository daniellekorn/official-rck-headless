# 024 — `/demo` page: light-ray, header-bg, and timeline options

**Status:** implemented (exploratory — distill once the client picks)
**Date:** 2026-06-24
**Author:** claude-session
**Related:** #015 (history timeline), #016 (bold visual refresh), #021 (visual refresh)

## Background
The client wants to choose between several directions for three visual elements.
`/demo` is an unlinked internal page (not in the nav) presenting labeled options
side-by-side so he can say "I like B" for each.

## What's on it
The demo sections use **cream** backgrounds (not navy) to match the real
sections, so effects are judged in true context. Timelines use **placeholder
photos with mixed aspect ratios** (picsum) to exercise the blur-fill.

1. **Light effects** — first pass (drift/burst/spiral motion variations on the
   radial field) was rejected as too samey. Current set is six structurally
   different ideas judged on cream: `current` (the drift rays on the site now)
   and `sweep` (liked) — both the `LightRays` `variant` prop — plus demo-only CSS
   effects `sunbeams` (diagonal streaming beams), `ripple` (expanding rings),
   and `aurora` (flowing gold light), plus a sparse-beam `drift` (the Current
   radial rays at a low beam count). Shimmer and the orbiting glow were dropped. The four CSS effects live in `demo.astro` and get built
   properly once chosen. A "Replay" button restarts the fields. Timeline demos
   use ~4 mixed-ratio placeholder photos (the expected real count).
2. **PageHeader backgrounds** — 6 navy treatments shown at header size:
   diagonal lines (current), aurora mesh (animated), film grain (inline SVG
   `feTurbulence`), dot field, spotlight+vignette, topographic contour. These
   live as scoped CSS in `demo.astro` only; the real `PageHeader.astro` is
   unchanged until one is chosen.
3. **Timeline** — new `DemoTimeline.astro` with 3 variants (`cinematic`, `wide`,
   `glass`). All: bigger imagery, year/title/caption overlaid at the bottom,
   seamless CSS marquee that pauses on hover, and a blurred copy of the same
   photo filling letterbox gaps (`object-contain` image over a blurred
   `object-cover` copy). Driven by real `OurHistory` rows.

## Next step (when the client picks)
Promote the chosen light-ray `variant` into the homepage usage, fold the chosen
header background into `PageHeader.astro`, replace `HistoryTimeline.astro` with
the chosen `DemoTimeline` style, then delete `/demo` + `DemoTimeline.astro` and
trim this entry to record the decisions.

## Verification
`astro check` passes (only the pre-existing `astro.config.mjs` `process` error).
Page renders at `/demo`; LightRays default unchanged elsewhere.

## Implementation Results
- **Timeline → "A · Widescreen" chosen.** The `wide` variant was promoted into the
  live site: `HistoryTimeline.astro` was rewritten to the widescreen (16:9)
  marquee — oversized year, title + caption overlaid on a scrim, blurred
  same-image fill, pure-CSS marquee that pauses on hover, reduced-motion
  fallback. It keeps the old component's `entries` interface and placeholder
  fallback, so `WhoWeAre.astro` / `OurHistory` wiring is unchanged. `WhoWeAre`
  now renders the strip **full-bleed** (outside `container-page`) to match the
  demo presentation. The old auto-pan/reverse JS timeline was removed.
- Light-effect and PageHeader-background options are still pending a pick; `/demo`
  and `DemoTimeline.astro` stay until those are decided, then both get removed and
  this entry trimmed. (Commit SHA to be added when committed.)
