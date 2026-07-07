# 044 — `WhatsappGroups` collection; multi-video tiles; WhatsApp in the footer

**Status:** implemented
**Date:** 2026-07-07
**Author:** claude-session (danielle directing)
**Related:** [#032](032-whatsapp-community-section.md) (the band's original flat-fields design)

## Problem

The WhatsApp band's content lived in 21 flat `whatsapp*` fields on the single
`HomePage` row (#032) — and none of them were ever filled, so the band ran
entirely on hardcoded fallbacks. Editing a *list* of groups through numbered
flat slots (`whatsappShort1…4*`) was the wrong shape, capped at four, and each
tile held exactly one video. Danielle wants the office to own the group list
and to stack several sample videos per group.

## Decision

- **New collection `WhatsappGroups`** — one row per chat group:
  `name`, `description`, `joinHref` (URL), `videoUrls` (Text, one YouTube link
  per line, any URL form), `image` (poster override), `featured` (Boolean),
  `sortOrder`, `active`. Seeded with the six previously hardcoded groups.
  The left-hand list = all active rows; the video tiles = first four
  `featured` rows.
- `HomePage` keeps only the band's **header copy** (`whatsappTitleLead/Accent/
  Trail`, `body`, `joinLabel`, `joinHref`, `membersNote`). The retired
  `whatsappEyebrow`, `whatsappChatList`, and `whatsappShort1–4*` fields were
  removed from the code interface **and their 22 columns deleted from the
  live collection** (they never held data), so the dashboard shows only fields
  the site reads. `extractYouTubeId` moved homepage.ts → whatsapp-groups.ts.
- **Multi-video tiles:** a tile with several parsed video ids gets ‹ › arrows
  and a 1/N counter (outside the iframe frame so they survive the embed swap);
  flipping plays the selected video immediately.
- **Tile titles removed** (per Danielle) — tiles show video, description, and
  "Join chat" only; `name` still feeds alt/aria text and the left list.
- **Per-group join links everywhere:** a row's `joinHref` also makes its entry
  in the left-hand list a real link (hover: green text + arrow) that opens that
  specific group's invite. Rows without one render as plain text.
- **Header logo:** the green disc + white glyph became the plain WhatsApp
  glyph in brand green (the "green dot" read as a generic badge).
- **Footer:** added `ContactInfo.whatsappUrl` (URL) — the footer's social row
  already rendered a green WhatsApp button when that field is set. The office
  fills it with the main community invite to switch it on.

## Alternatives considered

- Keeping flat slots but adding `VideoId2/3…` fields: rejected — multiplies
  the field explosion #032 already suffered from; a collection is the natural
  shape for "a list the office curates."
- One `videos` row per video (separate collection): rejected — overkill; a
  multiline text field on the group row is the office's mental model ("paste
  the links").

## Verification

`astro check` clean. Band renders from the seeded collection (list + 3
featured tiles with "coming soon" posters until video links are pasted);
flipping and inline play verified once real links exist. CONTRIBUTING.md
updated (band table rows, `HomePage` field table trimmed, new `WhatsappGroups`
schema section, footer socials row).
