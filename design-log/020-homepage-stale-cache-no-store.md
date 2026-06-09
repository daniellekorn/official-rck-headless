# 020 — Stop the CDN serving a stale homepage (HTML `no-store`)

**Status:** attempted — **did NOT work** (Wix overrides our `Cache-Control`); root cause is platform-side, see Outcome
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

## Outcome — the middleware does not fix it

Built and released (minor version, 2026-06-09), then re-measured with
`curl -sI /`:

- The client-facing header is **still** `cache-control: public, max-age=0,
  must-revalidate` — our `no-store` never reaches the client.
- Hammering `/` shows it **re-caches**: `x-cache` flips to `HIT` and `age`
  climbs (40 → 68s within 24s). The `wix release` only *purged* the entry, so
  the page is fresh right now, but the stale-serving mechanism is intact.

**Conclusion:** Wix's serving/edge layer sets the `Cache-Control` (and the
build-keyed `ETag`) on SSR HTML and overrides whatever our Astro middleware
emits. There is no documented app-side knob (checked headless + CLI docs). So
this is **not fixable in our codebase** — it's a Wix platform behavior: dynamic,
CMS-driven SSR HTML is edge-cached with a content-independent `ETag`, so
`must-revalidate` returns `304` and serves stale until the *build* changes (a
release) or the entry evicts.

The `src/middleware.ts` from this change is a **no-op**, so it was reverted
(deleted) and re-released. The findings + the bug report
(`wix-stale-cache-bug-report.md`, to send to Wix) are the lasting artifacts of
this entry.

## Follow-up

1. Raise with Wix (we have a contact): SSR responses for CMS-driven content are
   served stale because the edge caches HTML with a build-keyed `ETag` +
   `max-age=0, must-revalidate`. Ask for either a content-aware validator or a
   supported way to opt a route out of edge caching. This is the real fix.
2. Until then: homepage content edits lag until cache eviction or a republish;
   `/team` and other low-traffic routes are unaffected (always MISS). Verify
   live content any time with a cache-busting query string (`/?v=1`).
3. `astro check` stayed clean throughout (the lone `process` error in
   `astro.config.mjs` is pre-existing and unrelated).
