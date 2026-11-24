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
4. **Which page** — only if there's more than one. Count them yourself. Two pages that are the same flyer in English and Hebrew → *Hebrew + English flyers* below.
5. **How long it stays up.** If the design carries a date, offer that date. Events need one; standing schedules and ongoing programs don't.
6. **The link on the flyer**, if it has one — see *The link line*. Put it in the read-back; don't ask separately when you could read it.

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
| `imageUrlHebrew` | Text | The Hebrew flyer, same kind of public URL as `imageUrl`. Optional. |
| `titleHebrew` | Text | Hebrew title, shown under the Hebrew flyer. Optional. |
| `linkUrl` | Text | The link that's on the flyer. Optional. |
| `linkText` | Text | Words for that link, in English. Optional. |
| `linkTextHebrew` | Text | Words for that link, in Hebrew. Optional. |

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

Upload the JPG to the **Flyers** folder and use the URL the upload hands back — don't construct one. Read an existing flyer row and mirror it.

**The collection also has an `image` field and nothing reads it.** Most rows carry the same URL in both, but only `imageUrl` reaches the page — fill `image` alone and the flyer shows the "coming soon" placeholder. Always write `imageUrl`.

The image-upload tool takes a chat attachment as readily as a link, so an attached PNG is fine — don't send them back for a Canva link.

Prefer an image over a PDF: it gets hover zoom, click-to-enlarge, and a Download button.

## One page per flyer

Export **one page** as JPG, never the whole design, then compare the exported picture with the page's thumbnail from `read-design` before writing the row. Gray blocks or a missing banner → export again with different settings. Can't see the picture → ask them to check it on the site. Several pages → count them and ask which one. The one exception is below.

## Hebrew + English flyers

When two pages are the same flyer in English and Hebrew, upload both to **one row**: the English page in `imageUrl`, the Hebrew page in `imageUrlHebrew`. The site shows one card that opens in English, with an עברית button that flips it to the Hebrew flyer, title, and link. Never make two rows.

- Read both titles off the design: English in `title`, Hebrew in `titleHebrew`.
- Both languages share one `linkUrl`; write both `linkText` and `linkTextHebrew`.
- Works on `events` and `learning` flyers. The pop-up shows the English one only.
- No language tag needed: it answers to both the Hebrew and English filters by itself.

## The link line

A link on the flyer becomes a line under its title. Look for one on every event and shiur flyer: a web address in the text, a QR code, a Zoom or WhatsApp group link.

A QR code is a picture, so the design's text won't contain its link. Decode it from the exported page if you can; if not, ask for the link it opens. **Never guess a link**, and never use a placeholder. A phone number is not a link: only make one (`https://wa.me/9725…`, no leading 0) if they ask.

Write the full address in `linkUrl`, and pick the words from what the flyer asks people to do:

| The flyer says | `linkText` | `linkTextHebrew` |
|---|---|---|
| register, RSVP | Click here to register | לחצו כאן להרשמה |
| sign up | Click here to sign up | לחצו כאן להרשמה |
| join (Zoom, WhatsApp group) | Click here to join | לחצו כאן להצטרפות |
| reserve, buy tickets | Click here to reserve | לחצו כאן להזמנת מקום |
| sponsor, donate | Click here to sponsor | לחצו כאן לתרומה |
| watch, listen | Click here to watch | לחצו כאן לצפייה |
| nothing specific | Click here for more details | לחצו כאן לפרטים נוספים |

Leave the words empty and the site picks some from the kind of link. Show the link and the words in the read-back.

## Take-down dates

`removeAfter` is the last day it shows. It stays up through that day (Israel time) and drops off the next morning. The row survives — set a future date and it's back.

- **Event flyers: set a date.**
- **Standing schedules and ongoing programs: leave empty.**

## Tags

`subCategory` is an optional tag list. The site sorts them into filter rows:

- **Day** — weekday names, plus `Daily`, `Shabbos`, `Motzei-Shabbos`
- **Time** — `Morning`, `Afternoon`, `Evening`, `Night`
- **Audience** — `Men`, `Women`, `Boys`, `Girls`, `Kids`, `Teens`, `Youth`, `Family`, `Community`
- **Language** — `Hebrew`, `English`, `Spanish` (the language the shiur is given in)
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
