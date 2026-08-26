# 062 — 301 redirects from the old WordPress site

**Status:** implemented
**Date:** 2026-08-26
**Author:** claude-session
**Related:** #017 (the /programming split that set the redirect precedent), #020 (Wix edge overrides response headers)

## Background

rckollel.com currently serves the old WordPress site (All in One SEO, Elementor). The domain itself doesn't change in the cutover — it gets repointed from Hostinger to Wix — so the moment this site goes live, every old URL is served by *this* codebase or not at all.

The old site's editor raised this in WhatsApp: without 301s, Google rankings suffer. That's directionally right but overstated for a 13-URL local nonprofit site whose domain is unchanged — most authority is domain-level and carries over regardless. The load-bearing reason is simpler: without redirects, every Google result, bookmark, and link shared in a community WhatsApp group hard-404s on day one.

## The old site, scanned in full

Scanned 2026-08-26 via `rckollel.com/page-sitemap.xml` and `/wp-json/wp/v2/pages`. **13 URLs total, no blog posts**, nothing published outside this list (spot-checked `/about/`, `/donate/`, `/contact/`, `/gallery/`, `/shiurim/` — all 404 on the old site too). All old URLs carry a trailing slash.

| Old URL | Content | New |
|---|---|---|
| `/` | Home | `/` — unchanged, no redirect |
| `/rck-about/` | 1998 origins, Rabbi Horwitz | `/#history` |
| `/rck-minyanim/` | Daily + Shabbat/Chag tefilah | `/daven` |
| `/rck-all-shiurim/` | Shiurim hub | `/learn` |
| `/rck-english-shiurim/` | Daf Yomi, Halacha, women's | `/learn` |
| `/rck-hebrew-shiurim/` | שיעורים בעברית, citywide, kids | `/learn` |
| `/rck-learn-torah/` | Learning programs, Avot Ubanim | `/learn` |
| `/rck-community-outreach/` | Outreach + video | `/community` |
| `/rck-parsha-sheet/` | Weekly parsha sheet | `/torah-sheets` |
| `/rck-gallery/` | Photo gallery | `/` |
| `/rck-torah-tidbits/` | ~70 Torah Bytes parsha **videos** | `/torah-sheets#torah-bytes` |
| `/rck-choshen-mishpat/` | 11 Choshen Mishpat **videos** | `/learn` |
| `/new-at-rck/` | Empty stub page | `/events` |

## Design

`src/middleware.ts` holds a single `LEGACY_REDIRECTS` map and returns `context.redirect(target, 301)` on a match, else `next()`. Keys are stored without a trailing slash and the incoming pathname is stripped before lookup, so both slash forms match.

**Why middleware and not the other three options:**

- *Rename the new site's routes to the old slugs* — rejected outright. The old slugs are `rck-`-prefixed WordPress artifacts, and the map is many-to-one anyway (four old shiurim pages → one `/learn`), so it isn't even expressible as a rename.
- *Wix dashboard URL-redirect manager* — doesn't see routes served by a headless CLI site. Worth recording because it's what was promised in the WhatsApp thread and is wrong.
- *Twelve one-line page files, à la `programming.astro` (#017)* — works, but twelve files to express one table. The middleware keeps the old→new mapping readable in one place, which matters because that table *is* the artifact.

`Astro.redirect` in `programming.astro` (#017) stays as-is; it isn't legacy-WordPress and the two don't conflict.

## Questions and Answers

- **Q:** #020 found the Wix edge overrides what our middleware emits and deleted `src/middleware.ts` as a no-op. Doesn't that sink this approach?
  **A:** No — #020's failure was specific to *response headers on rendered HTML* (`Cache-Control` on a 200). This returns a different response object with a 301 status and `Location`, never letting the page render. Confirmed empirically rather than assumed: the live production site already serves `/programming` → `308 /events` through the Wix edge intact.

- **Q:** Why 301 and not 308, given #017 used 308?
  **A:** Google treats them identically, but these are GET-only legacy pages and 301 is the convention SEO tooling and Search Console expect for a permanent move. #017's 308 was catching CMS-authored CTA hrefs, a different job.

- **Q:** Two of these targets aren't equivalent content. Is that acceptable?
  **A:** Knowingly, for launch. See Trade-offs.

## Trade-offs

**Two old pages have no equivalent here, and their redirects are soft-404s.** `/rck-torah-tidbits/` (~70 parsha videos) and `/rck-choshen-mishpat/` (11 Rabbi Yogel shiurim) are video archives; this site has no video archive. The chosen targets stop them 404ing and are the closest topical match — the new "Torah Bytes" is a PDF series that shares the old video series' *name*, not its content. Google may treat both as soft-404s and drop them. Flagged to Yosef as a content decision rather than a launch blocker; **if those archives are ever rebuilt here, repoint these two keys.**

`/rck-gallery/` → `/` is a deliberate generic landing. The old gallery mixed learning programs, children's programs and the Annual Dinner, while galleries now live inside the pages they belong to (`/youth`), so no single page is an honest match.

**Old URLs take a two-hop chain.** Measured on live production: Wix's own edge 301s `/rck-about/` → `/rck-about` *before* our middleware runs, so a Google result for the old trailing-slash URL resolves as `/rck-about/` → 301 → `/rck-about` → 301 → `/#history`. Two hops is well inside what crawlers follow and passes signals essentially in full, so this is recorded as a known characteristic, not a defect — but it means the middleware's own slash-stripping is belt-and-braces in production. It still earns its place: dev doesn't do that normalization.

## Verification

`astro check` clean (the lone `index.astro:208` `ts(2339)` is pre-existing and unrelated). Against `wix dev`, all 12 legacy paths return `301` to the mapped target; both `/rck-about/` and `/rck-about` resolve identically; every redirect target (`/daven`, `/community`, `/torah-sheets`, `/events`, `/learn`, `/`) returns `200`; `/programming` still returns its own `308`; and an unmapped path still returns `404` — confirming the middleware falls through rather than swallowing unknown routes.

Not yet verifiable in production: the map only takes effect after a `wix release`, and the redirects only matter once the domain is repointed off Hostinger. **Re-run the same sweep against the live domain after cutover** — that's the check that actually counts.
