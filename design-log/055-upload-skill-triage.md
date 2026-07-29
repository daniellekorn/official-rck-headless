# 055 — The upload skill routes on the artifact, not on the noun

**Status:** Shipped. Skill version `2026-07-29c`. Follows [#054](054-editor-upload-skill.md).
**Date:** 2026-07-29

## Problem

A real Hebrew run opened `יש לי דף חדש לסים באתר של הכולל`. The skill went into the Torah-sheet flow and asked which parsha or chag. Told *"זה לא חג זה קשור לכולל קיץ"* — not a chag, it's the summer kollel — it asked **which series**. The user had to volunteer "Events" themselves. Four turns to establish what the design said on its face.

Three defects:

**The router routed on the wrong thing.** It offered three rows keyed on what the person says they want to *do* — upload a sheet, upload a flyer, take something down. An opening message is usually none of those; it's "I have a thing." `דף` covers a Torah sheet, a flyer, and a schedule, and #054's own `description` listed `דף תורה חדש` as a trigger, priming the wrong conclusion.

**Rule 4 forbade looking.** *"No tool calls until every answer is in hand"* was written to stop premature writes and stopped premature reads too, putting the decisive evidence — the design itself — last.

**Nothing said to back out.** A parsha/chag mismatch is evidence about the *flow*, not the series.

## Decision

**Route on the artifact, and confirm the route out loud.**

`SKILL.md` gains a table of the ambiguous nouns in both languages, then the instruction to **open the design and read it** — that's the routing decision, and it simultaneously answers the title, page count, date, and audience. A nine-row table maps what the thing *is* to the flow that handles it.

**No flow is entered silently.** Every job passes one explicit confirmation. What's *offered* scales with what's known: a named route to say yes to when message and design agree, two or three bare candidates when narrowed, the full numbered list only when there's nothing to go on. Option **9 is "something else on the site"**, because a closed menu otherwise makes people pick the nearest wrong option — the flyer-shaped hole this entry is trying to close.

The pure form — always show the whole menu — was cut back. A blind nine-item list answering "flyer for Tuesday's event" breaks the fewest-questions and don't-ask-what-they-told-you rules and reads as not listening, the same defect that got #054's language gate deleted.

Rule 4 now splits reads from writes. Rule 9 is the back-out, with the transcript's own line as the worked example.

**Rejected: dropping `דף` from the triggers.** It treats the symptom. The word is what people say and the skill must activate on it — it just mustn't *conclude* from it.

### Two silent failures, one of them shipped in the skill

Both are #054's failure mode — a correct-looking value that renders nowhere — and the skill was steering people into the first.

**`Flyers.category: youth` renders nowhere.** `youth.astro` reads `YouthPrograms` and never calls `getFlyers`; [#017](017-events-and-youth-pages.md) moved youth flyers onto the program row and left the category in the schema. The flyer flow offered it as one of four sections, prompting *"Is this for kids or teens?"*.

This is a new shape of drift. #054's check was "does the skill's list match the union in code?" — both say four. The check that catches it is **"which page renders a row with this value, and does that page still ask for it?"** Now in `skills/README.md`.

**A `schedules` flyer needs the `daily` tag or it renders nowhere.** `daven.astro:48` is the only consumer — `getFlyers("schedules", "daily")`, then `[0]`. So an untagged one is on no page, *and* a second `daily` one is on no page either. The section has one slot, so a new weekly schedule is a picture replacement, not a new row.

### Coverage: three more destinations

- **`flows/youth-program.md`** — `YouthPrograms`. Leads with the check that a design arriving for the youth page is usually a new flyer for a program already listed, so it's an update; a duplicate row shows the program twice.
- **`flows/past-event.md`** — `PastEvents`. Take-down and archive are two changes to two rows, offered as two, reusing the flyer image already in the Media Manager.
- **`flows/times.md`** — where the answer is usually **nothing to upload**. The times are computed (#040, #041); a row for a regular minyan shows it twice and won't roll over.

`take-down.md` gains the hide-vs-delete table: everything except a Torah sheet is reversible. `SKILL.md` names the collections these flows *don't* cover, so nothing gets filed as a flyer for lack of anywhere else.

### Editorial: the skill is documentation, not an argument

Danielle's, on reading the first draft back: the skill should say **what to do and how**, nothing else. #054's rule was "keep the consequence, cut the provenance", and the consequence half licensed a drift into prose — paragraphs justifying the line above them, reassurance about tone. A full pass rewrote all eight files as lean docs: imperative, tables over prose, consequence clauses only where they change what the model does. Standard now stated in `skills/README.md`.

`SKILL.md` loads on every activation, so every line of rationale in it is a line of instruction the model reads past.

## Verified against the live CMS

Read-only pass plus two page loads. Confirmed: `Flyers.imageUrl` is a plain `static.wixstatic.com` URL on all 26 rows; `YouthPrograms.flyerImage` is `wix:image://`; `TorahSheets` holds `wix:document://` / `wix:image://`; exactly one `schedules` flyer exists, correctly tagged; and **no `youth` rows exist**, so that fix is preventive, not a cleanup. The site URL came back `raanana-co-05a91814-daniellakorn.wix-site-host.com` — not guessable, so #054's never-assume-a-domain rule earns its place.

Three corrections it forced:

- **`Flyers` has an `image` field nothing reads.** 25 of 26 rows carry the same URL in both; `flyers.ts` reads only `imageUrl`. Filling `image` alone yields the "coming soon" placeholder. Documented nowhere before — see [#010's addendum](010-flyers-cms-collection.md).
- **`PastEvents.flyerImage` takes either shape.** The flow file asserted it needs the internal reference; a live row holds a plain URL and renders. Corrected to "read a row and mirror it". The `YouthPrograms` preference *is* real, now with its actual consequence: only the internal form carries `#originWidth`/`#originHeight` for `imageAspectRatio`, so a plain URL falls back to a fixed 3:4 crop.
- **`DaveningTimes.dayType` is `Shabbat`, and five live rows say `Shabbos`** — matching neither filter. `times.md` predicted this before the data was looked at.

### The `Shabbos` typo is load-bearing

The obvious fix — accept either spelling — is wrong, and this is the finding worth keeping. Those five rows pre-date #041 and duplicate it: Shacharis 8:45 and Tefillat Yeladim 10:00 are *identical* to the computed values, Mincha 7:15 contradicts the computed 7:10, and "Parsha of the Week — Parshas Pinchas" is stale against a computed Eikev. `daven.astro` appends CMS `Shabbat` rows to the computed list, so correcting the spelling shows each of those twice. The misspelling is the only thing hiding a duplicate-rendering bug.

So `davening.ts` **warns** on an unrecognized `dayType` rather than coercing it. The class is invisible because nothing complains; a build-log line catches the next one. Recommended data cleanup is `active: false` on all five, matching what #040 did to the equivalent weekday rows — left to the office, since it retires KBA's times.

### Stale docs behind the wrong instructions

The skill was written from the design log and `CONTRIBUTING.md`, so where it was wrong, they were wrong first. Corrected at the source: [#008's](008-davening-flat-layout-shabbat-static.md) two central Shabbat claims were false since #041; [#010's](010-flyers-cms-collection.md) field table no longer described the collection. Both now carry addenda, and the required-supersession rule this exposed is in [`design-log/README.md`](README.md) with a `npm run check:design-log` baseline.

## Follow-up

**`youth` can now be removed from `FlyerCategory` with no data migration** — the live check found zero rows using it. This entry originally parked that follow-up on exactly that unknown.

**The triage change is not yet exercised.** It's behavioural; the next real Hebrew upload is the test, and the thing to watch is whether the skill opens the design before its second question.
