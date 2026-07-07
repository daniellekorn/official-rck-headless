# 043 — `OurHistory.year` → `hebrew` (Text), and manual timeline navigation

**Status:** implemented
**Date:** 2026-07-07
**Author:** claude-session (danielle directing)
**Related:** [#015](015-history-timeline.md) (collection origin), [#024](024-history-timeline-widescreen.md) (widescreen marquee)

## Problem

1. The `year` field (Number by design, Text in practice) was never used for years —
   the office fills it with Hebrew accent lines ("מאין באנו", "ולאן אנחנו הולכים").
   The name misled both editors and the code, which sorted the timeline by it
   (`.ascending("year")`) — meaningless for Hebrew strings and wrong for rows
   that leave it empty.
2. The timeline was a pure-CSS marquee: visitors could watch it pan but couldn't
   move it themselves.

## Decision

- **Field rename, for real** (key, not just display name): created `hebrew`
  (Text), copied the two existing values via the Data Items API, deleted `year`.
  Ordering is now `sortOrder` alone.
- The Hebrew line renders in the **top-right corner** of each card (gold,
  `--font-hebrew`, RTL, text-shadow for legibility) instead of the big
  bottom-left year slot.
- **Manual navigation:** the marquee became a native horizontal scroller
  (hidden scrollbar, same edge mask) driven by a rAF loop that advances
  `scrollLeft` and wraps at half the duplicated track for the seamless loop.
  Prev/next arrow buttons scroll one card (smooth, card-aligned); touch swipe
  and trackpad work natively. Hover pauses the pan (as before); any manual
  input pauses it for a few seconds before it resumes.
  `prefers-reduced-motion`: no auto-pan, arrows jump without smooth scroll.

## Alternatives considered

- Renaming only the dashboard display name (key stays `year`): rejected — the
  key is what the code and future sessions see; the mismatch was the bug.
- Scroll-snap carousel with dots instead of the continuous pan: rejected — the
  slow marquee is part of the section's art direction (#016, #024).

## Verification

`hebrew` field verified live via the Data API (both values present, `year`
gone); `astro check` clean; homepage renders with the Hebrew corner line and
working arrows in both directions across the wrap seam. CONTRIBUTING.md
`OurHistory` schema table updated.
