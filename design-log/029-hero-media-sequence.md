# 029 — Hero media sequence (image → silent video → image crossfade)

**Status:** implemented — the `HomePage.heroImage` fallback superseded by #030 (HeroMedia is the single source of truth; empty → brand gradient). The reduced-motion autoplay behavior below is superseded by the 2026-08-02 addendum: the hero video now always autoplays regardless of `prefers-reduced-motion`.
**Date:** 2026-06-30
**Author:** claude-session (danielle directing)
**Related:** #001 (content/code boundary), #009 (hero lockup is structural), #018 (homepage layout config), #020 (homepage no-store cache)

## Background

The homepage hero (`src/components/Hero.astro`) shows a single background image
from `HomePage.heroImage`, with a dark gradient scrim and the brand lockup +
CTAs on top. The client wants the hero background to be a **sequence** — e.g. an
image that crossfades into a soundless video, then back to an image — instead of
one static image.

## Problem

A single `Image` field can't express an ordered, mixed-media sequence, and the
hero has no concept of multiple background layers or timed transitions. We need:
(1) a place for the office to add/order/remove hero slides (image or video), and
(2) hero code that crossfades through them, plays video muted, and degrades
gracefully.

## Questions and Answers

- **Q:** How do we play a CMS video without a heavy streaming player?
  **A:** `media.getVideoUrl(wixId, '720p')` (the `@wix/sdk` media API already used
  for images) returns a **direct progressive video URL** plus a `thumbnail`
  identifier. A plain `<video muted playsinline>` plays it — no HLS/DASH player,
  no `hls.js`. (The `@wix/media` `generateVideoStreamingUrl` route exists but is
  HLS/DASH and overkill for a short muted hero loop.) We use the returned
  `thumbnail` as the video's `poster` so there's no black flash before play.

- **Q:** New collection, or repeated fields on `HomePage`?
  **A:** New collection `HeroMedia`, one row per slide. The sequence is
  variable-length and ordered — exactly what rows are for. Repeated
  `heroSlide1*`/`heroSlide2*` fields on the single `HomePage` row would cap the
  count and bloat the schema.

- **Q:** One media field with a type selector, or separate image/video fields?
  **A:** Separate optional `image` (IMAGE) and `video` (VIDEO) fields, no type
  selector. A row is a **video slide** if `video` is set, else an **image slide**
  if `image` is set, else skipped. The editor just "uploads an image *or* a
  video" — no enum to get wrong.

- **Q:** When does a slide advance?
  **A:** Per the client's pick: **video plays once (muted) then crossfades** to
  the next slide; an **image holds** for `holdSeconds` (default 6) then
  crossfades. The sequence loops back to the first slide. A safety timer covers a
  video whose `ended` event never fires.

- **Q:** What about the existing `HomePage.heroImage`?
  **A:** Kept as a **fallback**. If `HeroMedia` has no active rows, the hero
  renders exactly as today from `heroImage`. Backward compatible — nothing
  changes until the office adds `HeroMedia` rows. When populated, `HeroMedia`
  takes over the hero background.

- **Q:** Accessibility / reduced motion / autoplay?
  **A:** Slides are decorative (`aria-hidden`), matching today's hero image.
  Under `prefers-reduced-motion: reduce`, the cycle does **not** run and video is
  **not** autoplayed — the first slide shows statically (a video shows its
  poster). Video is always `muted` + `playsinline` so mobile autoplay is allowed;
  playback is started via JS with a swallowed rejection.

## Design

**Collection:** `HeroMedia` — one row per slide. Permissions: **Anyone can read**,
edits ADMIN. Ordered by `sortOrder` ascending.

| Field | Wix type | Notes |
|---|---|---|
| `image` | IMAGE | Image slide. Used when `video` is empty. |
| `video` | VIDEO | Video slide (muted, plays once, then crossfades). Takes precedence over `image` on the same row. |
| `holdSeconds` | NUMBER (opt) | Image slides only: seconds to hold before crossfading. Default 6. Ignored for video. |
| `sortOrder` | NUMBER | Slide order, lower first. |
| `active` | BOOLEAN | Show/hide without deleting. |

**Service module:** `src/lib/hero-media.ts`
- `HeroSlide = { kind: "image" | "video"; url: string; poster?: string; holdMs?: number }`
- `getHeroMedia(): Promise<HeroSlide[]>` — queries active rows sorted by
  `sortOrder`, resolves images via `getScaledToFillImageUrl` and videos via
  `getVideoUrl(…, "720p")` (poster from the returned `thumbnail`). try/catch →
  `[]` (collection may not exist yet / SSR await safety per AGENTS.md).

