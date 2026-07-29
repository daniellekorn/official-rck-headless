# Flyers — field reference

Collection ID: `Flyers`. One row per flyer. Images live in the Wix Media Manager folder called **Flyers**.

## Fields

| Field | Type | What to put in it |
|---|---|---|
| `title` | Text | The name shown on the site. |
| `category` | Text | `schedules`, `learning`, `youth`, or `events`. Lowercase, exact. **Four options, not two** — see `vocabulary.md`. |
| `imageUrl` | Text | **The important one.** A plain public image URL. See below. |
| `pdfUrl` | Text | A public PDF URL. Fallback for genuinely multi-page documents only. |
| `isActive` | Boolean | Show/hide without deleting. Default true. |
| `displayOrder` | Number | Order within its section, lower first. |
| `subCategory` | Tags | Optional filter tags. See below. |
| `removeAfter` | Date | The last day it shows. Optional. |

## `imageUrl` must be a plain public URL

It holds something like:

```
https://static.wixstatic.com/media/f477b1_abc123….png
```

It is **not** a Wix internal reference. Writing `wix:image://v1/…` into this field produces a broken image on a live page with no error anywhere. This is the most common way a flyer upload silently fails.

Upload the PNG to the **Flyers** folder in the Media Manager, then take the resulting **public URL** and put that in `imageUrl`. The Wix image-upload tool hands back exactly that — a `wixstatic.com` URL — so use what it returns rather than building a URL yourself. Read an existing flyer row first and mirror what you see there.

That tool accepts a **chat attachment** as readily as a link (the platform resolves an attached file into the `download_url` + `file_id` it expects), so if someone attaches the PNG instead of sending a Canva link, that's fine — no need to send them back for a link.

Prefer an image over a PDF. An image gets the hover zoom, the click-to-enlarge viewer, and a Download button. Use `pdfUrl` only for a document that genuinely needs multiple pages.

## Flyers are one page

Export **one page** as PNG, not the whole design. If the design has several pages, check how many and ask which one — don't make the user count. This is why Canva embeds were removed from flyers: an embed showed every page, which was never what anyone wanted.

## Take-down dates

`removeAfter` is the last day the flyer shows. It stays up through that entire day in Israel time and disappears by itself the next morning. The row isn't deleted — set the date forward again and it comes back.

- **Event flyers: set a date.** This is the cleanup nobody remembers to do.
- **Standing schedules and ongoing programs: leave it empty.**

To take a flyer down right now, set `removeAfter` to yesterday. That's better than deleting — it's instant and it's reversible.

## Tags

`subCategory` is an optional list of tags. The site sorts them into filter rows by itself:

- **Day** — weekday names, plus `Daily`, `Shabbos`, `Motzei-Shabbos`
- **Time** — `Morning`, `Afternoon`, `Evening`, `Night`
- **Audience** — `Men`, `Women`, `Boys`, `Girls`, `Kids`, `Teens`, `Youth`, `Family`, `Community`
- **Topic** — anything else

Capitalisation doesn't matter. Tags must not contain a `|` character.

**One reserved tag:** a flyer with `category: schedules` and the tag `daily` becomes the featured daily schedule shown on the Daven page under the minyan times. Only the first active one shows. To swap that schedule, replace the picture on that existing row — don't add a second one.

## Already happened? Wrong collection.

`Flyers` is for current and upcoming things. An event that's already over belongs in `PastEvents`, which is a different collection with different fields (`title`, `eventDate`, `gallery`, `flyerImage`, `flyerPdfUrl`, `blurb`, `sortOrder`, `active`).

If someone asks you to add a flyer for something in the past, say so and ask whether they want it in the archive instead.

## Replacing a picture

Keep the title, the section, and the take-down date. Change only the image. Then **delete the old file** from the Flyers folder in the Media Manager — otherwise the folder fills up with superseded versions and nobody can tell which is current.

## Checking your work

Load the page for the section you filed it under, confirm the flyer is there and the picture renders. A blank space where the image should be almost always means `imageUrl` got an internal reference instead of a public URL.
