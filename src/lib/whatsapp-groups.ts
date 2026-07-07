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

const YT_ID = /^[\w-]{10,12}$/;

/**
 * Accepts whatever the office pastes — full YouTube URLs (watch?v=, /shorts/,
 * youtu.be, /embed/, /live/) or bare video IDs — one per line or comma-separated,
 * and returns clean video IDs. Unparseable lines are dropped silently rather
 * than breaking the tile.
 */
export function parseYouTubeIds(raw?: string): string[] {
	if (!raw) return [];
	return raw
		.split(/[\n,]/)
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => {
			if (YT_ID.test(s)) return s;
			try {
				const u = new URL(s.startsWith("http") ? s : `https://${s}`);
				if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] ?? "";
				const path = u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{10,12})/);
				if (path) return path[1];
				return u.searchParams.get("v") ?? "";
			} catch {
				return "";
			}
		})
		.filter((id) => YT_ID.test(id));
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
			imageUrl: resolveImage(g.image),
			videoIds: parseYouTubeIds(g.videoUrls),
		}));
	} catch (err) {
		console.error(`[whatsapp-groups] query failed:`, err);
		return [];
	}
}
