# Bug report: Wix-managed headless serves stale SSR HTML (content-independent ETag → 304 on a never-changing validator)

**Reporter:** RCK (Ra'anana Community Kollel) headless site
**Site ID:** `3360b9e1-0290-476e-ae3a-c88de2821929`
**Published URL:** https://raanana-co-05a91814-daniellakorn.wix-site-host.com/
**Date:** 2026-06-09

## Summary

On a Wix-managed headless site (Astro `output: "server"`, fully SSR, content
read live from Wix CMS per request), **edits to CMS content do not appear on a
cached route for 15–30 minutes**, even though the data is live in the CMS within
seconds. The published HTML is served from the CDN (Fastly) with a
**content-independent `ETag`**, so the `max-age=0, must-revalidate` revalidation
returns `304 Not Modified` and the edge keeps serving the stale body until the
build changes (a `wix release`) or the cache entry evicts.

The breakage is **route-asymmetric**: the homepage `/` (high traffic) is cached
and goes stale; low-traffic routes like `/team` are never cached (`x-cache: MISS`
on every request) and reflect CMS edits instantly. This asymmetry is what
surfaced the bug — identical code, opposite freshness behavior.

## Environment

- Wix-managed headless, scaffolded via the Wix CLI.
- Astro in `output: "server"` mode; pages SSR-render and query Wix CMS
  (`@wix/wix-data-items-sdk`, `auth.elevate`) on each request.
- Served through Wix hosting + Fastly (`server: Pepyaka`,
  `server-timing: …varnish…, dc;desc=fastly_ireland-pub_g`).

## Reproduction

1. Edit a CMS field that the homepage renders (e.g. `HomePage.whoWeAreBody`) in
   the dashboard or via the Data Items API. Confirm via the API that the **Live**
   dataset holds the new value.
2. Request the homepage repeatedly:
   ```
   curl -sI https://raanana-co-05a91814-daniellakorn.wix-site-host.com/
   ```
3. Observe the response is served from cache and does **not** reflect the edit,
   while the same edit is visible immediately on a low-traffic route (`/team`)
   and on the homepage with a cache-busting query string (`/?v=1`).

## Evidence

**Homepage `/` — served stale from cache, identical ETag across requests even as content changed:**

```
cache-control: public,max-age=0,must-revalidate
etag: W/"baas_20d2106912f7fe8c869393ea68e637d0bd6ed6ed0f27be42e414dad29f9e2323"
x-cache: HIT
age: 1111            # and 1616 on other hits — ~18–27 min stale
```

The cached `/` still contained an edit ("TEST TEST TEST" appended to
`whoWeAreBody`) **after** that text had been removed from the CMS; a fresh render
via `/?v=<random>` correctly omitted it. So the data layer was always correct —
only the cached HTML was stale.

**`/team` — never cached, always fresh (same codebase, same SDK pattern):**

```
x-cache: MISS
age: 0              # every request
```

## Expected vs. actual

- **Expected:** SSR HTML for CMS-driven content reflects CMS edits without a
  republish (this is the entire value proposition of headless + live CMS, and
  what the docs imply — "changes go live in ~30s").
- **Actual:** Cached routes serve stale HTML until the build changes or the
  cache entry evicts, because revalidation hinges on an `ETag` that does not
  change when the underlying content changes.

## Root-cause hypothesis

The `ETag` (`W/"baas_…"`) is derived from the **build artifact**, not the
**rendered response body / underlying data**. Combined with
`Cache-Control: public, max-age=0, must-revalidate`, every edge revalidation
sends `If-None-Match: <build-etag>`, the origin returns `304 Not Modified`
(because the build hasn't changed), and Fastly serves the stale cached body.
A `wix release` "fixes" it only because it changes the build (new ETag) and
purges the entry.

## What we tried (and why it didn't work)

Added Astro middleware setting `Cache-Control: no-store` on `text/html`
responses, then built and released. **No effect:** the client-facing header
remained `public, max-age=0, must-revalidate`, and the homepage re-cached
(`x-cache: HIT`, `age` climbing 40→68s within 24s). The Wix serving/edge layer
overrides response `Cache-Control` (and emits the `ETag`) downstream of app
code, so apps cannot control this themselves. We found no documented app-side
knob in the headless or CLI docs.

## Impact

- Content editors believe edits "didn't save" or the site is broken, when the
  data is in fact live. Erodes trust in the headless CMS workflow.
- The only reliable way to push a homepage content change today is a full
  `wix release`, which defeats the point of CMS-editable content.

## What we're asking for

One of:

1. **Content-aware validation** — derive the `ETag`/cache key from the rendered
   response (or the underlying data revision) so revalidation actually busts on
   content change; **or**
2. **A supported opt-out** — let a headless app mark a route/response as
   non-cacheable (honor an app-set `Cache-Control: no-store`/`private`, or a
   documented per-route config), so dynamic CMS-driven pages aren't edge-cached
   with a stale validator.

Happy to provide a live repro on the site above at any time.
