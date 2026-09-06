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

function selichosLine(time) {
  if (!time) return "";
  return `
      <div style="display:flex;align-items:baseline;gap:18px;margin-top:16px;padding-bottom:16px;border-bottom:3px solid #dfb030">
        <div style="font-family:'Oswald',sans-serif;font-size:40px;line-height:1;font-weight:500;color:#a47915">Selichos</div>
        <div style="font-family:'Oswald',sans-serif;font-size:56px;line-height:1;font-weight:500;color:#1a1a1a">${/[AP]M/i.test(time) ? to24(time) : time}</div>
      </div>`;
}

function card(service, rows, extra = "") {
  const groups = groupByDaySpec(rows);
  const total = rows.length;
  const size = total <= 2 ? 104 : total === 3 ? 96 : 74;
  const gap = total >= 4 ? 4 : 10;
  const blocks = groups
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
  return `
    <div style="background:#f7f5f0;border-top:6px solid #102a56;box-sizing:border-box;padding:28px 34px 24px;display:flex;flex-direction:column">
      <div style="font-family:'Oswald',sans-serif;font-size:68px;line-height:1;font-weight:500;color:#102a56">${service}</div>
      ${extra}${blocks}
    </div>`;
}

/**
 * @param {object} o
 * @param {string} o.weekOf     e.g. "September 13"
 * @param {Array}  o.rows       ComputedDaveningRow[] from getComputedWeekdaySchedule
 * @param {string} o.photoUrl   file:// or data: URL for the beis medrash photo
 * @param {string} o.logoUrl    file:// or data: URL for logo-vertical-light.png
 * @param {string} o.qrUrl      file:// or data: URL for the QR png
 * @param {string} [o.selichos]  optional Selichos time ("6:20 AM" or "06:20"); omit for none
 */
export function buildFlierHtml({ weekOf, rows, photoUrl, logoUrl, qrUrl, selichos = "" }) {
  const cards = SERVICES.map((s) =>
    card(s, rows.filter((r) => r.service === s), s === "Shacharis" ? selichosLine(selichos) : ""),
  ).join("");
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
