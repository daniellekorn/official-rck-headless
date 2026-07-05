import { GeoLocation, HDate, Zmanim, months } from "@hebcal/core";

/**
 * Computed weekday davening schedule (design-log #040).
 *
 * Times are fixed for a whole Sun–Thu week, computed from the week's most
 * restrictive day, matching how the office builds the weekly flyer from
 * myzmanim. Verified against myzmanim's Ra'anana page: @hebcal/core with
 * elevation 0 reproduces its "level region at sea level" sunset and its
 * "Earliest mincha" (= mincha gedolah) to within a few seconds.
 *
 * Cross-check any date against myzmanim with: node scripts/verify-zmanim.mjs
 */

// MyZmanim computes Ra'anana at sea level ("level region at sea level"),
// so elevation stays 0 even though the city sits above it.
const LOCATION = new GeoLocation("Ra'anana", 32.1848, 34.8713, 0, "Asia/Jerusalem");
const TZ = "Asia/Jerusalem";

// ── Rules (minutes since local midnight). Confirmed with the rav; see #040. ──
const SHACHARIS = [7 * 60, 8 * 60 + 15]; // 7:00 & 8:15, never change
const SHACHARIS_ROSH_CHODESH = [7 * 60, 8 * 60 + 5]; // 7:00 & 8:05
const EARLY_MINCHA_FLOOR = 12 * 60 + 50; // mincha gedolah, but never before 12:50
const FIXED_MINCHA = 18 * 60; // the 6:00 pm minyan...
const FIXED_MINCHA_CUTOFF = 18 * 60 + 10; // ...runs only while late mincha is after 6:10
const LATE_MINCHA_BEFORE_SHKIYA = 10; // minutes before shkiya
const MAARIV_AFTER_SHKIYA = 18; // minutes after shkiya
const FIXED_MAARIV = 20 * 60; // the 8:00 pm minyan, dropped once shkiya+18 reaches it
const LATE_MAARIV = 21 * 60 + 30; // 9:30 pm, Sunday & Wednesday only

export interface ComputedDaveningRow {
	service: "Shacharis" | "Mincha" | "Maariv";
	daySpec: string;
	time: string;
	notes?: string;
}

export interface ComputedWeekdaySchedule {
	/** Display label for the Sunday the week starts on, e.g. "July 5". */
	weekOf: string;
	/** ISO date (Jerusalem) of that Sunday, e.g. "2026-07-05" — for tooling. */
	weekStartISO: string;
	rows: ComputedDaveningRow[];
}

