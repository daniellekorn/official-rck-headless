# 032 — "Join our WhatsApp community" homepage band

**Status:** accepted
**Date:** 2026-06-30
**Author:** claude-session (danielle's direction)
**Related:** #016 (bold visual refresh), #019 (position-named homepage fields), #021 (mist bands / low radius)

## Background

The kollel's day-to-day life runs on WhatsApp — a main community chat plus topic
groups (Halacha2Go, Boost2Go, Torah Bytes, daily daf, minyan times, …). The
homepage had no entry point to it. The client wanted both a **list of the chat
groups** and a few **video previews** of featured groups.

## Design

New `src/components/WhatsAppCommunity.astro`, placed as the last `<main>` band
before the footer (id `whatsapp`, added to the section pager **and** to the Home
submenu in `Nav.astro` as "WhatsApp Community" → `/#whatsapp`). Light `bg-mist`
band, navy/gold type, WhatsApp green (`#25D366`) used sparingly so the section
reads as RCK not WhatsApp. Type sizes match the rest of the homepage (eyebrow
`text-base/lg`, h2 `text-4xl/5xl/6xl`, body `text-lg`).

**Layout:** centered header, then on desktop a two-column body:

- **Left:** the list of chat groups (icon + name) + the green join CTA.
- **Right:** 3–4 *featured* groups as **vertical 9:16 video-preview tiles**.
  Each tile shows a poster (YouTube thumbnail, a custom flyer image, or an "RCK"
  placeholder) and **plays that group's Short inline** — click swaps the poster
  for a `youtube-nocookie` autoplay embed. Group name + one-liner + "Join chat"
  sit beneath each tile. Mobile = a horizontal scroll-snap row; tablet+ wraps and
  centers.

This is how "thumbnail flyers" and "videos" were reconciled: a tile both
*highlights* a group and *is* its video.

### Design path (what we tried)

1. Dark animated-rays band — rejected (broke the light/dark alternation with the
   dark History section above; too loud).
2. Centered header + a row of vertical video tiles on a light band — liked.
3. Client shared a reference mock (list + WhatsApp hub + dashed connectors to
   thumbnails); built that hub-and-spoke version with the videos in a modal.
4. Client preferred the **video previews from step 2 over the hub-and-spoke**, so
   the final keeps the vertical tiles + inline play, adds the chat-group list on
   the left (from the mock) and the title on top. The hub, dashed connectors, and
   modal were dropped.

## Content / CMS

All copy, the chat list, and the featured groups live on the single `HomePage`
row as **flat fields** (see #019 for why homepage content is flat there) — chosen
over a dedicated collection to mirror the `joinUsCard1/2/3*` pattern and the
office's mental model. Fields on the live collection:

- Header: `whatsappEyebrow`, `whatsappTitleLead`, `whatsappTitleAccent`,
  `whatsappTitleTrail`, `whatsappBody`, `whatsappJoinLabel`, `whatsappJoinHref`,
  `whatsappMembersNote`. The heading is **lead + highlighted accent + trail** so
  any word can carry the gold marker. Default: "Join our WhatsApp **community**".
- Chat list: `whatsappChatList` — one name per line (or comma-separated); parsed
  in `index.astro`.
- Featured groups `whatsappShortN` (N = 1..4): `ChatName`, `Description`,
  `VideoId`, `JoinHref`, `Image`. Capped at 4 (`.slice(0, 4)`).

Read with optional chaining + fallbacks in `src/lib/homepage.ts` (and
`index.astro` passes them through), so the section renders with sensible
placeholder copy before the CMS is populated. `whatsappShortNImage` resolves
through `resolveImage` at 720×1280. A featured card shows only if it has a name
or a video; empty slots are hidden.

## Trade-offs

- **4-group cap** on the featured thumbnails, and the chat list is display-only
  text (no per-item links — that would need a collection). If the kollel wants
  more featured videos or per-chat links, migrate to a `WhatsAppShorts`
  collection (the component already takes arrays, so only the data source
  changes).
- YouTube embed is third-party + cookies-on-play. Mitigated with the
  privacy-mode (`youtube-nocookie`) host and click-to-load (no iframe until the
  visitor presses play on a tile).

## Verification

`astro check` clean (0 errors). 29 CMS fields created on the live `HomePage`
collection (`create-field`, confirmed: 22 header/short1-3, + `whatsappTitleTrail`,
+ `whatsappChatList` and the short4 slot). Renders empty-CMS-safe with
placeholders. `CONTRIBUTING.md` updated (where-it-lives table + field table).
