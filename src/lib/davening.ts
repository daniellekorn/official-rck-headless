import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";

const COLLECTION_ID = "DaveningTimes";

export type DayType = "Weekday" | "Shabbat";

export interface DaveningTime {
	_id: string;
	service: string;
	dayType: DayType;
	daySpec?: string;
	time: string;
	notes?: string;
	sortOrder?: number;
	active?: boolean;
}

/**
 * A service (Shacharis / Mincha / Maariv) together with its rows for one day-type.
 * Page renders one card per (dayType, service) pair, with `rows` as the variants.
 */
export interface ServiceGroup {
	service: string;
	rows: DaveningTime[];
}

async function getDaveningTimes(dayType?: DayType): Promise<DaveningTime[]> {
	try {
		const elevated = auth.elevate(items.query);
		let q = elevated(COLLECTION_ID).eq("active", true).ascending("sortOrder").limit(200);
		if (dayType) q = q.eq("dayType", dayType);
		const { items: results } = await q.find();
		return results as DaveningTime[];
	} catch (err) {
		console.error(`[davening] query failed:`, err);
		return [];
	}
}

/**
 * Stable display order for services. Anything not in this list goes to the
 * bottom in the order it first appears.
 */
const SERVICE_ORDER = ["Shacharis", "Mincha", "Maariv", "Selichos"] as const;
const serviceRank = (s: string) => {
	const i = SERVICE_ORDER.indexOf(s as (typeof SERVICE_ORDER)[number]);
	return i === -1 ? SERVICE_ORDER.length : i;
};

/**
 * Group rows by (dayType, service) and return one ServiceGroup per pairing,
 * sorted in the canonical Shacharis → Mincha → Maariv order. Rows inside
 * each group are kept in their query order (sortOrder ascending).
 */
export async function getDaveningGrouped(): Promise<Record<DayType, ServiceGroup[]>> {
	const all = await getDaveningTimes();
	const grouped: Record<DayType, ServiceGroup[]> = { Weekday: [], Shabbat: [] };

	for (const dayType of ["Weekday", "Shabbat"] as DayType[]) {
		const rows = all.filter((t) => t.dayType === dayType);
		const byService = new Map<string, DaveningTime[]>();
		for (const row of rows) {
			const arr = byService.get(row.service) ?? [];
			arr.push(row);
			byService.set(row.service, arr);
		}
		grouped[dayType] = Array.from(byService.entries())
			.map(([service, rows]) => ({ service, rows }))
			.sort((a, b) => serviceRank(a.service) - serviceRank(b.service));
	}

	return grouped;
}
