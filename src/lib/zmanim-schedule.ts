import { GeoLocation, HDate, Locale, Sedra, Zmanim, flags, getHolidaysOnDate, months } from "@hebcal/core";

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

// ── Selichos (confirmed with Yosef, Sept 2026; see #067, amended #071). ──
const SELICHOS_BEFORE_ELUL = 20; // minutes before each Shacharis, season start through erev Rosh Hashana
const SELICHOS_BEFORE_ASERES_YEMEI_TESHUVA = 30; // minutes before, the weekdays after Rosh Hashana through the day before erev Yom Kippur
const SELICHOS_BEFORE_EREV_ROSH_HASHANA = 60;
const SELICHOS_BEFORE_EREV_YOM_KIPPUR = 15;

// ── Fast days (confirmed against the printed luach, Sept 2026; see #068). ──
// Start (Tzom Gedaliah, Asara B'Tevet, Ta'anit Esther, 17 Tammuz): alot
// hashachar, sun 16.1° below the horizon — @hebcal/core's Zmanim.alotHaShachar()
// hardcodes this angle. Confirmed against the luach to within 1 minute across
// all four; a flat 72- or 90-minute offset was off by 4–14 minutes.
// Start (Tisha B'Av only): plain sunset the evening before, no offset.
// End (all five, no exceptions): sunset + 19 minutes, confirmed to zero
// minutes of error. This is its own constant — do not reuse TZEIS_ANGLE
// (8.5°/~37 min), which is for Shabbos motzash and is measurably different.
const TAANIS_END_AFTER_SHKIYA = 19;

/** Hebcal's own English event descriptions for the five communal fasts this
 * page shows (stable across years/locales; see `Event.getDesc()`). Excludes
 * Yom Kippur (also flagged MAJOR_FAST) and Ta'anit Bechorot (also flagged
 * MINOR_FAST, firstborns only, not a communal fast on this page). Tisha B'Av
 * has two descs: plain, and "(observed)" when 9 Av itself is Shabbat and the
 * fast is deferred to Sunday — verified against 200 years of Hebcal's own
 * output that it's the only one of the five with a deferred-variant desc
 * (Tzom Gedaliah/Tammuz keep their plain desc even deferred to Sunday). */
const TAANIS_DISPLAY_NAME: Record<string, string> = {
	"Tzom Gedaliah": "Tzom Gedaliah",
	"Asara B'Tevet": "Asara B'Tevet",
	"Ta'anit Esther": "Ta'anit Esther",
	"Tzom Tammuz": "17 Tammuz",
	"Tish'a B'Av": "Tisha B'Av",
	"Tish'a B'Av (observed)": "Tisha B'Av",
};

// ── Shabbos rules (confirmed with the rav, July 2026; see #041). ──
const CANDLES_BEFORE_SHKIYA = 20; // confirmed against the printed luach (10+ weeks), not hebcal's 18-min default; see #066
const EREV_MINCHA_VS_CANDLES = 10; // before candles on summer clock, after on winter clock
const SHABBOS_MORNING = [
	{ label: "Midrash Shiur", minutes: 8 * 60 },
	{ label: "Shacharis", minutes: 8 * 60 + 45 },
	{ label: "Tefillat Yeladim", minutes: 10 * 60 },
];
const BEIS_MEDRASH_BEFORE_MINCHA = 30;
const SHABBOS_MINCHA_BEFORE_CANDLES = 10; // vs erev Shabbos hadlakas neiros
const TZEIS_ANGLE = 8.5; // hebcal's tzeit hakochavim: sun 8.5° below horizon

export interface ComputedDaveningRow {
	service: "Shacharis" | "Mincha" | "Maariv" | "Selichos";
	daySpec: string;
	time: string;
	notes?: string;
}

