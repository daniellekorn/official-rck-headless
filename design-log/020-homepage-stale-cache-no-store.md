# 020 — Stop the CDN serving a stale homepage (HTML `no-store`)

**Status:** implemented
**Date:** 2026-06-09
**Author:** claude-session
**Related:** #001 (CMS-driven content)

## Background

The site is CMS-driven: an editor's change is supposed to appear within seconds,
no republish. In testing, homepage text edits took 15–30 minutes to show, while
`/team` edits (the rabbis) appeared instantly.

## Problem

Measured with `curl -sI`:

| | `/` | `/team` |
|---|---|---|
| `x-cache` | **HIT** | **MISS** every hit |
| `age` | ~1100–1600s | 0 |
| `ETag` | identical across hits, even as content changed | — |

The homepage was served from Wix's Fastly CDN with an ~18–27 min age. The page
sends `cache-control: max-age=0, must-revalidate`, so the CDN *does* revalidate —
but the `ETag` (`W/"baas_…"`) is keyed to the **build**, not the **content**. So
revalidation returns `304 Not Modified` and the CDN keeps serving the stale body
until the entry expires or the build changes (a `wix release`). `/team` was never
cached (always MISS), so it always rendered fresh — hence the asymmetry. A
fresh render via `/?v=<random>` reflected current Live data; the cached `/` did
not. The data layer was never the problem.

## Design

Add `src/middleware.ts` that sets `Cache-Control: no-store` on **HTML** responses
only (gated on `content-type: text/html`). `no-store` prevents caching outright,
sidestepping the broken build-keyed-ETag revalidation, so every page render hits
live CMS data. Content-hashed static assets (CSS/JS/images) are left untouched
and keep their long-lived caching.

## Questions and Answers

- **Q:** Why `no-store` rather than fixing the `ETag` to be content-derived?
  **A:** The ETag is emitted by the Wix hosting/adapter layer, not our code — we
  can't easily make it content-aware. `no-store` is a one-line, in-our-control
  fix. The site is low-traffic, so losing HTML CDN caching costs ~nothing.

- **Q:** Why a middleware instead of per-page `Astro.response.headers`?
  **A:** The stale-cache behavior is traffic-driven (the homepage got cached
  because it's the most-hit URL) — any page could be cached under load. A single
  middleware covers every current and future route uniformly.

## Trade-offs

HTML is no longer CDN-cached, so every request renders on the origin. Fine at
this site's traffic. If traffic ever grows enough to matter, revisit with a
short positive `max-age` (e.g. 30–60s) instead of `no-store` — but only if the
ETag is also made content-aware, or stale reads return.

## Verification

After release, re-measure: `curl -sI /` should show `x-cache: MISS` (or a
response with `cache-control: no-store`) and a homepage text edit should appear
on a normal refresh within seconds — matching the editor expectation in
CONTRIBUTING.md. `astro check` clean (the lone `process` error in
`astro.config.mjs` is pre-existing and unrelated).
