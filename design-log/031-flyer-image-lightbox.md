# 031 — Flyers render as images with a shared lightbox + download

**Status:** accepted
**Date:** 2026-06-30
**Author:** claude-session (danielle's direction)
**Related:** #010 (Flyers collection), #017 (youth), #027 (past-events gallery)

## Background

Flyers across the site (Learn grid, Events grid, the Daven schedule, Youth
programs, the Past-Events archive) were rendered from a Canva **"Publish to
Web" embed** — a live `<iframe>` whose URL lives in CMS fields (`embedUrl` on
the `Flyers` collection; `flyerEmbedUrl` on `PastEvents` / `YouthPrograms`).
Every render site already had an `image → embed → pdf` fallback chain.

## Problem

The Canva live embed has two limitations the office hit:

1. **No download.** The embed viewer has no download affordance, and there is
   no embed parameter that adds one.
2. **No single-page control.** A multi-page Canva design always renders the
   whole design. We verified this directly in Canva's native Embed dialog
   (screenshot, 2026-06-30): it offers only an HTML embed code and a "Smart
   embed link" — **no page selector**. The "Pages shown" feature seen in blogs
   is a third-party (Iframely) tool, not native Canva.

## Questions and Answers

- **Q:** Can an SDK/integration give us live, single-page embeds instead?
  **A:** Only the **Canva Connect API** does it natively — its PNG export is
  single-page (defaults to page 1). But it's an OAuth app with async export
  jobs and token refresh; disproportionate for a flyer that changes a few times
  a year. Iframely / screenshot APIs are paid and fragile. Rejected for now;
  noted as the upgrade path if manual re-export ever becomes a real pain.

- **Q:** Image vs. PDF as the default?
  **A:** Image. Most flyers are one page; the office exports page 1 as PNG
  (Canva → Download → page 1) and fills the image field. PDF stays a fallback
  for genuinely multi-page documents.

- **Q:** Force a real download cross-origin?
  **A:** The HTML `download` attribute is ignored cross-origin, and Wix media
  is served from `static.wixstatic.com`. The lightbox/card download therefore
  tries a `fetch → blob → object-URL` save and **falls back to opening the
  image in a new tab** if CORS blocks the fetch. Honest, degrades cleanly.

- **Q:** "Hover gets bigger" like the Daven flyer (`scale-[1.5]`)?
  **A:** That works for a single centered flyer but would overlap neighbours in
  a grid. Standardize on a tasteful *within-frame* image zoom
  (`group-hover:scale-105`) everywhere, and use the lightbox for actually-bigger
  viewing. Daven's bespoke `scale-[1.5]` is replaced by this + the lightbox.

## Design

Two new components, no data migration (the embed/pdf fallbacks stay, so flyers
not yet converted keep working — the office converts at their own pace):

- **`src/components/Lightbox.astro`** — a single site-wide viewer rendered once
  in `Layout.astro`. Native `<dialog>` (free focus-trap, Esc, `::backdrop`).
  One delegated script handles **both** opening (`[data-lightbox-open]` with
  `data-lightbox-src` / `-title`) and downloading (`[data-download]` with
  `data-download-src` / `-name`), so cards and the lightbox share one code path.

- **`src/components/Flyer.astro`** — renders the framed `aspect-[3/4]` media
  block only (callers keep their own outer frame + caption, so each context's
  layout is untouched). Image path: a lightbox trigger button with
  `group-hover:scale-105` zoom and hover-revealed Expand + Download icon
  buttons. Falls back to the existing embed/pdf `<iframe>`s. Props:
  `imageUrl?`, `embedUrl?`, `pdfUrl?`, `title?`, `eager?`.

Converted surfaces: `learn.astro` grid, `events.astro` grid, `youth.astro`,
`EventArchive.astro`. `daven.astro` keeps its natural-ratio schedule image but
gains the lightbox + download hooks inline. `CoverflowCarousel.astro` is left
as-is this pass — it has its own 3D click-to-zoom; wiring the lightbox into it
is a separate, riskier change.

