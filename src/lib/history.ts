import { items, auth } from "./wix-cms-admin";
import { resolveImageFit } from "./wix-media";

const COLLECTION_ID = "OurHistory";

export interface HistoryEntry {
	_id: string;
	image?: string;
	imageUrl?: string;
	title?: string;
	caption?: string;
	/** Hebrew accent line shown in the card's top-right corner (was `year` — see design-log #043). */
	hebrew?: string;
	sortOrder?: number;
	active?: boolean;
}

export async function getHistory(): Promise<HistoryEntry[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(50)
			.find();

		return (results as HistoryEntry[]).map((entry) => ({
			...entry,
			// `fit` (not `fill`): HistoryTimeline's img box is bounded by
			// max-width/max-height + object-fit: contain specifically so photos
			// render uncropped at their own aspect ratio — `resolveImage`'s
			// forced 4:3 fill crop was cutting the sides off wide/panorama
			// milestone photos (e.g. "Today and Onward") before they ever
			// reached that box.
			imageUrl: resolveImageFit(entry.image, 1200, 900),
		}));
	} catch (err) {
		console.error(`[history] query failed:`, err);
		return [];
	}
}
