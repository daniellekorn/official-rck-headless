---
name: rck-weekly-flier
description: "Renders the RCK weekday davening flier locally from the repo — a 1920x1080 JPG for screens and WhatsApp plus a printable PDF — using the same computed zmanim the website's /daven page shows. Use for any request for this week's davening times, davening schedule, minyan times, minyanim flier, times for the screen, or the לוח זמנים of tefillos, including for a named week or date. This is the ONLY skill that generates the davening times flier. It does not upload anything and does not touch the website — for putting existing flyers, sheets or schedules onto the site, use the website-uploads skill instead."
---

# RCK weekly davening flier

**Version:** 2026-09-06c

Report that version if asked.

Produces two files for the coming week: a **JPG** (television screen, WhatsApp) and a **PDF** (printing). Both are drawn from `getComputedWeekdaySchedule()` in `src/lib/zmanim-schedule.ts` — the same function `rckollel.com/daven` calls. **Never type a zman in by hand and never compute one yourself.** If a time looks wrong, the website is the authority and the fix belongs in that module.

## Rules

1. **Run it, don't rebuild it.** The flier is `automation/render.mjs`. No new script, no editing the design to "fix" a time.
2. **One question at most.** Only ask which week if the person named a date you can't resolve. Otherwise: current week.
3. **Show, then hand over.** Tell them the times you got, then where the files are.
4. **A time that disagrees with /daven is a stop.** Say so; don't ship the flier. That's Danielle's.
5. **Never publish it.** Not to Wix, not to the site, not as a repo page. These files are for print, screen and WhatsApp only.

## Do it

From the repo root:

```bash
node automation/render.mjs              # the current week
node automation/render.mjs 2026-09-13   # the week containing that date
```

It prints the week label and every row, then writes both files to `automation/out/`:

```
automation/out/daven-flier-2026-09-13.jpg
automation/out/daven-flier-2026-09-13.pdf
```

Copy them where the person can find them — `~/Downloads` unless they say otherwise:

```bash
cp automation/out/daven-flier-*.jpg automation/out/daven-flier-*.pdf ~/Downloads/
```

Then report the times you saw, in one block, and the two filenames.

## First run on a new machine

`render.mjs` needs Playwright, which is not in `package.json`:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

Node must be **22.18 or newer** (the script imports the site's TypeScript directly). `node -v` to check. Everything else comes from `npm ci`.

## Selichos and other special weeks

Nothing to do. Selichos rows come from `getComputedWeekdaySchedule()` like every
other row, so the flier draws them whenever the site says they run — 20 minutes
before each Shacharis, 40 before on Erev Rosh Hashana, 15 before on Erev Yom
Kippur. A day whose offset differs gets its own captioned line, from its real
day label.

There is no file to edit and no time to type. If Selichos is missing or wrong,
that is `src/lib/zmanim-schedule.ts` — Danielle's, not this skill's.

## When it goes wrong

| What you see | What it means |
|---|---|
| `Cannot find package 'playwright'` | first run on this machine — see above |
| `Unknown file extension ".ts"` | Node is older than 22.18 |
| Times differ from /daven | stop, and tell Danielle — never correct the flier |
| A row missing (no 18:00, no 20:00) | correct. The rules drop those minyanim in some weeks |

The design lives in `automation/flier-html.mjs` as plain inline-styled HTML at 1920×1080. Changes to how it *looks* are a design job, not this skill's.
