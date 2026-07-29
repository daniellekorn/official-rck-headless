# Flow — youth programs

Collection `YouthPrograms`, one row per program. Everything on `/youth` comes from here. Writing: `reference/wix.md`.

All **ongoing** kids' and teens' material goes here — chaburah, Dor L'Dor for boys or girls, teen learning, Matmidim. Never `Flyers` with `category: youth`: that page doesn't read flyers, so it renders nowhere.

A **one-off** for kids (Chanukah mesibah, trip, Lag BaOmer bonfire) is an Events flyer with an audience tag — `flows/flyer.md`.

## New program, or a new flyer for an existing one?

Read the existing rows and their titles before asking. A design arriving for the youth page is usually a **new flyer for a program already listed**, which is section B. A duplicate row shows the program twice.

If it matches an existing title, name the row you found and confirm it's the same program.

## A — a new program: ask

1. **The Canva link**, if there's a flyer. Open it — it usually carries the program name, days and times, and the rabbi.
2. **The program name**, offered from the design rather than asked cold.
3. **A short description** — what it is, who it's for, when it runs. Offer to draft it from the flyer. The page needs this one.
4. **The contact rabbi's name and email** — one question, they belong together. No email → the page shows a plain Contact button.
5. **Photos** — only if they've mentioned having some.

## Fields

| Field | Type | What to put in it |
|---|---|---|
| `title` | Text | Program name. Becomes the section heading and page anchor. |
| `description` | Rich Text | What the program is. Paragraphs kept. Required in practice. |
| `flyerImage` | Image | The page-1 PNG. Gets click-to-enlarge and a Download button. |
| `flyerPdfUrl` | Text | A public PDF URL. Multi-page documents only; checked after the image. |
| `gallery` | Media Gallery | Program photos. One is a banner; more become a slideshow. |
| `contactName` | Text | e.g. `Rav Avraham Aharon`. |
| `contactEmail` | Text | Becomes the Email link. |
| `sortOrder` | Number | Section order on the page, lower first. |
| `active` | Boolean | Show/hide without deleting. Default true. |

`flyerImage` is an **Image** field and takes Wix's internal reference format — unlike `Flyers.imageUrl`, which needs a plain public URL. Read an existing row and mirror it (`reference/wix.md`).

Every program shows a flyer slot; an empty one renders "Flyer coming soon". A program with no flyer yet is fine — say so rather than treating the flyer as blocking.

An actual photograph works in `flyerImage` — the page matches the frame to the image's shape.

## B — replacing a program's flyer

Title, description, contact, and photos all stay. Only the picture changes.

1. **Which program.** Read the row's title back.
2. **The Canva link**, and which page.
3. **Read back** what's changing and what's staying.
4. **Swap the image** — an update to an existing row, so `reference/wix.md` first.
5. **Delete the superseded image.**

## Verify

Load `/youth` (real base URL from the Wix connector): the program's section is there, in the right place in the order, flyer rendering, contact link working.

A program appearing **twice** means a duplicate row instead of an update — say so and offer to hide the new one.
