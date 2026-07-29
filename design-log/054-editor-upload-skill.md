# 054 — A packaged Claude skill for the office's Torah sheet and flyer uploads

**Status:** Shipped.
**Date:** 2026-07-29

## Problem

`CONTRIBUTING.md` has told the office since #001 that they can edit content by talking to Claude with the Wix MCP connected. In practice that hasn't worked. Two separate failures, and neither is a Wix bug:

**The user doesn't know what Claude needs.** The Wix MCP exposes generic CMS tools. It has no idea this site has a `TorahSheets` collection, that `series` takes exactly three values, or that a flyer needs a `category`. So it does what a general-purpose agent does with an under-specified request: it fills in something plausible and reports success. The office's own written workaround was a two-part prompt (a context paste, then a task paste) that the user has to send in the right order at the start of every conversation. Anyone who forgets the first paste gets a confident wrong answer.

**Wrong vocabulary fails silently.** This is the one that actually hurt. `subcategory` is matched against a closed list (`SEFER_PARSHIOS`, `CHAGIM_ORDER`) — case-insensitively, but otherwise exactly. A near-miss (`Ekev` for `Eikev`, `Ki Tavo` for `Ki Savo`) doesn't error. The row is created, the sheet renders under "All Sheets", and it is simply absent from the sidebar filter where anyone would look. Nobody notices for weeks. Ashkenazi transliteration of a Hebrew name is *exactly* the kind of thing a model will cheerfully approximate, and the users supplying the names are native Hebrew speakers typing `עקב`, not `Eikev`.

Compounding both: several of the site's admins work in Hebrew, and the existing instructions are English-only.

## Decision

Ship a **skill** (`skills/rck-website-uploads/`), packaged as a zip the office installs in Claude Desktop.

A skill is the right shape here specifically because it can carry **reference files**. The closed vocabulary ships *inside* the skill as a Hebrew → site-value lookup table, so the parsha name is resolved by table lookup rather than by transliteration-from-memory. That single property is the fix for the silent-failure mode; everything else is ergonomics.

Structure: `SKILL.md` holds the workflow (language gate, four-item task menu, one flow per task) and delegates detail to `reference/{vocabulary,torah-sheets,flyers,wix-api,phrases-he}.md`. `SKILL.md` is what loads on every activation, so it stays deliberately thin — the reference files are read only when the job at hand needs them.

The behavioural rules that matter, in rough order of how much breakage they prevent:

1. **Never write a vocabulary value that isn't in the table.** Stop and ask. Stated as a rule, then restated at the top of `vocabulary.md` with the consequence spelled out, because a model that "knows" the answer will otherwise skip the lookup.
2. **One question per message, no tool calls until every answer is in.** This is the direct fix for under-specified requests — you can't omit a field you were asked about individually.
3. **Read back before writing, and show the translated value** (`עקב → Eikev, Devarim`). A wrong match becomes visible to someone who reads Hebrew and has never heard of `SEFER_PARSHIOS`. This is the last line of defence and the one that catches what rule 1 misses.
4. **Verify after writing** — including "click the parsha button and confirm the sheet appears", which is the only check that actually proves the vocabulary matched.

### Bilingual, with fixed wording

Language is the **first** question, asked before anything else. The question itself is English ("Which language would you like me to guide you in?") with `English · עברית` as the two choices — Danielle's call, on the grounds that a one-line English question is short enough for a Hebrew reader and the Hebrew option makes the choice self-evident without asking twice. Hebrew phrasing lives in `reference/phrases-he.md` as fixed strings rather than being translated per-conversation, so the assistant reads the same way every week — for a skeptical user, consistency *is* trustworthiness. Hebrew addresses the user in the plural (תשלחו, תכתבו), which reads naturally and avoids assuming anyone's gender.

Values written to the CMS stay in Latin script regardless of conversation language. The site's vocabulary is Ashkenazi transliteration; the only Hebrew that enters the CMS is `year` (`תשפ״ו`).

## Three things the office's written instructions had wrong

Found by checking their handoff docs against the code rather than against `CONTRIBUTING.md`. All three are now correct in the skill:

- **Flyer sections.** Their doc offers `learning` and `events`. `FlyerCategory` has four: `schedules`, `learning`, `youth`, `events`. Youth and schedule flyers were being filed under Learning.
- **Parsha + chag.** Their doc says to create two rows pointing at the same PDF. #053 addendum 10 built `chagSubcategory` precisely so this is **one** row tagged both ways; two rows duplicate the sheet.
- **`pdfThumbnail`.** Their doc treats it as real (it is — `torah-sheets.ts:192`, rendered for the featured card at `torah-sheets.astro:137`). `CONTRIBUTING.md` claims it was "tried and dropped". The doc is stale, not the instructions.

`CONTRIBUTING.md` also still describes `TorahSheets.category` as Text; it's a list.

## Gap found, and closed

