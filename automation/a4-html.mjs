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

const capStyle = (px) =>
  `font-family:'Onest',sans-serif;font-weight:600;letter-spacing:.1em;text-transform:uppercase;font-size:${px}px;color:#a47915`;
let CAP = capStyle(28);
const time = (t, size, color = "#1a1a1a") =>
  `<div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:${size}px;line-height:1;color:${color};font-variant-numeric:tabular-nums">${t}</div>`;
const timesStack = (times, size) => {
  const row = (ts) => `<div style="display:flex;justify-content:flex-end;gap:30px">${ts.map((t) => time(t, size)).join("")}</div>`;
  return `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;margin-top:8px">${row(times.slice(0, -1))}${row(times.slice(-1))}</div>`;
};
const timesRow = (times, size, attr = "") =>
  `<div ${attr} style="display:flex;justify-content:flex-end;gap:30px;margin-top:8px;flex-wrap:nowrap">${times.map((t) => time(t, size)).join("")}</div>`;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
/** "Rosh Chodesh (Sun & Mon)" → "Sun & Mon"; null for any other spec. */
const rcDays = (spec) => /^Rosh Chodesh \((.+)\)$/.exec(spec)?.[1] ?? null;
/** Sun–Fri days left once the Rosh Chodesh days are taken out, as a label. */
function otherDays(rc) {
  const gone = rc.split(" & ");
  const rest = DAYS.filter((d) => !gone.includes(d));
  if (rest.length <= 1) return rest[0] ?? "";
  // Runs of 3+ consecutive days collapse to a range; shorter runs list their days. Keeps the label to two lines at most.
  const parts = [];
  for (let i = 0; i < rest.length; ) {
    let j = i;
    while (j + 1 < rest.length && DAYS.indexOf(rest[j + 1]) === DAYS.indexOf(rest[j]) + 1) j++;
    if (j - i >= 2) parts.push(`${rest[i]}\u00A0–\u00A0${rest[j]}`);
    else for (let k = i; k <= j; k++) parts.push(rest[k]);
    i = j + 1;
  }
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} &\u00A0${parts[parts.length - 1]}`;
}

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
  // Day labels are as large as the page allows; crowded weeks (Selichos, a fast) need them a little smaller.
  CAP = capStyle(big ? 28 : 24);
  // Two-time cards share the large size; a three-time Mincha is allowed to be
  // smaller so it still fits the card, without shrinking the other minyanim.
  const sizeFor = () => (big ? 80 : 50);
  // With room to spare, a third time drops to its own line instead of shrinking the row.
  const timesFor = (times) => (big && times.length >= 3 ? timesStack(times, sizeFor()) : timesRow(times, sizeFor()));

  const card = (title, inner, caption = "") => `
    <div style="background:#f7f5f0;border-top:5px solid #102a56;padding:${big ? "18px 26px 20px" : "12px 26px 14px"};display:grid;grid-template-columns:250px 1fr;column-gap:20px;align-items:center;${big ? "flex:1;" : ""}">
      <div>
        <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:60px;line-height:1;color:#102a56">${title}</div>
        ${caption ? `<div style="${CAP};margin-top:10px">${caption}</div>` : ""}
      </div>
      <div>${inner}</div>
    </div>`;

  const service = (name) => {
    const groups = groupByDaySpec(rows.filter((r) => r.service === name));
    const rcGroup = name === "Shacharis" ? groups.find((g) => rcDays(g.daySpec)) : null;
    if (rcGroup) {
      // Rosh Chodesh days get their own line, the remaining days another, both under
      // one "Shacharis" title pulled to the top of the card.
      const regular = groups.find((g) => g !== rcGroup);
      const regLabel = otherDays(rcDays(rcGroup.daySpec));
      const L = `${CAP};line-height:1.2`;
      const rcRow = `<div><div style="${L}">${rcDays(rcGroup.daySpec)}</div><div style="${L};color:#102a56;letter-spacing:.03em">Rosh Chodesh</div></div>
        ${timesRow(rcGroup.times, sizeFor(), "data-align-row")}`;
      const regRow = regLabel ? `<div style="${L}">${regLabel}</div>${timesRow(regular.times, sizeFor(), "data-align-row")}` : "";
      // Rosh Chodesh that opens the week (Sun/Mon) leads; later in the week it follows the regular days.
      const rcFirst = ["Sun", "Mon"].includes(rcDays(rcGroup.daySpec).split(" & ")[0]);
      return `
    <div style="background:#f7f5f0;border-top:5px solid #102a56;padding:18px 26px 20px">
      <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:60px;line-height:1;color:#102a56">Shacharis</div>
      <div style="display:grid;grid-template-columns:250px 1fr;column-gap:20px;row-gap:10px;align-items:center;margin-top:12px">
        ${rcFirst ? rcRow + regRow : regRow + rcRow}
      </div>
    </div>`;
    }
    let html = groups
      .map((g, i) => `${i === 0 ? "" : `<div style="${CAP}">${g.daySpec}</div>`}${timesFor(g.times)}`)
      .join('<div style="height:12px"></div>');
    if (name === "Shacharis" && selichos.length) {
      const [main, ...rest] = groupByDaySpec(selichos);
      html += `
      <div style="margin-top:16px;padding-top:12px;border-top:2px solid #dfb030">
        <div style="${CAP}">Selichos · ${main.daySpec}</div>
        <div style="display:flex;justify-content:flex-end;gap:30px;margin-top:8px">${main.times.map((t) => time(t, 44, "#a47915")).join("")}</div>
        ${rest
          .map(
            (g) => `<div style="margin-top:12px"><div style="${CAP}">Selichos · ${g.daySpec}</div><div style="display:flex;justify-content:flex-end;gap:30px;margin-top:6px">${g.times.map((t) => time(t, 36, "#a47915")).join("")}</div></div>`,
          )
          .join("")}
      </div>`;
    }
    return card(name, html, groups[0]?.daySpec ?? "");
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
<div id="page" style="width:794px;height:1123px;box-sizing:border-box;padding:22px 24px;display:flex;flex-direction:column;gap:16px;font-family:'Onest',system-ui,sans-serif;color:#1a1a1a;overflow:hidden;background:#fff">
  <header style="position:relative;height:200px;overflow:hidden;background:#091c41;flex:none">
    <img src="${photoUrl}" alt="" style="position:absolute;top:-40px;left:-60px;width:1000px;height:auto" />
    <div style="position:absolute;inset:0;background:linear-gradient(100deg,rgba(9,28,65,.95) 0%,rgba(9,28,65,.88) 40%,rgba(9,28,65,.5) 70%,rgba(9,28,65,.85) 100%)"></div>
    <div style="position:relative;height:100%;box-sizing:border-box;padding:0 30px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-family:'Oswald',sans-serif;font-weight:500;font-size:76px;line-height:1;color:#fff">Daven with Us</div>
        <div style="height:4px;width:76px;background:#dfb030;margin:12px 0 10px"></div>
        <div style="font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:24px;line-height:1.35;color:#f6d66b">Week of ${weekOf}</div>
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

/**
 * Runs inside the page. Rows tagged data-align-row end up different widths
 * only because digits differ (08:05 is wider than 08:15); this nudges each
 * toward the group's average width with a sub-pixel letter-spacing so their
 * left and right edges line up exactly, without visibly changing any glyph.
 */
export function alignRowWidths() {
  const rows = [...document.querySelectorAll("[data-align-row]")];
  if (rows.length < 2) return null;
  const glyphSpan = (row) => {
    const kids = [...row.children];
    const ls = parseFloat(kids[kids.length - 1].style.letterSpacing || "0");
    return { left: kids[0].getBoundingClientRect().left, right: kids[kids.length - 1].getBoundingClientRect().right - ls };
  };
  const widths = rows.map((r) => { const g = glyphSpan(r); return g.right - g.left; });
  const target = widths.reduce((a, b) => a + b, 0) / widths.length;
  rows.forEach((row, i) => {
    const kids = [...row.children];
    const chars = kids.reduce((n, k) => n + k.textContent.length, 0);
    const ls = (target - widths[i]) / (chars - 1);
    kids.forEach((k) => (k.style.letterSpacing = `${ls}px`));
    kids[kids.length - 1].style.marginRight = `${-ls}px`;
  });
  return rows.map((r) => glyphSpan(r)).map((g) => ({ left: +g.left.toFixed(2), right: +g.right.toFixed(2) }));
}
