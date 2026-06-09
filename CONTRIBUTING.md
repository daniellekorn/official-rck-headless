# Contributing to RCK

This site is built so almost every visible change — copy, photos, schedules, team — happens in the Wix dashboard, not in code. The code is the *structure*; the CMS is the *content*. If you find yourself opening a code editor to "add an image" or "change a name," stop: it probably belongs in the CMS.

This doc covers two roles:

- **Content editor** (the office, a collaborator) — uses the Wix dashboard or Claude with the Wix MCP. Never touches code.
- **Developer** (Danielle, future maintainers) — handles real code changes via PRs.

---

## For content editors

### What you can change without code

All of these live in the Wix CMS. Edit them in the dashboard and they go live automatically (give it ~30 seconds for caches to clear).

| Want to change… | Collection | How |
|---|---|---|
| Hero subtitle, eyebrow | `HomePage` | Edit the single row, change the relevant field. (The headline — "Welcome to RCK" + "The Ra'anana Community Kollel" — is brand, not content, and lives in code. See [#009](design-log/009-rck-brand-identity.md).) |
| Hero background image | `HomePage` | `heroImage` field — upload new image |
| Hero CTA buttons (label or link) | `HomePage` | `heroPrimaryCtaLabel` / `heroPrimaryCtaHref`, same for secondary |
| Split section copy ("Unique Impactful", "Torah Vision") | `HomePage` | The `uniqueImpactful*` and `torahVision*` fields |
| Which side the photo sits on in a split section | `HomePage` | `uniqueImpactfulImageOn` / `torahVisionImageOn` — type `left` or `right` |
| Which headline line gets the gold marker in a split section | `HomePage` | `uniqueImpactfulAccentLine` / `torahVisionAccentLine` — type `line1` or `line2` |
| History timeline under "Who We Are" | `OurHistory` | Add / reorder / hide rows. Each row is one milestone: image + year + title + caption |
| Join Us cards (3 gold cards) | `HomePage` | `joinUsCard1*` / `joinUsCard2*` / `joinUsCard3*` fields on the single row |
| Team members | `TeamMembers` | Add a row. Photo, name, role, bio, etc. |
| Youth programs (on /youth) | `YouthPrograms` | Add a row per program: title, description, contact rabbi, optional photo + flyer. |
| Weekday davening times | `DaveningTimes` | Add / edit rows with `dayType = Weekday`. Shabbat is a static "Join us at KBA" section (no CMS rows needed). |
| Flyers (Canva embeds or PDFs) | `Flyers` | Add a row per flyer. Set `category` to one of the four valid slugs (see schema below). For event flyers, set `removeAfter` so they drop off the site on their own. |
| Footer address, phone, email | `ContactInfo` | Edit the single row. Leave a field empty to hide it from the footer. |
| Footer social links | `ContactInfo` | Fill in any of `facebookUrl`, `instagramUrl`, `youtubeUrl`, `twitterUrl`, `linkedinUrl`. Empty = icon hidden. |

### Two ways to edit content

**1. Wix dashboard**
Open `https://manage.wix.com` → pick the site → CMS → click the collection → edit rows.

**2. Claude.ai + Wix MCP**
Connect the Wix connector/MCP to your Claude.ai account once. Then, tell the chat that you have a Wix site that you want to update content for. The content is all managed in CMS collections, so you can also ask the chat to list those collections first and what they include (they're listed above here too).

Examples:

- "Add this image to the 'Who We Are' history timeline of my Wix site <id> with year 2021 and title 'Beis Medrash Opens'" — Claude uploads + creates the row
- "Add these five milestones to the OurHistory collection on my Wix site <id>, each with a year, title, and caption" — done in one prompt
- "Add a team member to my Wix site <id>: Rabbi Cohen, role 'Maggid Shiur', ..." — done

Connection setup: `https://dev.wix.com/docs/mcp/getting-started`:
Login + grant permission to the site.
Use the same Wix account you've been given site access on.

### What you *cannot* change without a code PR

These are code/design changes:

- Colors, fonts, layout, spacing
- Adding a new section to a page
- Adding a new page or route
- Changing how the slideshow behaves (auto-advance speed, transitions)
- Anything involving CSS, HTML structure, or JavaScript

For these, ask Danielle, or open a PR yourself (see the code-PR workflow below).

### Code-PR workflow (for design / structural changes)

You don't need a local dev environment. You can open code PRs entirely from your browser using Claude.ai + the GitHub MCP.

1. **One-time:** connect the [GitHub MCP](https://github.com/github/github-mcp-server) to your Claude.ai account, and ask Danielle to add you as a collaborator on `daniellekorn/official-rck-headless` with **write** access.
2. In Claude.ai, say what you want — "make the hero title purple", "round the corners on the Join Us cards more". Claude opens a PR on a new branch. **Never push directly to `main`** — always open a PR so the preview workflow runs and Danielle reviews.
3. **GitHub Actions builds a preview.** Within a few minutes of opening the PR, a bot comment appears with a **Preview URL**. Click it to see your change live on a temporary Wix preview deployment.
4. The preview comment updates automatically every time you (or Claude) push new commits to the PR branch.
5. Danielle reviews the diff + the preview URL, then merges. After merging, Danielle ships the change manually via `wix release`.

**If the workflow fails:** the PR will show a red ✕ — open the failing job in GitHub Actions to see what broke. Most commonly it's a TypeScript error caught by the `astro check` step. Ask Claude to fix it in the same PR.

### Collection schemas (fields)

If a field name doesn't match exactly what's listed here, the code can't see it. Field names are case-sensitive.

#### `HomePage` — exactly **one** row, never more

| Field | Type | Notes |
|---|---|---|
| heroEyebrow | Text | Optional promo line above the headline (e.g. "Chag Sameach!"). Leave empty for none. |
| heroTitle | Text | **Unused — kept for legacy.** Headline is hardcoded ("Welcome to RCK" + brand line). See [design-log/009](design-log/009-rck-brand-identity.md). |
| heroSubtitle | Text | One-line tagline under the brand line |
| heroImage | Image | Optional — fallback gradient if empty |
| heroPrimaryCtaLabel | Text | "Our Schedule" |
| heroPrimaryCtaHref | Text | "/schedule" (relative path) |
| heroSecondaryCtaLabel | Text | "Our Programs" |
| heroSecondaryCtaHref | Text | "/programming" |
| uniqueImpactfulEyebrowGold | Text | "UNIQUE" |
| uniqueImpactfulEyebrowNavy | Text | "IMPACTFUL" |
| uniqueImpactfulTitleLine1 | Text | "A Community Kollel" |
| uniqueImpactfulTitleLine2 | Text | "in Israel" |
| uniqueImpactfulBody | Text | Paragraph |
| uniqueImpactfulImage | Image | Optional |
| uniqueImpactfulImageOn | Text | Which side the photo sits on: `left` or `right`. Empty = `left`. Forgiving about case/spacing. |
| uniqueImpactfulAccentLine | Text | Which headline line gets the animated gold marker: `line1` or `line2`. Empty = `line2`. Also accepts `first`/`second`. |
| torahVisionEyebrowGold | Text | |
| torahVisionEyebrowNavy | Text | |
| torahVisionTitleLine1 | Text | |
| torahVisionTitleLine2 | Text | |
| torahVisionBody | Text | |
| torahVisionImage | Image | Optional |
| torahVisionImageOn | Text | Which side the photo sits on: `left` or `right`. Empty = `right`. Forgiving about case/spacing. |
| torahVisionAccentLine | Text | Which headline line gets the animated gold marker: `line1` or `line2`. Empty = `line2`. Also accepts `first`/`second`. |
| whoWeAreTitle | Text | "Who We Are" |
| whoWeAreHebrew | Text | Hebrew tagline (Pirkei Avot) |
| whoWeAreBody | Text | Paragraph |
| joinUsCard1Title | Text | "Daven with Us" |
| joinUsCard1Subtitle | Text | "Daily Tefillah & Minyanim" |
| joinUsCard1Href | Text | "/daven" |
| joinUsCard1Icon | Text | One of: `book`, `reader`, `people` |
| joinUsCard2Title | Text | "Learn with Us" |
| joinUsCard2Subtitle | Text | "Weekly Shiurim & Chavrutas" |
| joinUsCard2Href | Text | "/learn" |
| joinUsCard2Icon | Text | One of: `book`, `reader`, `people` |
| joinUsCard3Title | Text | "Our Programs" |
| joinUsCard3Subtitle | Text | "Connection & Community" |
| joinUsCard3Href | Text | "/programming" |
| joinUsCard3Icon | Text | One of: `book`, `reader`, `people` |

#### `OurHistory` — one row per milestone (5–10 typical)

Drives the slow auto-panning history timeline under "Who We Are" on the homepage. Rows are ordered by `year` (then `sortOrder` as a tiebreak), so the timeline always reads chronologically.

| Field | Type | Notes |
|---|---|---|
| image | Image | Required. Shown as the milestone photo (cropped to a 4:3 card). |
| year | Number | The milestone year, e.g. `2021`. Drives chronological order and is shown as the big gold label on the timeline. |
| title | Text | Milestone heading shown under the photo |
| caption | Text | One-line description under the title |
| sortOrder | Number | Tiebreak when two rows share a year. Lower numbers first. |
| active | Boolean | Hide a milestone without deleting it |

> Renamed from the old `HomepageSlides` collection (which had no `year`). See [design-log/015](design-log/015-history-timeline.md).

#### `TeamMembers`

Fields: `firstName`, `lastName`, `hebrewName` (opt), `role`, `roleGroup`, `bio` (Rich Text), `photo` (Image), `email` (opt), `sortOrder` (Number), `featured` (Boolean).

**`roleGroup`** drives which section on /team a member appears in. Case-insensitive and forgiving about exact wording — type whatever feels natural and it usually lands in the right section. Recognized values (any spelling/case works):

| You type… | Lands in section |
|---|---|
| `Founder`, `Director`, `Founder and Director`, `Executive Director`, `Leadership`, `President` | **Founder & Director** |
| `Rosh Kollel`, `Rosh Chaburah`, `Roshei Kollel`, `Roshei Chaburos` | **Roshei Kollel** |
| `Kollel`, `Avreich`, `Avrech`, `Avreichim`, `Avrechim`, `Yungerman`, `Yungerleit` | **Kollel Avreichim** |
| `Rabbi`, `Rabbis`, `Rabbeim`, `Rabbanim`, `Rav`, `Maggid Shiur` | **Rabbis** (dormant — only shows if populated) |
| `Youth`, `Youth Programming`, `Teen`, `Teens`, `Dor L'Dor`, `Matmidim` | **Youth Programming** — shows on /team (the /youth page itself is driven by a separate `YouthPrograms` collection, see below) |
| `Staff`, `Admin`, `Administration`, `Hanhala`, `Office` | **Staff** (dormant) |
| `Board`, `Board Member`, `Trustee` | **Board** (dormant) |
| Anything else | **Team** (catch-all so nothing silently disappears) |

"Dormant" means the section header doesn't appear on /team unless at least one member is filed there. The taxonomy is biased toward the three active groups (**Founder & Director**, **Roshei Kollel**, **Kollel Avreichim**) but the dormant ones exist for flexibility — fill one and it appears automatically.

**Youth rabbis — two separate places:** a member with `roleGroup = Youth` shows in a "Youth Programming" section on **/team** (the staff directory). The **/youth page itself is *not* built from `TeamMembers`** — it's built from the `YouthPrograms` collection (see its schema below), where each program names its own contact rabbi. So to put a rabbi's chaburah on the youth page, add a **`YouthPrograms`** row, not a team member. The two are independent: a rabbi can be in both (a `TeamMembers` row for their directory bio *and* the contact on a `YouthPrograms` row). See [design-log/017](design-log/017-events-and-youth-pages.md).

If a value lands a member in the wrong section, either fix the spelling or ask the developer to extend the alias map in `src/lib/team.ts`. See design log [#007](design-log/007-team-page-taxonomy-and-hover-reveal.md) for the rationale behind the active vs. dormant split.

#### `YouthPrograms` — one row per youth program

Drives the **Youth Programming page** (`/youth`). Each row is one program (Dor L'Dor, Matmidim Chaburos, Teen Learning, …) and renders as its own section on the page. A program **always** needs a `title`, a `description`, and a contact rabbi; the photo and flyer are **optional** — a program with neither just shows as a centered text block. Rows are ordered by `sortOrder`.

| Field | Type | Notes |
|---|---|---|
| `title` | Text | Program name, e.g. `Dor L'Dor`, `Matmidim Chaburos`, `Teen Learning`. Shown as the big section heading. |
| `description` | Rich Text | What the program is. Paragraphs are preserved. |
| `gallery` | Media Gallery (opt) | Photos of the program's kids/teens — add as many as you like. **One** photo shows as a big banner; **more than one** becomes a big swipeable slideshow (with thumbnails on desktop, dots on mobile) below the flyer/description. Leave empty for none. |
| `flyerEmbedUrl` | Text (opt) | Canva "Publish to Web" iframe src URL — live-synced to Canva. |
| `flyerPdfUrl` | Text (opt) | Direct public PDF URL (for non-Canva flyers). |
| `flyerImage` | Image (opt) | A static flyer image. Use this *or* one of the URL fields — they're checked image → embed → pdf. |
| `contactName` | Text | The contact rabbi's name, e.g. `Rav Avraham Aharon`. |
| `contactEmail` | Text | The contact rabbi's email — becomes the "Email" link. Leave empty to show only the generic "Contact" button. |
| `sortOrder` | Number | Order of sections, lower first. |
| `active` | Boolean | Show/hide without deleting. |

**To add a rabbi's chaburah to the youth page:** add a `YouthPrograms` row — `title` = the program, `description` = the info, `contactName` + `contactEmail` = the rabbi. That's all that's required; add photos to `gallery` and/or a flyer if you have them. (This is separate from `TeamMembers` — see the note above.)

> The `Flyers` collection still has a `youth` category, but the `/youth` page no longer reads it — youth flyers belong on the `YouthPrograms` row now. Put youth flyers there.

#### `DaveningTimes`

One row per service-time variant. The page renders a flat, lean list grouped by service name. Add as many rows as you need per service (e.g. two Mincha rows for different time slots). **Only `dayType = Weekday` rows are shown on the page.** Shabbat davening is a static "Join us at KBA" section — no rows needed.

| Field | Type | Notes |
|---|---|---|
| service | Text | `Shacharis`, `Mincha`, `Maariv`, `Selichos` |
| dayType | Text | Use `Weekday`. (`Shabbat` rows are stored but not currently rendered — Shabbat is hardcoded.) |
| daySpec | Text (opt) | Days shown next to each service: `Sunday`, `Mon, Thu`, `Sun – Thu`, etc. Leave empty only if day specificity doesn't apply. |
| time | Text | Display string like `7:00 AM`, `Plag`, `10 min before Shkiya`. Wall-clock text, not a parsed time. |
| notes | Text (opt) | Extra context only — e.g. `Followed by daf yomi`. **Do not** put day-of-week info here; that belongs in `daySpec`. |
| sortOrder | Number | Display order within a service group (lower first) |
| active | Boolean | Hide a row without deleting it |

#### `ContactInfo` — exactly **one** row, never more

| Field | Type | Notes |
|---|---|---|
| address | Text | Full address displayed in the footer. Leave empty to hide. |
| phone | Text | Display string like "+972 9-123-4567". Leave empty to hide. |
| email | Text | Used as display text and mailto: link. Leave empty to hide. |
| facebookUrl | Text | Full URL. Leave empty to hide the icon. |
| instagramUrl | Text | Full URL. Leave empty to hide the icon. |
| youtubeUrl | Text | Full URL. Leave empty to hide the icon. |
| twitterUrl | Text | Full URL. Leave empty to hide the icon. |
| linkedinUrl | Text | Full URL. Leave empty to hide the icon. |

#### `Flyers`

One row per flyer. Either `embedUrl` or `pdfUrl` must be filled in — a row with neither set will render nothing and should have `isActive = false`.

| Field | Type | Notes |
|---|---|---|
| title | Text | Display name shown on site |
| category | Text | **Must be one of:** `schedules`, `learning`, `youth`, `events` (lowercase, exact). Wrong value = flyer silently hidden. |
| embedUrl | Text | Canva "Publish to Web" `<iframe>` src URL. Preferred for Canva designs — stays live-synced to Canva. |
| pdfUrl | Text | Direct public PDF URL. For non-Canva documents. |
| isActive | Boolean | Show/hide without deleting. Default: true (checked). |
| displayOrder | Number | Sort order within the category. Lower = first. |
| subCategory | Text | Optional. Sub-topic for filtering (e.g. `kashrus`, `shabbos`, `women`). One value per flyer. Leave empty if no sub-filtering needed. |
| removeAfter | Date | Optional. The last day the flyer should appear. It stays up through that whole day (Israel time) and drops off the site by itself the next morning. **Leave empty for anything evergreen** (a standing schedule, a learning program). Only put a date on things that go stale — mainly event flyers. The row is *not* deleted: to bring a flyer back, just change the date to a future one. |

**Getting a Canva embed URL:** In Canva, open the design → **Share → Publish to web** → copy the URL from the embed code (`src="…"`). Paste only the URL (not the full `<iframe>` tag) into `embedUrl`.

> ⚠️ **Use "Publish to web" — not the "Copy link" button.** The plain *Copy link* (the one in the design's `⋯` menu) gives a *view* link, which usually refuses to display embedded on the site and can ask visitors to log in to Canva. Only the **Publish to web** URL embeds correctly and stays live-synced.

**Valid `category` slugs:**

| Type this… | Shows under… |
|---|---|
| `schedules` | Schedules |
| `learning` | Learning |
| `youth` | Youth Programming |
| `events` | Events |

**Special reserved `subCategory` values — do not reuse for general filtering:**

| category | subCategory | Where it appears |
|---|---|---|
| `schedules` | `daily` | Featured daily learning schedule on the Daven with Us page, below the minyan times. Only the first active row matching this combination is shown. |

To swap the daily schedule: edit the one row with `category = schedules` and `subCategory = daily`. Update `imageUrl` (for a static image) or `embedUrl` (for a live Canva design). No code change needed.

Canva embeds include a built-in expand/download control — no separate download button is shown on the site.

#### The easy way to add a flyer (chat, no dashboard)

You don't have to hunt through the CMS dashboard. Once the Wix connector is linked to your Claude.ai account (see "Claude.ai + Wix MCP" above), you can just describe the flyer and let Claude fill in the row. Copy the **Publish to web** URL from Canva, then say something like:

> Add a flyer to my Wix site `<site-id>`: title "Shavuos Night Learning", category `events`, embed URL `https://www.canva.com/design/…/view?embed`. Take it down after June 2, 2026.

Claude creates the row with the right `category` slug and sets `removeAfter` for you. A few more examples:

> Add this to the `learning` flyers, title "Summer Chaburah Schedule", no end date — it's ongoing. Embed URL: `…`

> The Pesach event flyer is over — set its `removeAfter` to yesterday so it drops off. (Or: hide it by setting `isActive` to false.)

The **one** thing only you can do is the Canva step: open the design, Publish to web, copy the URL. Everything after that is a sentence.

#### Why flyers aren't pulled from Canva automatically

A fair question: why can't the site just *watch* a Canva folder and show whatever's in it? We looked into it, and the short version is that automating it would make the site **worse**, not easier:

- **The "live" magic comes from one button.** When you *Publish to web* and paste that link, editing the design in Canva updates the site automatically — no re-upload, ever. That live link is only created by that button. Canva's automation tools can't generate it; they can only send the site a flat *picture* of the design. So an "automatic" version would turn your live flyers into frozen snapshots that go out of date the moment you edit them in Canva.
- **There's no official Canva ↔ Wix connection** — and the few third-party "connectors" (Zapier, Make) are built for the old drag-and-drop Wix editor, not the custom site we run. They wouldn't apply here.
- **It would add fragile machinery** for very little gain. Adding a flyer is already two clicks in Canva plus one sentence to Claude. A background sync would be a lot of plumbing that quietly breaks and shows stale designs.

The `removeAfter` date is the part of "automatic" that's actually worth having: you set a take-down date once, and old event flyers disappear on their own. That's the cleanup nobody wants to remember to do — so we automated *that*, and left the publishing as a quick, deliberate step.

### Permissions on every collection

Set **"Anyone can read"** when you create a collection. This is what lets the public site render the data. Editing remains restricted to logged-in collaborators.

---

## For developers

### Local setup

```bash
git clone git@github.com:daniellekorn/official-rck-headless.git
cd official-rck-headless
npm install
wix login          # one-time
wix env pull       # writes .env.local (gitignored)
npm run dev        # opens http://localhost:4321
```

### Architecture

- **Astro** in `output: "server"` mode, deployed via Wix-managed headless.
- **Tailwind v4** via `@tailwindcss/vite`. Brand tokens (navy, gold, fonts, type scale) in `src/styles/global.css` under `@theme`.
- **Wix CMS via `@wix/wix-data-items-sdk`**. Every query MUST be wrapped in `auth.elevate(items.query)` from `@wix/essentials` — without elevation, restricted collections silently return zero items. (See `node_modules/@wix/agent-skills/skills/wix-headless/references/cms/CMS_FOUNDATIONS.md` for the canonical pattern.)
- **Service modules** in `src/lib/*.ts`. One module per use case, each exporting typed query functions. Every Wix SDK await wrapped in try/catch — unguarded SSR awaits truncate Astro's response mid-body on failure.
- **Pages** in `src/pages/*.astro` call the lib functions, never the SDK directly.

### PR workflow

- Branch from `main`. Open PR against `main`. Direct pushes to `main` are not technically enforced (branch protection requires GitHub Pro on private repos), but **always** go through a PR by convention so the preview workflow runs and someone reviews.
- On PR open / commit push, `.github/workflows/pr-preview.yml` runs: `npm ci` → `astro check` (TypeScript) → `wix build` → `wix preview`. A bot comment with the unique preview URL lands on the PR; it updates in place on subsequent pushes (no comment spam).
- Click the preview URL to verify visually instead of pulling locally for every PR. Local pull still works when you want to debug or step through code.
- Merge to `main`. Ship with `wix release` (manual for now).

### Secrets

`.env.local` is gitignored and must stay that way. The Wix CLI rewrites it via `wix env pull`. If you accidentally commit it, rotate `WIX_CLIENT_SECRET` in the Wix dashboard immediately.

The PR-preview workflow uses a separate **Wix API key** stored as the `WIX_API_KEY` repo secret in GitHub. Rotate it from the [Wix account API keys page](https://manage.wix.com/account/api-keys) if it's ever exposed (e.g. pasted into a chat) and update the GitHub secret via `gh secret set WIX_API_KEY --repo daniellekorn/official-rck-headless` (paste at the prompt — never put it on the command line).

> **Security caveat — `pull_request` event + secrets.** Workflows fire on PRs from same-repo branches with secrets in scope. A malicious `postinstall` in a PR's `package.json` could exfiltrate `WIX_API_KEY`. Trust model: contributors with branch-push access are trusted. If you add a new contributor, also enable GitHub's "Require approval for first-time contributors" setting (Settings → Actions → General).

### What lives in code vs. CMS

Rule of thumb: **anything an editor would conceivably want to change is content.** Sections, layout, styling, behavior is code. If you find yourself hard-coding a string, image URL, or schedule into a component, ask whether it belongs in a CMS collection first.
