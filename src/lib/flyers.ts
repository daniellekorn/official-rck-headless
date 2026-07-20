import { items, auth } from "./wix-cms-admin";

const COLLECTION_ID = "Flyers";

export type FlyerCategory = "schedules" | "learning" | "youth" | "events";

export interface Flyer {
	_id: string;
	title: string;
	category: FlyerCategory;
	/**
	 * Tags field in the CMS — always an array, always lowercase (normalized on read, so
	 * "Daily" and "daily" in the CMS are one tag). Templates re-capitalize for display.
	 */
	subCategory?: string[];
	pdfUrl?: string;
	imageUrl?: string;
	isActive?: boolean;
	displayOrder?: number;
	removeAfter?: Date | string;
}

/** Today's date as YYYY-MM-DD in Israel time, regardless of where the server runs. */
function israelDateStr(d: Date): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jerusalem",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(d);
}

/**
 * A flyer is expired once the day *after* its `removeAfter` date has begun (Israel time).
 * So a flyer set to remove after June 2 still shows all of June 2 and disappears June 3.
 * Empty `removeAfter` = never expires. An unparseable value is treated as never-expires
 * (fail open) so a bad date hides nothing silently.
 */
function isExpired(removeAfter: Flyer["removeAfter"], now: Date): boolean {
	if (!removeAfter) return false;
	const date = removeAfter instanceof Date ? removeAfter : new Date(removeAfter);
	if (Number.isNaN(date.getTime())) return false;
	return israelDateStr(date) < israelDateStr(now);
}

export async function getFlyers(category?: FlyerCategory, subCategory?: string): Promise<Flyer[]> {
	try {
		const elevated = auth.elevate(items.query);
		let q = elevated(COLLECTION_ID).eq("isActive", true).ascending("displayOrder").limit(100);
		if (category) q = q.eq("category", category);
		const { items: results } = await q.find();
		const now = new Date();
		// The subCategory filter runs in memory (not in the query) so it can be
		// case-insensitive — the DB's hasSome is not, and office-entered tags mix case.
		const wanted = subCategory?.toLowerCase();
		return (results as Flyer[])
			.filter((f) => !isExpired(f.removeAfter, now))
			.map((f) => ({ ...f, subCategory: normalizeTags(f.subCategory) }))
			.filter((f) => !wanted || f.subCategory?.includes(wanted));
	} catch (err) {
		console.error(`[flyers] query failed:`, err);
		return [];
	}
}

/**
 * Tags come back lowercased, trimmed, and deduped, so identity is case-insensitive
 * everywhere downstream. Rows saved before the field became Tags may hold a plain
 * string; empty stays undefined so templates can use simple truthiness guards.
 */
function normalizeTags(value: unknown): string[] | undefined {
	const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
	const tags = [
		...new Set(
			raw
				.filter((t): t is string => typeof t === "string")
				.map((t) => t.trim().toLowerCase())
				.filter(Boolean),
		),
	];
	return tags.length > 0 ? tags : undefined;
}

export function uniqueSubCategories(flyers: Flyer[]): string[] {
	return [...new Set(flyers.flatMap((f) => f.subCategory ?? []))].sort();
}

/**
 * Descriptive alt text for specific flyers, keyed by their exact CMS title
 * (including quirks like "." instead of ":" and Hebrew suffixes — these must
 * match the Flyers collection's title field verbatim). Titles not listed here
 * fall back to the caller's default.
 */
const FLYER_ALT_TEXT: Record<string, string> = {
	"TGIF Shiur & Breakfast":
		"TGIF Shiur & Breakfast flyer — men's Halacha shiur with breakfast, Friday mornings, Ra'anana",
	"Beyond the Surface. Penimiyus HaTorah":
		"Beyond the Surface: Penimiyus HaTorah flyer — men's shiur on Chassidus and Torah's inner dimension, Thursday nights, Ra'anana",
	"Daf Yomi with Rabbi Horwitz":
		"Daf Yomi with Rabbi Horwitz flyer — Daf Yomi shiur, Sunday–Thursday nights, with RCK founder Rabbi Dovid Horwitz, Ra'anana",
	"Daf Yomi with Rav Rabi":
		"Daf Yomi with Rav Rabi flyer — English Daf Yomi shiur, daily mornings, with Rav Aharon Rabi, Ra'anana",
	"Dor L'Dor for Boys":
		"Dor L'Dor for Boys flyer — father-son Torah learning night, Motzei Shabbos, Ra'anana",
	"Dor L'Dor for Girls":
		"Dor L'Dor for Girls flyer — mother-daughter Torah learning night, Motzei Shabbos, with Mrs. Devora Cornick, Ra'anana",
	"Foundations. Gemara B'iyun":
		"Foundations: Gemara B'iyun flyer — in-depth Gemara shiur, Sunday and Tuesday mornings, Ra'anana",
	"Kitzur Shulchan Aruch Yomi":
		"Kitzur Shulchan Aruch Yomi flyer — daily halacha shiur, mornings, with Rabbi Yisroel Zaslow, Ra'anana",
	"Learn & Grow Chaburos for Kids":
		"Learn & Grow Chaburos for Kids flyer — weekly Torah chaburos for boys grades 1–6, Sun/Mon/Wed afternoons, with Rav Avraham Aharon Mandelbaum, Ra'anana",
	"Living Inspired for Men":
		"Living Inspired for Men flyer — men's mussar shiur, Monday nights, with Rabbi Isaac Bernstein, Ra'anana",
	"Living Inspired for Women":
		"Living Inspired for Women flyer — women's mussar shiur, Tuesday nights, Ra'anana",
	"Matmonim":
		"Matmonim flyer — Gemara, Daf Yomi, and machshava shiur, daily mornings, Ra'anana",
	"Mishna Yomi":
		"Mishna Yomi flyer — daily Mishna shiur, mornings, with Rav Itamar Gibli, Ra'anana",
	"Night Seder Program":
		"Night Seder Program flyer — men's Halacha and Gemara night seder, Sunday nights, Ra'anana",
	"Practical Halacha for Women":
		"Practical Halacha for Women flyer — women's halacha shiur, Monday nights, Ra'anana",
	"Thursday Night Learning לימוד ליל שישי":
		"Thursday Night Learning flyer — men's mishmar-style learning covering Daf Yomi, Halacha, Parsha, and Chassidus, Thursday nights, Ra'anana",
	"Women's Parsha Shiur":
		"Women's Parsha Shiur flyer — women's Torah portion shiur, Tuesday mornings, Ra'anana",
	"דף יומי עם רב מרגי":
		"Daf Yomi shiur flyer — daily morning Daf Yomi, Ra'anana",
	"הלכות ברכות":
		"Hilchos Brachos shiur flyer — halacha shiur on the laws of blessings, Tuesday/Wednesday mornings, Ra'anana",
	"לימוד סדר ערב":
		"Night seder learning flyer — evening Torah learning, Sunday nights, Ra'anana",
	"Community Schedule": "RCK's weekly minyan and shiur schedule, Ra'anana",
	"Daf Yomi Schedule": "RCK's Daf Yomi shiur schedule, Ra'anana",
};

/** Looks up descriptive alt text for a flyer by its exact title, falling back to `fallback` if unmatched. */
export function flyerAlt(title: string | undefined, fallback: string): string {
	if (!title) return fallback;
	return FLYER_ALT_TEXT[title] ?? fallback;
}
