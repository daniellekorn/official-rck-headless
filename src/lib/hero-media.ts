import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media, VideoResolution } from "@wix/sdk";
import { resolveImage } from "./wix-media";

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

/**
 * Resolve one CMS row into a HeroSlide. A row is a VIDEO slide when `video` is
 * set (it wins over `image`), otherwise an IMAGE slide. Returns null when the
 * row has neither usable media, so it can be filtered out.
 */
function resolveSlide(row: HeroMediaRow): HeroSlide | null {
	if (row.video) {
		try {
			// `getVideoUrl` just builds a predictable CDN URL for the requested
			// resolution — it never checks which renditions actually exist. Wix
			// only transcodes up to the source clip's own resolution, so a video
			// uploaded below 720p (common for phone clips) 403s at MID/HIGH even
			// though it plays fine at LOW. One office-uploaded hero clip hit this
			// exactly — the whole hero froze on that slide since its video never
			// loaded. LOW (480p) is safely below what Wix generates for virtually
			// any successful upload; the hero's gradient scrim over the video
			// (for text legibility) also makes the resolution difference hard to
			// notice in practice.
			const v = media.getVideoUrl(row.video, VideoResolution.LOW); // 480p
			if (v?.url) {
				return { kind: "video", url: v.url, poster: resolveImage(v.thumbnail, 1920, 1200) };
			}
		} catch {
			/* fall through — try image, else drop */
		}
	}
	const imageUrl = resolveImage(row.image, 1920, 1200);
	if (imageUrl) {
		const hold = typeof row.holdSeconds === "number" && row.holdSeconds > 0 ? row.holdSeconds : DEFAULT_HOLD_SECONDS;
		return { kind: "image", url: imageUrl, holdMs: hold * 1000 };
	}
	return null;
}

/**
 * Active hero slides in display order. Empty array when the collection is
 * absent/empty or the query fails — Hero then renders its brand gradient
 * placeholder. See design-log/029 and /030.
 */
export async function getHeroMedia(): Promise<HeroSlide[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(100)
			.find();
		return (results as HeroMediaRow[])
			.map(resolveSlide)
			.filter((s): s is HeroSlide => s !== null);
	} catch (err) {
		console.error(`[hero-media] query failed:`, err);
		return [];
	}
}
