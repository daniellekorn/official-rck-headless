# The site's closed vocabulary

**Look every name up here. Every time. Even when you're certain.** If it isn't here, don't write it — stop and ask.

The site's filters match these values case-insensitively but otherwise **exactly**. A value that isn't on the list throws no error: the sheet uploads, shows under "All Sheets", and is missing from the sidebar filter where anyone would look for it.

Source of truth: `SEFER_PARSHIOS`, `CHAGIM_ORDER`, and `PIRKEI_AVOS_PERAKIM` in `src/lib/torah-sheets.ts`. If this file disagrees with that one, the code wins.

---

## Series — exactly three

Write one of these into `series`, spelled exactly like this:

| Value | Shown on the site as |
|---|---|
| `Torah Bytes` | Torah Bytes |
| `Dor L'Dor` | Dor L'Dor ParshaLink |
| `Source Sheets` | Source Sheets |

`Parsha Bytes` is the old name for Torah Bytes and still works, but write `Torah Bytes` on anything new. Any other value hides the sheet from every tab.

## Category — exactly seven

`category` is a **list**, not a single value. A sheet can carry more than one.

`Bereishis` · `Shemos` · `Vayikra` · `Bamidbar` · `Devarim` · `Chagim & Special Days` · `Pirkei Avos`

`Pirkei Avos` is used by Dor L'Dor only. Source Sheets leave `category` empty and use `topic` instead.

---

## Parshios, by Sefer

The **Site value** column is what goes into `subcategory`. Copy it character for character — the site uses Ashkenazi transliteration (`Eikev`, not `Ekev`; `Ki Savo`, not `Ki Tavo`).

Hyphenated rows are **combined weeks**. They are real, valid entries — use them when a sheet covers both parshios. A combined sheet gets no filter button of its own; it shows up under each of its two parshios automatically.

### Bereishis · בראשית

| Hebrew | Site value |
|---|---|
| בראשית | `Bereishis` |
| נח | `Noach` |
| לך לך | `Lech Lecha` |
| וירא | `Vayeira` |
| חיי שרה | `Chayei Sarah` |
| תולדות | `Toldos` |
| ויצא | `Vayeitzei` |
| וישלח | `Vayishlach` |
| וישב | `Vayeishev` |
| מקץ | `Mikeitz` |
| ויגש | `Vayigash` |
| ויחי | `Vayechi` |

### Shemos · שמות

| Hebrew | Site value |
|---|---|
| שמות | `Shemos` |
| וארא | `Vaeira` |
| בא | `Bo` |
| בשלח | `Beshalach` |
| יתרו | `Yisro` |
| משפטים | `Mishpatim` |
| תרומה | `Terumah` |
| תצוה | `Tetzaveh` |
| כי תשא | `Ki Sisa` |
| ויקהל | `Vayakhel` |
| ויקהל-פקודי | `Vayakhel-Pekudei` |
| פקודי | `Pekudei` |

### Vayikra · ויקרא

| Hebrew | Site value |
|---|---|
| ויקרא | `Vayikra` |
| צו | `Tzav` |
| שמיני | `Shmini` |
| תזריע | `Tazria` |
| תזריע-מצורע | `Tazria-Metzora` |
| מצורע | `Metzora` |
| אחרי מות | `Achrei Mos` |
| אחרי מות-קדושים | `Achrei Mos-Kedoshim` |
| קדושים | `Kedoshim` |
| אמור | `Emor` |
| בהר | `Behar` |
| בהר-בחוקותי | `Behar-Bechukosai` |
| בחוקותי | `Bechukosai` |

### Bamidbar · במדבר

| Hebrew | Site value |
|---|---|
| במדבר | `Bamidbar` |
| נשא | `Naso` |
| בהעלותך | `Behaaloscha` |
| שלח | `Shlach` |
| קרח | `Korach` |
| חוקת | `Chukas` |
| בלק | `Balak` |
| פינחס | `Pinchas` |
| מטות | `Matos` |
| מטות-מסעי | `Matos-Masei` |
| מסעי | `Masei` |

### Devarim · דברים

| Hebrew | Site value |
|---|---|
| דברים | `Devarim` |
| ואתחנן | `Vaeschanan` |
| עקב | `Eikev` |
| ראה | `Re'eh` |
| שופטים | `Shoftim` |
| כי תצא | `Ki Seitzei` |
| כי תבוא | `Ki Savo` |
| נצבים | `Nitzavim` |
| נצבים-וילך | `Nitzavim-Vayeilech` |
| וילך | `Vayeilech` |
| האזינו | `Haazinu` |
| וזאת הברכה | `Vezos Habracha` |

### Combined weeks that exist on the list

`Vayakhel-Pekudei` · `Tazria-Metzora` · `Achrei Mos-Kedoshim` · `Behar-Bechukosai` · `Matos-Masei` · `Nitzavim-Vayeilech`

That's all of them. Any other pair is not on the list — stop and ask rather than inventing a hyphenated name.

---

## Chagim & Special Days — exactly nineteen

Listed in Jewish calendar order, Tishrei → Elul.

| Hebrew | Site value |
|---|---|
| ראש השנה | `Rosh Hashanah` |
| שבת שובה | `Shabbos Shuva` |
| יום כיפור | `Yom Kippur` |
| סוכות | `Sukkos` |
| שמיני עצרת | `Shemini Atzeres` |
| שמחת תורה | `Simchas Torah` |
| חנוכה | `Chanukah` |
| עשרה בטבת | `Asara B'Teves` |
| ט״ו בשבט | `Tu BiShvat` |
| תענית אסתר | `Taanis Esther` |
| פורים | `Purim` |
| שושן פורים | `Shushan Purim` |
| שבת הגדול | `Shabbos HaGadol` |
| פסח | `Pesach` |
| ספירת העומר | `Sefiras HaOmer` |
| ל״ג בעומר | `Lag BaOmer` |
| שבועות | `Shavuos` |
| שבעה עשר בתמוז | `Shiva Asar B'Tammuz` |
| תשעה באב | `Tisha B'Av` |

**No "Other" bucket here.** A day that isn't above gets no filter button at all — the sheet uploads and shows under "All Sheets", but nobody browsing by chag finds it.

Not on the list: **Rosh Chodesh**, **Yom Ha'atzmaut**, **Yom Yerushalayim**.

Given one of those, or any other day not in the table: don't force it, don't substitute a neighbour. Tell them the site has no filter for that day yet, that the sheet will still upload and stay reachable under "All Sheets", and that Danielle can add the day in a small code change. Then ask whether to go ahead now or wait.

## Pirkei Avos — exactly six

`Chapter 1` · `Chapter 2` · `Chapter 3` · `Chapter 4` · `Chapter 5` · `Chapter 6`

Written into `avosPerek`, spelled exactly like that — not `Perek 1`, not `3`, not `פרק ג`. Dor L'Dor only. A Pirkei Avos sheet without this set still shows under "All Sheets" but gets no chapter button.

---

## Closed lists elsewhere

Nothing in this file applies outside `TorahSheets`.

| List | Where | A wrong value |
|---|---|---|
| Flyer sections — `events` · `learning` · `schedules` | `flows/flyer.md` | flyer on no page. `youth` is accepted and also renders nowhere. |
| Flyer tags — Day, Time, Audience | `flows/flyer.md` | harmless, falls back to a Topic button. Except `daily`, which is load-bearing. |
| `dayType` — `Weekday` · `Shabbat` | `flows/times.md` | row joins neither table, appears nowhere. |
