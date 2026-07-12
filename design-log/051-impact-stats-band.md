# 051 — Impact stats band (count-up numbers between hero and first section)

**Status:** implemented
**Date:** 2026-07-12
**Author:** claude-session (danielle directing)

## Background

Danielle pointed to a competitor kollel site's homepage — a thin section with headline numbers (years running, shiurim/week, etc.) that count up from zero as it scrolls into view — and asked for the same effect with RCK's own numbers: 27+ Years of Devotion, 100+ Shiurim Weekly, 1,000 Hours of Torah Weekly, HUNDREDS Of Families Connected, THOUSANDS Of Lives Impacted. Placement: a new thin band between the Hero and whatever section currently sits right below it (the first "image + text" band, `id="about"`), dark-navy background matching the header/footer tone, all five numbers on one line always (no stacking on mobile).

## Design

**New component** `src/components/ImpactStats.astro`, inserted in `index.astro` between the `#welcome` (Hero) wrapper and the `#about` wrapper. `bg-navy-700` (the same token `PageHeader`/`Footer` use), a single `flex flex-nowrap` row of five columns with thin dividers between them. Number size uses a fluid `clamp()` (not breakpoint steps) specifically so five columns always fit on one line at any width down to a narrow phone, without introducing a new Tailwind breakpoint just for this.

**Mixed countable/non-countable values.** Not every value is a real number — "HUNDREDS" and "THOUSANDS" are words, not counts. Rather than a rigid schema (a numeric field + separate suffix field, which couldn't hold "HUNDREDS" at all), each stat is a single free-text CMS field exactly as an editor would type it ("27+", "1,000", "HUNDREDS"). The client script parses each value with `/^(\D*)([\d,]+)(\D*)$/` — a match yields a prefix, a numeric core, and a suffix to animate; no match (no digits at all) leaves the value exactly as authored, no animation attempted. This means the same field/component handles both cases without the office needing to know or care which kind of value they're entering.

**Reused conventions already in this codebase** rather than inventing new ones:
- The `motion` package's `inView` helper is already used for `index.astro`'s section-glide reveal; considered for this too, but a plain `IntersectionObserver` (matching `Layout.astro`'s own `[data-reveal]` script) was simpler for a one-shot "animate then unobserve" per element and avoided pulling the animation library into a second, differently-shaped use.
- `prefers-reduced-motion` is checked explicitly (matching the homepage's own section-reveal script) — reduced motion skips the whole observer setup, leaving the server-rendered final values (e.g. "27+") exactly as they'd read fully counted-up.
- Field naming (`statNumber1`/`statLabel1` … `5`) follows the established flat, numbered-slot pattern already used for `joinUsCard1–3*` and `imageTextSection1/2*` on the same `HomePage` collection, rather than a new collection for five rows.

**Ordering, changed after initial ship:** videos/numbers order wasn't a concern here, but worth noting for future reference — stat display order is simply array order (`statNumber1` first), no separate sort field, since five is a small fixed count edited directly in the dashboard's natural field order.

## Trade-offs

- **Five fixed slots, not a repeatable collection.** Matches every other "small fixed set of things" on `HomePage` (three Join Us cards, two image+text bands). A sixth stat would need a code change, not just a new CMS row — accepted, the layout is explicitly designed for exactly five columns on one line.
- **The "no digits → don't animate" rule is a heuristic, not a field-level toggle.** An editor typing "27th" (digits present but not meant as a count) would animate oddly. Not a real risk for the five values in use; worth a note if this component is ever reused elsewhere with different data.

## Verification

`astro check` clean (same 3 pre-existing, unrelated `index.astro` errors). Confirmed via the dev server: all five values/labels render from the seeded `HomePage` row, the compiled client script parses correctly (checked the transpiled output directly), and the band sits between the hero and the first `SplitFeature` band with the requested navy background.
