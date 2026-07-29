# Skills

Claude skills shipped with this repo. A skill is a folder containing a `SKILL.md` plus reference files; Claude loads it automatically when a conversation matches its description.

## `rck-website-uploads`

A bilingual (Hebrew/English) guided workflow that lets a non-technical person add Torah sheets and flyers to the site from a Canva link, without touching the Wix dashboard and without knowing any field names.

It exists because the raw Wix MCP alone didn't work for the office: people weren't supplying the information Claude needed, and a mistyped parsha name fails **silently** — the sheet uploads, then quietly goes missing from the sidebar filters. The skill fixes that by asking one question at a time, refusing to call a tool until every answer is in hand, and looking every vocabulary value up in a bundled closed list instead of transliterating from memory.

```
rck-website-uploads/
  SKILL.md                   the workflow: language gate, task menu, the four flows
  reference/
    vocabulary.md            the closed lists, Hebrew ↔ site value
    torah-sheets.md          TorahSheets fields
    flyers.md                Flyers fields
    phrases-he.md            fixed Hebrew wording
```

### Keeping it accurate

`reference/vocabulary.md` mirrors `SEFER_PARSHIOS`, `CHAGIM_ORDER`, and `PIRKEI_AVOS_PERAKIM` in `src/lib/torah-sheets.ts`, and the flyer sections mirror `FlyerCategory` in `src/lib/flyers.ts`. **If you change any of those lists in code, update `vocabulary.md` in the same PR** — a skill that disagrees with the code is worse than no skill, because it teaches the wrong value confidently.

Adding a chag is the likeliest change. `Shabbos HaGadol` in particular is not currently in `CHAGIM_ORDER`, and it comes up every year.

### Packaging and sharing

Claude Desktop takes a skill as a `.zip` whose **root is the skill folder**:

```bash
npm run skill:pack     # writes skills/rck-website-uploads.zip
```

The zip is **not committed** — it's a build artifact, and a stale one that disagrees with the source folder is exactly the kind of thing that teaches people the wrong value. Regenerate it whenever you change the skill and re-send it.

Then either:

- **Send people the zip.** They install it themselves — Claude Desktop → Settings → Customize → Skills → upload. Custom skills are private to the account that uploads them, so each person needs their own copy. This is the route for anyone outside your Claude organisation, which includes the Kollel office.
- **Share it within an organisation.** On Team and Enterprise plans an owner can enable sharing in Organization settings → Skills, after which skills can be shared with individuals or the whole org, and recipients pick up your updates automatically. Only useful if the people using it are in the same org as you.

Hand out `INSTALL-for-editors.md` alongside the zip — it's the bilingual setup page, written for someone who has never installed anything in Claude before.

### Prerequisites on the user's side

- Claude Desktop, signed in
- The **Canva** connector enabled, signed in to an account with access to the RCK designs
- The **Wix** connector enabled, signed in to an account with edit access to the RCK site
- Code execution enabled (Settings → Capabilities) — skills are greyed out without it
