import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "HomePage";

export interface HomepageContent {
	heroEyebrow?: string;
	heroTitle?: string;
	heroSubtitle?: string;
	heroImage?: string;
	heroImageUrl?: string;
	heroPrimaryCtaLabel?: string;
	heroPrimaryCtaHref?: string;
	heroSecondaryCtaLabel?: string;
	heroSecondaryCtaHref?: string;

	uniqueImpactfulEyebrowGold?: string;
	uniqueImpactfulEyebrowNavy?: string;
	uniqueImpactfulTitleLine1?: string;
	uniqueImpactfulTitleLine2?: string;
	uniqueImpactfulBody?: string;
	uniqueImpactfulImage?: string;
	uniqueImpactfulImageUrl?: string;

	torahVisionEyebrowGold?: string;
	torahVisionEyebrowNavy?: string;
	torahVisionTitleLine1?: string;
	torahVisionTitleLine2?: string;
	torahVisionBody?: string;
	torahVisionImage?: string;
	torahVisionImageUrl?: string;

	whoWeAreTitle?: string;
	whoWeAreHebrew?: string;
	whoWeAreBody?: string;

	joinUsCard1Title?: string;
	joinUsCard1Subtitle?: string;
	joinUsCard1Href?: string;
	joinUsCard1Icon?: string;

	joinUsCard2Title?: string;
	joinUsCard2Subtitle?: string;
	joinUsCard2Href?: string;
	joinUsCard2Icon?: string;

	joinUsCard3Title?: string;
	joinUsCard3Subtitle?: string;
	joinUsCard3Href?: string;
	joinUsCard3Icon?: string;
}

function resolveImage(wixImageUrl?: string, w = 1600, h = 1000): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFillImageUrl(wixImageUrl, w, h, {});
	} catch {
		return undefined;
	}
}

export async function getHomepage(): Promise<HomepageContent | null> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID).limit(1).find();
		const row = results[0] as HomepageContent | undefined;
		if (!row) return null;

		return {
			...row,
			heroImageUrl: resolveImage(row.heroImage, 1920, 1200),
			uniqueImpactfulImageUrl: resolveImage(row.uniqueImpactfulImage, 1000, 750),
			torahVisionImageUrl: resolveImage(row.torahVisionImage, 1000, 750),
		};
	} catch (err) {
		console.error(`[homepage] query failed:`, err);
		return null;
	}
}
