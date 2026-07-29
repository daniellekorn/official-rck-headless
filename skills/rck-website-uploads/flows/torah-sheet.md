# Flow — a new Torah sheet

Collection `TorahSheets`, one row per sheet. Names come from `reference/vocabulary.md`; writing from `reference/wix.md`.

A Torah Bytes sheet should take **three questions**. Skip anything already answered.

## First, confirm it's a Torah sheet

**Open the design and read it before question 2.** `דף` gets used for anything printed on a page.

| It is one | It isn't |
|---|---|
| divrei Torah on the parsha or a chag | a set of times, a seder or program schedule |
| a sugya, or mekoros on a topic | a sign-up, an announcement, an appeal |
| a perek of Pirkei Avos | a summer or bein-hazmanim program |

The right-hand column is flyers — `flows/flyer.md`.

**"It's not a parsha or a chag" means the wrong flow, not a series question.** Say so and go back to *Where it goes* in `SKILL.md`. Only a **Source Sheet** is legitimately neither, and a Source Sheet is still mekoros to learn from, so the design settles it. "It's for the summer kollel" describes a program, not a sugya.

## Ask

1. **The Canva link.**
2. **Which parsha or chag.** Hebrew is fine. Look it up in `vocabulary.md`; on an exact match **say nothing and move on** — it appears in the read-back for them to confirm. Speak up only when unsure: nothing close → stop and ask; close but not exact → name your guess and ask.
3. **The year.** Offer the current Hebrew year to correct — `Year: תשפ״ו?` — never open-ended.
4. **Combined?** Only if their answer suggests it. See below.

Don't ask:

- **for a title on Torah Bytes** — it's the parsha name. Dor L'Dor and Source Sheets do need one; offer to read the sheet and suggest it.
- **about the series**, unless nothing in the conversation indicates it. If you must, three bare options.
- **about the cover picture.** The answer is always yes. One line in the read-back.

**Never turn "which parsha" into a list.** Let them type `עקב` and match it.

## Fields

| Field | Type | What to put in it |
|---|---|---|
| `title` | Text | The name on the card. Torah Bytes: the parsha name. Dor L'Dor: usually the topic. A combo reads like `Pinchas / Shiva Asar B'Tammuz – Consistency`. |
| `series` | Text | `Torah Bytes`, `Dor L'Dor`, or `Source Sheets`. Exact. |
| `category` | **List** of Text | The Sefer, and/or `Chagim & Special Days`, and/or `Pirkei Avos`. A sheet can carry several. Empty for Source Sheets. |
| `subcategory` | Text | The specific parsha, or the chag for a chag-only sheet. |
| `chagSubcategory` | Text | Only when a sheet is *both* a parsha and a chag. |
| `avosPerek` | Text | Dor L'Dor Pirkei Avos only. `Chapter 1`–`Chapter 6`. |
| `topic` | Text | Source Sheets only. Open-ended (`Halacha`, `Hashkafa`, `Mussar`). The sidebar groups by whatever values exist. |
| `year` | Text | Hebrew, display only — `תשפ״ו`. The only Hebrew that goes into the site. |
| `sourceType` | Text | `pdf` or `canva`, lowercase. Anything else is treated as `pdf`. |
| `pdfFile` | Document | The PDF. Used when `sourceType` is `pdf`. |
| `canvaEmbedUrl` | Text | Used when `sourceType` is `canva`. The Canva **Share → Embed** link, ending `/view?embed`. |
| `canvaPdfBackup` | Document | Optional, Canva sheets only. Adds a download button beside the live embed. |
| `pdfThumbnail` | Image | The page-1 cover picture. |

Default to **`sourceType: pdf`** with the PDF in `pdfFile` — that's nearly every sheet. Use `canva` only when they say the sheet will keep being edited after posting and the site should always show the current version. Either can be switched later without a code change.

## Combined sheets

**Two parshios read together** (Behar + Bechukosai) → **one row**:

```
category:     ["Vayikra"]
subcategory:  "Behar-Bechukosai"
```

The hyphenated value must be one of the six in `vocabulary.md`. The site shows the sheet under both `Behar` and `Bechukosai` by itself. Don't create two rows.

**A parsha that's also a special day** (Pinchas falling on Shiva Asar B'Tammuz) → still **one row**, tagged both ways:

```
category:         ["Bamidbar", "Chagim & Special Days"]
subcategory:      "Pinchas"                 ← the parsha identity
chagSubcategory:  "Shiva Asar B'Tammuz"     ← the special-day name
```

That row appears under both the `Pinchas` and `Shiva Asar B'Tammuz` buttons. Two rows pointing at the same PDF would duplicate the sheet.

A **chag-only** sheet (Chanukah, no parsha) needs no `chagSubcategory` — put the chag in `subcategory` and tag `category: ["Chagim & Special Days"]`.

A Dor L'Dor sheet can be a parsha *and* Pirkei Avos *and* a chag at once — tag all three categories and fill `subcategory`, `avosPerek`, and `chagSubcategory`.

## The cover picture

**Always make `pdfThumbnail`.** Wix renders no preview from a PDF, so without it the sheet shows a generic icon. Only the featured (newest) sheet displays its cover.

**Never clear `pdfThumbnail` on another row.** A leftover value on an older sheet displays nothing; clearing it destroys a preview that has to be re-rendered from the PDF to get back.

## The featured sheet

A single new upload becomes the featured sheet at the top of its tab, by row creation time. No field to set.

Exception: a **batch** — several rows created within half an hour. The site then picks whichever matches the real current parsha. When adding a backlog, don't expect the last one you added on top.

## Getting the PDF in

1. Take the Canva **design** link.
2. Ask the Canva connector for a **PDF export URL**.
3. Hand that URL to Wix's Media Manager import — `reference/wix.md`: set `mimeType` explicitly and wait for the file to be ready.

The Wix image-upload tool doesn't take PDFs, so this goes through the generic import, which needs a publicly reachable URL. Don't reach for a chat attachment first — it may not resolve to one the API can fetch. If someone attaches a PDF anyway, try it; if the import fails, ask for the Canva link. Never substitute a different file.

**Don't create the row until the PDF has landed** in the Media Manager. A row pointing at a file that isn't there renders a broken card.

Downloads are named `RCK.TorahBytes.{Title}.{Year}.pdf` automatically from the row — no field to set. Only Torah Bytes carry the year.

## Verify

Load `/torah-sheets` (real base URL from the Wix connector):

1. The sheet is on the right tab.
2. It's at the top, with a real cover.
3. **Clicking its parsha or chag button in the sidebar shows it.** This is the check that catches a bad vocabulary match.
