# Skills

Claude skills shipped with this repo. A skill is a folder containing a `SKILL.md` plus reference files; Claude loads it automatically when a conversation matches its description.

## `rck-website-uploads`

A bilingual (Hebrew/English) guided workflow that lets a non-technical person put content on the site from a Canva link or an attachment, without touching the Wix dashboard and without knowing any field names.

It exists because the raw Wix MCP alone didn't work for the office: people weren't supplying the information Claude needed, and a mistyped parsha name fails **silently** — the sheet uploads, then quietly goes missing from the sidebar filters. The skill fixes that by asking one question at a time, refusing to write until every answer is in hand, and looking every vocabulary value up in a bundled closed list instead of transliterating from memory.

```
rck-website-uploads/
  SKILL.md                   entry point: rules, language, triage, and a router to the flows
  flows/
    torah-sheet.md           adding a Torah sheet, end to end
    flyer.md                 adding a flyer, and replacing one's picture
    youth-program.md         a YouthPrograms row, and its flyer
    past-event.md            archiving something that already happened
    times.md                 minyan times — mostly "nothing to upload"
    take-down.md             hiding a flyer or a row, deleting a sheet
  reference/
    vocabulary.md            the closed lists, Hebrew ↔ site value
    wix.md                   endpoints, PATCH vs PUT, media formats, docs fallback
```

**`SKILL.md` is the only file that loads on every activation**, so it stays short — rules that apply to every job, the triage that decides *which* job it is, and a table pointing at the one flow file needed. Each flow file is self-contained: its questions, its fields, and how to verify it, so you can read one top to bottom and see the whole flow. The two reference files are shared by all of them.

**Triage is the part that earns its place in `SKILL.md`.** Routing on the noun the person used doesn't work — `דף` covers a Torah sheet, a flyer, and a schedule — so the skill opens the design and routes on what it actually says, and rule 10 tells it to back out of a flow rather than keep narrowing inside the wrong one. See [#055](../design-log/055-upload-skill-triage.md).

Detail belongs in a flow file, not in `SKILL.md`.

**Write it like documentation: what to do and how, nothing else.** Lean, clear, concise — imperative sentences, tables over prose, no paragraph that exists to justify the line above it. Rationale goes in the design log, and that includes the softer forms of it: "previous attempts failed because…", "that's the reassurance", "worth naming outright". A bare consequence clause earns its place only when it changes what the model *does* ("a wrong value throws no error: the sheet uploads, then vanishes from the filters" → so look it up). Anything longer is for `design-log/054` and `055`.

### Keeping it accurate

`reference/vocabulary.md` mirrors `SEFER_PARSHIOS`, `CHAGIM_ORDER`, and `PIRKEI_AVOS_PERAKIM` in `src/lib/torah-sheets.ts`, and the flyer sections mirror `FlyerCategory` in `src/lib/flyers.ts`. **If you change any of those lists in code, update `vocabulary.md` in the same PR** — a skill that disagrees with the code is worse than no skill, because it teaches the wrong value confidently.

Adding a chag is the likeliest change — `CHAGIM_ORDER` has no "Other" bucket, so a day that isn't on it gets no filter button at all. `Rosh Chodesh` and `Yom Ha'atzmaut`/`Yom Yerushalayim` are the deliberate omissions (#054); everything else the office has asked for is on the list.

A subtler kind of drift, and the one that bit in #055: a value can be **spelled correctly and still render nowhere**, because the page that used to read it no longer does. `Flyers.category: youth` is the live example — `FlyerCategory` still accepts it, `/youth` stopped reading it in #017. So when a page stops consuming a collection or a category, check whether the skill still offers it. The check that catches this isn't "is the value in the union?" but **"which page renders a row with this value, and does that page still ask for it?"**

### Packaging and sharing

Claude Desktop takes a skill as a `.zip` whose **root is the skill folder**:

```bash
npm run skill:pack     # writes skills/rck-website-uploads-<version>.zip
```

The version comes from the `**Version:**` line at the top of `SKILL.md` — **bump it whenever you change the skill.** Because installed copies can drift (see below), a datestamped filename is how you tell "this is broken" from "you're three versions behind". The skill also reports its own version if you ask it.

The zip is **not committed** — it's a build artifact, and a stale one that disagrees with the source folder is exactly the kind of thing that teaches people the wrong value.

### Two ways to get it to people

**Send the zip** (what we do today). They install it themselves: Claude Desktop → Settings → Customize → Skills → upload. *"Custom skills you upload are private to your individual account"* — so everyone needs their own copy, **and nobody gets your fixes until you re-send and they re-upload.** That's the real cost of this route.

**Share it inside an organisation** (better, if it's available). On Team and Enterprise plans:

- An owner enables sharing in Organization settings → Skills — it's off by default — and you then share the skill with individuals. Recipients get it view-only, and *"if you update the skill later, recipients automatically get the updated version."*
- Or an owner uploads it org-wide, and it appears for everyone in Customize → Skills with nothing for them to install. *"Only owners can add or remove organization-wide skills"*; members can toggle it off but can't edit or delete it.

Either way the re-send problem disappears — you edit, they have it. **The catch is org membership, not plan features:** sharing only reaches people inside your own Claude organisation. For the Kollel office that means the Kollel needs its own Team plan with you in it. That's an admin decision, and it's much cheaper than any engineering alternative.

Hand out `INSTALL-for-editors.md` alongside the zip if you're on the manual route — it's the bilingual setup page, written for someone who has never installed anything in Claude before.


### Prerequisites on the user's side

- Claude Desktop, signed in
- The **Canva** connector enabled, signed in to an account with access to the RCK designs
- The **Wix** connector enabled, signed in to an account with edit access to the RCK site
- Code execution enabled (Settings → Capabilities) — skills are greyed out without it
