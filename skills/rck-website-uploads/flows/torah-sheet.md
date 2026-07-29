# Flow — a new Torah sheet

Collection `TorahSheets`, one row per sheet. Names come from `reference/vocabulary.md`; writing from `reference/wix.md`.

A Torah Bytes sheet should take **three questions**. Skip anything already answered.

## Ask

1. **The Canva link.**
2. **Which parsha or chag.** Hebrew is fine. Look it up in `vocabulary.md` — and if you find an exact match, **say nothing about it and move on**. It appears in the read-back, where they'll confirm it. Announcing `ואתחנן → Vaeschanan` mid-flow and then showing it again at read-back reads as asking twice. Speak up only when genuinely unsure: nothing close → stop and ask; close but not exact → name your guess and ask.
3. **The year.** Don't ask open-ended — offer the current Hebrew year to correct: `Year: תשפ״ו?` Almost every sheet is for the year it's uploaded in.
4. **Combined?** Only if their answer suggests it. See below.

**Don't ask for a title on Torah Bytes** — it's the parsha name, every time. Asking is the vocabulary match again in different words. Dor L'Dor and Source Sheets *do* need one, because their titles name a topic rather than the parsha; ask there, and offer to read the sheet and suggest something.

**Don't ask about the series** unless nothing in the conversation indicates it. If you must, offer three bare options — not a sentence explaining how to answer.

**Don't ask about the cover picture.** The answer is always yes. Note it in the read-back on one line.

**Never turn "which parsha" into a list.** Fifty-four transliterations the person doesn't think in is worse than them typing `עקב` and you matching it.

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

The hyphenated value must be one of the six on the list in `vocabulary.md`. The site splits it and shows the sheet under both `Behar` and `Bechukosai` by itself. Don't create two rows.

**A parsha that's also a special day** (Pinchas falling on Shiva Asar B'Tammuz) → still **one row**, tagged both ways:

```
category:         ["Bamidbar", "Chagim & Special Days"]
subcategory:      "Pinchas"                 ← the parsha identity
chagSubcategory:  "Shiva Asar B'Tammuz"     ← the special-day name
```

That one row appears under the `Pinchas` button *and* the `Shiva Asar B'Tammuz` button. Two rows pointing at the same PDF would duplicate the sheet.

A **chag-only** sheet (Chanukah, no parsha) needs no `chagSubcategory` — put the chag in `subcategory` and tag `category: ["Chagim & Special Days"]`.

A Dor L'Dor sheet can be a parsha *and* Pirkei Avos *and* a chag at once — tag all three categories and fill `subcategory`, `avosPerek`, and `chagSubcategory`.

## The cover picture

`pdfThumbnail` won't happen by itself: Wix renders no preview from a PDF, so until someone renders page 1 and uploads it the sheet shows a generic icon. Always make it.

Only the featured (newest) sheet displays its cover, so it matters most in the week a sheet goes up.

**Never clear `pdfThumbnail` on another row.** The page renders a thumbnail only for the featured card, so a leftover value on an older sheet displays nothing and costs nothing. Clearing it is pure data loss — that sheet had a real preview when it was featured, and erasing it means re-rendering the PDF to get it back.

## The featured sheet

A single new upload automatically becomes the featured sheet at the top of its tab, based on when the row was created. No field to set.

The exception is a **batch** — several rows created within half an hour. Then the site picks whichever matches the real current parsha instead. So when adding a backlog, don't expect the last one you added to be on top; that's deliberate.

## Getting the PDF in

The route that works, and the default:

1. Take the Canva **design** link.
2. Ask the Canva connector for a **PDF export URL**.
3. Hand that URL to Wix's Media Manager import (`reference/wix.md` — set `mimeType` explicitly, and wait for the file to be ready).

The Wix image-upload tool doesn't take PDFs, so this goes through the generic import, which needs a publicly reachable URL — a Canva export URL is one. A chat attachment may not resolve to one the API can fetch, so don't reach for that first.

If someone attaches a PDF anyway, try it — but if the import fails, say so and ask for the Canva link. Don't substitute a different file, and **don't create the row until the PDF has actually landed** in the Media Manager. A row pointing at a file that isn't there renders a broken card.

Downloads are automatically named `RCK.TorahBytes.{Title}.{Year}.pdf` (Torah Bytes carry the year; the other series don't). Built from the row — no field to set.

## Verify

Load the site's `/torah-sheets` page (real base URL from the Wix connector) and confirm three things:

1. The sheet is on the right tab.
2. It's at the top, with a real cover.
3. **Clicking its parsha or chag button in the sidebar actually shows it.** This is the one that catches a bad vocabulary match, and the one people skip.
