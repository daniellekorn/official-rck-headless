import { defineMiddleware } from "astro:middleware";

// 301s from the old WordPress site (rckollel.com, 13 URLs total) to their
// closest equivalent here. The domain doesn't change, so these have to live on
// *this* site: the moment rckollel.com points at Wix the WordPress install is
// gone and every one of these paths hard-404s — Google results, bookmarks, and
// every link ever shared in a community WhatsApp group.
//
// This is code rather than Wix's dashboard URL-redirect manager because that
// manager doesn't see routes served by a headless CLI site.
//
// Keys are written without a trailing slash; the lookup below strips it, so
// both `/rck-about` and WordPress's canonical `/rck-about/` match. Fragments in
// the targets survive the redirect — browsers carry them over from Location.
//
// Old-site page map (scanned 2026-08-26 via its sitemap + WP REST API):
// there were no posts, and no published URLs outside this list.
const LEGACY_REDIRECTS: Record<string, string> = {
	// About → the homepage history section tells the same 1998-origins story.
	"/rck-about": "/#history",

	// Minyanim → daily + Shabbat/Chag tefilah schedules.
	"/rck-minyanim": "/daven",

	// Four separate old shiurim pages all collapse into one filterable /learn.
	"/rck-all-shiurim": "/learn",
	"/rck-english-shiurim": "/learn",
	"/rck-hebrew-shiurim": "/learn",
	"/rck-learn-torah": "/learn",

	"/rck-community-outreach": "/community",
	"/rck-parsha-sheet": "/torah-sheets",

	// No standalone gallery page here — the old one mixed learning programs,
	// children's programs and the Annual Dinner, while galleries now sit inside
	// the pages they belong to. Home is the honest generic landing spot.
	"/rck-gallery": "/",

	// NOTE: the next two old pages were video archives with no equivalent on
	// this site — ~70 Torah Bytes parsha videos and 11 Choshen Mishpat shiurim
	// from Rabbi Yogel. These targets keep them from 404ing, but they are the
	// closest topical match, not the same content. If those archives ever get
	// rebuilt here, repoint these two.
	"/rck-torah-tidbits": "/torah-sheets#torah-bytes",
	"/rck-choshen-mishpat": "/learn",

	// Empty stub page on the old site whose only real link was "Learn with us".
	"/new-at-rck": "/events",
};

export const onRequest = defineMiddleware((context, next) => {
	const path = context.url.pathname.replace(/\/+$/, "") || "/";
	const target = LEGACY_REDIRECTS[path];

	// 301 (not 308) because these are GET-only legacy pages and 301 is what SEO
	// tooling and Google Search Console expect for a permanent move.
	if (target) return context.redirect(target, 301);

	return next();
});
