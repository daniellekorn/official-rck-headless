import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { resolveImage, resolveGalleryVideos, type GalleryItem } from "./wix-media";

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

/** A featured tile's video is either a YouTube embed or a directly-hosted file (e.g. Wix Media). */
export type VideoItem = { kind: "youtube"; id: string } | { kind: "file"; src: string };

/**
 * Accept either a bare YouTube video ID or any full YouTube URL form
 * (watch?v=, youtu.be/, /shorts/, /embed/) and return just the video ID.
 * Returns undefined if the input is empty or unrecognised.
 * (Moved here from homepage.ts when the shorts left the HomePage row — #044.)
 */
export function extractYouTubeId(input: string | undefined): string | undefined {
	if (!input) return undefined;
	const s = input.trim();
	// Already a bare ID (no slashes or protocol)
	if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
	try {
		const url = new URL(s);
		// youtu.be/VIDEO_ID
		if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0] || undefined;
		// /shorts/VIDEO_ID or /embed/VIDEO_ID or /v/VIDEO_ID
		const pathMatch = url.pathname.match(/\/(shorts|embed|v)\/([A-Za-z0-9_-]{11})/);
		if (pathMatch) return pathMatch[2];
		// ?v=VIDEO_ID
		return url.searchParams.get("v") ?? undefined;
	} catch {
		return undefined;
	}
}

/**
 * The office pastes video links one per line (commas work too) — YouTube in
 * any URL shape or as a bare ID, or a direct video file URL (e.g. pasted
 * from Wix's Media Manager). Each line resolves to whichever kind it is;
 * anything that's neither is dropped silently rather than breaking the tile.
 */
export function parseVideos(raw?: string): VideoItem[] {
	if (!raw) return [];
	return raw
		.split(/[\n,]/)
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s): VideoItem | undefined => {
			const ytId = extractYouTubeId(s);
			if (ytId) return { kind: "youtube", id: ytId };
			// A direct video file — Wix Media uploads, or any other host, as
			// long as it looks like an actual video URL (not e.g. a malformed
			// or non-video link, which would otherwise render a broken player).
			const isVideoFile = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(s) || /video\.wixstatic\.com/i.test(s);
			return isVideoFile ? { kind: "file", src: s } : undefined;
		})
		.filter((v): v is VideoItem => Boolean(v));
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
