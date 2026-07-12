import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { resolveImage } from "./wix-media";

const COLLECTION_ID = "HomePage";

export interface HomepageContent {
	heroEyebrow?: string;
	heroTitle?: string;
	heroSubtitle?: string;
	// Legacy — the hero background now lives in the HeroMedia collection (single
	// source of truth). heroImage is no longer read by the hero; the CMS field
	// remains but nothing resolves or renders it. See design-log/030.
	heroImage?: string;
	heroPrimaryCtaLabel?: string;
	heroPrimaryCtaHref?: string;
	heroSecondaryCtaLabel?: string;
	heroSecondaryCtaHref?: string;

	// Impact stats band, between the hero and the first content section (see
	// design-log/051). Five number+label pairs, in display order. A value can
	// be a real countable number ("27+", "1,000" — animates counting up from
	// zero on scroll) or plain text with no digits ("HUNDREDS" — shown as-is,
	// nothing to count).
	statNumber1?: string;
	statLabel1?: string;
	statNumber2?: string;
	statLabel2?: string;
	statNumber3?: string;
	statLabel3?: string;
	statNumber4?: string;
	statLabel4?: string;
	statNumber5?: string;
	statLabel5?: string;

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

	// WhatsApp community band — header copy only. The chat groups and featured
	// video tiles moved to the `WhatsappGroups` collection (see design-log/044);
	// the old whatsappEyebrow, whatsappChatList and whatsappShort1–4 flat fields
	// are retired.
	whatsappTitleLead?: string;
	whatsappTitleAccent?: string;
	whatsappTitleTrail?: string;
	whatsappBody?: string;
	whatsappJoinLabel?: string;
	whatsappJoinHref?: string;
	whatsappMembersNote?: string;
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

export async function getHomepage(): Promise<HomepageContent | null> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID).limit(1).find();
		const row = results[0] as HomepageContent | undefined;
		if (!row) return null;

		return {
			...row,
			imageTextSection1ImageUrl: resolveImage(row.imageTextSection1Image, 1000, 750),
			imageTextSection2ImageUrl: resolveImage(row.imageTextSection2Image, 1000, 750),
			joinUsCard1ImageUrl: resolveImage(row.joinUsCard1Image, 800, 1000),
			joinUsCard2ImageUrl: resolveImage(row.joinUsCard2Image, 800, 1000),
			joinUsCard3ImageUrl: resolveImage(row.joinUsCard3Image, 800, 1000),
		};
	} catch (err) {
		console.error(`[homepage] query failed:`, err);
		return null;
	}
}
