import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "HomePage";

export interface HomepageContent {
	heroEyebrow?: string;
	heroTitle?: string;
	heroSubtitle?: string;
	// Legacy — the hero background now lives in the HeroMedia collection (single
	// source of truth). heroImage/heroImageUrl are no longer read by the hero.
	// Kept for back-compat like heroTitle. See design-log/030.
	heroImage?: string;
	heroImageUrl?: string;
	heroPrimaryCtaLabel?: string;
	heroPrimaryCtaHref?: string;
	heroSecondaryCtaLabel?: string;
	heroSecondaryCtaHref?: string;

	// The two stacked "image + text" bands on the homepage. Named by position
	// (Section 1 = first, Section 2 = second), NOT by their current content, so
	// the office can repurpose what each band is about without the field names
	// lying. Renamed from uniqueImpactful*/torahVision* — see design-log/019.
	imageTextSection1EyebrowLead?: string;
	imageTextSection1EyebrowGold?: string;
	imageTextSection1EyebrowNavy?: string;
	imageTextSection1TitleLine1?: string;
	imageTextSection1TitleLine2?: string;
	imageTextSection1Body?: string;
	imageTextSection1Image?: string;
	imageTextSection1ImageUrl?: string;
	imageTextSection1ImageOn?: string;
	imageTextSection1AccentLine?: string;

	imageTextSection2EyebrowLead?: string;
	imageTextSection2EyebrowGold?: string;
	imageTextSection2EyebrowNavy?: string;
	imageTextSection2TitleLine1?: string;
	imageTextSection2TitleLine2?: string;
	imageTextSection2Body?: string;
	imageTextSection2Image?: string;
	imageTextSection2ImageUrl?: string;
	imageTextSection2ImageOn?: string;
	imageTextSection2AccentLine?: string;

	whoWeAreTitle?: string;
	whoWeAreHebrew?: string;

	joinUsCard1Title?: string;
	joinUsCard1Subtitle?: string;
	joinUsCard1Href?: string;
	joinUsCard1Icon?: string;
	joinUsCard1Image?: string;
	joinUsCard1ImageUrl?: string;

	joinUsCard2Title?: string;
	joinUsCard2Subtitle?: string;
	joinUsCard2Href?: string;
	joinUsCard2Icon?: string;
	joinUsCard2Image?: string;
	joinUsCard2ImageUrl?: string;

	joinUsCard3Title?: string;
	joinUsCard3Subtitle?: string;
	joinUsCard3Href?: string;
	joinUsCard3Icon?: string;
	joinUsCard3Image?: string;
	joinUsCard3ImageUrl?: string;

	// "On WhatsApp" closing band — header copy + three subchat slots. Flat fields
	// (capped at 3 subchats) mirroring the Join Us card pattern. See design-log/032.
	whatsappEyebrow?: string;
	whatsappTitleLead?: string;
	whatsappTitleAccent?: string;
	whatsappTitleTrail?: string;
	whatsappBody?: string;
	whatsappJoinLabel?: string;
	whatsappJoinHref?: string;
	whatsappMembersNote?: string;

	whatsappShort1ChatName?: string;
	whatsappShort1Description?: string;
	whatsappShort1VideoId?: string;
	whatsappShort1JoinHref?: string;
	whatsappShort1Image?: string;
	whatsappShort1ImageUrl?: string;

	whatsappShort2ChatName?: string;
	whatsappShort2Description?: string;
	whatsappShort2VideoId?: string;
	whatsappShort2JoinHref?: string;
	whatsappShort2Image?: string;
	whatsappShort2ImageUrl?: string;

	whatsappShort3ChatName?: string;
	whatsappShort3Description?: string;
	whatsappShort3VideoId?: string;
	whatsappShort3JoinHref?: string;
	whatsappShort3Image?: string;
	whatsappShort3ImageUrl?: string;
}

/**
 * Normalize a CMS "image side" value to "left" | "right".
 * Forgiving on purpose — a content editor might type "Left", "RIGHT", " left ".
 * Anything unrecognized falls back to the section's hardcoded default.
 */
export function normalizeImageOn(
	value: string | undefined,
	fallback: "left" | "right",
): "left" | "right" {
	const v = value?.trim().toLowerCase();
	if (v === "left" || v === "right") return v;
	return fallback;
}

/**
 * Normalize a CMS "accent line" value to "line1" | "line2".
 * Accepts the techy form ("line1"/"line2") and friendlier forms
 * ("1"/"2", "first"/"second", "top"/"bottom"). Unrecognized → fallback.
 */
export function normalizeAccentLine(
	value: string | undefined,
	fallback: "line1" | "line2",
): "line1" | "line2" {
	const v = value?.trim().toLowerCase();
	if (v === "line1" || v === "1" || v === "first" || v === "top") return "line1";
	if (v === "line2" || v === "2" || v === "second" || v === "bottom") return "line2";
	return fallback;
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
			imageTextSection1ImageUrl: resolveImage(row.imageTextSection1Image, 1000, 750),
			imageTextSection2ImageUrl: resolveImage(row.imageTextSection2Image, 1000, 750),
				joinUsCard1ImageUrl: resolveImage(row.joinUsCard1Image, 800, 1000),
				joinUsCard2ImageUrl: resolveImage(row.joinUsCard2Image, 800, 1000),
				joinUsCard3ImageUrl: resolveImage(row.joinUsCard3Image, 800, 1000),
				whatsappShort1ImageUrl: resolveImage(row.whatsappShort1Image, 720, 1280),
				whatsappShort2ImageUrl: resolveImage(row.whatsappShort2Image, 720, 1280),
				whatsappShort3ImageUrl: resolveImage(row.whatsappShort3Image, 720, 1280),
		};
	} catch (err) {
		console.error(`[homepage] query failed:`, err);
		return null;
	}
}
