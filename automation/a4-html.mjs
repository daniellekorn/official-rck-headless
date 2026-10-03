// Builds the A4 portrait (794×1123 CSS px) flier HTML from the same computed
// schedule rows the landscape flier uses. Pure string building — called by
// render.mjs. Sibling of flier-html.mjs; keep the palette and fonts in step.

const to24 = (t) => {
  const [hm, ap] = t.trim().split(/\s+/);
  let [h, m] = hm.split(":").map(Number);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const groupByDaySpec = (rows) => {
  const out = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.daySpec === r.daySpec) last.times.push(to24(r.time));
    else out.push({ daySpec: r.daySpec, times: [to24(r.time)] });
  }
  return out;
};

const CAP =
  "font-family:'Onest',sans-serif;font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:21px;color:#a47915";
const time = (t, size, color = "#1a1a1a") =>
  `<div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:${size}px;line-height:1;color:${color}">${t}</div>`;
const timesRow = (times, size) =>
  `<div style="display:flex;gap:30px;margin-top:8px;flex-wrap:nowrap">${times.map((t) => time(t, size)).join("")}</div>`;

/**
 * @param {object} o
 * @param {string} o.weekOf
 * @param {Array}  o.rows     ComputedDaveningRow[]
 * @param {Array}  [o.taanis] ComputedTaanisRow[]
 * @param {string} o.photoUrl
 * @param {string} o.logoUrl
 * @param {string} o.qrUrl
 * @param {string} o.oswald500Url
 * @param {string} o.onest400Url
 * @param {string} o.onest600Url
 */
export function buildA4Html({ weekOf, rows, taanis = [], photoUrl, logoUrl, qrUrl, oswald500Url, onest400Url, onest600Url }) {
  const selichos = rows.filter((r) => r.service === "Selichos");
  // A plain week (no Selichos, no fast) has room to spare, so cards stretch to
  // fill the page and times go big. Busy weeks use compact cards instead.
  const big = selichos.length === 0 && taanis.length === 0;

  const card = (title, inner) => `
    <div style="background:#f7f5f0;border-top:5px solid #102a56;padding:${big ? "18px 26px 20px" : "12px 26px 14px"};display:grid;grid-template-columns:205px 1fr;column-gap:20px;align-items:center;${big ? "flex:1;" : ""}">
      <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:50px;line-height:1;color:#102a56">${title}</div>
      <div>${inner}</div>
    </div>`;

  const service = (name) => {
    const groups = groupByDaySpec(rows.filter((r) => r.service === name));
    let html = groups
      .map((g) => `<div style="${CAP}">${g.daySpec}</div>${timesRow(g.times, big ? (g.times.length <= 2 ? 80 : 58) : 54)}`)
      .join('<div style="height:12px"></div>');
    if (name === "Shacharis" && selichos.length) {
      const [main, ...rest] = groupByDaySpec(selichos);
      html += `
      <div style="margin-top:16px;padding-top:12px;border-top:2px solid #dfb030">
        <div style="${CAP}">Selichos · ${main.daySpec}</div>
        <div style="display:flex;gap:30px;margin-top:8px">${main.times.map((t) => time(t, 44, "#a47915")).join("")}</div>
        ${rest
          .map(
            (g) => `<div style="margin-top:12px"><div style="${CAP}">Selichos · ${g.daySpec}</div><div style="display:flex;gap:30px;margin-top:6px">${g.times.map((t) => time(t, 36, "#a47915")).join("")}</div></div>`,
          )
          .join("")}
      </div>`;
    }
    return card(name, html);
  };

  const taanisCards = taanis
    .map((f) => {
      const edges = [f.startInWeek && ["Start of Fast", f.startTime], f.endInWeek && ["End of Fast", f.endTime]].filter(Boolean);
      return `
      <div style="background:#faf1d9;border-top:5px solid #102a56;padding:12px 26px 14px">
        <div style="${CAP}">${f.startDateLabel}</div>
        <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:40px;color:#102a56;margin-top:2px">${f.name}</div>
        <div style="display:flex;gap:60px;margin-top:6px">${edges.map(([l, t]) => `<div><div style="${CAP}">${l}</div>${time(to24(t), 46)}</div>`).join("")}</div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
@page{size:A4 portrait;margin:0}
html,body{margin:0;padding:0}
@font-face{font-family:'Oswald';font-style:normal;font-weight:500;src:url('${oswald500Url}') format('woff2')}
@font-face{font-family:'Onest';font-style:normal;font-weight:400;src:url('${onest400Url}') format('woff2')}
@font-face{font-family:'Onest';font-style:normal;font-weight:600;src:url('${onest600Url}') format('woff2')}
</style>
</head>
<body>
<div id="page" style="width:794px;height:1123px;box-sizing:border-box;padding:32px 40px;display:flex;flex-direction:column;gap:16px;font-family:'Onest',system-ui,sans-serif;color:#1a1a1a;overflow:hidden;background:#fff">
  <header style="position:relative;height:200px;overflow:hidden;background:#091c41;flex:none">
    <img src="${photoUrl}" alt="" style="position:absolute;top:-40px;left:-60px;width:1000px;height:auto" />
    <div style="position:absolute;inset:0;background:linear-gradient(100deg,rgba(9,28,65,.95) 0%,rgba(9,28,65,.88) 40%,rgba(9,28,65,.5) 70%,rgba(9,28,65,.85) 100%)"></div>
    <div style="position:relative;height:100%;box-sizing:border-box;padding:0 30px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:76px;line-height:1;color:#fff">Daven with Us</div>
        <div style="height:4px;width:76px;background:#dfb030;margin:12px 0 10px"></div>
        <div style="font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:20px;line-height:1.35;color:#f6d66b">Weekday Minyanim<br>Week of ${weekOf}</div>
      </div>
      <img src="${logoUrl}" alt="RCK — Ra'anana Community Kollel" style="height:112px;width:auto;display:block" />
    </div>
  </header>

  <div id="body" style="flex:1;display:flex;flex-direction:column;gap:12px;min-height:0">
    ${["Shacharis", "Mincha", "Maariv"].map(service).join("")}
    ${taanisCards}
  </div>

  <footer style="flex:none;border-top:3px solid #102a56;margin-top:6px;padding-top:14px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:26px;color:#102a56;line-height:1.1">Times update weekly at rckollel.com/daven</div>
      <div style="font-size:14px;color:#3e4d6b;margin-top:6px">Ahuza St 198, Ra'anana | 058-794-5168 | rckollel@gmail.com</div>
    </div>
    <div style="display:flex;align-items:center;gap:14px">
      <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:24px;color:#102a56;text-align:right;line-height:1.15">Visit our<br>Website:</div>
      <img src="${qrUrl}" alt="QR code to rckollel.com" style="width:92px;height:92px;display:block" />
    </div>
  </footer>
</div>
</body>
</html>`;
}
