# 065 — "Community Voices" section; Member Spotlight behind a feature flag

**Status:** implemented
**Date:** 2026-09-01
**Author:** claude-session
**Related:** [#047](047-community-page.md) (Member Spotlight section this supersedes the slot of), [#060](060-hide-parshalink-feature-flag.md) (same hide-behind-a-flag pattern)

## Background

The Community page's "Member Spotlight" section (#047, `id="members"`) opens with a fixed video tile ("RCK Community Voices – What the RCK Means to Us") ahead of the CMS-driven family carousel.

## Problem

Yosef wants that whole section ("Community Spotlight" in his own words) off the live page for now, without deleting it — it needs to come back later, and when it does, it should render *below* a new section rather than reclaiming its old slot. The new section, "Community Voices," permanently takes over that slot and keeps just the video, formatted like the Learn page's first band: heading + copy on the left, media on the right, sized to match the Learn page's carousel band.

## Design

- **`SHOW_MEMBER_SPOTLIGHT`** (`src/pages/community.astro`, default `false`) gates the entire `id="members"` section — same one-flag pattern as `SHOW_PARSHALINK` (#060). Flipping it to `true` republishes Member Spotlight exactly as it was, now rendering after Community Voices instead of before it.
- **New `id="community-voices"` section**, placed where Member Spotlight used to sit. Hand-rolled two-column band (not `CoverflowCarousel.astro`) matching its `with-aside` layout — `container-page grid ... lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]` — since this is one fixed video, not a pageable set of items; reusing the carousel component for a single non-carousel media item would mean fighting its item-list API. `Highlight.astro` wraps "our community" and "Watch the video" in the copy, per Yosef's spec.
- The video tile itself is the same click-to-play-inline / corner-button-opens-lightbox tile #047 built (`data-video-spotlight` + `data-video-spotlight-play/-thumb/-scrim` wired by the shared script at the bottom of `community.astro`, expand button wired by the global `Lightbox.astro`), just bigger (`aspect-video` instead of `aspect-square`, sized to fill the right column up to `max-w-2xl`) — no new JS needed since that handler already `querySelectorAll`s every `[data-video-spotlight]` on the page, including a second one.

## Trade-offs

Re-enabling Member Spotlight is one line, but its video tile now duplicates the one in Community Voices (same `videoId`, same title) — both will render if the flag is ever flipped back on with Community Voices left in place. That's expected per this design (permanent replacement, not a temporary swap); if Member Spotlight comes back, drop its own video tile at that point rather than showing it twice.

## Verification

`astro check` and `astro build` are both clean for `community.astro` (the one pre-existing `index.astro` type error is unrelated, same one noted in #060). Confirmed the member section's markup sits entirely inside the `{SHOW_MEMBER_SPOTLIGHT && (...)}` expression, so with the flag `false` Astro never emits it to the response HTML (not just CSS-hidden) — nothing to find via view-source or an element inspector, and the flag/full section remain in the file for git history and a one-line revert.

## Addendum — `Highlight.astro` whitespace fix (2026-09-01)

Wrapping copy in `<Highlight>` immediately followed by punctuation (`<Highlight>...</Highlight>,`) rendered a visible gap before the comma — Astro was compiling the source's newline-indented `<slot />` into a literal leading/trailing space inside the `<span>`. Collapsed `Highlight.astro` to `><slot /></span>` on one line to remove those. This is sitewide (every `<Highlight>` caller), but strictly a fix: `WhatsAppCommunity.astro`'s title had been compensating with its own explicit `{titleLead && " "}` / `` `${titleTrail}` `` spacing, which was producing a double space around the highlighted word — confirmed via a rebuild that the homepage now renders a single space there instead.
