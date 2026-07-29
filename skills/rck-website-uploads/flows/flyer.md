# Flow — flyers

Collection `Flyers`, one row per flyer. Images live in the Media Manager folder called **Flyers**. Writing: `reference/wix.md`.

Two jobs here: **a new flyer**, and **replacing the picture on one that's already up**.

## Already happened? Wrong collection.

`Flyers` is for current and upcoming things. An event that's over belongs in `PastEvents` — a different collection with different fields (`title`, `eventDate`, `gallery`, `flyerImage`, `flyerPdfUrl`, `blurb`, `sortOrder`, `active`). If someone asks for a flyer for something in the past, say so and ask whether they want it in the archive instead.

## A — a new flyer: ask

1. **The Canva link.**
2. **Which page** — only if there's more than one. Check the design yourself rather than making them count.
3. **Title.** Offer to read it and suggest one.
4. **Which section** — Schedules, Learning, Youth Programming, or Events. Offer all four.
5. **How long it stays up.** Events almost always need a date; standing schedules don't.

## Fields

| Field | Type | What to put in it |
|---|---|---|
| `title` | Text | The name shown on the site. |
| `category` | Text | `schedules`, `learning`, `youth`, or `events`. Lowercase, exact. |
| `imageUrl` | Text | **The important one.** A plain public image URL — see below. |
| `pdfUrl` | Text | A public PDF URL. For genuinely multi-page documents only. |
| `isActive` | Boolean | Show/hide without deleting. Default true. |
| `displayOrder` | Number | Order within its section, lower first. |
| `subCategory` | Tags | Optional filter tags — see below. |
| `removeAfter` | Date | The last day it shows. Optional. |

## Sections — exactly four

Written into `category`, **lowercase**:

| Site value | Visitor sees | Ask |
|---|---|---|
| `schedules` | Schedules | "Is this a schedule?" |
| `learning` | Learning | "Is this a shiur or learning program?" |
| `youth` | Youth Programming | "Is this for kids or teens?" |
| `events` | Events | "Is this a one-off event?" |

A wrong or misspelled value means the flyer appears **nowhere**, with no warning. There is no fifth section — if they want one, that's Danielle's.

## `imageUrl` must be a plain public URL

It holds something like `https://static.wixstatic.com/media/f477b1_abc123….png`.

It is **not** a Wix internal reference. Writing `wix:image://v1/…` here produces a broken image on a live page with no error anywhere. This is the most common way a flyer upload silently fails.

Upload the PNG to the **Flyers** folder, then put the **public URL it hands back** in `imageUrl`. The Wix image-upload tool returns exactly that — a `wixstatic.com` URL — so use what it returns rather than building one. Read an existing flyer row first and mirror it.

That tool takes a **chat attachment** as readily as a link, so if someone attaches the PNG instead of sending a Canva link, that's fine — no need to send them back for a link.

Prefer an image over a PDF: an image gets the hover zoom, the click-to-enlarge viewer, and a Download button.

## Flyers are one page

Export **one page** as PNG, not the whole design. If the design has several pages, check how many and ask which one. This is why Canva embeds were removed from flyers — an embed showed every page, which was never what anyone wanted.

## Take-down dates

`removeAfter` is the last day the flyer shows. It stays up through that whole day in Israel time and disappears by itself the next morning. The row isn't deleted — set the date forward again and it comes back.

- **Event flyers: set a date.** This is the cleanup nobody remembers to do.
- **Standing schedules and ongoing programs: leave it empty.**

## Tags

`subCategory` is an optional list of tags. The site sorts them into filter rows by itself:

- **Day** — weekday names, plus `Daily`, `Shabbos`, `Motzei-Shabbos`
- **Time** — `Morning`, `Afternoon`, `Evening`, `Night`
- **Audience** — `Men`, `Women`, `Boys`, `Girls`, `Kids`, `Teens`, `Youth`, `Family`, `Community`
- **Topic** — anything else

Capitalisation doesn't matter. Tags must not contain a `|`.

**One reserved tag:** a flyer with `category: schedules` and the tag `daily` becomes the featured daily schedule on the Daven page under the minyan times. Only the first active one shows. To swap that schedule, replace the picture on that existing row — don't add a second one.

## B — replacing a flyer's picture

Title, section, and take-down date all stay exactly as they are. Only the image changes.

1. **Which flyer.** Ask for the title, find it, and read the title back so you're both certain it's the right one.
2. **The Canva link**, and which page.
3. **Read back** what's changing and what's staying.
4. **Swap the image.** This is an **update to an existing row** — `reference/wix.md` before you write. A careless one-field update wipes the title and take-down date you just promised to keep.
5. **Delete the old image** from the Flyers folder, so superseded versions don't pile up and nobody can tell which is current.

## Verify

Load the page for the section you filed it under (real base URL from the Wix connector) and confirm the flyer is there and the picture renders. A blank space where the image should be almost always means `imageUrl` got an internal reference instead of a public URL.
