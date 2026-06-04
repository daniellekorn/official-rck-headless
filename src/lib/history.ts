import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "OurHistory";

export interface HistoryEntry {
	_id: string;
	image?: string;
	imageUrl?: string;
	title?: string;
	caption?: string;
	year?: number;
	sortOrder?: number;
	active?: boolean;
}

function resolveImage(wixImageUrl?: string, w = 1200, h = 900): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFillImageUrl(wixImageUrl, w, h, {});
	} catch {
		return undefined;
	}
}

export async function getHistory(): Promise<HistoryEntry[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("year")
			.ascending("sortOrder")
			.limit(50)
			.find();

		return (results as HistoryEntry[]).map((entry) => ({
			...entry,
			imageUrl: resolveImage(entry.image),
		}));
	} catch (err) {
		console.error(`[history] query failed:`, err);
		return [];
	}
}
