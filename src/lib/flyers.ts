import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";

const COLLECTION_ID = "Flyers";

export type FlyerCategory = "schedules" | "learning" | "youth" | "events";

export interface Flyer {
	_id: string;
	title: string;
	category: FlyerCategory;
	subCategory?: string;
	embedUrl?: string;
	pdfUrl?: string;
	isActive?: boolean;
	displayOrder?: number;
}

export async function getFlyers(category?: FlyerCategory, subCategory?: string): Promise<Flyer[]> {
	try {
		const elevated = auth.elevate(items.query);
		let q = elevated(COLLECTION_ID).eq("isActive", true).ascending("displayOrder").limit(100);
		if (category) q = q.eq("category", category);
		if (subCategory) q = q.eq("subCategory", subCategory);
		const { items: results } = await q.find();
		return results as Flyer[];
	} catch (err) {
		console.error(`[flyers] query failed:`, err);
		return [];
	}
}

export async function getFlyersByCategory(): Promise<Record<FlyerCategory, Flyer[]>> {
	const all = await getFlyers();
	const grouped: Record<FlyerCategory, Flyer[]> = {
		schedules: [],
		learning: [],
		youth: [],
		events: [],
	};
	for (const flyer of all) {
		if (flyer.category in grouped) {
			grouped[flyer.category].push(flyer);
		}
	}
	return grouped;
}

export function uniqueSubCategories(flyers: Flyer[]): string[] {
	return [...new Set(flyers.map((f) => f.subCategory).filter((s): s is string => Boolean(s)))].sort();
}
