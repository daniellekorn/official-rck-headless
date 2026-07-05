// Print the computed weekly davening schedule so it can be checked against
// myzmanim (https://www.myzmanim.com, location: Raanana) and the weekly flyer.
//
//   node scripts/verify-zmanim.mjs               → this week
//   node scripts/verify-zmanim.mjs 2026-12-06    → the week containing that date
//   node scripts/verify-zmanim.mjs 2026-12-06 2027-03-15 …  → several at once
//
// Requires Node 22.18+ (runs the site's TypeScript directly).
import { GeoLocation, Zmanim } from "@hebcal/core";
import { getComputedShabbosSchedule, getComputedWeekdaySchedule } from "../src/lib/zmanim-schedule.ts";

const LOCATION = new GeoLocation("Ra'anana", 32.1848, 34.8713, 0, "Asia/Jerusalem");
const clock = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Asia/Jerusalem",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hourCycle: "h23",
});
const dayLabel = new Intl.DateTimeFormat("en-US", {
	timeZone: "Asia/Jerusalem",
	weekday: "short",
	month: "short",
	day: "numeric",
});

const inputs = process.argv.slice(2);
const dates = inputs.length > 0 ? inputs : [null];

for (const input of dates) {
	let probe = new Date();
	if (input) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
			console.error(`Skipping "${input}" — use YYYY-MM-DD`);
			continue;
		}
		probe = new Date(`${input}T12:00:00Z`);
	}

	const { weekOf, weekStartISO, rows } = getComputedWeekdaySchedule(probe);

	console.log(`\n═══ Week of ${weekOf}${input ? ` (asked: ${input})` : " (current week)"} ═══`);
	let service = "";
	for (const row of rows) {
		const label = row.service === service ? "" : row.service;
		service = row.service;
		console.log(`  ${label.padEnd(10)} ${row.daySpec.padEnd(24)} ${row.time}${row.notes ? `  (${row.notes})` : ""}`);
	}

	// Raw per-day zmanim for line-by-line comparison with myzmanim.
	console.log("  ── daily zmanim (vs myzmanim: 'Earliest mincha' / 'Sunset - level region at sea level')");
	const [y, m, d0] = weekStartISO.split("-").map(Number);
	for (let i = 0; i < 5; i++) {
		const d = new Date(Date.UTC(y, m - 1, d0 + i, 12));
		const z = new Zmanim(LOCATION, d, false);
		console.log(
			`     ${dayLabel.format(d).padEnd(12)} mincha gedolah ${clock.format(z.minchaGedola())}   shkiya ${clock.format(z.sunset())}`,
		);
	}

	// Shabbos schedule (vs hebcal.com Ra'anana: candles = shkiya − 18, havdalah = tzeit 8.5°).
	const shabbos = getComputedShabbosSchedule(probe);
	const parshaLabel = shabbos.parsha ? `Parshas ${shabbos.parsha}` : "(Yom Tov reading)";
	console.log(`  ── Shabbos ${shabbos.dateLabel} · ${parshaLabel}`);
	console.log("     Friday Night");
	for (const row of shabbos.fridayRows) console.log(`       ${row.label.padEnd(28)} ${row.time}`);
	console.log("     Shabbos Day");
	for (const row of shabbos.dayRows) console.log(`       ${row.label.padEnd(28)} ${row.time}`);
	const [fy, fm, fd] = shabbos.erevShabbosISO.split("-").map(Number);
	const zFri = new Zmanim(LOCATION, new Date(Date.UTC(fy, fm - 1, fd, 12)), false);
	const zSat = new Zmanim(LOCATION, new Date(Date.UTC(fy, fm - 1, fd + 1, 12)), false);
	console.log(
		`     raw: erev shkiya ${clock.format(zFri.sunset())}   candles(−18) ${clock.format(zFri.sunsetOffset(-18, true))}   tzeis 8.5° ${clock.format(zSat.tzeit(8.5))}`,
	);
}
