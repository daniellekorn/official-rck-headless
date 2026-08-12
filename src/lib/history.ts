import { items, auth } from "./wix-cms-admin";
import { resolveImage, resolveImageFitManual } from "./wix-media";

const COLLECTION_ID = "OurHistory";

/**
 * The "Today and Onward" milestone photo is a wide panorama (4000x1848,
 * ~2.16:1) — resolveImage's centered 4:3-ish fill crop cuts the people at
 * both edges off. Every other milestone photo renders fine with the normal
 * fill crop, so this scales down (not crops) just this one image, matched
 * by its stable Wix media file ID — not a change to resolveImage itself,
 * which broke every row the last time this was attempted (see git history).
 */
const SCALE_TO_FIT_PHOTO_IDS = ["f477b1_473aba46a21c4b959dadcd9fa1c9ade1"];

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
			imageUrl: SCALE_TO_FIT_PHOTO_IDS.some((id) => entry.image?.includes(id))
				? resolveImageFitManual(entry.image, 1200, 900)
				: resolveImage(entry.image),
		}));
	} catch (err) {
		console.error(`[history] query failed:`, err);
		return [];
	}
}
