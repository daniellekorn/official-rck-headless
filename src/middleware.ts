import { defineMiddleware } from "astro:middleware";

/**
 * Force HTML pages to never be served from a CDN/browser cache.
 *
 * Why: this site is CMS-driven — an editor's change is supposed to show up
 * within seconds, no republish. But Wix's CDN was serving a stale cached
 * homepage for 15–30 min at a time. Root cause: the response `ETag` is keyed to
 * the *build*, not the *content*, so the CDN's `must-revalidate` check returned
 * 304 Not Modified and kept handing out the old body even after the CMS changed.
 * (`/` got cached because it's the most-requested URL; `/team` was always a MISS,
 * which is why team edits appeared instantly and homepage edits lagged.)
 *
 * `no-store` sidesteps the broken revalidation entirely: HTML is never cached,
 * so every request renders fresh against live CMS data. Hashed static assets
 * (CSS/JS/images with content-hashed filenames) are left untouched and keep
 * their long-lived caching. See design-log/020.
 */
export const onRequest = defineMiddleware(async (_context, next) => {
	const response = await next();
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("text/html")) {
		response.headers.set("Cache-Control", "no-store");
	}
	return response;
});
