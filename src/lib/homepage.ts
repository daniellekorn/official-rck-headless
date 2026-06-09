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

	// The two stacked "image + text" bands on the homepage. Named by position
	// (Section 1 = first, Section 2 = second), NOT by their current content, so
	// the office can repurpose what each band is about without the field names
	// lying. Renamed from uniqueImpactful*/torahVision* — see design-log/019.
	imageTextSection1EyebrowGold?: string;
	imageTextSection1EyebrowNavy?: string;
	imageTextSection1TitleLine1?: string;
	imageTextSection1TitleLine2?: string;
	imageTextSection1Body?: string;
	imageTextSection1Image?: string;
	imageTextSection1ImageUrl?: string;
	imageTextSection1ImageOn?: string;
	imageTextSection1AccentLine?: string;

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
		const row = results[0] as Record<string, unknown> | undefined;
		if (!row) return null;

		// Read the new generic keys, falling back to the legacy keys
		// (uniqueImpactful*/torahVision*) so nothing breaks during the window
		// before the old fields are deleted. See design-log/019.
		const pick = (next: string, legacy: string): string | undefined =>
			(row[next] as string | undefined) ?? (row[legacy] as string | undefined);

		return {
			...(row as HomepageContent),
			heroImageUrl: resolveImage(row.heroImage as string | undefined, 1920, 1200),

			imageTextSection1EyebrowGold: pick("imageTextSection1EyebrowGold", "uniqueImpactfulEyebrowGold"),
			imageTextSection1EyebrowNavy: pick("imageTextSection1EyebrowNavy", "uniqueImpactfulEyebrowNavy"),
			imageTextSection1TitleLine1: pick("imageTextSection1TitleLine1", "uniqueImpactfulTitleLine1"),
			imageTextSection1TitleLine2: pick("imageTextSection1TitleLine2", "uniqueImpactfulTitleLine2"),
			imageTextSection1Body: pick("imageTextSection1Body", "uniqueImpactfulBody"),
			imageTextSection1ImageOn: pick("imageTextSection1ImageOn", "uniqueImpactfulImageOn"),
			imageTextSection1AccentLine: pick("imageTextSection1AccentLine", "uniqueImpactfulAccentLine"),
			imageTextSection1ImageUrl: resolveImage(pick("imageTextSection1Image", "uniqueImpactfulImage"), 1000, 750),

			imageTextSection2EyebrowGold: pick("imageTextSection2EyebrowGold", "torahVisionEyebrowGold"),
			imageTextSection2EyebrowNavy: pick("imageTextSection2EyebrowNavy", "torahVisionEyebrowNavy"),
			imageTextSection2TitleLine1: pick("imageTextSection2TitleLine1", "torahVisionTitleLine1"),
			imageTextSection2TitleLine2: pick("imageTextSection2TitleLine2", "torahVisionTitleLine2"),
			imageTextSection2Body: pick("imageTextSection2Body", "torahVisionBody"),
			imageTextSection2ImageOn: pick("imageTextSection2ImageOn", "torahVisionImageOn"),
			imageTextSection2AccentLine: pick("imageTextSection2AccentLine", "torahVisionAccentLine"),
			imageTextSection2ImageUrl: resolveImage(pick("imageTextSection2Image", "torahVisionImage"), 1000, 750),
		};
	} catch (err) {
		console.error(`[homepage] query failed:`, err);
		return null;
	}
}
