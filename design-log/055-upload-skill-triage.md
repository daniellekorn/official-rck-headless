# 055 — The upload skill routes on the artifact, not on the noun

**Status:** Shipped.
**Date:** 2026-07-29

Follows [#054](054-editor-upload-skill.md), which shipped the skill. Skill version `2026-07-29c`.

## Problem

A real Hebrew run, opening:

> יש לי דף חדש לסים באתר של הכולל

The skill went straight into the Torah-sheet flow and asked which parsha or chag. The user answered *"זה לא חג זה קשור לכולל קיץ"* — it's not a chag, it's to do with the summer kollel. The skill then asked **which series** — Dor L'Dor or Source Sheets. The user had to volunteer "Events" themselves to get out of it. Four turns to establish something the design said on its face.

Three separate defects behind it.

**The router routed on the wrong thing.** `SKILL.md` offered three rows keyed on *what the person says they want to do*: upload a sheet, upload a flyer, take something down. An opening message is usually none of those — it's "I have a thing." The routing input the skill actually needed was **what the artifact is**, and it never asked.

**`דף` is not a Torah sheet.** It's page, sheet, or any printed handout, and the office uses it for flyers and schedules as readily as for Torah sheets. #054's own `description` field listed `דף תורה חדש` as a trigger, so the skill was primed to read `דף` as the series it was about to guess. `עלון`, `לוח`, `מודעה`, `תוכנית`, `גיליון` are all similarly ambiguous, in both directions.

**Rule 4 forbade looking.** *"No tool calls until every answer is in hand."* The one signal that settles the whole question is the design itself — it says whether it's divrei Torah or a schedule of times, how many pages it has, its title, its date, who it's for. The rule was written to stop premature *writes* and it stopped premature *reads* as well, which put the decisive evidence last. In the transcript the skill did eventually read the design, noticed the text wasn't parsha-related, and still stayed inside the flow.

And nothing told it to back out. A parsha/chag mismatch is evidence about the **flow**, not about the series; the skill treated it as the latter and narrowed further into the wrong place.

## Two silent failures found while fixing it

Both are the #054 failure mode exactly — a correct-looking value that renders nowhere, with no error — and the skill was steering people into one of them by design.

**`Flyers.category: youth` is dead.** `flows/flyer.md` offered four sections and prompted *"Is this for kids or teens?"* → `youth`. But `/youth` renders `YouthPrograms` rows; `src/pages/youth.astro` never calls `getFlyers`. [#017](017-events-and-youth-pages.md) moved youth flyers onto the `YouthPrograms` row and left the category in the schema — its own notes say so, and `CONTRIBUTING.md` carries the warning. The skill was written against `FlyerCategory`, which still has four members, so it inherited a value no page reads. A youth flyer filed through the skill is invisible on every page of the site.

This is a *new* shape of drift, worth naming: #054's check was "does the skill's list match the union in code?" Both lists say four. The check that catches this one is **"which page renders a row with this value, and does that page still ask for it?"** Now in `skills/README.md`.

**A `schedules` flyer needs the `daily` tag or it renders nowhere.** `daven.astro:48` is the only consumer of that category — `getFlyers("schedules", "daily")`, then `[0]`. So an untagged schedules flyer is on no page, *and* a second `daily` one is on no page either, because the first keeps the slot. #054 documented `daily` as a "reserved tag" that unlocks a featured position — an accurate description of a bonus, and a misleading one for a requirement. The Schedules section has exactly one slot, so a new weekly schedule is nearly always a **picture replacement on the existing row**, not a new row.

## Decision

Route on the artifact, and confirm the route out loud. Three changes to the shape of the skill, then the coverage gaps.

**Triage replaces the task menu.** `SKILL.md` gains two sections. *What is it* — a table of the ambiguous nouns in both languages and what each could be, then the instruction to **open the design and read it**, since that is the routing decision and it simultaneously answers the title, the page count, the date, and the audience. *Where each one goes* — a nine-row table from what the thing *is* to the flow that handles it.

**No flow is entered silently.** Danielle's call, and it removes the failure class rather than reducing it: every job passes one explicit confirmation of where the thing is going before any flow starts. What's *offered* scales with what's already known — a named route to say yes to when the message and the design agree, two or three bare candidates when it's narrowed, the full numbered list only when there's nothing to go on.

The pure form of this — always show the whole menu — was considered and cut back. A blind nine-item list in answer to "flyer for Tuesday's event" breaks rules 2 and 3 and reads as not listening, which is the same defect that got the language gate deleted in #054. Narrowing first keeps the confirmation cheap (usually a yes) while still making the route explicit.

The list carries **"9 · Something else on the site"** deliberately: without an escape hatch, a closed menu makes people pick the nearest wrong option, which is the flyer-shaped hole this entry is otherwise trying to close.

**Rule 4 splits reads from writes.** Now *"Look before you ask; no writes until every answer is in hand."* Opening the design, reading a row, listing a folder — early and freely, because they're how questions get avoided. Writing still waits for the full picture. This is what makes triage-by-inspection possible at all, and it also improves the flows that were already working: title, date, and page count come off the design instead of out of the user.

**Rule 10 is the back-out.** *"If the answers stop fitting the flow, you're in the wrong flow."* With the transcript's own line as the worked example, because the failure is subtle — narrowing *within* a flow feels like progress. Backing out costs one message; guessing costs a row in a collection nobody will think to look in.

### Coverage: three more destinations

The office produces more than sheets and flyers, and #054 knew two destinations. New self-contained flows, same shape as the existing ones:

- **`flows/youth-program.md`** — `YouthPrograms`. Where all ongoing kids'/teens' material goes. Leads with the check that matters: a design arriving for the youth page is usually a **new flyer for a programme already there**, so it's an update, not a new row — a duplicate row shows the programme twice. Also flags that `flyerImage` is an Image field taking Wix's internal reference format, *unlike* `Flyers.imageUrl`, so the habit doesn't carry across.
- **`flows/past-event.md`** — `PastEvents`. Anything already over. Handles the common pairing explicitly: taking the flyer down and archiving the event are two changes to two rows, offered as two, and the flyer image already in the Media Manager gets reused rather than re-requested.
- **`flows/times.md`** — minyan times, where the answer is usually **nothing to upload**. The weekday and Shabbos schedules are computed ([#040](040-computed-davening-times.md), [#041](041-computed-shabbos-times.md)); a row for a regular minyan shows the time *twice* and doesn't roll over next week. `DaveningTimes` is for extras (Selichos, special weeks) and its `dayType` is another exact-value-or-nowhere field. A computed time that disagrees with the printed schedule is a rule change in code — escalate, don't paper over it with a row.

`take-down.md` gains the table of how each kind comes down: everything except a Torah sheet has a reversible hide (`removeAfter` for a flyer, `active` for the other three).

### Editorial: the skill is documentation, not an argument

Danielle's, on reading the first draft of this change back: the skill should say **what to do and how**, and nothing else. #054's rule was "keep the consequence, cut the provenance", and the consequence half licensed a drift back into prose — paragraphs justifying the line above them, reassurance about tone, "previous attempts failed because". A full pass over all eight skill files rewrote them as lean docs: imperative sentences, tables over prose, consequence clauses only where they change what the model does ("a wrong value throws no error: the sheet uploads, then vanishes from the filters"). The standard is now stated that way in `skills/README.md`.

Cheap and worth it on its own terms — `SKILL.md` is what loads on every activation, and every line of rationale in it is a line of instruction the model reads past.

And `SKILL.md` now names the collections these flows *don't* cover — team members, community families, hero media, the history timeline, WhatsApp groups, contact details, the donate page — with the instruction to ask the connector for the fields and work through it under the same rules. The point is negative: **don't file something as a flyer because a flyer is the only shape you have.** That was the available failure once triage started rejecting things.

## Alternatives considered

**Drop `דף` from the trigger list.** Treats the symptom. The word is what people say, and the skill needs to activate on it — it just mustn't *conclude* from it. The description now leads with the range of things the skill handles and ends with "works out which part of the site the thing belongs in before asking anything else."

**Make `/youth` render `youth` flyers.** Undoes #017 deliberately. Youth content is program-centric — title, description, contact rabbi, photos — and a bare flyer has none of that. The skill routes to `YouthPrograms` instead.

## Follow-up not taken

**`FlyerCategory` still includes `youth`.** It is now a value that type-checks, validates, and renders nowhere — a trap for the next person reading the union as the list of valid sections. Removing it is a small change to `src/lib/flyers.ts` plus a migration for any existing `youth` rows, and it wants a check for those rows first. Left out of this PR to keep it to the skill; worth doing next time `flyers.ts` is touched. The skill is told never to write the value, and `skills/README.md` records the general check.

## Verification

`youth` renders nowhere: `getFlyers` has exactly four call sites — `daven.astro:48` (`schedules` + `daily`), `learn.astro:11` (`learning`), `events.astro:14` (`events`). None passes `youth`, and `youth.astro` imports `getYouthPrograms` only. Consistent with #017's stated decision and the `CONTRIBUTING.md` note.

Schedules single-slot: `daven.astro:48–49` — `getFlyers("schedules", "daily")` then `scheduleFlyers[0] ?? null`; no other consumer of the category.

Computed-times claims read off `src/lib/zmanim-schedule.ts` and the `DaveningTimes` fields off `src/lib/davening.ts` (`DayType = "Weekday" | "Shabbat"`, `SERVICE_ORDER` including `Selichos`). `YouthPrograms` and `PastEvents` field names and types read off `src/lib/youth-programs.ts`, `src/lib/past-events.ts`, and the `CONTRIBUTING.md` schemas — including the shape distinction that `flyerImage` is an Image field while `Flyers.imageUrl` is a plain-URL Text field.

Version bumped to `2026-07-29c` so an installed copy is identifiable (#054 — copies drift per person).

### Checked against the live CMS

Read-only pass over the real site (`raanana-co-05a91814-daniellakorn.wix-site-host.com` — fetched from the connector, confirming the never-guess-a-domain rule), plus two live page loads. Confirmed as documented: `Flyers.imageUrl` holds a plain `static.wixstatic.com` URL on all 26 rows; `YouthPrograms.flyerImage` holds `wix:image://`; `TorahSheets.pdfFile` / `pdfThumbnail` hold `wix:document://` / `wix:image://`; there is exactly **one** `schedules` flyer and it is correctly tagged `daily`, so "replace the picture, don't add a row" is the right instruction; and **no `youth` flyer rows exist**, so that trap is real but unsprung — the fix is preventive, not a cleanup.

Three things the pass found that the skill had wrong or missing:

- **`Flyers` has an `image` field that nothing reads.** 25 of 26 rows carry the same URL in both `image` and `imageUrl`; `flyers.ts` only ever reads `imageUrl`. Filling `image` alone yields the "coming soon" placeholder. Same silent-failure class, previously undocumented anywhere.
- **`PastEvents.flyerImage` takes either shape.** The flow file claimed it needs the internal reference; one live row holds a plain `wixstatic` URL and renders fine on `/events`. Corrected to "read a row and mirror it" rather than asserting a format. The `YouthPrograms` preference *is* real and now stated with its actual consequence: only the internal form carries `#originWidth`/`#originHeight`, which `imageAspectRatio` parses to fit the frame — a plain URL renders but falls back to a fixed 3:4.
- **`DaveningTimes.dayType` is `Shabbat`, and five live rows say `Shabbos`.** `DayType` is `"Weekday" | "Shabbat"`, so `Shabbos` matches neither filter. Confirmed on `/daven`: the five active `Shabbos` rows (KBA's "Parsha of the Week", Shacharis 8:45, Tefillat Yeladim 10:00, Mincha 7:15, Maariv At Tzeis) appear nowhere — the 8:45 and 10:00 visible on the page come from the computed `SHABBOS_MORNING` constants, not from those rows. `times.md` predicted this failure mode before the data was looked at; it now names the spelling explicitly, since `Shabbos` is the form the site uses everywhere else. Also documents `orgName`, an undocumented field on every row.

**Live data left alone.** Retiring KBA's times is the office's call, so the five rows are reported, not fixed. The recommendation is `active: false` on all five, matching what #040 did to the equivalent weekday rows.

### The stale docs behind the wrong instructions, and one code change

The skill was written from the design log and `CONTRIBUTING.md`, so where it was wrong, they were wrong first. Corrected at the source rather than only in the skill:

- **[#008's](008-davening-flat-layout-shabbat-static.md) two central Shabbat claims are false** — "Shabbat CMS data will never exist" and "`dayType = Shabbat` rows stored but not rendered". #041 computed the Shabbos block and `daven.astro` appends CMS `Shabbat` rows to it as `shabbosExtras`; #008 was never revisited. Status line now flags the supersession, with an addendum carrying the live data.
- **[#010's](010-flyers-cms-collection.md) field table no longer describes the collection** — `embedUrl` is gone (#031), `imageUrl` isn't listed at all, `subCategory` and `removeAfter` arrived later, `pdfUrl` is unused, and the undocumented `image` duplicate isn't mentioned. Addendum added.
- **`CONTRIBUTING.md`** gains the `image`-does-nothing row, the `Shabbat`-not-`Shabbos` warning, and a don't-fix-these note on the five rows.

One code change, deliberately small: **`davening.ts` now warns when an active row's `dayType` matches neither value.** This whole class is invisible precisely because nothing complains, and a build-log line is enough to catch the next one. It warns rather than coercing — accepting `Shabbos` as a synonym is the tempting fix and the wrong one, since it unmasks the duplicates. `flyers.ts` gains a comment on why `image` is not read. No render behaviour changes.

**Discovered and left open:** `youth` can now be removed from `FlyerCategory` with no data migration — the live check found zero rows using it. #055 originally listed that follow-up as blocked on exactly that unknown.

**The triage change itself is not yet exercised.** It's behavioural; the next real Hebrew upload is the test, and the thing to watch is whether the skill opens the design before its second question.

Site content and code are unchanged — this entry is skill and docs only.
