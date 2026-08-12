import { items, auth } from "./wix-cms-admin";
import { resolveImage, resolveCroppedImage, resolveGalleryUrls, imageAspectRatio, type GalleryItem } from "./wix-media";
import { slugify } from "./slug";
import { getFlyers } from "./flyers";

const COLLECTION_ID = "YouthPrograms";

/**
 * The Teen Learning photo's canvas has genuine transparent padding baked in
 * above/below the actual photo (162px top, 494px bottom margin on the
 * original 4000x3200 upload) — a plain centered fill crop lands ~19px into
 * the bottom margin, showing as a thin white/transparent bar under the
 * photo. Crop to the content band (y 309–2559 of the original — already
 * 16:9, fully inside the opaque photo) instead of the whole canvas. Matched
 * by the Wix media file ID (stable across CMS edits), same pattern as
 * HistoryTimeline.astro's TRANSPARENT_MARGIN_IMAGE_IDS — promote to a real
 * field if more images ever need this.
 */
const TRANSPARENT_MARGIN_PHOTO_IDS = ["f477b1_fa47a08dc42249189dc8f116f5a2fd9d"];

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
	flyerAspect?: string; // the uploaded image's own aspect ratio (e.g. "2040 / 1148") — some programs post an actual photo, not a portrait print flyer, so the frame should match it instead of the usual fixed 3:4
	/**
	 * True when `flyerImage` is a landscape candid photo rather than a portrait
	 * print flyer (no `linkedFlyerTitle` override, aspect ratio wider than tall).
	 * Renders as a plain, non-downloadable image matching the program photo
	 * galleries below, instead of the flyer frame's zoom/download chrome.
	 */
	isPhoto?: boolean;
	contactName?: string; // contact rabbi, e.g. "Rav Avraham Aharon"
	contactEmail?: string;
	sortOrder?: number;
	active?: boolean;
	/**
	 * Exact title of a `Flyers` row (category "learning") whose flyer this
	 * program should mirror instead of its own `flyerImage` — lets the office
	 * update one flyer (in Learning) and have it reflect here too. Falls back
	 * to `flyerImage` when unset or when no learning row matches. See
	 * design-log #057.
	 */
	linkedFlyerTitle?: string;
}

// Raw shape as stored in the CMS (media fields hold Wix media URLs we resolve).
interface YouthProgramRow extends Omit<YouthProgram, "galleryUrls" | "flyerImageUrl" | "flyerAspect"> {
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

		const rows = results as YouthProgramRow[];
		let learningByTitle: Map<string, { imageUrl?: string; pdfUrl?: string }> | null = null;
		if (rows.some((r) => r.linkedFlyerTitle)) {
			const learning = await getFlyers("learning");
			learningByTitle = new Map(
				learning.map((f) => [f.title?.trim().toLowerCase(), { imageUrl: f.imageUrl, pdfUrl: f.pdfUrl }]),
			);
		}

		return rows.map((row, i) => {
			const linked = row.linkedFlyerTitle
				? learningByTitle?.get(row.linkedFlyerTitle.trim().toLowerCase())
				: undefined;
			const flyerAspect = linked ? undefined : imageAspectRatio(row.flyerImage);
			const [aspectW, aspectH] = flyerAspect ? flyerAspect.split(" / ").map(Number) : [];
			const isPhoto = !linked && Boolean(aspectW && aspectH && aspectW / aspectH > 1.15);
			const hasTransparentMargin =
				isPhoto && TRANSPARENT_MARGIN_PHOTO_IDS.some((id) => row.flyerImage?.includes(id));
			return {
				...row,
				slug: slugify(row.title ?? "") || `program-${i + 1}`,
				galleryUrls: resolveGalleryUrls(row.gallery),
				flyerImageUrl:
					linked?.imageUrl ??
					(hasTransparentMargin
						? resolveCroppedImage(row.flyerImage, 0, 309, 4000, 2250, 1200, 675)
						: resolveImage(row.flyerImage, isPhoto ? 1200 : 900, isPhoto ? 675 : 1200)),
				flyerPdfUrl: linked?.pdfUrl ?? row.flyerPdfUrl,
				flyerAspect,
				isPhoto,
			};
		});
	} catch (err) {
		console.error(`[youth-programs] query failed:`, err);
		return [];
	}
}