## Trade-offs

- Images are snapshots: when a flyer changes, the office must re-export page 1.
  The live embed auto-updated; the image doesn't. Accepted — see Connect-API
  note above for the eventual automation path.
- Full-size view uses the same Wix-resolved URL (scaled to 900×1200 by
  `resolveImage`), not the original asset. Fine for on-screen viewing/printing.

## Verification

Site builds; flyer surfaces render with image (lightbox opens, Esc/backdrop
close, download saves or opens). When no image/PDF is set, a branded
"coming soon" placeholder renders (empty-CMS safe). Office workflow updated in
`CONTRIBUTING.md`.

## Implementation Results

The embed option was removed **entirely** — from the code (`Flyer`,
`CoverflowCarousel`, `daven`, the three libs) and from the CMS (the `embedUrl`
field on `Flyers` and `flyerEmbedUrl` on `PastEvents` / `YouthPrograms`). The
render chain is now **image → PDF → "coming soon" placeholder**. PDF was kept.

At removal time, 10 of 14 flyers were embed-only with no image. Rather than
block the cleanup on 10 manual Canva exports, we:

- Converted the **Daily Schedule** (the one flyer that had to keep working) from
  its Canva embed to a real image: rendered page 1 of `RCK Community Schedule.pdf`
  to PNG via `pdftoppm` and uploaded it to the Media Manager.
- Left the other embed-only `Flyers` rows with no image, so they show the new
  placeholder until the office uploads page-1 exports. A code-rendered
  placeholder (not an uploaded asset) was chosen so it disappears automatically
  once a real `imageUrl` is set — nothing to clean up later.

**Youth flyer slot (follow-up decision).** Deleting the embed field also blanked
the two Dor L'Dor programs, which had been embed-only. Because nothing in the
data distinguishes "awaiting a flyer" from "intentionally text-only" once the
embed is gone, `/youth` was changed to **always render a flyer slot** for every
program — image/PDF when present, the "coming soon" placeholder otherwise (the
`hasFlyer` gate was removed from `youth.astro`). `PastEvents` was deliberately
left gated: a past event with no flyer isn't "pending" anything, so it shows no
placeholder.

**Preserved Canva design URLs** (the `embedUrl` values, deleted from the CMS —
kept here so they're recoverable if anyone needs the original designs):

| Flyer | Canva design URL |
|---|---|
| Shiur 2 | https://www.canva.com/design/DAHKCT0aDOQ/3xD4NoM4kYwIcYhspirSog/view?embed |
| Shiur 3 | https://www.canva.com/design/DAGzHgpjQd4/ExJNgGoGA_toyNW9he_9Ow/view?embed |
| Shiur 4 | https://www.canva.com/design/DAG2KnnKzrA/GBJir9WrnaNvtMjKyHB35w/view?embed |
| Shiur 5 | https://www.canva.com/design/DAG5JxRAoQQ/Jy3nhguwSvH96-8rTLniFw/view?embed |
| Shiur 6 | https://www.canva.com/design/DAG4UkA2T8o/ENQes9C-6syGl_RyCKdTtA/view?embed |
| Shiur 7 | https://www.canva.com/design/DAG_Z7HvsIk/g6mJ_bzVYEhYZjMLS0kjFQ/view?embed |
| TGIF — Shiur & Breakfast | https://www.canva.com/design/DAG2g3RLb-Y/hl5EzsEniJsSulqJFhwTgw/view?embed |
| Daily Schedule (now an image) | https://www.canva.com/design/DAGxRn56bGQ/6fYh2bW2VcYR7crkrfnxOg/view?embed |
| Dor L'Dor for Girls | https://www.canva.com/design/DAHE7hI6kcw/inB7HC6Qdjh8a47P3v5xlQ/view?embed |
| Dor L'Dor for Boys | https://www.canva.com/design/DAHE5R8Ydtk/ZlFHIJqCVpTpEe-OZrnxqA/view?embed |
