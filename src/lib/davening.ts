import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";

const COLLECTION_ID = "DaveningTimes";

export type DayType = "Weekday" | "Shabbat";

export interface DaveningTime {
	_id: string;
	service: string;
	dayType: DayType;
	time: string;
	notes?: string;
	sortOrder?: number;
	active?: boolean;
}

export async function getDaveningTimes(dayType?: DayType): Promise<DaveningTime[]> {
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

export async function getDaveningByDayType(): Promise<Record<DayType, DaveningTime[]>> {
	const all = await getDaveningTimes();
	const grouped: Record<DayType, DaveningTime[]> = { Weekday: [], Shabbat: [] };
	for (const t of all) {
		if (t.dayType === "Weekday" || t.dayType === "Shabbat") {
			grouped[t.dayType].push(t);
		}
	}
	return grouped;
}
