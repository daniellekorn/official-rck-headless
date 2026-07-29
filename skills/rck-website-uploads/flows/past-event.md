# Flow — something that already happened

Collection `PastEvents`, one row per event. Drives the archive lower down `/events`: a list of names, newest first; clicking one opens that event's photos, videos, and flyer. Writing: `reference/wix.md`.

Anything already over goes here — mesibah, siyum, melava malka, trip, a speaker who's been. Not `Flyers`: a flyer for a finished event isn't hidden, it stays in the upcoming-events carousel looking current.

Two ways in:

- **"Here are the photos from the mesibah"** → section A.
- **"The Pesach event is over"** → `flows/take-down.md` for the flyer, then offer this.

## Was it up as a flyer?

Look before asking. If the event ran, there's usually still a `Flyers` row. Then it's two changes, presented as two:

1. The flyer comes off the upcoming section.
2. The event goes into the archive with its flyer and photos.

Offer both; show both in the read-back. Reuse the flyer image already in the Media Manager rather than asking for a fresh export — say that you're doing it.

## A — a new archive entry: ask

1. **What it was** — the name. If it was up as a flyer, offer that title.
2. **When it was.** A month is enough. No date → it sinks to the bottom of the list.
3. **The photos.** Attachments are the usual way. Ask for them in one go.
4. **Videos** — only if they mention having any. YouTube links in any form.
5. **A blurb** — optional. Offer to draft one.

A title and a date alone is a valid entry. Don't hold the upload for photos that don't exist.

## Fields

| Field | Type | What to put in it |
|---|---|---|
| `title` | Text | Event name — the clickable label in the archive list. |
| `eventDate` | Date | Sorts newest-first and captions the panel. Empty → bottom of the list. |
| `gallery` | Media Gallery | The photos. One is a single image; more become a slideshow. |
| `videoUrls` | Text | Video links, **one per line**. Any YouTube URL form. They appear after the photos in the same viewer. |
| `flyerImage` | Image | The event's flyer. Preferred over the PDF. |
| `flyerPdfUrl` | Text | A public PDF URL. Multi-page fallback. |
| `blurb` | Rich Text | Short description above the photos. Paragraphs kept. |
| `sortOrder` | Number | Tiebreaker for two events on the same date, lower first. |
| `active` | Boolean | Show/hide without deleting. Default true. |

`flyerImage` and `gallery` take Wix's internal reference format — not the plain public URL `Flyers.imageUrl` needs. Read an existing row and mirror it (`reference/wix.md`).

## Order

Sorted by `eventDate`, newest first. No featured slot, nothing to set. To move an event to the top, fix its date. `sortOrder` only separates events sharing a date.

## Verify

Load `/events` (real base URL from the Wix connector), scroll to the archive:

1. The name is in the list, in the right place by date.
2. Clicking it opens the photos, with the flyer beside them.
3. If you also took a flyer down, the upcoming section no longer shows it.
