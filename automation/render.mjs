// Renders this week's davening flier to PDF + JPG.
//
//   node automation/render.mjs                 → the current week
//   node automation/render.mjs 2026-09-13      → the week containing that date
//
// Requires Node 22.18+ (imports the site's TypeScript directly, same as
// scripts/verify-zmanim.mjs) and Playwright (npm i -D playwright).
//
// Times come from src/lib/zmanim-schedule.ts — the exact same module the
// /daven page uses — so the flier can never disagree with the website.
// Output lands in automation/out/.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { getComputedWeekdaySchedule } from "../src/lib/zmanim-schedule.ts";
import { buildFlierHtml } from "./flier-html.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const outDir = path.join(here, "out");

const arg = process.argv[2];
if (arg && !/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
  console.error(`Bad date "${arg}" — use YYYY-MM-DD`);
  process.exit(1);
}
const probe = arg ? new Date(`${arg}T12:00:00Z`) : new Date();

const { weekOf, weekStartISO, rows } = getComputedWeekdaySchedule(probe);
console.log(`Week of ${weekOf} (${weekStartISO})`);
for (const r of rows) console.log(`  ${r.service.padEnd(10)} ${r.daySpec.padEnd(24)} ${r.time}`);

// automation/special.json — optional. To switch Selichos on for the season:
//   { "selichos": { "on": true, "offsetMin": 20, "erevRHOffsetMin": 40 } }
// Drop erevRHOffsetMin except on the Erev Rosh Hashana week.
// Delete the file when the season is over, or it keeps printing.
let special = {};
try {
  special = JSON.parse(await readFile(path.join(here, "special.json"), "utf8"));
  console.log("special.json:", special);
} catch {}

const html = buildFlierHtml({
  weekOf,
  rows,
  selichos: special.selichos ?? null,
  photoUrl: pathToFileURL(path.join(here, "assets", "beis-medrash.png")).href,
  logoUrl: pathToFileURL(path.join(repo, "public", "logo-vertical-light.png")).href,
  qrUrl: pathToFileURL(path.join(here, "assets", "qr-rckollel.png")).href,
});

await mkdir(outDir, { recursive: true });
const htmlPath = path.join(outDir, "flier.html");
await writeFile(htmlPath, html, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const base = `daven-flier-${weekStartISO}`;
await page.screenshot({
  path: path.join(outDir, `${base}.jpg`),
  type: "jpeg",
  quality: 95,
  clip: { x: 0, y: 0, width: 1920, height: 1080 },
});
await page.pdf({
  path: path.join(outDir, `${base}.pdf`),
  width: "1920px",
  height: "1080px",
  printBackground: true,
  pageRanges: "1",
});
await browser.close();

console.log(`Wrote ${path.relative(repo, outDir)}/${base}.jpg and .pdf`);
// Consumed by the workflow to name the attachments and the subject line.
await writeFile(path.join(outDir, "meta.json"), JSON.stringify({ weekOf, weekStartISO, base }), "utf8");
