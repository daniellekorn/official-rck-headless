# 032 — "On WhatsApp" homepage closing band

**Status:** accepted
**Date:** 2026-06-30
**Author:** claude-session (danielle's direction)
**Related:** #016 (bold visual refresh), #019 (position-named homepage fields), #021 (mist bands / low radius)

## Background

The kollel's day-to-day life runs on WhatsApp — a main community chat plus
topic sub-chats (daily daf, halacha, parsha, etc.). The homepage had no entry
point to it. We wanted a closing band that invites people in and previews a few
sub-chats via their YouTube **Shorts**.

## Design

New `src/components/WhatsAppCommunity.astro`, placed as the last `<main>` band
before the footer (id `whatsapp`, added to the section pager).

- **Light `mist` band, no animated atmosphere.** First pass put it on a dark
  navy canvas with animated `LightRays` (sunbeams) + gold/green glows. Rejected:
  History directly above is already dark (broke the light/dark alternation), and
  the moving yellow-on-navy was too loud for the rest of the site. Final is the
  quiet warm `bg-mist` band like Join Us, navy/gold type, standard `data-reveal`
  entrance only. Pager theme is `light`.
- **Shorts are vertical, so the tiles are phone-proportioned** (`aspect-[9/16]`,
  ~12rem wide). One tile per sub-chat. The video stays pure; chat name +
  one-liner + "Join chat" sit as a caption *beneath* each tile. Mobile = a
  horizontal scroll-snap row (swipe like Stories); desktop = centered wrap.
- **Click-to-play, not autoplay.** A poster (YouTube thumbnail, custom image, or
  a branded "Short coming soon" placeholder when there's no video) with a play
  button; click swaps in a `youtube-nocookie.com/embed/{id}` iframe. Keeps the
  page light and privacy-friendly until a visitor opts in.
- **WhatsApp green (`#25D366`) is the only foreign colour**, used sparingly: the
  main CTA button, the live pulse dots, the play hover ring. Navy + gold stay
  dominant so the section reads as RCK, not as WhatsApp's brand.

## Content / CMS

All copy + the sub-chats are content, so they live on the single `HomePage` row
(see #019 for why homepage content is flat fields there). Chose **flat fields,
3 sub-chat slots** over a dedicated `WhatsAppShorts` collection — mirrors the
existing `joinUsCard1/2/3*` pattern and the office's mental model, at the cost
of a hard cap of 3 (a 4th needs code). Added to the live collection:

- Header: `whatsappEyebrow`, `whatsappTitleLead`, `whatsappTitleAccent`,
  `whatsappTitleTrail`, `whatsappBody`, `whatsappJoinLabel`, `whatsappJoinHref`,
  `whatsappMembersNote`. The heading is **lead + highlighted accent + trail** so
  any word can carry the gold marker (the accent word is mid-phrase, not at the
  end).
- Per sub-chat `whatsappShortN` (N = 1..3): `ChatName`, `Description`, `VideoId`,
  `JoinHref`, `Image`.

Read with optional chaining + fallbacks in `src/lib/homepage.ts` (and
`index.astro` passes them through), so the section renders with sensible
placeholder copy and three "coming soon" tiles before the CMS is populated.
`whatsappShortNImage` resolves through `resolveImage` at 720×1280 (portrait).
A tile shows only if it has a name or a video; empty slots are hidden.

Default heading is "The **community** in your pocket" — danielle picked "the
community in your pocket" over "the conversation never stops", with the gold
marker on **community**. Section type sizes match the rest of the homepage
(eyebrow `text-base/lg`, h2 `text-4xl/5xl/6xl`, body `text-lg`).

## Trade-offs

- 3-slot cap. If the kollel wants more sub-chats highlighted, migrate to a
  `WhatsAppShorts` collection (the component already takes a `shorts[]` array, so
  only the data source changes).
- YouTube embed is third-party + cookies-on-play. Mitigated with the
  privacy-mode (`youtube-nocookie`) host and click-to-load (no iframe until the
  visitor clicks).

## Verification

`astro check` clean (0 errors). All 22 CMS fields created on the live `HomePage`
collection (`create-field`, confirmed). Renders empty-CMS-safe with placeholders.
`CONTRIBUTING.md` updated (where-it-lives table + field table).