**Hero.astro:** new optional `slides: HeroSlide[]` prop. If non-empty, render the
stacked crossfade layers (each slide absolutely positioned, opacity-transitioned;
the dark scrim sits above the media, lockup/CTAs unchanged on top). If empty,
fall back to the existing `imageUrl` → gradient logic untouched.

**Crossfade (client script in Hero):** show slide 0; image → advance after
`holdMs`; video → `play()` then advance on `ended` (with safety timeout); wrap to
0. Leaving a video pauses+resets it; entering one resets `currentTime` and plays.
A single video slide just loops. Honors `prefers-reduced-motion`.

```
HeroMedia (CMS rows) ──► getHeroMedia() ──► HeroSlide[] ──► <Hero slides>
                                                               │
        stacked <img>/<video> layers + opacity crossfade (client JS)
```

## Trade-offs

- **Bandwidth:** video autoplays on the homepage. Mitigations: `720p` cap,
  `preload="none"` on non-first slides (loaded on activation), muted. A very long
  clip is still a cost — guidance: keep hero clips short (≤ ~15s).
- **No per-slide transition styling** (duration/easing are fixed in code). If the
  office later wants control, that's a new entry.
- **Reduced-motion users never see the video** — acceptable; it's decorative.

## Verification

Empty/absent `HeroMedia` → hero renders exactly as today from `heroImage`. With
rows, slides crossfade in `sortOrder`; video plays muted once then fades on; the
sequence loops. Reduced-motion shows the first slide static with no autoplay.
`astro check` passes. `CONTRIBUTING.md` updated.

## Implementation Results (appended after work ships)

> **Update — the `heroImage` fallback below is superseded by [#030](030-hero-single-source-of-truth.md).**
> The hero now reads `HeroMedia` **only** (single source of truth);
> `HomePage.heroImage` is legacy/unused and the current image was migrated into a
> `HeroMedia` row. The rest of this entry (collection shape, video resolution,
> crossfade behavior) still stands.

Built and verified; commit pending.

- `src/lib/hero-media.ts` (new) — `HeroSlide`, `getHeroMedia()`; resolves images
  via `getScaledToFillImageUrl` and videos via `getVideoUrl(id, VideoResolution.MID)`
  (720p) with the returned `thumbnail` as poster. try/catch → `[]`.
- `src/components/Hero.astro` — new `slides` prop; stacked image/video crossfade
  layers + scrim when non-empty, else the prior `imageUrl`/gradient path
  untouched. Added `<style>` (opacity transition) + client `<script>` (image
  hold / video play-once-then-fade / loop / reduced-motion / off-screen
  pause-resume).
- `src/pages/index.astro` — fetches `getHeroMedia()` and passes `slides`.
- CMS: `HeroMedia` collection created live (fields `image` IMAGE, `video` VIDEO,
  `holdSeconds`/`sortOrder` NUMBER, `active` BOOLEAN; `read: ANYONE`, edits
  `ADMIN`). Starts empty.
- `CONTRIBUTING.md` updated (editable list + `HeroMedia` schema; noted
  `heroImage` is now the fallback).

**Note — `VideoResolution`:** `getVideoUrl`'s 2nd arg is the SDK's
`VideoResolution` **enum**, not a string literal; pass `VideoResolution.MID`, not
`"720p"` (the latter fails `astro check`).

**Addendum (2026-08-02):** Reverses the "reduced-motion users never see the
video" call above. Yosef reported the hero video not playing on phones in Low
Power Mode / with the OS "Reduce Motion" accessibility setting on — the
`prefers-reduced-motion: reduce` gate this entry built (skip the whole
cycle/autoplay, show slide 0 statically) was working as designed, but the
hero video is core marketing content here, not decorative motion, so he wants
it to always play. `src/components/Hero.astro`'s client script no longer
checks `prefers-reduced-motion` before calling `video.play()` — the crossfade
cycle and video autoplay now run identically regardless of that preference.
The CSS `@media (prefers-reduced-motion: reduce) { transition: none }` rule
is untouched (crossfades still cut instantly instead of animating for that
preference; only the "no video" part was reversed).

**Verification (live, dev server):** empty collection → hero renders from
`heroImage` as before (no `data-hero-slides`). Seeded two image slides → the
`[data-hero-slides]` container with two `[data-hero-slide]` layers rendered, both
`image` values resolved to scaled fill URLs (`w_1920,h_1200`). Test rows deleted.
Video playback path is type-checked and uses the documented `getVideoUrl`; not
exercised live (no uploaded clip yet). `astro check`: 0 new errors (only the
pre-existing `astro.config.mjs` `process` error).
