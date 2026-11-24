# 084 — Hebrew + English flyers that flip, and a link line under the title

**Status:** implemented
**Date:** 2026-11-24
**Author:** claude-session (Yosef directing)
**Related:** #010, #031, #038, #045, #054, #057, #083

## Background

Event flyers often come as a two-page Canva design, the same flyer in English and Hebrew, and carry a link — usually a QR code, which is useless to someone already reading on their phone.

## Design

Five optional fields on `Flyers` (schema in `CONTRIBUTING.md`): `imageUrlHebrew`, `titleHebrew`, `linkUrl`, `linkText`, `linkTextHebrew`.

- **Bilingual** = `imageUrl` and `imageUrlHebrew` both set (`isBilingual()` in `src/lib/flyers.ts`). `FlyerCard.astro` renders one normal-width card with the two flyers back to back. It opens in English; a solid white button in the picture's top right, labelled with the *other* language, flips it, and the title and link line below switch too. Both captions always hold their space so the card's height never changes; the side facing away is `inert`. The Hebrew caption is `lang="he" dir="rtl"`. Expand/Download move to the top left, and are hidden under 640px — a tap opens the lightbox on the side showing, where the arrows also change language. Flipping syncs by flyer id so the carousel's cloned cards match.
- **Link line** = `flyerLink()` in `src/lib/flyer-link.ts`. The office's words win; otherwise they're chosen from the kind of link. Only site paths, http(s), email and tel: become links — anything else shows no line. Navy text with a gold underline, because gold text on white fails contrast at that size.
- **Language filter** (`/learn`). `english`/`hebrew`/`spanish` tags form a Language group (`src/lib/tag-groups.ts`, #038); no row had one when this shipped, so the group appears once the office uses them. Choosing Hebrew or English turns every two-language flyer to that side, still flippable; both or neither means English. Only a change of language does this, so other filters never undo a flip made by hand. A two-language flyer matches both language filters whatever its tags, but doesn't create the filter — only tags do.
- `/events` and the `/learn` grid use `FlyerCard`; the `/learn` carousel (`CoverflowCarousel.astro`) has its own markup for the same flip, with the button and link line on the active card only. Both use `FlipToggle.astro` and `src/lib/flyer-flip.ts`, so a flyer's carousel and grid copies turn together. `linkedFlyerTitle` (#057) mirrors `imageUrlHebrew` too; a link belongs to its own row and isn't mirrored.

## Questions and Answers

- **Q:** Both flyers side by side, or flip between them?
  **A:** Flip everywhere (Yosef, after trying both in preview). Side by side was built first in a double-width card; on a phone each half was too small to read, and on a computer one event took two cards' space.
- **Q:** One row with a second image, or two rows linked together?
  **A:** One row. It's one event with one take-down date and one pop-up slot; two rows could drift apart, and the pair would depend on matching titles (#057's failure mode).
- **Q:** Merge the two pages into one wide picture before uploading?
  **A:** No. Each would be half-size in the lightbox and they couldn't be downloaded separately.
- **Q:** Read the link from the flyer automatically on the site?
  **A:** No. The upload skill reads it once (decoding the QR where it can) and shows it for confirmation; a wrong link is worse than none.
- **Q:** Reuse `popupLink` (#083)?
  **A:** No. That is where the pop-up's button goes, normally a page on this site. A flyer can need both.

## Verification

Checked in local preview on `/events` and `/learn`, desktop and phone, with a real Hebrew + English flyer beside single ones: flip, captions, lightbox, the link line for form, Zoom and invalid links, and the language filter (with temporary tags) in every combination. A row with none of the new fields renders as before.
