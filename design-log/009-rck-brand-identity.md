# 009 — RCK as primary brand identity

**Status:** implemented — RCK-first identity shipped; the hero treatment was later simplified by #021 (headline is plain "RCK", no highlight, no "Welcome to" lead-in)
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** #001 (content/code boundary), #006 (Highlight component used in hero)

## Background

The site has been built and copy-edited with "The Ra'anana Community Kollel" as the headline brand mark. The nav already runs a small RCK-first lockup (a navy-ringed `RCK` chip with the full name in a tiny stack next to it — see `src/components/Nav.astro:27-36`), but every other surface — hero, page titles, body copy — leads with the long-form name.

Danielle's note from this session: the long-form name is doing two jobs poorly. It's too long to act as a brand mark, and burying "RCK" as a small companion mark means visitors never internalize the short form. The intent has always been for the organization to be known and referred to as **RCK**, with the long name serving as explanatory subtext.

## Problem

Brand recall. "Ra'anana Community Kollel" doesn't stick — it's a four-word descriptive phrase, not a name. Visitors won't remember it, won't type it, won't tell their friends "go to the Ra'anana Community Kollel website." We want them to remember **RCK**.

The hero is the highest-leverage surface: it's the first impression, and it currently makes the long name the entire visual brand statement.

## Questions and Answers

- **Q:** Where does the brand line live — in the CMS (`heroTitle` field) or hardcoded in `Hero.astro`?
  **A:** Hardcoded. The brand is structural, not content. Leaving it as a CMS string means the office could accidentally type "The Raanana Community Kollel" (missing apostrophe) or "Ra'anana Community Kollel" (no leading "The") and silently undo the rebrand. The brand line should be as un-editable as the logo. CMS retains control of `heroEyebrow`, `heroSubtitle`, CTAs, and image — everything that is genuinely content.

- **Q:** Then what happens to the `heroTitle` field that already exists in the `HomePage` collection?
  **A:** It becomes unused. The lib type stays (so we don't break the SDK query), and the field stays in the Wix dashboard (so we don't ask the office to do migrations), but `Hero.astro` stops reading it. CONTRIBUTING.md drops the field from the editable-content table. If we later want a non-homepage usage of the Hero component with a custom headline, we'll reintroduce a `title` prop override at the call site, not via CMS.

- **Q:** Layout: lockup ("RCK" + stacked full name to the right, like the nav) vs. inline phrase ("Welcome to RCK" as one headline with credit line below) vs. stacked (big RCK on its own line, full name on a smaller line below)?
  **A:** Inline phrase. The headline reads "Welcome to RCK" with `RCK` carrying the animated highlight; the full name renders as a smaller gold-tinted credit line directly beneath. Picked over stacked because the headline still reads as English prose ("Welcome to RCK") rather than a logo dump; picked over the side lockup because the side lockup repeats the nav's pattern at hero scale, which feels redundant. (User confirmed this choice in the originating session.)

- **Q:** Existing `Highlight` animation staggers across the last two words of the title ("Community", "Kollel") — what happens to it?
  **A:** Collapses to a single highlight on `RCK`. The two-word stagger only made sense for the long name; on a 3-letter monogram, two passes would look fussy. Single immediate highlight, ~1100ms duration, same gold color.

- **Q:** Does the eyebrow stay?
  **A:** The default `"Welcome to"` eyebrow is now redundant with the new headline ("Welcome to RCK"), so the default becomes empty. The CMS `heroEyebrow` field stays — if the office wants to put a promo line above the headline (e.g. "Chag Sameach!", "Now enrolling for Elul zman"), they fill in `heroEyebrow` and it renders. Empty value → nothing renders.

- **Q:** Other pages — should their `<title>` tags say "… — RCK" or "… — RCK (Ra'anana Community Kollel)"?
  **A:** "… — RCK". Browser tabs and search result snippets are space-constrained; the full name appears in meta descriptions and on the homepage itself, which is enough SEO context. (User confirmed.)

- **Q:** Nav `aria-label` currently says `"Ra'anana Community Kollel — Home"`. Update?
  **A:** Yes, to `"RCK — Ra'anana Community Kollel — Home"`. Leads with the brand for users who already know it, retains the full name for first-time screen reader users.

- **Q:** What about body copy that says "the Ra'anana Community Kollel is building something distinct in Israel" (`src/pages/index.astro:28`)?
  **A:** Replace with "RCK is building something distinct in Israel." Drops the article ("the") since RCK isn't a noun phrase. Consistent with the rule: full name only appears as the credit line under the hero headline; everywhere else uses RCK.