**`Shabbos HaGadol` was not in `CHAGIM_ORDER`** — and it's the example in the office's own instruction sheet. Chagim has no "Other" bucket (#053 addendum 9), so a sheet tagged with it would have got no filter button at all. Same for Shemini Atzeres, Simchas Torah, Lag BaOmer, Tisha B'Av, and the minor fasts.

Fixed in the same PR — see #053 addendum 17, which extends the list from 9 entries to 19. `Rosh Chodesh` and `Yom Ha'atzmaut`/`Yom Yerushalayim` are deliberately still out; the skill names the missing day and asks rather than substituting a neighbour, which is the behavior that should survive any future gap in the list. Worth doing properly next time the list is touched.

## Alternatives considered

**Project instructions / a longer paste-in prompt.** What they have now. No bundled reference files, so the vocabulary lookup falls back to the model's memory — which is the actual defect. Rejected for that reason alone.

**An MCP bundle (`.mcpb`).** Wrong tool. That's for shipping *new tools*; the Canva and Wix connectors already exist. What's missing is orchestration and domain knowledge on top of them, which is what a skill is.

**Automating the Canva → Wix path outright.** Rejected again, same reasoning as #031: no official Canva ↔ Wix connection, the Connect API means OAuth plus async export jobs, and a flyer changes a few times a year. The two-click export stays manual.

## Drift risk

`reference/vocabulary.md` duplicates lists that live in `src/lib/torah-sheets.ts` and `src/lib/flyers.ts`. A skill that confidently teaches a stale value is worse than no skill. Noted in `skills/README.md`: changing any of those lists in code means updating `vocabulary.md` in the same PR. Generating the file at build time was considered and skipped — the lists change roughly never, and a generator is more machinery to rot than the thing it protects.

## Verification

Zip structure confirmed correct for Claude Desktop (skill folder at archive root, `SKILL.md` frontmatter with `name` and `description` parses). Vocabulary tables cross-checked entry-by-entry against `SEFER_PARSHIOS`, `CHAGIM_ORDER`, and `PIRKEI_AVOS_PERAKIM`; flyer sections against `FlyerCategory`. The media-format rules (`Flyers.imageUrl` must be a plain `static.wixstatic.com` URL — a `wix:image://` value passes through `scaleFlyerImage` untransformed and renders broken; `TorahSheets.pdfFile` is a Document field and does take the internal reference) were read off `wix-media.ts` and the row mappings rather than assumed, and the skill is additionally told to read an existing row and mirror its shape before its first write.

**Two end-to-end runs since** (one English, one Hebrew), both uploading a real Eikev sheet to the live site successfully. What they exposed is in "Post-first-run corrections" below — including one destructive defect that a `wix env`-less static review could never have caught.

Site content and code are unchanged by this entry — the skill is additive, and the existing dashboard and MCP workflows in `CONTRIBUTING.md` still work.

## Post-first-run corrections

Two real runs (one English, one Hebrew) against the live site. Both completed successfully; both exposed defects worth recording.

**The thumbnail "cleanup" was destructive and pointless — removed.** The skill inherited a line from the office's written instructions describing it as a "bonus cleanup": when uploading a new sheet, clear `pdfThumbnail` on the older ones so stale previews don't accumulate. Carried over without checking it against the render path, which was the mistake — `torah-sheets.astro` already gates the thumbnail on `isFeatured`, so a leftover value on a non-featured row **displays nothing**. The clearing bought exactly zero and cost a real preview: the Vaeschanan sheet lost the page-1 image it had from when it was featured, unrecoverable without re-rendering the PDF.

It also came within one lucky recovery of much worse. Wix Data's item update is **`PUT`, not `PATCH`** — a full replace. The run sent a partial body to clear the one field and wiped that row's `title`, `subcategory`, and `pdfFile` too. It noticed and restored from the Media Manager, but that's luck, not design.

So: the clearing instruction is gone, and two rules replace it —

- **Touch only the row you're working on.** Never edit another row to make the page look a certain way; the page decides what to display, and erased data is gone.
- **Updates are read-merge-write.** Read the row, merge the change into the complete `data` object, send all of it back. Never build an update body from scratch.

The PUT semantics are now in a new `reference/wix-api.md` alongside the endpoints, since the same trap applies to replacing a flyer image and to taking one down — both are updates.

**Hardcoded a domain that doesn't exist.** The skill told users to check `rckollel.org/torah-sheets`; the live site is on a `wix-site-host.com` address. Invented, never verified. Now: fetch the site URL from the Wix connector, never assume a domain.

**Latency.** The Hebrew run was slow, and roughly all of it was avoidable — a web search to work out Wix endpoints, then the clearing call, its `PUT`-shaped failure, and the restore. `wix-api.md` exists so the endpoints are read rather than searched (explicitly: don't web-search for Wix API details), and dropping the clearing removes a whole failure-and-recovery cycle.

**Language leaked mid-conversation.** The Hebrew run narrated its progress in English ("Now importing the PDF and PNG into Wix Media Manager", "It's PUT, not PATCH") between Hebrew questions. Fixed twice over: everything the user sees is in their chosen language including progress notes, and step-by-step narration is discouraged outright — one line that work is happening, then the result.

## Addendum — reshaped after review

Three things came out of reading the shipped skill back. Version `2026-07-29b`.

### The language gate and the Hebrew script are gone

Both were solving a problem the model doesn't have. Claude already mirrors the language it's written to, so `Step 0 — language` spent a whole round trip asking a question the user had *already answered by typing* `להעלות פלייר` — and in doing so broke the skill's own rule 3 ("never ask what they already told you"), which is the rule whose stated purpose is not looking like you weren't listening. The worst case was the intended one: a Hebrew speaker opens with Hebrew and gets an English form back.

`reference/phrases-he.md` (144 lines of fixed Hebrew wording) is deleted with it. The consistency argument for it was real but small, and it had already cost more than it bought: the file told the assistant to ask `שם הדף: Eikev?` while `SKILL.md` said **don't** ask for a title on Torah Bytes. A parallel script drifts from the flow it's meant to voice, and it drifted within one PR of being written.

What survives is the part that isn't script but instruction, now four lines in `SKILL.md`: reply in the language they wrote in and stay there including progress notes; if you truly can't tell, start in English and switch on their first Hebrew reply; address Hebrew speakers in the **plural** (תשלחו) so nobody is gendered; CMS values stay Latin script regardless. The safety-critical Hebrew messages needed no script either — their *content* ("I won't guess, a wrong name fails silently, ask Danielle") is specified in `vocabulary.md`, and phrasing that faithfully is something the model is good at.

### Structure: an entry file that routes, and one self-contained file per flow

The old split was two overlapping decompositions — `SKILL.md` narrated all four flows *and* `reference/` held the same material organised by collection. So a Torah sheet upload was described in two places, and the PUT warning in four.

Now `SKILL.md` (88 lines) holds only what applies to every job — the nine rules, language, read-back, verify, escalate — plus a three-row table routing to `flows/{torah-sheet,flyer,take-down}.md`. Each flow file is self-contained: its questions, its fields, its verification. Reading one top to bottom shows the whole flow, which is what makes it reviewable. `reference/{vocabulary,wix}.md` stay shared.

The other lever was cutting rationale addressed to the author rather than the model — "an old instruction sheet lists only two", "older written instructions call this a bonus cleanup", "previous attempts failed because". That history is *this file's* job. The editorial rule, now in `skills/README.md`: **keep the consequence, cut the provenance.** "A wrong value fails silently and the sheet vanishes from the filters" changes what the model does; "we learned this in July" doesn't.

874 lines → 583, with the four flows now readable in isolation.

### `PATCH` exists, and it defuses the incident above

The find that justified the whole detour. Chasing "where will the Wix MCP struggle", the REST reference turned up **`PATCH /wix-data/v2/items/{id}`** — a genuine partial update (`fieldModifications` with `SET_FIELD`), where *"only the fields specified in the request are modified. Data that isn't explicitly modified remains unchanged."*

The destructive near-miss recorded above happened because the only update primitive we knew about was `PUT`, and the answer we shipped was the careful-discipline one: read-merge-write, every time, never a partial body. `PATCH` makes the whole failure class unreachable for single-field changes — which is what replacing a flyer image and setting `removeAfter` to yesterday both are. It's now the recommended path, with read-merge-write `PUT` kept as the documented fallback and "never send a partial `PUT`" kept as the rule.

`PUT`'s full-replace semantics are confirmed in Wix's own words, which is worth having on the record: *"After an item is updated, it only contains the fields included in the `dataItem.data` payload in the request. If the existing item has fields with values and those fields aren't included in the updated item, their values are lost."*

**Not yet exercised against the live site.** Docs-verified only; the next real update job should confirm the body shape.

Two more failure points found the same way, both previously unhandled:

- **Media import returns `operationStatus: PENDING`** — *"When you import a file, it's not immediately available."* The skill already said "don't create the row until you've confirmed the PDF landed" without saying how; it now says to wait for the descriptor to be ready. This is very likely what a broken card after an apparently clean upload actually is.
- **Import needs an explicit `mimeType`** unless the URL or `displayName` carries a file extension — and a Canva export URL frequently carries neither.

### Docs as a documented fallback, connector still first

Danielle's call, and the right one: the Wix connector stays how the skill reads and writes, since it's authenticated and site-aware. But `dev.wix.com/docs` is fetchable as plain markdown — **append `.md` to any docs URL** — so when a call 404s or a shape is rejected there's somewhere to look that isn't a web search. `reference/wix.md` now ends with a table of the five pages that actually matter (data-items, patch, update, error codes, import-file) plus `llms.txt` as the index.

`llms.txt` and `llms-full.txt` both resolve; `llms-full.txt` is ~38 MB and the skill is told never to fetch it. Note that the fallback needs web access on the user's side, which the connector-only path did not.

This also retires the previous instruction's dead end. "Don't web-search for Wix API details; that file or the Wix docs tool" left nothing to do when both came up empty — which is what produced the slow Hebrew run.
