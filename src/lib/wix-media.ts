import { media } from "@wix/sdk";

/**
 * A raw Wix image field (`wix:image://v1/<file>/<name>#originWidth=W&originHeight=H`)
 * carries the original upload's pixel dimensions in its URL fragment. Pull
 * those out as a CSS `aspect-ratio` value (e.g. "2040 / 1148") for contexts
 * that need to size a frame to match a specific image instead of using a
 * fixed ratio — e.g. a photo dropped into the `Flyers`-style upload field
 * that isn't actually a portrait print flyer. Returns undefined when the
 * fragment is missing/malformed, so the caller's fixed-ratio default stands.
 */
export function imageAspectRatio(rawWixImageUrl?: string): string | undefined {
	if (!rawWixImageUrl) return undefined;
	const m = rawWixImageUrl.match(/originWidth=(\d+)&originHeight=(\d+)/);
	if (!m) return undefined;
	const [, w, h] = m;
	return Number(w) > 0 && Number(h) > 0 ? `${w} / ${h}` : undefined;
}

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

/**
 * Like `resolveImage`, but `fit` (not `fill`): scales down to stay within the
 * box while keeping the photo's native aspect ratio, no cropping. Use this
 * for "view full size" contexts (e.g. a lightbox) — `resolveImage`'s forced
 * crop is only right for fixed-aspect thumbnails/grids.
 */
export function resolveImageFit(
	wixImageUrl?: string,
	w = 1600,
	h = 1600,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options: Record<string, any> = {},
): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFitImageUrl(wixImageUrl, w, h, options);
	} catch {
		return undefined;
	}
}

/**
 * Widths (CSS px) we emit variants for in a flyer `srcset`. The browser picks
 * the smallest that satisfies the rendered size × its device-pixel-ratio.
 */
const FLYER_WIDTHS = [400, 600, 800, 1200, 1600];

/**
 * Scale a *raw* flyer image URL down to a display-sized, format-optimized CDN
 * variant. The `Flyers` collection stores `imageUrl` as a plain text field — a
 * public `static.wixstatic.com` URL pasted in by the office (a Canva page-1 PNG
 * export at print resolution), NOT a Wix Image field. Served raw, each is a
 * multi-MB PNG shown in a small card: the events grid alone can pull dozens.
 *
 * This rewrites the URL to a Wix CDN transform: `fit` (not `fill`, which every
 * other image uses) preserves each flyer's true aspect ratio since the frames
 * letterbox with `object-fit: contain`, and `enc_auto` serves WebP/AVIF when
 * the browser accepts it. It works whether the pasted URL is a bare
 * `/media/<file>` original or already carries a `/v1/...` transform (we take
 * the file id and rebuild). Non-wixstatic URLs pass through untouched.
 *
 * Only the thumbnail `<img>` should use this — keep the ORIGINAL `imageUrl` for
 * the lightbox "view full size" and the Download button.
 */
export function scaleFlyerImage(url?: string, width = 800): string | undefined {
	if (!url) return undefined;
	const m = url.match(/^(https?:\/\/static\.wixstatic\.com\/media\/)([^/]+)/);
	if (!m) return url;
	const [, base, file] = m;
	// Generous portrait height bound; with `fit` the tighter constraint wins, so
	// for typical portrait flyers width binds and the true ratio is preserved.
	const height = Math.round(width * 1.6);
	return `${base}${file}/v1/fit/w_${width},h_${height},q_80,enc_auto/${file}`;
}

/**
 * Build a responsive `srcset` for a raw flyer URL, or `undefined` when the URL
 * can't be transformed (non-wixstatic) so the caller falls back to a plain src.
 */
export function flyerSrcset(url?: string): string | undefined {
	if (!url) return undefined;
	const probe = scaleFlyerImage(url, FLYER_WIDTHS[0]);
	if (!probe || probe === url) return undefined;
	return FLYER_WIDTHS.map((w) => `${scaleFlyerImage(url, w)} ${w}w`).join(", ");
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

/** Resolve a CMS Media Gallery field to displayable (cropped-to-fill) thumbnail URLs, dropping videos and bad values. */
export function resolveGalleryUrls(gallery: GalleryItem[] | undefined): string[] {
	return (gallery ?? [])
		.map(galleryItemUrl)
		.map((u) => resolveImage(u))
		.filter((u): u is string => Boolean(u));
}

/** Same field, uncropped — for a lightbox/"view full size" rendering of the same gallery. */
export function resolveGalleryFullUrls(gallery: GalleryItem[] | undefined): string[] {
	return (gallery ?? [])
		.map(galleryItemUrl)
		.map((u) => resolveImageFit(u))
		.filter((u): u is string => Boolean(u));
}
