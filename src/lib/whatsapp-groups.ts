import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { resolveImage } from "./wix-media";

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
	 * YouTube links, one per line (commas work too). Full URLs of any shape —
	 * watch, Shorts, youtu.be, embed — or bare video IDs. Parsed into `videoIds`.
	 */
	videoUrls?: string;
	image?: string;
	/** Optional custom poster; falls back to the first video's YouTube thumbnail. */
	imageUrl?: string;
	/** Featured groups render as video tiles on the right side of the band. */
	featured?: boolean;
	sortOrder?: number;
	active?: boolean;
	/** Parsed from `videoUrls` on read. */
	videoIds?: string[];
}

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
 * The office pastes YouTube links one per line (commas work too), in any URL
 * shape or as bare IDs. Unparseable lines are dropped silently rather than
 * breaking the tile.
 */
export function parseYouTubeIds(raw?: string): string[] {
	if (!raw) return [];
	return raw
		.split(/[\n,]/)
		.map((s) => extractYouTubeId(s))
		.filter((id): id is string => Boolean(id));
}

export async function getWhatsappGroups(): Promise<WhatsappGroup[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(100)
			.find();

		return (results as WhatsappGroup[]).map((g) => ({
			...g,
			imageUrl: resolveImage(g.image, 720, 1280),
			videoIds: parseYouTubeIds(g.videoUrls),
		}));
	} catch (err) {
		console.error(`[whatsapp-groups] query failed:`, err);
		return [];
	}
}
