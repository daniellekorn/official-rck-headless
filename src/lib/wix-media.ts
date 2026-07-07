import { media } from "@wix/sdk";

/**
 * Resolve a Wix media URL (wix:image://…) to a scaled CDN URL, or undefined
 * when the value is missing or unparseable — a bad CMS value never breaks a
 * render, the caller just gets no image.
 */
export function resolveImage(
	wixImageUrl?: string,
	w = 1200,
	h = 900,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options: Record<string, any> = {},
): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFillImageUrl(wixImageUrl, w, h, options);
	} catch {
		return undefined;
	}
}

// A Media Gallery item is documented as a URL string, but the CMS often stores
// objects ({ src/url/image, type }). Accept either so rendering never breaks.
export type GalleryItem = string | { src?: string; url?: string; image?: string; type?: string };

// Pull a Wix media URL out of a gallery item (string or object) and skip
// non-image (e.g. video) entries, which the galleries don't render.
function galleryItemUrl(item: GalleryItem): string | undefined {
	if (typeof item === "string") return item;
	if (item.type && item.type !== "image") return undefined;
	return item.src ?? item.url ?? item.image;
}

/** Resolve a CMS Media Gallery field to displayable image URLs, dropping videos and bad values. */
export function resolveGalleryUrls(gallery: GalleryItem[] | undefined): string[] {
	return (gallery ?? [])
		.map(galleryItemUrl)
		.map((u) => resolveImage(u))
		.filter((u): u is string => Boolean(u));
}
