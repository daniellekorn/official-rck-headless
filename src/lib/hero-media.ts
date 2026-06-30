import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media, VideoResolution } from "@wix/sdk";

const COLLECTION_ID = "HeroMedia";

const DEFAULT_HOLD_SECONDS = 6;

export interface HeroSlide {
	kind: "image" | "video";
	url: string;
	/** Poster image for a video slide (from the video's thumbnail) — avoids a black flash. */
	poster?: string;
	/** Image slides: how long to hold before crossfading, in ms. */
	holdMs?: number;
}

interface HeroMediaRow {
	image?: string;
	video?: string;
	holdSeconds?: number;
	sortOrder?: number;
	active?: boolean;
}

function resolveImage(wixImageUrl?: string, w = 1920, h = 1200): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFillImageUrl(wixImageUrl, w, h, {});
	} catch {
		return undefined;
	}
}

/**
 * Resolve one CMS row into a HeroSlide. A row is a VIDEO slide when `video` is
 * set (it wins over `image`), otherwise an IMAGE slide. Returns null when the
 * row has neither usable media, so it can be filtered out.
 */
function resolveSlide(row: HeroMediaRow): HeroSlide | null {
	if (row.video) {
		try {
			const v = media.getVideoUrl(row.video, VideoResolution.MID); // 720p
			if (v?.url) {
				return { kind: "video", url: v.url, poster: resolveImage(v.thumbnail) };
			}
		} catch {
			/* fall through — try image, else drop */
		}
	}
	const imageUrl = resolveImage(row.image);
	if (imageUrl) {
		const hold = typeof row.holdSeconds === "number" && row.holdSeconds > 0 ? row.holdSeconds : DEFAULT_HOLD_SECONDS;
		return { kind: "image", url: imageUrl, holdMs: hold * 1000 };
	}
	return null;
}

/**
 * Active hero slides in display order. Empty array when the collection is
 * absent/empty or the query fails — Hero then falls back to HomePage.heroImage.
 * See design-log/029.
 */
export async function getHeroMedia(): Promise<HeroSlide[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.find();
		return (results as HeroMediaRow[])
			.map(resolveSlide)
			.filter((s): s is HeroSlide => s !== null);
	} catch (err) {
		console.error(`[hero-media] query failed:`, err);
		return [];
	}
}
