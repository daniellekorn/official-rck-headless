# 045 — Flyer images: scale the raw CMS URL through the Wix CDN

**Status:** implemented

## Problem

The flyer pages (events, learn, daven) were painfully slow on mobile — flyers
loaded very slowly if at all. Cause: the `Flyers` collection stores `imageUrl`
as a plain **text field** (a public `static.wixstatic.com` URL the office pastes
in — a Canva page-1 export, see [#031](031-flyer-image-lightbox.md)), and that
URL was passed straight to `<img src>` with no width, no `srcset`, no format
negotiation.

This is the one image on the site that bypassed `resolveImage()`
(`src/lib/wix-media.ts`), which every *Wix Image field* goes through to get a
bounded, WebP CDN variant via `getScaledToFillImageUrl`. The flyer field is a
text URL, not a Wix Image field, so that helper never applied. Result: mobile
downloaded full originals (observed: a `w_2500` PNG) to fill ~350px cards, one
per flyer across a grid that queries `limit(100)`.

## Decision

Rewrite the stored wixstatic URL into a Wix CDN transform at render time, rather
than migrate the field to a Wix Image type or re-export smaller PNGs by hand.

- `scaleFlyerImage(url, width)` + `flyerSrcset(url)` in `src/lib/wix-media.ts`.
- Uses `/v1/fit/…,q_80,enc_auto/` — **`fit`, not `fill`** (the rest of the site
  crops to a box; flyers must keep their true aspect since the frames letterbox
  with `object-fit: contain`), and `enc_auto` so the CDN serves AVIF/WebP by
  `Accept`. Emits a 400–1600w `srcset` + `sizes`.
- The thumbnail `<img>` is scaled; the Download button keeps the **original**
  `imageUrl`. The lightbox "view full size" originally also kept the raw
  original too, but that caused a real bug on mobile — see Update below.
- Non-wixstatic URLs pass through untouched; the helper is idempotent on URLs
  that already carry a `/v1/…` transform (it re-extracts the file id).

Applied in `Flyer.astro`, `CoverflowCarousel.astro`, and daven's inline schedule
flyer. No CMS schema change, no editor-workflow change — the office still pastes
the same public URL.

### Alternatives rejected

- **Migrate `imageUrl` to a Wix Image field** → routes through `resolveImage`
  for free, but changes the collection schema and the office's paste-a-URL
  workflow (CONTRIBUTING.md), and breaks existing rows. Too invasive for a
  render-time concern.
- **Ask the office to export smaller PNGs** → relies on humans, doesn't give
  responsive sizing or WebP, and the print-res export is wanted for downloads.

## Verification

Ran against the live CMS via the dev server: transformed URLs return `200` from
`static.wixstatic.com`, and the rendered `srcset` carries all five widths. For a
representative flyer the payload dropped from **188 KB** (`w_2500` PNG, as
stored) to **~12.5 KB** AVIF at `w_800` on a browser sending a modern `Accept`
header — ~93% smaller per flyer, more for heavier portrait flyers. Pages still
render with an empty field (helper returns `undefined` → existing placeholder)
and with non-wixstatic URLs (passthrough). Editor workflow unchanged.

## Update (2026-07-17): the lightbox needed the same treatment

Report: tapping a flyer on mobile to enlarge it showed a blacked-out image.
Cause: the lightbox's `data-lightbox-src` was intentionally left pointed at the
raw original `imageUrl` (per the original design above), and some stored
originals are far larger than the "observed `w_2500` PNG" this doc assumed —
one measured at **2828×4000px / 20.9 MB**. On a mobile connection that's slow
enough to load that the lightbox `<img>` sits on its dark placeholder
background for a long time, reading as "blacked out."

Fix: added `flyerLightboxSrc()` in `wix-media.ts` — the same `scaleFlyerImage`
transform at `w_1600` (vs. the thumbnail's ≤800) — and pointed
`data-lightbox-src` at it in `Flyer.astro`, `CoverflowCarousel.astro`, and
daven's schedule flyer. That same 20.9 MB PNG now serves as a ~180 KB AVIF.
The Download button is untouched — it still gets the true original, since
print-quality is the point of downloading.
