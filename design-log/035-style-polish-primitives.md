# 035 — Style polish: shared heading-rule, focus, and WhatsApp-color primitives

**Status:** implemented (retrospective — records a polish pass and the primitives it standardized)
**Date:** 2026-07-02
**Author:** claude-session (danielle directing)
**Related:** [#004](004-brand-palette-refresh.md), [#021](021-cream-bands-bright-yellow-low-radius.md), [#034](034-design-review-cleanup.md)

## Decisions

- **Gold heading rules are a two-tier system**, not per-component spans. Use the
  `gold-rule` utility (3px × 4rem, rounded) under page/band headers and
  `gold-rule-sm` (2px × 3.5rem) under inner section headings — both in
  `global.css`. Don't hand-roll `h-[2px] w-12 bg-gold-400` variants again.
- **Homepage band eyebrows share one register**: the `eyebrow` utility plus the
  `text-base! sm:text-lg!` override. SplitFeature was the last bespoke one
  (bold, 0.18em) and now conforms.
- **One focus language site-wide**: a global `:focus-visible` (2px gold-500
  outline, 3px offset) in `global.css`, promoted from SectionPager. This
  realizes #004's "accent range reserved for focus rings" intent; components
  may still override with their own `focus-visible:` utilities (WhatsApp CTAs do).
- **`::selection`** is gold-200 on navy-700.
- **WhatsApp green is tokenized** (`--color-whatsapp`, `--color-whatsapp-dark`)
  and reserved for WhatsApp affordances only — never decoration.
- **PageHeader's gradient mid-stop** is `color-mix` of the navy tokens instead
  of a hardcoded hex, so CMS theme recoloring (#028) reaches it.
- Davening times render with `tabular-nums`; `h1`/`h2` get `text-wrap: balance`.

## Verification

`astro check` and `wix build` pass. Visual deltas are deliberate and small:
WhoWeAre's rule matches its band-header siblings (3px, rounded), team/contact
rules widen to the small tier, SplitFeature eyebrows pick up the shared
weight/tracking.