## Design

**Hero structure (file: `src/components/Hero.astro`)**

```
[optional eyebrow — CMS-driven, blank by default]
Welcome to ▓RCK▓        ← big headline, RCK highlighted
The Ra'anana Community Kollel   ← smaller credit line, gold tint
[subtitle — CMS-driven]
[CTAs]
[bg image / gradient]
```

The credit line sits between the headline and subtitle. It uses the same gold accent palette as the eyebrow (`text-gold-300`) at roughly `text-lg`/`text-xl` — bigger than the eyebrow, smaller than the subtitle that follows is in size *terms* but more prominent in tone (gold accent vs. white/80).

**Props changes:**
- Remove `title` from `Hero.astro` Props (it was only ever filled with the brand name; the new structure hardcodes the brand).
- Remove `eyebrow` default of `"Welcome to"` — default is `undefined`, eyebrow only renders if CMS provides a value.
- All other props (`subtitle`, `imageUrl`, CTA pairs) unchanged.

**Call site (`src/pages/index.astro`):** stop passing `title={homepage?.heroTitle}` to `<Hero>`. Leave the other props as-is.

**Highlight:** single `<Highlight immediate delay={300} duration={1100}>RCK</Highlight>` wrapping just `RCK` in the headline. The two-word stagger and the `titleSplit` regex go away.

**Other surfaces:**

| File | Change |
|---|---|
| `src/layouts/Layout.astro:11` | default title `"Ra'anana Community Kollel"` → `"RCK — The Ra'anana Community Kollel"` |
| `src/pages/daven.astro:17` | `"Daven with Us — Ra'anana Community Kollel"` → `"Daven with Us — RCK"`; meta description swap |
| `src/pages/team.astro:14` | `"Meet the Team — Ra'anana Community Kollel"` → `"Meet the Team — RCK"`; meta description swap |
| `src/pages/index.astro:28` | "the Ra'anana Community Kollel is building" → "RCK is building" |
| `src/components/Nav.astro:27` | `aria-label="Ra'anana Community Kollel — Home"` → `aria-label="RCK — Ra'anana Community Kollel — Home"` |
| `CONTRIBUTING.md:20, 80` | Remove `heroTitle` / "Hero title" from editable-content lists; note the brand is structural |

## Implementation Plan

1. Restructure `src/components/Hero.astro` per "Design" section.
2. Update `src/pages/index.astro` Hero call site (drop `title` prop) and body copy in the `uniqueImpactful` default.
3. Update `src/layouts/Layout.astro`, `src/pages/daven.astro`, `src/pages/team.astro` titles + descriptions.
4. Update `src/components/Nav.astro` aria-label.
5. Update `CONTRIBUTING.md` to deprecate `heroTitle`.
6. Verify in dev server.

## Trade-offs

- **CMS loses control of the headline.** If the office ever wants a fully custom homepage headline (e.g. "Join us for a special event"), they can't do it without a code change. We accept this because the brand name shouldn't be content; promo lines belong in `heroEyebrow` or `heroSubtitle`.
- **The `heroTitle` field becomes dead schema.** It still exists in the Wix collection and the SDK type. If the office edits it, nothing happens — which could be confusing. CONTRIBUTING.md removes the field from the editable list, but we don't drop the field from the Wix dashboard (that's a manual operation and the field's presence does no harm).
- **CSS class naming was already `.rck-*` everywhere** (`rck-highlight`, `rck-beam-*`, etc.). No change to internal naming — that decision predates this log.

## Verification

- Homepage hero renders "Welcome to RCK" with a gold highlight sweep across `RCK`; credit line "The Ra'anana Community Kollel" appears below the headline; subtitle and CTAs unchanged.
- With an empty `heroEyebrow` CMS field, no eyebrow row renders above the headline. With a value, it renders as before.
- Browser tab on `/` reads "RCK — The Ra'anana Community Kollel"; `/daven` reads "Daven with Us — RCK"; `/team` reads "Meet the Team — RCK".
- `grep -rn "Ra'anana Community Kollel" src/` returns only the structural credit line in `Hero.astro` and the secondary mention in the Nav `aria-label` — no other body copy.

## Implementation Results

Shipped: RCK leads on every surface (nav lockup, page titles, hero) with the
full name as the credit line. Deviation: the hero headline was later reduced to
a plain white "RCK" — the gold Highlight sweep and "Welcome to" lead-in
described above were reverted by the client; see #021.
