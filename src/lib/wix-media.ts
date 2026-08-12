import { media } from "@wix/sdk";

/** A video item is either a YouTube embed or a directly-hosted file (e.g. Wix Media). */
export type VideoItem = { kind: "youtube"; id: string } | { kind: "file"; src: string };

/**
 * One slide in a mixed photo/video gallery (e.g. PhotoGalleryGrid + Lightbox,
 * design log #050) — a photo (cropped thumbnail + uncropped full-size), or a
 * YouTube video. Lives here rather than in a `.astro` file's frontmatter:
 * Astro's compiler chokes on a top-level `export type X = A | B` union export
 * from component frontmatter (breaks the dev/build script transform), so any
 * type shared across components needs a plain `.ts` home.
 */
export type GalleryMediaItem =
	| { type: "image"; src: string; fullSrc: string }
	| { type: "youtube"; videoId: string };

/**
 * Accept either a bare YouTube video ID or any full YouTube URL form
 * (watch?v=, youtu.be/, /shorts/, /embed/) and return just the video ID.
 * Returns undefined if the input is empty or unrecognised.
 * (Originally lived on homepage.ts, then whatsapp-groups.ts — #044 — moved
 * here so PastEvents' video field can share it instead of duplicating it.)
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
 * Like resolveImage, but crops an exact rectangle in the original upload's
 * own pixel space before scaling to fill — for a source photo with baked-in
 * padding (e.g. a transparent canvas margin around the real content) where a
 * plain centered fill crop lands inside that padding. Built by hand rather
 * than via the SDK's `media.getCroppedImageUrl` — that helper's w/h params
 * don't reliably reach the resulting URL (same class of bug as
 * `getScaledToFitImageUrl`, which regressed history.ts — see that revert).
 * Uses the same static.wixstatic.com transform scheme resolveImage's own
 * output already relies on, so it needs no SDK trust beyond URL parsing.
 */
export function resolveCroppedImage(
	wixImageUrl: string | undefined,
	cropX: number,
	cropY: number,
	cropWidth: number,
	cropHeight: number,
	w: number,
	h: number,
): string | undefined {
	if (!wixImageUrl) return undefined;
	const m = wixImageUrl.match(/^wix:image:\/\/v1\/([^/]+)\//);
	if (!m) return undefined;
	const fileId = m[1];
	return `https://static.wixstatic.com/media/${fileId}/v1/crop/x_${cropX},y_${cropY},w_${cropWidth},h_${cropHeight}/fill/w_${w},h_${h},al_c,q_90,usm_0.66_1.00_0.01,enc_auto/${fileId}`;
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
 * The thumbnail `<img>` uses this directly; the lightbox "view full size" uses
 * `flyerLightboxSrc` (same transform, larger width) below. Only the Download
 * button keeps the ORIGINAL `imageUrl`.
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

/**
 * Full-view width for the lightbox — much larger than the thumbnail widths
 * above, but still far short of the raw original. The stored `imageUrl` is a
 * Canva print-resolution export (observed up to ~20MB); handing that straight
 * to an `<img>` is slow enough on mobile networks/memory that the lightbox
 * reads as a blacked-out image while it loads (or fails to). The Download
 * button still gets the true original for print quality.
 */
export function flyerLightboxSrc(url?: string): string | undefined {
	return scaleFlyerImage(url, 1600);
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

// The video counterpart of a gallery item — same shape, `type: "video"`.
function galleryItemVideoSrc(item: GalleryItem): string | undefined {
	if (typeof item === "string") return undefined;
	return item.type === "video" ? item.src ?? item.url : undefined;
}

/**
 * Resolve a Wix video field (`wix:video://…`) to a direct playable URL, plus
 * an auto-generated poster thumbnail. Undefined when missing/unparseable.
 */
export function resolveVideo(wixVideoUrl?: string): { url: string; thumbnail?: string } | undefined {
	if (!wixVideoUrl) return undefined;
	try {
		const v = media.getVideoUrl(wixVideoUrl);
		return v?.url ? { url: v.url, thumbnail: v.thumbnail } : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Resolve a Wix Document field (`wix:document://…`, e.g. an uploaded PDF) to a
 * real downloadable URL + original filename. Undefined when missing/unparseable.
 */
export function resolveDocument(wixDocumentUrl?: string): { id: string; url: string; filename?: string } | undefined {
	if (!wixDocumentUrl) return undefined;
	try {
		const doc = media.getDocumentUrl(wixDocumentUrl);
		return doc?.url ? { id: doc.id, url: doc.url, filename: doc.filename } : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Resolve a CMS Media Gallery field's video items (dropping photos) to
 * playable URLs + a poster from the first one — for a field the office
 * uploads video files into directly, no URL-pasting required.
 */
export function resolveGalleryVideos(gallery: GalleryItem[] | undefined): { urls: string[]; poster?: string } {
	const resolved = (gallery ?? [])
		.map(galleryItemVideoSrc)
		.map((u) => resolveVideo(u))
		.filter((v): v is { url: string; thumbnail?: string } => Boolean(v));
	return { urls: resolved.map((v) => v.url), poster: resolved.find((v) => v.thumbnail)?.thumbnail };
}
