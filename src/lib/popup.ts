import { items, auth } from "./wix-cms-admin";
import { cmsDateStr, israelDateStr, getFeaturedFlyer, flyerAlt } from "./flyers";
import { extractYouTubeId, resolveImageFitManual, scaleFlyerImage } from "./wix-media";

const CAMPAIGNS_COLLECTION_ID = "PopupCampaigns";

/**
 * One row per fundraising campaign pop-up. While a row is active and today
 * (Israel time) is inside its start/end dates, it replaces the weekly featured
 * shiur pop-up site-wide. See design-log #083.
 */
interface PopupCampaignRow {
	_id: string;
	title?: string;
	heading?: string;
	isActive?: boolean;
	startDate?: Date | string;
	endDate?: Date | string;
	/** "flyer" or "video" — which media the pop-up shows. */
	mediaType?: string;
	/** Wix Image field — the flyer, and the poster behind a video. */
	image?: string;
	youtubeUrl?: string;
	buttonLabel?: string;
	buttonUrl?: string;
}

export type PopupMedia =
	| { type: "image"; src: string; alt: string }
	| { type: "youtube"; id: string; poster?: string };

/** Everything the site-wide pop-up needs to render — one shape for both modes. */
export interface PopupConfig {
	kind: "campaign" | "shiur" | "event";
	/** CMS row id — part of the per-session storage key, so a new week/campaign shows again. */
	id: string;
	/** Not shown on screen — the dialog's accessible name and the video's title. */
	heading: string;
	media: PopupMedia;
	cta: { label: string; href: string; external: boolean };
	/** Shiur/event: × removes it. Campaign: × collapses it into a "Donate" tab. */
	dismiss: "close" | "minimize";
}

async function getActiveCampaign(now: Date): Promise<PopupConfig | null> {
	const elevated = auth.elevate(items.query);
	const { items: rows } = await elevated(CAMPAIGNS_COLLECTION_ID).eq("isActive", true).limit(20).find();
	const today = israelDateStr(now);

	for (const row of rows as PopupCampaignRow[]) {
		// Missing dates are open-ended; an unparseable one disqualifies the row
		// rather than running a campaign forever by accident.
		if (row.startDate && !cmsDateStr(row.startDate)) continue;
		if (row.endDate && !cmsDateStr(row.endDate)) continue;
		const start = cmsDateStr(row.startDate);
		const end = cmsDateStr(row.endDate);
		if ((start && today < start) || (end && today > end)) continue;
		if (!row.buttonUrl) continue;

		const poster = resolveImageFitManual(row.image, 800, 1280);
		const youtubeId = row.mediaType?.trim().toLowerCase() === "video" ? extractYouTubeId(row.youtubeUrl) : undefined;
		// Video with a bad/missing link falls back to the flyer image.
		const media: PopupMedia | undefined = youtubeId
			? { type: "youtube", id: youtubeId, poster }
			: poster
				? { type: "image", src: poster, alt: row.heading || row.title || "RCK campaign" }
				: undefined;
		if (!media) continue;

		return {
			kind: "campaign",
			id: row._id,
			heading: row.heading?.trim() || "Support RCK",
			media,
			cta: { label: row.buttonLabel?.trim() || "Donate now!", href: row.buttonUrl, external: true },
			dismiss: "minimize",
		};
	}
	return null;
}

/**
 * The flyer's `popupLink`, if it's usable: a site path ("/youth#…") stays in
 * the tab; a full http(s) URL is external unless it's rckollel.com itself.
 * Anything else (a typo like "youth") is ignored so the default link stands.
 */
function popupLinkOverride(raw: string | undefined): { href: string; external: boolean } | null {
	const link = raw?.trim();
	if (!link) return null;
	if (link.startsWith("/") && !link.startsWith("//")) return { href: link, external: false };
	try {
		const url = new URL(link);
		if (url.protocol !== "https:" && url.protocol !== "http:") return null;
		const ownSite = /(^|\.)rckollel\.com$/i.test(url.hostname);
		return ownSite
			? { href: `${url.pathname}${url.search}${url.hash}`, external: false }
			: { href: url.href, external: true };
	} catch {
		return null;
	}
}

async function getFeaturedFlyerPopup(now: Date): Promise<PopupConfig | null> {
	const flyer = await getFeaturedFlyer(now);
	const src = scaleFlyerImage(flyer?.imageUrl, 800);
	if (!flyer || !src) return null;
	// A featured event flyer sends visitors to /events; a shiur to /learn.
	const isEvent = flyer.category === "events";
	const heading = isEvent ? "Featured event" : "Featured shiur";
	return {
		kind: isEvent ? "event" : "shiur",
		id: flyer._id,
		heading,
		media: { type: "image", src, alt: flyerAlt(flyer.title, `${flyer.title ?? heading} flyer`) },
		cta: {
			label: isEvent ? "Join us!" : "Learn with us!",
			// `popupLink` on the row sends the button elsewhere (e.g. a youth
			// program's section); otherwise the category's own page.
			...(popupLinkOverride(flyer.popupLink) ?? {
				href: isEvent ? "/events" : "/learn",
				external: false,
			}),
		},
		dismiss: "close",
	};
}

/**
 * The pop-up to show right now: an in-range campaign wins, else this week's
 * featured flyer (shiur or event), else nothing. Never throws — a CMS hiccup (or the
 * PopupCampaigns collection not existing yet) just means no pop-up / falls
 * through to the shiur.
 */
export async function getActivePopup(now = new Date()): Promise<PopupConfig | null> {
	try {
		const campaign = await getActiveCampaign(now);
		if (campaign) return campaign;
	} catch (err) {
		console.error("[popup] campaign query failed:", err);
	}
	try {
		return await getFeaturedFlyerPopup(now);
	} catch (err) {
		console.error("[popup] featured flyer lookup failed:", err);
		return null;
	}
}
