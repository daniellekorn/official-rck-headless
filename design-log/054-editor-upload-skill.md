# 054 — A packaged Claude skill for the office's uploads

**Status:** Shipped. Routing reworked in [#055](055-upload-skill-triage.md).
**Date:** 2026-07-29

## Problem

`CONTRIBUTING.md` has told the office since #001 that they can edit content by talking to Claude with the Wix MCP connected. In practice it didn't work, for two reasons — neither of them a Wix bug.

**The user doesn't know what Claude needs.** The Wix MCP exposes generic CMS tools with no idea this site has a `TorahSheets` collection, that `series` takes exactly three values, or that a flyer needs a `category`. So it does what a general-purpose agent does with an under-specified request: fills in something plausible and reports success. The office's workaround was a two-part prompt they had to paste in the right order every conversation; anyone forgetting the first paste got a confident wrong answer.

**Wrong vocabulary fails silently.** This is the one that hurt. `subcategory` is matched against a closed list (`SEFER_PARSHIOS`, `CHAGIM_ORDER`) case-insensitively but otherwise exactly. A near-miss (`Ekev` for `Eikev`, `Ki Tavo` for `Ki Savo`) doesn't error: the row is created, the sheet renders under "All Sheets", and it's simply absent from the sidebar filter where anyone would look. Nobody notices for weeks. Ashkenazi transliteration is *exactly* what a model will cheerfully approximate, and the people supplying the names type `עקב`, not `Eikev`.

Several of the site's admins work in Hebrew, and the instructions were English-only.

## Decision

Ship a **skill** (`skills/rck-website-uploads/`), packaged as a zip the office installs in Claude Desktop.

A skill is the right shape specifically because it carries **reference files**. The closed vocabulary ships *inside* it as a Hebrew → site-value lookup table, so a parsha name is resolved by table lookup rather than transliteration-from-memory. That single property is the fix for the silent-failure mode; everything else is ergonomics.

The behavioural rules, in rough order of breakage prevented:

1. **Never write a vocabulary value that isn't in the table.** Stop and ask. Stated as a rule and restated at the top of `vocabulary.md` with the consequence, because a model that "knows" the answer will otherwise skip the lookup.
2. **One question per message; no writes until every answer is in.** You can't omit a field you were asked about individually.
3. **Read back before writing, showing the Hebrew beside the matched value** (`Eikev (עקב)`). A wrong match becomes visible to someone who reads Hebrew and has never heard of `SEFER_PARSHIOS`.
4. **Verify after writing** — including "click the parsha button and confirm the sheet appears", the only check that proves the vocabulary matched.
5. **Touch only the row you're working on.** Never edit another row to make a page look a certain way; the page decides what it displays, and erased data is gone.
6. **Never assume a domain.** Fetch the live URL from the connector. The first version told people to check `rckollel.org/torah-sheets`, which does not exist.

### Bilingual, without a script

Reply in whatever language they wrote in and stay there, including progress notes. Hebrew addresses the user in the **plural** (תשלחו, תכתבו), which reads naturally and avoids assuming anyone's gender. Values written to the CMS stay Latin script regardless; the only Hebrew that enters the CMS is `year` (`תשפ״ו`).

A language *gate* ("which language would you like?") and a file of fixed Hebrew phrasings were both tried and removed. Claude already mirrors the language it's written to, so the gate spent a round trip asking what the user had answered by typing `להעלות פלייר` — breaking the skill's own "never ask what they already told you" rule. The phrase file drifted from the flow it was meant to voice within one PR of being written: it said to ask `שם הדף: Eikev?` while `SKILL.md` said *don't* ask for a title on Torah Bytes. A parallel script always drifts.

### `PATCH`, not a careful `PUT`

Wix Data's item update is `PUT` — a full replace, in Wix's own words: *"if the existing item has fields with values and those fields aren't included in the updated item, their values are lost."* A first run sent a partial body to clear one field and wiped that row's `title`, `subcategory`, and `pdfFile` with it. It was restored from the Media Manager, which was luck, not design.

`PATCH /wix-data/v2/items/{id}` is a genuine partial update (`fieldModifications` / `SET_FIELD`) and makes that whole failure class unreachable for single-field changes — which is what replacing a flyer image and setting `removeAfter` both are. It's the recommended path; read-merge-write `PUT` is the documented fallback, and "never send a partial `PUT`" stays a rule.

Two more traps found in the docs rather than the hard way: media import returns `operationStatus: PENDING` (so don't create the row off the import response — wait for the descriptor), and import needs an explicit `mimeType` unless the URL or `displayName` carries a file extension, which a Canva export URL often doesn't.

## Three things the office's written instructions had wrong

Found by checking their handoff docs against the code:

- **Flyer sections.** Their doc offered `learning` and `events`. `FlyerCategory` has four. Youth and schedule flyers were being filed under Learning.
- **Parsha + chag.** Their doc said to create two rows pointing at the same PDF. #053 addendum 10 built `chagSubcategory` precisely so this is **one** row tagged both ways; two rows duplicate the sheet.
- **`pdfThumbnail`.** Their doc treats it as real, and it is. `CONTRIBUTING.md` claimed it had been "tried and dropped" — the claim was stale.

A fourth, found the destructive way: the office's instructions called clearing `pdfThumbnail` on older sheets a "bonus cleanup". `torah-sheets.astro` gates the thumbnail on `isFeatured`, so a leftover value on a non-featured row displays nothing. The clearing bought zero and cost the Vaeschanan sheet a real preview.

## Gap found, and closed

**`Shabbos HaGadol` was not in `CHAGIM_ORDER`** — and it was the example in the office's own instruction sheet. Chagim has no "Other" bucket (#053 addendum 9), so a sheet tagged with it would have got no filter button at all. Same for Shemini Atzeres, Simchas Torah, Lag BaOmer, Tisha B'Av, and the minor fasts. Fixed in the same PR (#053 addendum 17, 9 entries → 19).

`Rosh Chodesh` and `Yom Ha'atzmaut`/`Yom Yerushalayim` are deliberately still out. The skill names the missing day and asks rather than substituting a neighbour — the behaviour that should survive any future gap.

## Alternatives considered

**Project instructions / a longer paste-in prompt.** What they had. No bundled reference files, so the vocabulary lookup falls back to the model's memory — the actual defect. Rejected for that reason alone.

**An MCP bundle (`.mcpb`).** Wrong tool: that ships *new tools*, and the Canva and Wix connectors already exist. What's missing is orchestration and domain knowledge, which is what a skill is.

**Automating Canva → Wix outright.** Rejected again, same reasoning as #031: no official Canva ↔ Wix connection, the Connect API means OAuth plus async export jobs, and a flyer changes a few times a year. The two-click export stays manual.

## Drift risk

`reference/vocabulary.md` duplicates lists in `src/lib/torah-sheets.ts` and `src/lib/flyers.ts`. A skill that confidently teaches a stale value is worse than no skill, so `skills/README.md` requires updating it in the same PR as any change to those lists. Generating it at build time was considered and skipped — the lists change roughly never, and a generator is more machinery to rot than the thing it protects.

#055 later found the subtler form: a value can be spelled correctly and still render nowhere, because the page that used to read it no longer does.

## Verification

Zip structure correct for Claude Desktop (skill folder at archive root, frontmatter parses). Vocabulary tables cross-checked entry-by-entry against `SEFER_PARSHIOS`, `CHAGIM_ORDER`, `PIRKEI_AVOS_PERAKIM`, and `FlyerCategory`. Media-format rules read off `wix-media.ts` and the row mappings rather than assumed; the skill is also told to read an existing row and mirror it before its first write.

Two end-to-end runs, one English and one Hebrew, both uploading a real Eikev sheet to the live site successfully. Both exposed the defects recorded above — the destructive `PUT`, the invented domain, and progress notes leaking into English mid-conversation. Site content and code unchanged; the skill is additive and the existing dashboard and MCP workflows still work.
