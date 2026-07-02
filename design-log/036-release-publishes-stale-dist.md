# 036 — `wix release` publishes the existing dist; the release script now builds first

**Status:** implemented
**Date:** 2026-07-02
**Author:** claude-session (danielle directing)
**Related:** [#020](020-homepage-stale-cache-no-store.md)

## Problem

`wix release` does not rebuild the site — it publishes whatever `dist/` the
last `wix build` produced, and reports "✔ Site published" either way. Running
it with a stale `dist/` (built before a `git pull`, or while another branch
was checked out) silently ships old code. This burned us twice in one day:
"I built and released but production is still the old code." It looks exactly
like the #020 cache symptom but has nothing to do with caching.

## Decision

`npm run release` is now `wix build && wix release` — releasing always builds
the current checkout first. Diagnosis rule for "production looks old": check
this first (curl the live page for a marker from the new code), *then* suspect
browser cache, and only then CDN staleness (#020).

## Verification

Reproduced the stale publish (release-only shipped pre-#13 CSS), then
`wix build && wix release` put the new CSS live — verified by curling the
published site's bundled stylesheet.
