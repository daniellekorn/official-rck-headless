// Renders this week's davening flier to PDF + JPG (1920×1080) and an A4 portrait JPG + PDF.
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

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { getComputedWeekdaySchedule } from "../src/lib/zmanim-schedule.ts";
import { buildFlierHtml } from "./flier-html.mjs";
import { buildA4Html, alignRowWidths } from "./a4-html.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const outDir = path.join(here, "out");

const arg = process.argv[2];
if (arg && !/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
  console.error(`Bad date "${arg}" — use YYYY-MM-DD`);
  process.exit(1);
}
const probe = arg ? new Date(`${arg}T12:00:00Z`) : new Date();

const { weekOf, weekStartISO, rows, taanis } = getComputedWeekdaySchedule(probe);
console.log(`Week of ${weekOf} (${weekStartISO})`);
for (const r of rows) console.log(`  ${r.service.padEnd(10)} ${r.daySpec.padEnd(24)} ${r.time}`);
for (const f of taanis) console.log(`  Taanis     ${f.name}: ${f.startTime} (${f.startDayLabel}) - ${f.endTime} (${f.endDayLabel})`);

const shared = {
  weekOf,
  rows,
  taanis,
  photoUrl: pathToFileURL(path.join(here, "assets", "beis-medrash.png")).href,
  logoUrl: pathToFileURL(path.join(repo, "public", "logo-vertical-light.png")).href,
  qrUrl: pathToFileURL(path.join(here, "assets", "qr-rckollel.png")).href,
  // Self-hosted (not Google Fonts over the network) so the Monday-morning
  // launchd run still gets the right fonts even if it fires right as the
  // Mac wakes from sleep, before Wi-Fi has reconnected.
  oswald500Url: pathToFileURL(path.join(here, "assets", "fonts", "Oswald-500.woff2")).href,
  onest400Url: pathToFileURL(path.join(here, "assets", "fonts", "Onest-400.woff2")).href,
  onest600Url: pathToFileURL(path.join(here, "assets", "fonts", "Onest-600.woff2")).href,
};
const html = buildFlierHtml(shared);

await mkdir(outDir, { recursive: true });
const htmlPath = path.join(outDir, "flier.html");
await writeFile(htmlPath, html, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const base = `RCK-DaveningTimes_${weekStartISO}`;
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

// A4 portrait print copy — same times, same module, its own layout.
const a4Path = path.join(outDir, "flier-a4.html");
await writeFile(a4Path, buildA4Html(shared), "utf8");
const a4Page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
await a4Page.goto(pathToFileURL(a4Path).href, { waitUntil: "networkidle" });
await a4Page.evaluate(() => document.fonts.ready);
await a4Page.evaluate(alignRowWidths);
const a4Overflows = await a4Page.evaluate(() => {
  const b = document.getElementById("body");
  return b.scrollHeight > b.clientHeight + 1;
});
if (a4Overflows) {
  console.error("A4 flier content overflows the page — not writing the A4 PDF. Tell Danielle.");
  process.exitCode = 1;
} else {
  await a4Page.screenshot({
    path: path.join(outDir, `RCK-DaveningTimes_A4_${weekStartISO}.jpg`),
    type: "jpeg",
    quality: 95,
    clip: { x: 0, y: 0, width: 794, height: 1123 },
  });
  await a4Page.pdf({
    path: path.join(outDir, `RCK-DaveningTimes_A4_${weekStartISO}.pdf`),
    format: "A4",
    printBackground: true,
    pageRanges: "1",
  });
}
await browser.close();

console.log(`Wrote ${path.relative(repo, outDir)}/${base}.jpg and .pdf${a4Overflows ? "" : `, plus RCK-DaveningTimes_A4_${weekStartISO}.jpg and .pdf`}`);
// Consumed by the workflow to name the attachments and the subject line.
await writeFile(path.join(outDir, "meta.json"), JSON.stringify({ weekOf, weekStartISO, base }), "utf8");
