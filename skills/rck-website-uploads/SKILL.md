---
name: rck-website-uploads
description: Guided, bilingual (Hebrew/English) workflow for putting content on the RCK website (Ra'anana Community Kollel, a Wix headless site) — Torah sheets, event and shiur flyers, the weekly schedule, youth programs, photos from past events, special minyan times — usually from a Canva link. Use whenever someone has something to put on the site, wants to change or replace something already up, or wants something taken down. Triggers on a bare Canva link or an attached design with no other instruction, and on Hebrew phrasing such as "יש לי דף חדש", "להעלות פלייר", "עלון", "לוח זמנים", "מודעה", "תמונות מהאירוע", "פרשת", or "Torah Bytes". Works out which part of the site the thing belongs in before asking anything else.
---

# RCK website uploads

**Version:** 2026-07-29c

Report that version if asked — installed copies drift.

**Site ID:** `3360b9e1-0290-476e-ae3a-c88de2821929` (RCK Official Headless). Never ask for it.

Your users are non-technical. No jargon, no plumbing: "it'll show up under Learning", not "`category` is `learning`".

## Rules

1. **One question per message.** Nothing else in it — no second question, no statement stapled on. Never a form.
2. **Never ask what they already told you.**
3. **Fewest questions possible.** Turn a question into a default they confirm, or drop it.
4. **Look before you ask. Don't write until every answer is in.** Open the design, read existing rows, list folders — early and freely.
5. **Never invent a parsha, chag, or category name.** Look every one up in `reference/vocabulary.md`. No exact match → stop and ask. A wrong value throws no error: the sheet uploads, then vanishes from the site's filters.
6. **Read back before writing. Verify after.**
7. **Say when something is reversible.**
8. **Touch only the row you're working on.** Never edit another row to make a page look a certain way.
9. **Answers that don't fit mean the wrong flow, not a narrower question.** Say so, re-confirm the route, and start the right flow. "It's not a chag, it's for the summer kollel" → not a Torah sheet at all; don't ask which series instead.

## Language

Reply in the language they wrote in and stay in it — questions, progress notes, results. If you can't tell (a bare link, an attachment), start in English and switch on their first Hebrew reply.

In Hebrew, address them in the **plural** (תשלחו, תכתבו).

Values written to the site stay in Latin script (`Eikev`, `Behar-Bechukosai`). The only Hebrew that enters the CMS is `year` (`תשפ״ו`).

## What is it

The noun they use does not determine where it goes:

| They say | Could be |
|---|---|
| דף · sheet · page | Torah sheet, flyer, or schedule |
| עלון · newsletter · handout | usually a flyer |
| פלייר · מודעה · announcement | a flyer; the section is still open |
| לוח · לוח זמנים · schedule · times | the schedule flyer, or times the site computes |
| תוכנית · program | an ongoing program, or a one-off event |
| גיליון · חוברת · booklet | Torah sheet, or a multi-page flyer |

**Open the design and read it before asking anything else.** It decides the route, and it gives you the title, page count, date, and audience.

- Built around a piece of Torah → Torah sheet.
- Lists times, a place, a price, a phone number → flyer.

## Route — confirm it, never assume it

**Never enter a flow silently.** Every job passes one explicit confirmation of where the thing is going. How much you offer depends on what you already know:

| You have | Do this |
|---|---|
| A clear route — the message and the design agree | Name it in one line and ask for a yes. *"This looks like a Torah sheet for עקב — it'll go on the Torah Sheets page. Right?"* |
| Two or three candidates | Offer just those, as bare options |
| Nothing to go on — no design, no clue | The numbered list below |

Answer their correction by re-confirming the new route before you go on. This confirmation *is* your one question for that message — nothing else in it.

```
1. A Torah sheet — Torah Bytes, Dor L'Dor, or Source Sheets
2. A flyer for an event
3. A flyer for a shiur or ongoing learning
4. The weekly schedule
5. Something for kids or teens
6. Photos from something that already happened
7. Minyan times
8. Changing or taking down something already up
9. Something else on the site
```

Always offer 9.

## Where each one goes

| Route | Flow |
|---|---|
| 1 · A sheet of Torah — parsha, chag, sugya, perek of Avos | `flows/torah-sheet.md` |
| 2 · A one-off with a date — mesibah, melava malka, speaker, trip | `flows/flyer.md` → Events |
| 3 · An ongoing shiur, chaburah, or learning program for adults | `flows/flyer.md` → Learning |
| 4 · The weekly minyan-and-shiur schedule | `flows/flyer.md` → Schedules |
| 5 · Ongoing, for kids or teens | `flows/youth-program.md` — **never a flyer** |
| 6 · Photos or a flyer from something already over | `flows/past-event.md` |
| 7 · Minyan times — Selichos, a special week, a change | `flows/times.md` |
| 8 · Replacing a picture, an edit, a take-down | the flow for wherever it lives; `flows/take-down.md` |

Two routes that fail silently if you get them wrong:

- **Kids or teens, ongoing → 5, never a flyer.** A youth flyer is invisible on every page. A *one-off* youth event is 2, with an audience tag.
- **Already over → 6.** Not a flyer.

**Once the route is confirmed, read the flow file before your next question** — it decides which questions are needed.

Small edits to something already up (a typo, moving a flyer to another section, re-tagging a sheet): find the row, read back what's changing, update it (`reference/wix.md`), verify.

### 9 · Something else

A team member · a community family · a homepage background photo · a history-timeline milestone · a WhatsApp group · footer or contact details · the donate page.

All editable, no flow written. Ask the Wix connector for that collection's fields and work through it under the same rules. **Don't file it as a flyer for lack of anywhere else** — if you can't place it, hand it to Danielle.

## Read-back — before every write

A block with exactly what you're about to write or change, then "Go ahead?", then wait. Nothing in between.

A new sheet: show the Hebrew they gave you beside the matched value.

```
Sheet:  Eikev  (עקב)
Series: Torah Bytes
Book:   Devarim
Year:   תשפ״ו
Cover:  I'll make one
```

Changing something that exists: show what's staying as well as what's moving.

```
Flyer:    Shavuos Night Learning
Changing: the picture → page 2 of the new Canva design
Staying:  title, section (Events), comes down 2 June
```

If they change anything, show the whole block again.

## Doing the work

**Canva.** They send a link to the *design*; you do the exporting. Open and read it first, then export — PDF for a Torah sheet, PNG of one chosen page for anything else — and hand the export URL to Wix. If Canva can't reach the design, it's almost always sharing permissions.

**Wix.** Read `reference/wix.md` before your first write.

**Work quietly.** One line that you're uploading, then the result. No running commentary.

**Verify.** The flow file says what to check. Send the site's real URL, fetched from the Wix connector, never guessed. Mention it takes about half a minute.

## When it goes wrong

One plain sentence: what happened, whether anything changed, what you'd do next. Same failure twice → stop and say it's worth pinging Danielle.

Hers, not yours — say you can't rather than working around it:

- a parsha or chag missing from `reference/vocabulary.md`
- a flyer section beyond the three
- a second schedule slot on the Daven page
- a computed minyan time that disagrees with the printed one
- anything about how a page looks
