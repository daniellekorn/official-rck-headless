# Weekly davening flier

Produces the weekday minyanim flier — a 1920×1080 JPG for the television screen
and WhatsApp, and a PDF for printing — using the same computed times
`rckollel.com/daven` shows. The automated Monday run always renders the
*following* week (see "The weekly schedule" below); run by hand with a date
argument to render any other week.

Times come from `getComputedWeekdaySchedule()` in `src/lib/zmanim-schedule.ts`.
**No zman is ever typed into the flier.** If a time on the flier looks wrong,
the website is the authority and the fix belongs in that module, not here.

## Running it

```bash
node automation/render.mjs              # current week
node automation/render.mjs 2026-09-13   # the week containing that date
```

Both files land in `automation/out/`. `weekly-flier.sh` renders *next* week
specifically (it passes render.mjs a date 7 days out) and copies the newest
pair to `~/Downloads/RCK Flier`.

First run on a new machine needs Playwright and Node ≥ 22.18:

```bash
npm install --save-dev playwright && npx playwright install chromium
```

## The weekly schedule

`com.rckollel.weeklyflier.plist` is a macOS LaunchAgent that runs
`weekly-flier.sh` every Monday at 06:30 local time, rendering the *following*
week's flier — so it lands well ahead of the week it covers.

```bash
cp automation/com.rckollel.weeklyflier.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.rckollel.weeklyflier.plist
launchctl list | grep rckollel     # confirm
launchctl start com.rckollel.weeklyflier   # run now
```

Logs: `/tmp/rck-flier.log`, `/tmp/rck-flier.err`. If the Mac is asleep at 06:30
the job runs on the next wake.

`.github/workflows/weekly-flier.yml` renders the same files on GitHub every
Monday (same "following week" date math) and attaches them to the run — the
backup for when the Mac is away, and the route for anyone without the repo
checked out. It must never publish the flier as a site page.

## Files

| File | What it is |
| --- | --- |
| `render.mjs` | Reads the schedule, builds the HTML, drives Playwright, writes JPG + PDF + `meta.json` |
| `flier-html.mjs` | The design: one function returning the 1920×1080 HTML, inline-styled |
| `weekly-flier.sh` | Renders *next* week and copies the newest pair to `~/Downloads/RCK Flier` |
| `com.rckollel.weeklyflier.plist` | The Monday 06:30 LaunchAgent |
| `assets/` | Beis medrash photograph, QR code, logo |
| `out/` | Generated output — gitignored, safe to delete |

## The rules the times follow

Shacharis is fixed clock time — 07:00 and 08:15, 07:00 and 08:05 on Rosh
Chodesh. Mincha and Maariv are computed once for the whole week, so a single
posted time is valid every day:

- Early Mincha — the latest Mincha Gedola across Sun–Thu, never before 12:50
- The fixed 18:00 minyan — shown only while late Mincha still falls after 18:10
- Late Mincha — the earliest sunset across the week, minus 10 minutes
- Maariv — the latest sunset across the week, plus 18 minutes
- The fixed 20:00 minyan — shown only while that earlier Maariv is before 20:00

A missing 18:00 or 20:00 row is correct, not a bug: the rules drop those
minyanim in some weeks. Selichos runs 20 minutes before each Shacharis, and 40
minutes before on Erev Rosh Hashana.

A fast (Taanis) week gets a 4th column — solid gold, to the right of
Shacharis/Mincha/Maariv — naming the fast, its own day and date (e.g.
"Monday, September 14"), and Start/End of Fast, so the flier never leaves it
ambiguous which calendar day the time belongs to.

## Changing how it looks

The design lives in `flier-html.mjs` as plain inline-styled HTML — navy #102a56,
gold #dfb030 / #a47915, warm stone #f7f5f0, Oswald for numerals and headings,
Onest for labels. There is a matching design file (`Davening Times - Screen
16x9.dc.html`) kept alongside the A4 print version; change both together or they
drift.
