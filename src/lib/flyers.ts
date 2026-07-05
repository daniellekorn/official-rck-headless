import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";

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
