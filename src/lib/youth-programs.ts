import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "YouthPrograms";

// One row per youth program (Dor L'Dor, Matmidim, Teen Learning, …). Each
// renders as its own section on /youth: always a title + description, and
// optionally photos, a flyer, and a contact rabbi. See design log #017.
export interface YouthProgram {
	_id: string;
	title: string;
	description?: unknown; // Ricos rich text — extracted to plain text for render
	galleryUrls: string[]; // resolved program photos; [0] is the featured one
	flyerEmbedUrl?: string; // Canva "Publish to Web" iframe src
	flyerPdfUrl?: string; // direct PDF URL
	flyerImageUrl?: string; // resolved static flyer image
	contactName?: string; // contact rabbi, e.g. "Rav Avraham Aharon"
	contactEmail?: string;
	sortOrder?: number;
	active?: boolean;
}

// A Media Gallery item is documented as a URL string, but the CMS often stores
// objects ({ src/url/image, type }). Accept either so rendering never breaks.
type GalleryItem = string | { src?: string; url?: string; image?: string; type?: string };

// Raw shape as stored in the CMS (media fields hold Wix media URLs we resolve).
interface YouthProgramRow extends Omit<YouthProgram, "galleryUrls" | "flyerImageUrl"> {
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
// non-image (e.g. video) entries, which the page doesn't render.
function galleryItemUrl(item: GalleryItem): string | undefined {
	if (typeof item === "string") return item;
	if (item.type && item.type !== "image") return undefined;
	return item.src ?? item.url ?? item.image;
}

export async function getYouthPrograms(): Promise<YouthProgram[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(100)
			.find();

		return (results as YouthProgramRow[]).map((row) => {
			const galleryUrls = (row.gallery ?? [])
				.map(galleryItemUrl)
				.map((u) => resolveImage(u))
				.filter((u): u is string => Boolean(u));
			return {
				...row,
				galleryUrls,
				flyerImageUrl: resolveImage(row.flyerImage, 900, 1200),
			};
		});
	} catch (err) {
		console.error(`[youth-programs] query failed:`, err);
		return [];
	}
}

/** True when a program carries any embeddable flyer (Canva, PDF, or image). */
export function hasFlyer(p: YouthProgram): boolean {
	return Boolean(p.flyerEmbedUrl || p.flyerPdfUrl || p.flyerImageUrl);
}
