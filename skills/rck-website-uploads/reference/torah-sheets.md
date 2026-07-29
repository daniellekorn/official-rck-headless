# TorahSheets — field reference

Collection ID: `TorahSheets`. One row per sheet. Vocabulary values come from `vocabulary.md` — look them up there, don't type them from memory.

## Fields

| Field | Type | What to put in it |
|---|---|---|
| `title` | Text | The name on the card. Torah Bytes are usually just the parsha name. Dor L'Dor usually name the topic. A combo sheet reads like `Pinchas / Shiva Asar B'Tammuz – Consistency`. |
| `series` | Text | `Torah Bytes`, `Dor L'Dor`, or `Source Sheets`. Exact. |
| `category` | **List** of Text | The Sefer, and/or `Chagim & Special Days`, and/or `Pirkei Avos`. A sheet can carry several. Empty for Source Sheets. |
| `subcategory` | Text | The specific parsha, or the chag for a chag-only sheet. |
| `chagSubcategory` | Text | Only when a sheet is *both* a parsha and a chag — see "Combined sheets". |
| `avosPerek` | Text | Only for Dor L'Dor Pirkei Avos sheets. `Chapter 1`–`Chapter 6`. |
| `topic` | Text | Source Sheets only. Open-ended (`Halacha`, `Hashkafa`, `Mussar`). The sidebar groups by whatever values actually exist. |
| `year` | Text | Hebrew, display only — `תשפ״ו`. The only Hebrew that goes into the site. |
| `sourceType` | Text | `pdf` or `canva`, lowercase. Anything else is treated as `pdf`. |
| `pdfFile` | Document | The PDF. Used when `sourceType` is `pdf`. |
| `canvaEmbedUrl` | Text | Used when `sourceType` is `canva`. The Canva **Share → Embed** link, ending `/view?embed`. |
| `canvaPdfBackup` | Document | Optional, Canva sheets only. Adds a download button next to the live embed. |
| `pdfThumbnail` | Image | The page-1 cover picture. See below. |

## PDF or live Canva embed

Default to **`sourceType: pdf`** with the PDF uploaded into `pdfFile`. That's what nearly every sheet is.

Use `canva` only when the person says the sheet will keep getting edited after it's posted and they want the site to always show the current version. A live embed shows every page of the design — that's correct for a source sheet, and wrong for a flyer.

Either can be switched later without any code change.

## Combined sheets

**Two parshios read together** (Behar + Bechukosai): **one row**.

```
category:     ["Vayikra"]
subcategory:  "Behar-Bechukosai"
```

The hyphenated value must be one of the six on the list in `vocabulary.md`. The site splits it and shows the sheet under both `Behar` and `Bechukosai` automatically. Don't create two rows, and don't give a combined sheet its own filter button — that's handled.

**A parsha that's also a special day** (Pinchas, which fell on Shiva Asar B'Tammuz): still **one row**, tagged both ways.

```
category:          ["Bamidbar", "Chagim & Special Days"]
subcategory:       "Pinchas"                 ← the parsha identity
chagSubcategory:   "Shiva Asar B'Tammuz"     ← the real special-day name
```

That single row appears under the `Pinchas` button *and* the `Shiva Asar B'Tammuz` button. Two separate rows pointing at the same PDF would duplicate the sheet — some older written instructions say to do that; don't.

A **chag-only** sheet (a Chanukah sheet with no parsha) doesn't need `chagSubcategory` — just put the chag in `subcategory` and tag `category: ["Chagim & Special Days"]`.

A Dor L'Dor sheet can be a parsha *and* Pirkei Avos *and* a chag all at once — tag all three categories and fill `subcategory`, `avosPerek`, and `chagSubcategory` accordingly.

## The featured sheet

A single new upload automatically becomes the featured sheet at the top of its tab, based on when the row was created. There is no field to set and nothing to do.

The exception is a **batch** — several rows created within half an hour of each other. Then the site picks whichever one matches the real current parsha instead. So if you're adding a backlog, don't expect the last one you added to be the one on top; that's deliberate.

## The cover picture — always make one, never ask

`pdfThumbnail` will not happen by itself: Wix doesn't render a preview from a PDF, so until someone renders page 1 and uploads it, the sheet sits at the top of the list showing a generic icon instead of a real preview.

The answer is always yes, so **don't spend a question on it.** Make it, and note it in the read-back on one line.

Only the featured (newest) sheet displays its cover, so it matters most in the week a sheet goes up.

**Never clear `pdfThumbnail` on any other row.** The page already renders a thumbnail only for the featured card (`isFeatured` gates it in `torah-sheets.astro`), so a leftover value on an older sheet displays nothing and costs nothing. Clearing it is pure data loss — that sheet had a real preview when it was featured, and erasing it means nobody can get it back without re-rendering the PDF.

Older written instructions call this a "bonus cleanup." It isn't. It wiped a real preview the first time it ran.

## Getting the PDF in

**The route that's known to work**, and the default:

1. Take the Canva **design** link the user sent.
2. Ask the Canva connector to produce a **PDF export URL** from it.
3. Hand that export URL to Wix's Media Manager import.

The Wix image-upload tool doesn't handle PDFs, so the import goes through the generic path, which wants a publicly reachable URL — which a Canva export URL is. A chat attachment may not resolve to one the API can fetch, so don't reach for that first.

If someone attaches a PDF anyway, try it — but if the import fails, say so and ask for the Canva link. Do not fall back to a different file, and do not create the row until you've confirmed the PDF actually landed in the Media Manager. A row pointing at a file that isn't there renders a broken card.

## Writing to the collection

Read an existing row first and mirror its shape. `pdfFile` and `canvaPdfBackup` are Document fields and hold Wix's internal reference format, not a public URL — copy the format you see rather than constructing one.

Downloads are automatically named `RCK.TorahBytes.{Title}.{Year}.pdf` (Torah Bytes carry the year; the other series don't). That's built from the row — no field to set.

## Checking your work

Load the site's `/torah-sheets` page — get the real base URL from the Wix connector, don't assume a domain — and confirm three things:

1. The sheet is on the right tab.
2. It's at the top, with a real cover if you made one.
3. **Clicking its parsha or chag button in the sidebar actually shows it.** This is the one that catches a bad vocabulary match, and it's the one people skip.
