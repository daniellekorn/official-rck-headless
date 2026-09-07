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

// Same caption look as GOLD_CAP but sized to match the day-of-week text
// (e.g. Mincha/Maariv's "SUN – THU") — used for the day-range caption itself
// and anywhere else a caption needs to read at that size, not GOLD_CAP's.
const DAYSPEC_CAP =
  "font-family:'Onest',sans-serif;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;font-size:22px;color:#a47915";

/** The day-range caption every card uses directly under its title (e.g.
 * Mincha/Maariv's "SUN – THU"), with the top-of-card margin only on the
 * first one. */
function daySpecCaption(daySpec, { first, compact }) {
  const top = first ? (compact ? 8 : 12) : compact ? 12 : 20;
  return `<div style="${DAYSPEC_CAP};margin-top:${top}px">${daySpec}</div>`;
}

/**
 * @param {Array} rows
 * @param {boolean} [compact] Tighter margins/gaps — used on fast weeks, where
 *   a 4th column (the gold Taanis box) narrows the other three and the extra
 *   room has to come from trimming this whitespace, not the time text itself.
 */
function defaultBody(rows, compact = false) {
  const groups = groupByDaySpec(rows);
  const total = rows.length;
  const size = total <= 2 ? 104 : total === 3 ? 96 : 74;
  const gap = (total >= 4 ? 4 : 10) - (compact ? 2 : 0);
  const bodyTop = (total >= 4 ? 12 : 24) - (compact ? 6 : 0);
  return groups
    .map(
      (g, i) => `
      ${daySpecCaption(g.daySpec, { first: i === 0, compact })}
      <div style="display:flex;flex-direction:column;gap:${gap}px;margin-top:${bodyTop}px">${g.times
        .map(
          (t) =>
            `<div style="font-family:'Oswald',sans-serif;font-size:${size}px;line-height:1.06;font-weight:500;color:#1a1a1a">${t}</div>`,
        )
        .join("")}</div>`,
    )
    .join("");
}

/**
 * The Shacharis card's Selichos treatment (see #067; days moved to match
 * Mincha/Maariv's caption position, see #069): the day-range caption sits
 * directly under the card header, in the same spot and style Mincha/Maariv
 * use for theirs — naming the days that apply to *both* Shacharis and
 * Selichos that week — followed by a "Selichos" label over a gold column of
 * Selichos times (from the site's own Selichos rows — never computed here)
 * paired positionally with each Shacharis time. A second daySpec group among
 * the Selichos rows — Erev Rosh Hashana, Erev Yom Kippur — gets its own
 * "Selichos · " captioned line below a gold rule, using its real daySpec
 * text, never hardcoded.
 * Returns "" when there are no Selichos rows, in which case card() renders
 * the Shacharis card normally (defaultBody, unchanged).
 */