export interface ComputedTaanisRow {
	/** "Tzom Gedaliah", "Asara B'Tevet", "Ta'anit Esther", "17 Tammuz", "Tisha B'Av". */
	name: string;
	startTime: string;
	/** Short weekday the start falls on, e.g. "Mon" — Tisha B'Av's start is the evening before. */
	startDayLabel: string;
	/** Full weekday + month/day the start falls on, e.g. "Monday, September 14". */
	startDateLabel: string;
	/** Whether the start day itself falls in this Sun–Sat week (vs. this row
	 * being included only because the *end* falls here — a split Tisha B'Av). */
	startInWeek: boolean;
	endTime: string;
	/** Short weekday the end falls on, e.g. "Tue". */
	endDayLabel: string;
	/** Full weekday + month/day the end falls on, e.g. "Tuesday, September 15". */
	endDateLabel: string;
	/** Whether the end day itself falls in this Sun–Sat week. */
	endInWeek: boolean;
}

export interface ComputedWeekdaySchedule {
	/** Display label for the Sunday the week starts on, e.g. "July 5". */
	weekOf: string;
	/** ISO date (Jerusalem) of that Sunday, e.g. "2026-07-05" — for tooling. */
	weekStartISO: string;
	rows: ComputedDaveningRow[];
	/** Fasts whose start or end falls in this Sun–Sat week; usually empty. */
	taanis: ComputedTaanisRow[];
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

/** "Monday, September 14" — used for the fast-day banners so a reader never
 * has to work out which calendar day "Start of Fast" refers to. */
const weekdayDateFmt = new Intl.DateTimeFormat("en-US", {
	timeZone: TZ,
	weekday: "long",
	month: "long",
	day: "numeric",
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
 * Whether this civil day is a Yom Tov as observed in Ra'anana (Israel) — the
 * shul's fixed weekday Shacharis/Mincha/Maariv minyanim don't run on these
 * days (Yom Tov davening replaces them, not modeled here). Rosh Hashana I &
 * II, Yom Kippur, Sukkot I, Shmini Atzeret/Simchat Torah (combined in
 * Israel), Pesach I & VII, Shavuot — one day each except Rosh Hashana.
 * Chol HaMoed is deliberately *not* included here: those weekdays still run
 * the regular schedule.
 *
 * Filters `getHolidaysOnDate()`'s events to `CHAG` flag set and `CHUL_ONLY`
 * (diaspora-only second day) *not* set — verified against 2026–2027 that
 * this yields exactly the one-day-per-holiday Israel list above (confirmed
 * Shmini Atzeret/Simchat Torah collapse to the single combined Israel day,
 * and Sukkot/Pesach's Chol HaMoed days carry no CHAG flag at all).
 */
function isChag(c: CivilDate): boolean {
	const hd = new HDate(anchor(c));
	for (const ev of getHolidaysOnDate(hd) ?? []) {
		const f = ev.getFlags();
		if (f & flags.CHAG && !(f & flags.CHUL_ONLY)) return true;
	}
	return false;
}

/**
 * Selichos season (Ashkenazi minhag, see #067, amended #071):
 *
 *  - Leil Selichos is the Motzei Shabbos on/before (1 Tishrei − 4 days) — the
 *    same rule @hebcal/core uses internally for its "Leil Selichot" event
 *    (`HDate.dayOnOrBefore(SAT, tishrei1.abs() - 4)`), reproduced here with
 *    this file's own TZ-safe civil-date arithmetic instead of `HDate.greg()`
 *    (which resolves via the *runtime's* local timezone, not Jerusalem's —
 *    unsafe on a server that isn't necessarily set to Asia/Jerusalem).
 *  - The first weekday morning Selichos is said the second morning after
 *    that Motzei Shabbos (i.e. the Monday), not the Sunday right after it —
 *    the Sunday's is a special late-night one, not tied to the regular
 *    before-Shacharis time (confirmed with Yosef, Sept 2026).
 *  - It continues every weekday morning through Erev Yom Kippur, skipping
 *    Rosh Hashana itself (no Selichos on Yom Tov). The before-Shacharis
 *    offset itself isn't uniform across the season, though (see #071):
 *    `SELICHOS_BEFORE_ELUL` from season start through erev Rosh Hashana,
 *    `SELICHOS_BEFORE_ASERES_YEMEI_TESHUVA` from the day after Rosh Hashana
 *    through the day before erev Yom Kippur — a longer Selichos once the
 *    Aseres Yemei Teshuva additions are said.
 */
interface SelichosWindow {
	erevRoshHashana: CivilDate;
	roshHashana1: CivilDate;
	roshHashana2: CivilDate;
	erevYomKippur: CivilDate;
	seasonStart: CivilDate;
}

/** Milliseconds timestamp for a CivilDate — safe for equality/ordering (see `anchor`). */
const civilTime = (c: CivilDate) => anchor(c).getTime();

function selichosWindowForYear(ref: CivilDate, refAbs: number, hebrewYear: number): SelichosWindow {
	const tishrei1Abs = new HDate(1, months.TISHREI, hebrewYear).abs();
	const tishrei1 = addDays(ref, tishrei1Abs - refAbs);

	let leilSelichos = addDays(tishrei1, -4);
	while (dayOfWeek(leilSelichos) !== 6) leilSelichos = addDays(leilSelichos, -1); // walk back to Saturday

	return {
		erevRoshHashana: addDays(tishrei1, -1),
		roshHashana1: tishrei1,
		roshHashana2: addDays(tishrei1, 1),
		erevYomKippur: addDays(tishrei1, 8),
		seasonStart: addDays(leilSelichos, 2), // the Monday after Leil Selichos, not the Sunday
	};
}

/** Both candidate Rosh Hashanas (the one that started this Hebrew year, and next year's) — at
 * most one is ever close enough to `ref` to matter; checking both avoids picking the wrong one
 * near the Rosh Hashana boundary itself. */
function selichosWindows(ref: CivilDate): SelichosWindow[] {
	const refAbs = new HDate(anchor(ref)).abs();
	const hebrewYear = new HDate(anchor(ref)).getFullYear();
	return [hebrewYear, hebrewYear + 1].map((y) => selichosWindowForYear(ref, refAbs, y));
}

interface SelichosDayInfo {
	offset: number;
	/** Set only for the erev Rosh Hashana / erev Yom Kippur one-off exceptions. */
	label?: string;
}

function selichosInfoFor(day: CivilDate, windows: SelichosWindow[]): SelichosDayInfo | null {
	for (const w of windows) {
		if (civilTime(day) === civilTime(w.erevRoshHashana))
			return { offset: SELICHOS_BEFORE_EREV_ROSH_HASHANA, label: "Erev Rosh Hashana" };
		if (civilTime(day) === civilTime(w.erevYomKippur))
			return { offset: SELICHOS_BEFORE_EREV_YOM_KIPPUR, label: "Erev Yom Kippur" };
		if (civilTime(day) === civilTime(w.roshHashana1) || civilTime(day) === civilTime(w.roshHashana2)) return null; // no Selichos on Yom Tov
		if (civilTime(day) >= civilTime(w.seasonStart) && civilTime(day) <= civilTime(w.erevRoshHashana))
			return { offset: SELICHOS_BEFORE_ELUL };
		if (civilTime(day) >= civilTime(w.roshHashana2) && civilTime(day) <= civilTime(w.erevYomKippur))
			return { offset: SELICHOS_BEFORE_ASERES_YEMEI_TESHUVA };
	}
	return null;
}

/** The one of the five communal fasts (see `TAANIS_DISPLAY_NAME`) landing on
 * this civil day per Hebcal's own flags/deferral rules, or null. Reads via
 * this file's TZ-safe `anchor()`, never `Event.getDate().greg()` (unsafe on a
 * server not necessarily set to Asia/Jerusalem — same caveat as Selichos). */
function taanisOnDay(day: CivilDate): string | null {
	const hd = new HDate(anchor(day));
	for (const ev of getHolidaysOnDate(hd) ?? []) {
		const desc = ev.getDesc();
		if (desc in TAANIS_DISPLAY_NAME) return desc;
	}
	return null;
}

/**
 * Fasts whose start or end time falls within the Sun–Sat week starting
 * `sunday`. Most fasts start and end the same civil day, so normally match
 * one week. Tisha B'Av starts at sunset the evening before and ends the
 * following night at shkiya+19 — if those two evenings land in different
 * weeks, this returns it for both weeks' calls (never picks just one; see
 * #068). Scans `sunday` through `sunday + 7` inclusive: enough to catch
 * every case where a fast's start or end day falls in `[sunday, sunday+6]`.
 */
function getComputedTaanisRows(sunday: CivilDate): ComputedTaanisRow[] {
	const weekEnd = addDays(sunday, 6);
	const inWeek = (d: CivilDate) => civilTime(d) >= civilTime(sunday) && civilTime(d) <= civilTime(weekEnd);

	const rows: ComputedTaanisRow[] = [];
	for (let i = 0; i <= 7; i++) {
		const day = addDays(sunday, i);
		const desc = taanisOnDay(day);
		if (!desc) continue;

		const isTishaBav = desc.startsWith("Tish'a B'Av");
		const startDay = isTishaBav ? addDays(day, -1) : day;
		const endDay = day;
		const startInWeek = inWeek(startDay);
		const endInWeek = inWeek(endDay);
		if (!startInWeek && !endInWeek) continue;

		const zStart = new Zmanim(LOCATION, anchor(startDay), false);
		const zEnd = new Zmanim(LOCATION, anchor(endDay), false);
		const startTime = fmtTime(minutesOf(isTishaBav ? zStart.sunset() : zStart.alotHaShachar()));
		const endTime = fmtTime(minutesOf(zEnd.sunsetOffset(TAANIS_END_AFTER_SHKIYA, true)));

		rows.push({
			name: TAANIS_DISPLAY_NAME[desc],
			startTime,
			startDayLabel: DAY_NAMES[dayOfWeek(startDay)],
			startDateLabel: weekdayDateFmt.format(anchor(startDay)),
			startInWeek,
			endTime,
			endDayLabel: DAY_NAMES[dayOfWeek(endDay)],
			endDateLabel: weekdayDateFmt.format(anchor(endDay)),
			endInWeek,
		});
	}
	return rows;
}

/** Joins day-of-week indices (0=Sun) into "Sun – Wed" style ranges, e.g. [1,2,3,4] → "Mon – Thu". */
function formatDaySpec(indices: number[]): string {
	const ranges: number[][] = [];
	for (const i of indices) {
		const last = ranges[ranges.length - 1];
		if (last && i === last[last.length - 1] + 1) last.push(i);
		else ranges.push([i]);
	}
	return ranges
		.map((r) => (r.length > 1 ? `${DAY_NAMES[r[0]]} – ${DAY_NAMES[r[r.length - 1]]}` : DAY_NAMES[r[0]]))
		.join(", ");
}

/**
 * Compute the weekday minyan schedule for the week containing `now`
 * (Friday/Shabbos roll to the coming week). Pure and deterministic.
 */
export function getComputedWeekdaySchedule(now: Date = new Date()): ComputedWeekdaySchedule {
	const sunday = scheduleSunday(civilDateOf(now));

	// A Yom Tov day has no fixed weekday Shacharis/Mincha/Maariv at all (see
	// isChag) — drop it from every regular-day list below, the same way a
	// week's Taanis or Selichos rows already only cover their own days.
	// Shacharis also runs Friday; Mincha/Maariv only Sun–Thu (Friday's covered
	// by the separate Erev Shabbos schedule).
	const shacharisDays = [0, 1, 2, 3, 4, 5].filter((i) => !isChag(addDays(sunday, i)));
	const minchaMaarivDays = [0, 1, 2, 3, 4].filter((i) => !isChag(addDays(sunday, i)));

	// Mincha/Maariv aggregate the most restrictive *actually-in-session* day
	// so one posted time is valid every day it runs (early minyanim can't
	// precede their zman on any of those days, shkiya-anchored ones can't run
	// late on any of them).
	let latestMinchaGedola = 0;
	let earliestShkiya = Infinity;
	let latestShkiya = 0;
	for (const i of minchaMaarivDays) {
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

	const shacharisDaySpec = formatDaySpec(shacharisDays);
	for (const t of SHACHARIS) rows.push({ service: "Shacharis", daySpec: shacharisDaySpec, time: fmtTime(t) });
	// Scan the same in-session days for Rosh Chodesh (never coincides with a
	// Yom Tov day itself — Rosh Chodesh Tishrei is Rosh Hashana, already
	// excluded by isRoshChodesh's month check).
	const roshChodeshDays = shacharisDays
		.map((i) => addDays(sunday, i))
		.filter(isRoshChodesh)
		.map((c) => DAY_NAMES[dayOfWeek(c)]);
	if (roshChodeshDays.length > 0) {
		const spec = `Rosh Chodesh (${roshChodeshDays.join(" & ")})`;
		for (const t of SHACHARIS_ROSH_CHODESH) rows.push({ service: "Shacharis", daySpec: spec, time: fmtTime(t) });
	}

	// Selichos (see #067, amended #071): a regular bucket per offset (Elul vs
	// Aseres Yemei Teshuva — almost always just one, but a week straddling
	// Rosh Hashana mid-week can have in-season days on both sides, each at
	// its own offset) for whichever Sun–Fri days of this week fall in season,
	// plus one-off rows for erev Rosh Hashana / erev Yom Kippur if either
	// lands in this week. Assumes no in-season day is also Rosh Chodesh (only
	// Rosh Chodesh Tishrei — Rosh Hashana itself — falls anywhere near the
	// season, and it's excluded).
	// Rows are collected keyed by their earliest day-of-week, then pushed in
	// that order — a later-in-the-week special day (e.g. Fri) must render
	// after an earlier regular bucket (e.g. Mon–Thu), not before it.
	const selichosWindowsThisWeek = selichosWindows(sunday);
	const selichosRegularDaysByOffset = new Map<number, number[]>();
	const selichosBuckets: { sortKey: number; daySpec: string; offset: number }[] = [];
	for (let i = 0; i <= 5; i++) {
		const day = addDays(sunday, i);
		const info = selichosInfoFor(day, selichosWindowsThisWeek);
		if (!info) continue;
		if (info.label) {
			selichosBuckets.push({ sortKey: i, daySpec: `${info.label} (${DAY_NAMES[i]})`, offset: info.offset });
		} else {
			const days = selichosRegularDaysByOffset.get(info.offset) ?? [];
			days.push(i);
			selichosRegularDaysByOffset.set(info.offset, days);
		}
	}
	for (const [offset, days] of selichosRegularDaysByOffset) {
		selichosBuckets.push({ sortKey: days[0], daySpec: formatDaySpec(days), offset });
	}
	selichosBuckets.sort((a, b) => a.sortKey - b.sortKey);
	for (const bucket of selichosBuckets) {
		for (const t of SHACHARIS) rows.push({ service: "Selichos", daySpec: bucket.daySpec, time: fmtTime(t - bucket.offset) });
	}

	const minchaMaarivDaySpec = formatDaySpec(minchaMaarivDays);
	rows.push({ service: "Mincha", daySpec: minchaMaarivDaySpec, time: fmtTime(earlyMincha) });
	if (lateMincha > FIXED_MINCHA_CUTOFF) rows.push({ service: "Mincha", daySpec: minchaMaarivDaySpec, time: fmtTime(FIXED_MINCHA) });
	rows.push({ service: "Mincha", daySpec: minchaMaarivDaySpec, time: fmtTime(lateMincha) });

	rows.push({ service: "Maariv", daySpec: minchaMaarivDaySpec, time: fmtTime(shkiyaMaariv) });
	if (shkiyaMaariv < FIXED_MAARIV) rows.push({ service: "Maariv", daySpec: minchaMaarivDaySpec, time: fmtTime(FIXED_MAARIV) });

	const weekOf = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", day: "numeric" }).format(anchor(sunday));
	const pad = (n: number) => String(n).padStart(2, "0");
	const weekStartISO = `${sunday.y}-${pad(sunday.m)}-${pad(sunday.d)}`;

	return { weekOf, weekStartISO, rows, taanis: getComputedTaanisRows(sunday) };
}

// ─────────────────────────── Shabbos ───────────────────────────

export interface ComputedShabbosRow {
	label: string;
	time: string;
	notes?: string;
}

export interface ComputedShabbosSchedule {
	/** e.g. "Matos–Masei"; empty when the Shabbos reading is a Yom Tov's. */
	parsha: string;
	/** e.g. "July 10–11" (erev Shabbos – Shabbos day). */
	dateLabel: string;
	/** ISO date (Jerusalem) of erev Shabbos — for tooling. */
	erevShabbosISO: string;
	fridayRows: ComputedShabbosRow[];
	dayRows: ComputedShabbosRow[];
}

const offsetFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" });

/** Israel summer clock (IDT, GMT+3) in effect on this civil day's afternoon. */
function isSummerClock(c: CivilDate): boolean {
	const zone = offsetFmt.formatToParts(anchor(c)).find((p) => p.type === "timeZoneName")?.value;
	return zone === "GMT+3";
}

/** Minutes since local midnight of an instant, nearest minute (hebcal-style rounding). */
function minutesOf(instant: Date): number {
	return Math.round(secondsOfDay(instant) / 60);
}

/**
 * Compute the schedule for the upcoming Shabbos (the one closing the same
 * schedule week as `getComputedWeekdaySchedule` — so the page rolls to the
 * next Shabbos on Motzei Shabbos, together with the weekday table).
 */
export function getComputedShabbosSchedule(now: Date = new Date()): ComputedShabbosSchedule {
	const friday = addDays(scheduleSunday(civilDateOf(now)), 5);
	const shabbos = addDays(friday, 1);

	// Hadlakas neiros: sea-level shkiya − 20, rounded to the nearest minute.
	// Not hebcal's 18-min default — 20 is what the printed luach uses,
	// confirmed across 10+ weeks of dates (#066).
	const zFri = new Zmanim(LOCATION, anchor(friday), false);
	const candles = minutesOf(zFri.sunsetOffset(-CANDLES_BEFORE_SHKIYA, true));
	// Mincha & Kabbalos Shabbos flips with the clock change: 10 min before
	// hadlakas neiros on the summer clock, 10 after on the winter clock.
	const erevMincha = candles + (isSummerClock(friday) ? -EREV_MINCHA_VS_CANDLES : EREV_MINCHA_VS_CANDLES);

	// Chronological: mincha precedes candles in summer, follows them in winter.
	const fridayRows: ComputedShabbosRow[] = [
		{ minutes: erevMincha, label: "Mincha & Kabbalos Shabbos" },
		{ minutes: candles, label: "Hadlakas Neiros" },
	]
		.sort((a, b) => a.minutes - b.minutes)
		.map(({ label, minutes }) => ({ label, time: fmtTime(minutes) }));

	const zSat = new Zmanim(LOCATION, anchor(shabbos), false);
	const mincha = candles - SHABBOS_MINCHA_BEFORE_CANDLES;
	const maariv = minutesOf(zSat.tzeit(TZEIS_ANGLE));

	const dayRows: ComputedShabbosRow[] = [
		...SHABBOS_MORNING.map(({ label, minutes }) => ({ label, time: fmtTime(minutes) })),
		{ label: "Beis Medrash & Shiur", time: fmtTime(mincha - BEIS_MEDRASH_BEFORE_MINCHA) },
		{ label: "Mincha", time: fmtTime(mincha) },
		{ label: "Maariv", time: fmtTime(maariv) },
	];

	const hd = new HDate(anchor(shabbos));
	const reading = new Sedra(hd.getFullYear(), true).lookup(hd);
	const parsha = reading.chag
		? ""
		: reading.parsha.map((name) => Locale.gettext(name, "ashkenazi")).join("–");

	const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", day: "numeric" });
	const friLabel = dayFmt.format(anchor(friday));
	const satLabel = dayFmt.format(anchor(shabbos));
	const dateLabel =
		friday.m === shabbos.m ? `${friLabel}–${shabbos.d}` : `${friLabel} – ${satLabel}`;

	const pad = (n: number) => String(n).padStart(2, "0");
	return {
		parsha,
		dateLabel,
		erevShabbosISO: `${friday.y}-${pad(friday.m)}-${pad(friday.d)}`,
		fridayRows,
		dayRows,
	};
}
