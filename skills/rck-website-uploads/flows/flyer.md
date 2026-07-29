# Flow — flyers

Collection `Flyers`, one row per flyer. Images go in the Media Manager folder **Flyers**. Writing: `reference/wix.md`.

Two jobs: **a new flyer**, and **replacing the picture on one already up**.

## Check first — these aren't flyers

- **Already over** → `flows/past-event.md`. A past-dated flyer isn't hidden; it sits in the upcoming-events carousel looking current.
- **Ongoing, for kids or teens** → `flows/youth-program.md`.

## A — a new flyer: ask

1. **The Canva link.** Open and read it before asking anything else — it gives you the title, page count, date, and audience.
2. **Which section**, if the design doesn't settle it — Schedules, Learning, or Events.
3. **Title** — read it off the design and offer it for confirmation.
4. **Which page** — only if there's more than one. Count them yourself.
5. **How long it stays up.** If the design carries a date, offer that date. Events need one; standing schedules and ongoing programs don't.

## Fields

| Field | Type | What to put in it |
|---|---|---|
| `title` | Text | The name shown on the site. |
| `category` | Text | `events`, `learning`, or `schedules`. Lowercase, exact. Never `youth`. |
| `imageUrl` | Text | A plain public image URL — see below. |
| `pdfUrl` | Text | A public PDF URL. Genuinely multi-page documents only. |
| `isActive` | Boolean | Show/hide without deleting. Default true. |
| `displayOrder` | Number | Order within its section, lower first. |
| `subCategory` | Tags | Optional filter tags — see below. |
| `removeAfter` | Date | The last day it shows. Optional. |

## Sections

Written into `category`, lowercase. A wrong or misspelled value puts the flyer on no page, with no warning.

| Value | Visitor sees | Use it when | Renders on |
|---|---|---|---|
| `events` | Events | one-off with a date | `/events` |
| `learning` | Learning | shiur, chaburah, or learning program for adults | `/learn` |
| `schedules` | Schedules | the weekly minyan-and-shiur schedule | `/daven`, **only with the `daily` tag** |

**Never write `youth`.** The collection accepts it and no page reads it — a flyer filed there is invisible sitewide, spelled correctly, with no error. Instead:

- **Ongoing** (chaburah, Dor L'Dor, teen learning) → `flows/youth-program.md`.
- **One-off** (Chanukah mesibah, a trip) → `events` plus an audience tag (`Kids`, `Teens`, `Boys`, `Girls`).

No fifth section exists. If they want one, that's Danielle's.

## `imageUrl` must be a plain public URL

Like `https://static.wixstatic.com/media/f477b1_abc123….png`. A `wix:image://v1/…` value renders a broken image on a live page with no error anywhere.

Upload the PNG to the **Flyers** folder and use the URL the upload hands back — don't construct one. Read an existing flyer row and mirror it.

The image-upload tool takes a chat attachment as readily as a link, so an attached PNG is fine — don't send them back for a Canva link.

Prefer an image over a PDF: it gets hover zoom, click-to-enlarge, and a Download button.

## One page per flyer

Export **one page** as PNG, never the whole design. Several pages → count them and ask which one.

## Take-down dates

`removeAfter` is the last day it shows. It stays up through that day (Israel time) and drops off the next morning. The row survives — set a future date and it's back.

- **Event flyers: set a date.**
- **Standing schedules and ongoing programs: leave empty.**

## Tags

`subCategory` is an optional tag list. The site sorts them into filter rows:

- **Day** — weekday names, plus `Daily`, `Shabbos`, `Motzei-Shabbos`
- **Time** — `Morning`, `Afternoon`, `Evening`, `Night`
- **Audience** — `Men`, `Women`, `Boys`, `Girls`, `Kids`, `Teens`, `Youth`, `Family`, `Community`
- **Topic** — anything else

Capitalisation doesn't matter. No `|` in a tag.

## Schedules has exactly one slot

`/daven` shows the **first** flyer with `category: schedules` **and** the tag `daily`. Nothing else in the section renders anywhere:

- A `schedules` flyer without the `daily` tag is on no page.
- A second `daily` schedule flyer is on no page — the first keeps the slot.

So a new weekly schedule is almost always **section B on the existing row**, not a new row. Find the current `daily` row and confirm it's the one they mean.

If they want a second schedule posted separately, say the page has room for one and that's Danielle's.

The minyan times above the flyer on that page are computed weekly by the site — replacing this picture doesn't change them. If the times are what they're asking about, see `flows/times.md`.

## B — replacing a flyer's picture

Title, section, and take-down date stay. Only the image changes.

1. **Which flyer.** Find it and read the title back.
2. **The Canva link**, and which page.
3. **Read back** what's changing and what's staying.
4. **Swap the image** — an update to an existing row, so `reference/wix.md` first. A careless one-field update wipes the title and date you just promised to keep.
5. **Delete the old image** from the Flyers folder.

## Verify

Load the page for its section (real base URL from the Wix connector) and confirm the flyer is there and the picture renders. A blank space almost always means `imageUrl` got an internal reference instead of a public URL.