/** Civil calendar date in Asia/Jerusalem (month is 1–12). */
interface CivilDate {
	y: number;
	m: number;
	d: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const civilFmt = new Intl.DateTimeFormat("en-CA", {
	timeZone: TZ,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const clockFmt = new Intl.DateTimeFormat("en-GB", {
	timeZone: TZ,
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hourCycle: "h23",
});

/** The Jerusalem calendar date of an instant — never the server's local date. */
function civilDateOf(instant: Date): CivilDate {
	const [y, m, d] = civilFmt.format(instant).split("-").map(Number);
	return { y, m, d };
}

/**
 * An unambiguous instant inside a Jerusalem civil day (UTC noon = 14:00–15:00
 * local). Used both to feed @hebcal/core and for calendar arithmetic.
 */
function anchor({ y, m, d }: CivilDate): Date {
	return new Date(Date.UTC(y, m - 1, d, 12));
}

function addDays(c: CivilDate, n: number): CivilDate {
	const t = anchor(c);
	t.setUTCDate(t.getUTCDate() + n);
	return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 0 = Sunday … 6 = Saturday. */
function dayOfWeek(c: CivilDate): number {
	return anchor(c).getUTCDay();
}

/** Seconds since local (Jerusalem) midnight for an instant. */
function secondsOfDay(instant: Date): number {
	const parts = clockFmt.formatToParts(instant);
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
	return get("hour") * 3600 + get("minute") * 60 + get("second");
}

/** "1:20 PM" from minutes since midnight. */
function fmtTime(minutes: number): string {
	const h24 = Math.floor(minutes / 60);
	const m = minutes % 60;
	const h12 = ((h24 + 11) % 12) + 1;
	return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

/**
 * The Sunday opening the schedule week. Friday still belongs to the current
 * week (Shacharis runs Sun–Fri, so a Friday Rosh Chodesh must show); the page
 * rolls to the coming week on Shabbos, so by Motzei Shabbos the new week is up.
 */
function scheduleSunday(today: CivilDate): CivilDate {
	const dow = dayOfWeek(today);
	return dow <= 5 ? addDays(today, -dow) : addDays(today, 7 - dow);
}

function isRoshChodesh(c: CivilDate): boolean {
	const h = new HDate(anchor(c));
	// Day 30 of a month, or day 1 of any month except Tishrei (Rosh Hashana).
	return h.getDate() === 30 || (h.getDate() === 1 && h.getMonth() !== months.TISHREI);
}

/**
 * Compute the weekday minyan schedule for the week containing `now`
 * (Friday/Shabbos roll to the coming week). Pure and deterministic.
 */
export function getComputedWeekdaySchedule(now: Date = new Date()): ComputedWeekdaySchedule {
	const sunday = scheduleSunday(civilDateOf(now));

	// Mincha/Maariv run Sun–Thu; aggregate the most restrictive day so one
	// posted time is valid all week (early minyanim can't precede their zman
	// on any day, shkiya-anchored ones can't run late on any day).
	let latestMinchaGedola = 0;
	let earliestShkiya = Infinity;
	let latestShkiya = 0;
	for (let i = 0; i < 5; i++) {
		const z = new Zmanim(LOCATION, anchor(addDays(sunday, i)), false);
		latestMinchaGedola = Math.max(latestMinchaGedola, secondsOfDay(z.minchaGedola()));
		earliestShkiya = Math.min(earliestShkiya, secondsOfDay(z.sunset()));
		latestShkiya = Math.max(latestShkiya, secondsOfDay(z.sunset()));
	}

	// Round down to the minute only after aggregating exact times.
	const earlyMincha = Math.max(Math.floor(latestMinchaGedola / 60), EARLY_MINCHA_FLOOR);
	const lateMincha = Math.floor(earliestShkiya / 60) - LATE_MINCHA_BEFORE_SHKIYA;
	const shkiyaMaariv = Math.floor(latestShkiya / 60) + MAARIV_AFTER_SHKIYA;

	const rows: ComputedDaveningRow[] = [];

	for (const t of SHACHARIS) rows.push({ service: "Shacharis", daySpec: "Sun – Fri", time: fmtTime(t) });
	// Shacharis also runs Friday, so scan Sun–Fri for Rosh Chodesh.
	const roshChodeshDays = [0, 1, 2, 3, 4, 5]
		.map((i) => addDays(sunday, i))
		.filter(isRoshChodesh)
		.map((c) => DAY_NAMES[dayOfWeek(c)]);
	if (roshChodeshDays.length > 0) {
		const spec = `Rosh Chodesh (${roshChodeshDays.join(" & ")})`;
		for (const t of SHACHARIS_ROSH_CHODESH) rows.push({ service: "Shacharis", daySpec: spec, time: fmtTime(t) });
	}

	rows.push({ service: "Mincha", daySpec: "Sun – Thu", time: fmtTime(earlyMincha) });
	if (lateMincha > FIXED_MINCHA_CUTOFF) rows.push({ service: "Mincha", daySpec: "Sun – Thu", time: fmtTime(FIXED_MINCHA) });
	rows.push({ service: "Mincha", daySpec: "Sun – Thu", time: fmtTime(lateMincha) });

	rows.push({ service: "Maariv", daySpec: "Sun – Thu", time: fmtTime(shkiyaMaariv) });
	if (shkiyaMaariv < FIXED_MAARIV) rows.push({ service: "Maariv", daySpec: "Sun – Thu", time: fmtTime(FIXED_MAARIV) });
	rows.push({ service: "Maariv", daySpec: "Sun & Wed", time: fmtTime(LATE_MAARIV) });

	const weekOf = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", day: "numeric" }).format(anchor(sunday));
	const pad = (n: number) => String(n).padStart(2, "0");
	const weekStartISO = `${sunday.y}-${pad(sunday.m)}-${pad(sunday.d)}`;

	return { weekOf, weekStartISO, rows };
}
