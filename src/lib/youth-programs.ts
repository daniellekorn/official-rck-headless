import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { resolveImage, resolveGalleryUrls, type GalleryItem } from "./wix-media";
import { slugify } from "./slug";

const COLLECTION_ID = "YouthPrograms";

// One row per youth program (Dor L'Dor, Matmidim, Teen Learning, …). Each
// renders as its own section on /youth: always a title + description, and
// optionally photos, a flyer, and a contact rabbi. See design log #017.
export interface YouthProgram {
	_id: string;
	title: string;
	slug: string; // anchor id, derived from title (e.g. "dor-ldor")
	description?: unknown; // Ricos rich text — extracted to plain text for render
	galleryUrls: string[]; // resolved program photos; [0] is the featured one
	flyerPdfUrl?: string; // direct PDF URL
	flyerImageUrl?: string; // resolved static flyer image (preferred)
	contactName?: string; // contact rabbi, e.g. "Rav Avraham Aharon"
	contactEmail?: string;
	sortOrder?: number;
	active?: boolean;
}

// Raw shape as stored in the CMS (media fields hold Wix media URLs we resolve).
interface YouthProgramRow extends Omit<YouthProgram, "galleryUrls" | "flyerImageUrl"> {
	gallery?: GalleryItem[];
	flyerImage?: string;
}

export async function getYouthPrograms(): Promise<YouthProgram[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(100)
			.find();

		return (results as YouthProgramRow[]).map((row, i) => ({
			...row,
			slug: slugify(row.title ?? "") || `program-${i + 1}`,
			galleryUrls: resolveGalleryUrls(row.gallery),
			flyerImageUrl: resolveImage(row.flyerImage, 900, 1200),
		}));
	} catch (err) {
		console.error(`[youth-programs] query failed:`, err);
		return [];
	}
}