function selichosBlock(shacharisTimes, selichosRows, compact) {
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
      ${daySpecCaption(main.daySpec, { first: true, compact })}
      <div style="display:grid;grid-template-columns:auto 1fr;column-gap:26px;row-gap:8px;align-items:baseline;margin-top:${compact ? 8 : 12}px">
        <div style="${DAYSPEC_CAP};grid-column:1">Selichos</div>
        <div style="grid-column:2"></div>${pairs}
      </div>${extra}`;
}

/**
 * @param {string} service
 * @param {Array} rows
 * @param {object} [opts]
 * @param {string} [opts.overrideBody] Replaces the default groupByDaySpec rendering
 *   (the Selichos+Shacharis paired grid) when non-empty.
 * @param {boolean} [opts.compact] See defaultBody — also tightens the card's own padding.
 */
function card(service, rows, { overrideBody = "", compact = false } = {}) {
  const body = overrideBody || defaultBody(rows, compact);
  const padding = compact ? "22px 26px 18px" : "28px 34px 24px";
  return `
    <div style="background:#f7f5f0;border-top:6px solid #102a56;box-sizing:border-box;padding:${padding};display:flex;flex-direction:column">
      <div style="font-family:'Oswald',sans-serif;font-size:68px;line-height:1;font-weight:500;color:#102a56">${service}</div>
      ${body}
    </div>`;
}

// A pale tint of the flier's gold (#dfb030), light enough that the dark
// time text stays legible and the box doesn't fight the cream cards for
// attention — just a soft wash marking it "special", not a bold fill.
const TAANIS_TINT = "#faf1d9";
// Time text uses the exact same style as every other time on the flier
// (defaultBody's dark #1a1a1a Oswald) so the fast column doesn't read as a
// different design language — only the background marks it as different.
const TIME_STYLE = "font-family:'Oswald',sans-serif;font-weight:500;color:#1a1a1a;line-height:1.06";

/**
 * The fast-day column — a 4th card to the right of Shacharis/Mincha/Maariv,
 * shown only on weeks touching a fast (see design-log #069 addendum;
 * supersedes the earlier per-card banner design). A pale gold tint marks it
 * as a "special day" panel, but its captions reuse `GOLD_CAP` (the same gold
 * caption style as "SUN – THU" elsewhere) and its times reuse the exact dark
 * Oswald style every other time on the flier uses — so it reads as part of
 * the same design, not a different one. Lists the fast's own day+date, its
 * name, and Start/End of Fast — only the halves whose own day falls in
 * *this* week (a split Tisha B'Av shows just "Start" on one week's flyer,
 * just "End" on the other's; see #068). Returns "" with nothing to show, in
 * which case buildFlierHtml renders the ordinary 3-column grid.
 */
function taanisColumn(taanisRows) {
  if (taanisRows.length === 0) return "";
  const entries = taanisRows
    .map((f) => {
      const edges = [
        f.startInWeek && { label: "Start of Fast", time: to24(f.startTime), day: f.startDateLabel },
        f.endInWeek && { label: "End of Fast", time: to24(f.endTime), day: f.endDateLabel },
      ].filter(Boolean);
      const sameDay = edges.length === 2 && edges[0].day === edges[1].day;
      return `
      <div>
        ${sameDay ? `<div style="${DAYSPEC_CAP}">${edges[0].day}</div>` : ""}
        <div style="font-family:'Oswald',sans-serif;font-size:44px;line-height:1.05;font-weight:500;color:#102a56;margin-top:${sameDay ? 4 : 0}px">${f.name}</div>
        ${edges
          .map(
            (e) => `
          <div style="margin-top:16px;padding-top:14px;border-top:3px solid #dfb030">
            ${sameDay ? "" : `<div style="${DAYSPEC_CAP}">${e.day}</div>`}
            <div style="${GOLD_CAP};margin-top:${sameDay ? 0 : 4}px">${e.label}</div>
            <div style="${TIME_STYLE};font-size:64px;margin-top:4px">${e.time}</div>
          </div>`,
          )
          .join("")}
      </div>`;
    })
    .join('<div style="height:3px;background:#dfb030;margin:22px 0"></div>');
  return `
    <div style="background:${TAANIS_TINT};border-top:6px solid #102a56;box-sizing:border-box;padding:22px 26px 18px;display:flex;flex-direction:column">
      <!-- This column has no "Shacharis"-style header, but its date line
           must still land level with the day-range caption in the other
           three cards. 76px = card()'s 68px header line (line-height:1) +
           daySpecCaption()'s 8px compact top margin — keep in sync by hand
           if either of those changes. -->
      <div style="height:76px"></div>
      ${entries}
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
  const hasTaanis = taanis.length > 0;
  // Selichos' paired gold/dark grid makes the Shacharis card the tightest of
  // the three on a fast week — give it more of the row and take it from
  // Mincha/Maariv (their own content doesn't need the extra room) rather
  // than the Taanis column.
  const hasSelichosAndTaanis = hasTaanis && selichosRows.length > 0;
  const cards = SERVICES.map((s) => {
    const mine = rows.filter((r) => r.service === s);
    if (s === "Shacharis") {
      return card(s, mine, {
        overrideBody: selichosBlock(mine.map((r) => to24(r.time)), selichosRows, hasTaanis),
        compact: hasTaanis,
      });
    }
    return card(s, mine, { compact: hasTaanis });
  }).join("") + taanisColumn(taanis);
  const gridTemplateColumns = hasSelichosAndTaanis
    ? "1.3fr 0.85fr 0.85fr 1fr"
    : `repeat(${hasTaanis ? 4 : 3},minmax(0,1fr))`;
  const gridGap = hasTaanis ? 24 : 32;
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

  <div style="flex:1;display:grid;grid-template-columns:${gridTemplateColumns};gap:${gridGap}px;min-height:0">${cards}</div>

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
