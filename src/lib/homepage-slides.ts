import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "HomepageSlides";

export interface HomepageSlide {
	_id: string;
	image?: string;
	imageUrl?: string;
	title?: string;
	caption?: string;
	sortOrder?: number;
	active?: boolean;
}

function resolveImage(wixImageUrl?: string, w = 1600, h = 900): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFillImageUrl(wixImageUrl, w, h, {});
	} catch {
		return undefined;
	}
}

export async function getHomepageSlides(): Promise<HomepageSlide[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(50)
			.find();

		return (results as HomepageSlide[]).map((s) => ({
			...s,
			imageUrl: resolveImage(s.image),
		}));
	} catch (err) {
		console.error(`[homepage-slides] query failed:`, err);
		return [];
	}
}
