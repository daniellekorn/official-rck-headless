// Builds the 1920×1080 flier HTML from the site's computed schedule rows.
// Pure string building — no browser, no network. Called by render.mjs.

const SERVICES = ["Shacharis", "Mincha", "Maariv"];

/** "1:10 PM" → "13:10" */
function to24(t) {
  const [hm, ap] = t.trim().split(/\s+/);
  let [h, m] = hm.split(":").map(Number);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** [{daySpec, times:[...]}, …] in the order the rows arrived. */
function groupByDaySpec(rows) {
  const out = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.daySpec === r.daySpec) last.times.push(to24(r.time));
    else out.push({ daySpec: r.daySpec, times: [to24(r.time)] });
  }
  return out;
}

const GOLD_CAP =
  "font-family:'Onest',sans-serif;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;font-size:17px;color:#a47915;line-height:1.3";

/**
 * The Shacharis card's Selichos treatment: a gold column of Selichos times
 * (from the site's own Selichos rows — never computed here) paired
 * positionally with each Shacharis time, under a gold caption naming the
 * Selichos row's own daySpec. A second daySpec group among the Selichos rows
 * — Erev Rosh Hashana, Erev Yom Kippur — gets its own captioned line below a
 * gold rule, using its real daySpec text, never hardcoded.
 * Returns "" when there are no Selichos rows, in which case card() renders
 * the Shacharis card normally.
 */
function selichosBlock(shacharisTimes, selichosRows) {
  if (selichosRows.length === 0) return "";
  const [main, ...rest] = groupByDaySpec(selichosRows);

  const pairs = main.times
    .map(
      (t, i) => `
          <div style="font-family:'Oswald',sans-serif;font-size:60px;line-height:1.06;font-weight:500;color:#a47915;border-right:3px solid #dfb030;padding-right:26px">${t}</div>
          <div style="font-family:'Oswald',sans-serif;font-size:92px;line-height:1.06;font-weight:500;color:#1a1a1a">${shacharisTimes[i] ?? ""}</div>`,
    )
    .join("");

  const extra = rest
    .map(
      (g) => `
        <div style="margin-top:18px;padding-top:14px;border-top:3px solid #dfb030">
          <div style="${GOLD_CAP}">Selichos · ${g.daySpec}</div>
          <div style="font-family:'Oswald',sans-serif;font-size:52px;line-height:1.06;font-weight:500;color:#a47915;margin-top:8px">${g.times.join(" | ")}</div>
        </div>`,
    )
    .join("");

  return `
      <div style="display:grid;grid-template-columns:auto 1fr;column-gap:26px;row-gap:8px;align-items:baseline;margin-top:12px">
        <div style="${GOLD_CAP};grid-column:1">Selichos<br />${main.daySpec}</div>
        <div style="grid-column:2"></div>${pairs}
      </div>${extra}`;
}

function defaultBody(rows) {
  const groups = groupByDaySpec(rows);
  const total = rows.length;
  const size = total <= 2 ? 104 : total === 3 ? 96 : 74;
  const gap = total >= 4 ? 4 : 10;
  return groups
    .map(
      (g, i) => `
      <div style="font-family:'Onest',sans-serif;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;font-size:22px;color:#a47915;margin-top:${i === 0 ? 12 : 20}px">${g.daySpec}</div>
      <div style="display:flex;flex-direction:column;gap:${gap}px;margin-top:${total >= 4 ? 12 : 24}px">${g.times
        .map(
          (t) =>
            `<div style="font-family:'Oswald',sans-serif;font-size:${size}px;line-height:1.06;font-weight:500;color:#1a1a1a">${t}</div>`,
        )
        .join("")}</div>`,
    )
    .join("");
}

/**
 * @param {string} service
 * @param {Array} rows
 * @param {object} [opts]
 * @param {string} [opts.prefix] Rendered above the body regardless of override — the
 *   Taanis banner's spot, always on top of whatever else the card shows that week.
 * @param {string} [opts.overrideBody] Replaces the default groupByDaySpec rendering
 *   (the Selichos+Shacharis paired grid) when non-empty.
 */
function card(service, rows, { prefix = "", overrideBody = "" } = {}) {
  const body = overrideBody || defaultBody(rows);
  return `
    <div style="background:#f7f5f0;border-top:6px solid #102a56;box-sizing:border-box;padding:28px 34px 24px;display:flex;flex-direction:column">
      <div style="font-family:'Oswald',sans-serif;font-size:68px;line-height:1;font-weight:500;color:#102a56">${service}</div>
      ${prefix}${body}
    </div>`;
}

