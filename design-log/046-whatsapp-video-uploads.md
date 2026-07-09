# 046 — Direct video uploads for WhatsApp featured tiles

**Status:** implemented
**Date:** 2026-07-09
**Author:** claude-session (yosef directing)
**Related:** [#044](044-whatsapp-groups-collection.md) (`WhatsappGroups` collection, `videoUrls` field)

## Problem

`WhatsappGroups.videoUrls` only ever parsed YouTube links (`extractYouTubeId`
recognizes `watch?v=`, `youtu.be`, `/shorts/`, `/embed/`, or a bare 11-char
ID). Three videos were uploaded directly to Wix Media and their
`video.wixstatic.com/.../file.mp4` URLs pasted into Boost2Go's `videoUrls` —
none of them matched any YouTube pattern, so `videoIds` came out empty and
the tile showed no play button at all, even though a poster image was set.

## Decision

- **Support both video sources, not just YouTube.** `WhatsappGroup.videos` is
  now `VideoItem[]` — `{kind:"youtube", id}` or `{kind:"file", src}` — instead
  of a YouTube-only `videoIds: string[]`. `parseVideos()` (renamed from
  `parseYouTubeIds`) classifies each `videoUrls` line by trying
  `extractYouTubeId` first, then falling back to "file" for anything that
  looks like a real video URL (`.mp4/.mov/.webm/.m4v`, or
  `video.wixstatic.com`) — so a pasted Wix video link now works without any
  code change on top of what #044 shipped.
- **New field `videoGallery` (Media Gallery, type `MEDIA_GALLERY`)** added to
  the live `WhatsappGroups` collection via the Data Collections API — the
  no-URL-pasting path: drag video files straight into the CMS row, the same
  interaction the office already uses for photo galleries elsewhere
  (`PastEvents.gallery`, `YouthPrograms.gallery`). Resolved via
  `media.getVideoUrl()` (new `resolveVideo`/`resolveGalleryVideos` in
  `wix-media.ts`), which also returns an auto-generated poster thumbnail —
  closing a related gap where uploaded/file videos had no poster fallback at
  all (YouTube videos already got one from `i.ytimg.com`).
- **Both sources merge into one `videos` array** per group (`videoGallery`
  items first, then parsed `videoUrls` lines), so the ‹ › tile switcher and
  the "N/total" counter don't need to know which source a video came from —
  same UI runs on top of whichever mix of the two the office chose.
- **Player picks the right embed for the kind:** the tile's client script
  renders a YouTube `<iframe>` for `{kind:"youtube"}` and a plain
  `<video controls autoplay playsinline>` for `{kind:"file"}`.
- **Poster fallback order updated:** custom `image` field → an uploaded
  video's auto thumbnail → the first YouTube video's thumbnail → "RCK coming
  soon" placeholder.

## Alternatives considered

- Telling the office to re-upload the 3 videos to YouTube instead: rejected —
  forces an unnecessary extra hop through a second platform for content Wix
  already hosts natively and serves fine.
- A single-file `Video` field (one video per row) instead of a Media Gallery:
  rejected — groups can have multiple videos (the switcher exists for this
  reason), and `Video` fields only hold one file.

## Verification

`wix build` clean. Confirmed live: Boost2Go's `videoUrls` (3
`video.wixstatic.com` links) resolve to 3 `{kind:"file"}` entries and render
in the tile's `data-videos` attribute; Halacha2Go (no videos yet) still shows
the placeholder. `videoGallery` field created on the live `WhatsappGroups`
collection (empty until the office drags files into it — not yet exercised
end-to-end with an actual gallery upload). CONTRIBUTING.md's band table and
`WhatsappGroups` schema section updated.
