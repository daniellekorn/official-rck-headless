import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";
import { slugify } from "./slug";

const COLLECTION_ID = "PastEvents";

// One row per past event (a simcha, a shiur series finale, a community trip…).
// Each is a clickable entry in the /events archive: a name in the side list
// that, when chosen, shows the event's photo gallery + its flyer. Field shape
// deliberately mirrors YouthPrograms so the lib and editor docs read the same.
// See design log #027.
export interface PastEvent {
	_id: string;
	title: string;
	slug: string; // anchor id / deep-link, derived from title (e.g. "chanukah-mesibah")
	eventDate?: Date | string; // for newest-first sort + an optional caption
	blurb?: unknown; // Ricos rich text — extracted to plain text for render
	galleryUrls: string[]; // resolved event photos; [0] is the featured one
	flyerPdfUrl?: string; // direct PDF URL
	flyerImageUrl?: string; // resolved static flyer image (preferred)
	sortOrder?: number; // manual tiebreaker when two events share a date
	active?: boolean;
}

// A Media Gallery item is documented as a URL string, but the CMS often stores
// objects ({ src/url/image, type }). Accept either so rendering never breaks.
type GalleryItem = string | { src?: string; url?: string; image?: string; type?: string };

interface PastEventRow extends Omit<PastEvent, "galleryUrls" | "flyerImageUrl" | "slug"> {
	gallery?: GalleryItem[];
	flyerImage?: string;
}

function resolveImage(wixImageUrl?: string, w = 1200, h = 900): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFillImageUrl(wixImageUrl, w, h, {});
	} catch {
		return undefined;
	}
}

// Pull a Wix media URL out of a gallery item (string or object) and skip
// non-image (e.g. video) entries, which the gallery doesn't render.
function galleryItemUrl(item: GalleryItem): string | undefined {
	if (typeof item === "string") return item;
	if (item.type && item.type !== "image") return undefined;
	return item.src ?? item.url ?? item.image;
}

function dateValue(d: PastEvent["eventDate"]): number {
	if (!d) return 0;
	const date = d instanceof Date ? d : new Date(d);
	const t = date.getTime();
	return Number.isNaN(t) ? 0 : t;
}

export async function getPastEvents(): Promise<PastEvent[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.limit(100)
			.find();

		const events = (results as PastEventRow[]).map((row, i) => {
			const galleryUrls = (row.gallery ?? [])
				.map(galleryItemUrl)
				.map((u) => resolveImage(u))
				.filter((u): u is string => Boolean(u));
			return {
				...row,
				slug: slugify(row.title ?? "") || `event-${i + 1}`,
				galleryUrls,
				flyerImageUrl: resolveImage(row.flyerImage, 900, 1200),
			} as PastEvent;
		});

		// Newest first by event date; `sortOrder` (lower first) breaks ties so
		// the office can hand-order events that share a date.
		return events.sort((a, b) => {
			const byDate = dateValue(b.eventDate) - dateValue(a.eventDate);
			if (byDate !== 0) return byDate;
			return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
		});
	} catch (err) {
		console.error(`[past-events] query failed:`, err);
		return [];
	}
}

/** True when an event carries a flyer (image or PDF). */
export function hasFlyer(e: PastEvent): boolean {
	return Boolean(e.flyerImageUrl || e.flyerPdfUrl);
}