/**
 * The fast-day banner: gold-bordered, above everything else in the Shacharis
 * card (the same spot Selichos takes on /daven — see design-log #068).
 * Returns "" when there's no fast this week, in which case card() renders
 * exactly as it always has.
 */
function taanisBlock(taanisRows) {
  if (taanisRows.length === 0) return "";
  return `
      <div style="margin-top:12px;padding:14px 18px;border:3px solid #dfb030;border-radius:6px;background:#fbf3e0">${taanisRows
        .map(
          (f) => `
        <div style="${GOLD_CAP}">${f.name}</div>
        <div style="font-family:'Oswald',sans-serif;font-size:32px;line-height:1.3;font-weight:500;color:#1a1a1a;margin-top:4px">Begins ${f.startTime} <span style="color:#a47915">(${f.startDayLabel})</span> &nbsp;·&nbsp; Ends ${f.endTime} <span style="color:#a47915">(${f.endDayLabel})</span></div>`,
        )
        .join("")}
      </div>`;
}

/**
 * @param {object} o
 * @param {string} o.weekOf     e.g. "September 13"
 * @param {Array}  o.rows       ComputedDaveningRow[] from getComputedWeekdaySchedule
 * @param {Array}  [o.taanis]   ComputedTaanisRow[] from the same getComputedWeekdaySchedule call
 * @param {string} o.photoUrl   file:// or data: URL for the beis medrash photo
 * @param {string} o.logoUrl    file:// or data: URL for logo-vertical-light.png
 * @param {string} o.qrUrl      file:// or data: URL for the QR png
 */
export function buildFlierHtml({ weekOf, rows, taanis = [], photoUrl, logoUrl, qrUrl }) {
  const selichosRows = rows.filter((r) => r.service === "Selichos");
  const cards = SERVICES.map((s) => {
    const mine = rows.filter((r) => r.service === s);
    if (s !== "Shacharis") return card(s, mine);
    return card(s, mine, {
      prefix: taanisBlock(taanis),
      overrideBody: selichosBlock(mine.map((r) => to24(r.time)), selichosRows),
    });
  }).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>html,body{margin:0;padding:0}</style>
</head>
<body>
<div style="width:1920px;height:1080px;box-sizing:border-box;padding:60px 64px;background:#ffffff;font-family:'Onest',system-ui,sans-serif;color:#1a1a1a;display:flex;flex-direction:column;gap:32px;overflow:hidden">

  <header style="position:relative;height:200px;overflow:hidden;background:#091c41;flex:none">
    <img src="${photoUrl}" alt="" style="position:absolute;top:-228px;left:100px;width:1938px;height:auto;display:block" />
    <div style="position:absolute;inset:0;background:linear-gradient(100deg,rgba(9,28,65,0.95) 0%,rgba(9,28,65,0.9) 30%,rgba(9,28,65,0.6) 45%,rgba(9,28,65,0.18) 58%,rgba(9,28,65,0.42) 70%,rgba(9,28,65,0.82) 82%,rgba(9,28,65,0.94) 100%)"></div>
    <div style="position:relative;height:100%;box-sizing:border-box;padding:22px 44px;display:flex;align-items:center;justify-content:space-between;gap:40px">
      <div>
        <div style="font-family:'Oswald',sans-serif;font-size:92px;line-height:0.98;font-weight:500;color:#ffffff;letter-spacing:0.01em">Daven with Us</div>
        <div style="display:block;height:4px;width:88px;background:#dfb030;margin:18px 0 15px"></div>
        <div style="font-family:'Onest',sans-serif;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;font-size:20px;color:#f6d66b">Weekday Minyanim | Week of ${weekOf}</div>
      </div>
      <img src="${logoUrl}" alt="RCK — Ra'anana Community Kollel" style="height:156px;width:auto;display:block;flex:none" />
    </div>
  </header>

  <div style="flex:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;min-height:0">${cards}</div>

  <footer style="flex:none;border-top:3px solid #102a56;padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:40px">
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="font-family:'Oswald',sans-serif;font-size:38px;font-weight:500;color:#102a56;line-height:1.1">Times update weekly at rckollel.com/daven</div>
      <div style="font-size:22px;color:#3e4d6b">Ahuza St 198, Ra'anana | 058-794-5168 | rckollel@gmail.com</div>
    </div>
    <div style="display:flex;align-items:center;gap:22px;flex:none">
      <div style="text-align:right;font-family:'Oswald',sans-serif;font-size:38px;line-height:1.15;font-weight:500;color:#102a56">Visit our Website:</div>
      <img src="${qrUrl}" alt="QR code to rckollel.com" style="width:128px;height:128px;display:block" />
    </div>
  </footer>

</div>
</body>
</html>`;
}
