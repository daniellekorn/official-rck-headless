import { items, auth } from "./wix-cms-admin";
import { resolveImage } from "./wix-media";

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
			imageUrl: resolveImage(entry.image),
		}));
	} catch (err) {
		console.error(`[history] query failed:`, err);
		return [];
	}
}
