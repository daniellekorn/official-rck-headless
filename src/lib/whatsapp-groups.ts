import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import {
	resolveImage,
	resolveGalleryVideos,
	parseVideos,
	type GalleryItem,
	type VideoItem,
} from "./wix-media";

// Re-exported for existing importers (e.g. WhatsAppCommunity.astro) — the
// actual implementations moved to wix-media.ts so PastEvents' video field
// could share them without duplicating this parsing logic. See design log #050.
export { extractYouTubeId, parseVideos } from "./wix-media";
export type { VideoItem } from "./wix-media";

const COLLECTION_ID = "WhatsappGroups";

export interface WhatsappGroup {
	_id: string;
	/** Group name — shown in the left-hand chat list (not on the video tiles). */
	name?: string;
	/** One-liner under a featured group's video tile. */
	description?: string;
	/** chat.whatsapp.com invite link for this group. */
	joinHref?: string;
	/**
	 * Video links, one per line (commas work too) — either YouTube (any URL
	 * shape, or a bare video ID) or a direct video file URL (e.g. a Wix Media
	 * upload, `video.wixstatic.com/...`). Parsed into `videos`.
	 */
	videoUrls?: string;
	/** Drag-and-drop video uploads (Media Gallery field) — the no-URL-pasting alternative to `videoUrls`. Also merged into `videos`. */
	videoGallery?: GalleryItem[];
	image?: string;
	/** Optional custom poster; falls back to an uploaded video's auto thumbnail, then the first YouTube video's thumbnail. */
	imageUrl?: string;
	/** Featured groups render as video tiles on the right side of the band. */
	featured?: boolean;
	sortOrder?: number;
	active?: boolean;
	/** Parsed from `videoUrls` on read. */
	videos?: VideoItem[];
}

export async function getWhatsappGroups(): Promise<WhatsappGroup[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(100)
			.find();

		return (results as WhatsappGroup[]).map((g) => {
			const uploaded = resolveGalleryVideos(g.videoGallery);
			const videos: VideoItem[] = [
				...uploaded.urls.map((src): VideoItem => ({ kind: "file", src })),
				...parseVideos(g.videoUrls),
			];
			return {
				...g,
				imageUrl: resolveImage(g.image, 720, 1280) ?? uploaded.poster,
				videos,
			};
		});
	} catch (err) {
		console.error(`[whatsapp-groups] query failed:`, err);
		return [];
	}
}
