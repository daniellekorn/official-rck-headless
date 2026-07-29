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

Structure: `SKILL.md` holds the workflow (language gate, four-item task menu, one flow per task) and delegates detail to `reference/{vocabulary,torah-sheets,flyers,phrases-he}.md`.

The behavioural rules that matter, in rough order of how much breakage they prevent:

1. **Never write a vocabulary value that isn't in the table.** Stop and ask. Stated as a rule, then restated at the top of `vocabulary.md` with the consequence spelled out, because a model that "knows" the answer will otherwise skip the lookup.
2. **One question per message, no tool calls until every answer is in.** This is the direct fix for under-specified requests — you can't omit a field you were asked about individually.
3. **Read back before writing, and show the translated value** (`עקב → Eikev, Devarim`). A wrong match becomes visible to someone who reads Hebrew and has never heard of `SEFER_PARSHIOS`. This is the last line of defence and the one that catches what rule 1 misses.
4. **Verify after writing** — including "click the parsha button and confirm the sheet appears", which is the only check that actually proves the vocabulary matched.

### Bilingual, with fixed wording

Language is the **first** question, asked before anything else, in both languages (`עברית או English?`). Hebrew phrasing lives in `reference/phrases-he.md` as fixed strings rather than being translated per-conversation, so the assistant reads the same way every week — for a skeptical user, consistency *is* trustworthiness. Hebrew addresses the user in the plural (תשלחו, תכתבו), which reads naturally and avoids assuming anyone's gender.

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

**Not yet done: no end-to-end run.** Nobody has installed the zip and uploaded a real sheet through it. The first run should be a throwaway title with `isActive = false` so nothing reaches the public site.

Site content and code are unchanged by this entry — the skill is additive, and the existing dashboard and MCP workflows in `CONTRIBUTING.md` still work.
