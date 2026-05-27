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
| Hero title, subtitle, eyebrow | `HomePage` | Edit the single row, change the relevant field |
| Hero background image | `HomePage` | `heroImage` field — upload new image |
| Hero CTA buttons (label or link) | `HomePage` | `heroPrimaryCtaLabel` / `heroPrimaryCtaHref`, same for secondary |
| Split section copy ("Unique Impactful", "Torah Vision") | `HomePage` | The `uniqueImpactful*` and `torahVision*` fields |
| Slideshow under "Who We Are" | `HomepageSlides` | Add / reorder / hide rows. Image + title + caption per row |
| Join Us cards (3 gold cards) | `JoinUsCards` | Edit the 3 rows. Title, subtitle, link, icon key |
| Team members | `TeamMembers` | Add a row. Photo, name, role, bio, etc. |
| Davening times | `DaveningTimes` | Add / edit rows. `dayType` is exactly "Weekday" or "Shabbat" |

### Two ways to edit content

**1. Wix dashboard (always works, no extra setup).**
Open `https://manage.wix.com` → pick the site → CMS → click the collection → edit rows.

**2. Claude.ai + Wix MCP (faster for bulk operations).**
Connect the Wix MCP to your Claude.ai account once. Then:

- "Add this image to the homepage slideshow with title 'Beis Medrash'" — Claude uploads + creates the row
- "Add these five images as new slides" — done in one prompt
- "Add a team member: Rabbi Cohen, role 'Maggid Shiur', group 'rabbeim'…" — done

Connection setup: `https://dev.wix.com/docs/mcp/getting-started` — login + grant permission to the site. Use the same Wix account you've been given Content Manager access on.

> **You don't have site admin.** You should be given **Content Manager** access (or "Contributor with CMS"), which lets you edit collections but not change site settings, billing, or domains. If something isn't editable, that's intentional.

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

1. **One-time:** connect the [GitHub MCP](https://github.com/github/github-mcp-server) to your Claude.ai account, and ask Danielle to add you as a collaborator on `daniellekorn/official-rck-headless` with **write** access (you need it to push branches, but you will not be able to merge to `main`).
2. In Claude.ai, say what you want — "make the hero title purple", "round the corners on the Join Us cards more". Claude opens a PR on a new branch (it will never push directly to `main` — branch protection prevents that).
3. **GitHub Actions builds a preview.** Within a few minutes of opening the PR, a bot comment appears with a **Preview URL**. Click it to see your change live on a temporary Wix preview deployment.
4. The preview comment updates automatically every time you (or Claude) push new commits to the PR branch.
5. Danielle reviews the diff + the preview URL, then merges. After merging, Danielle ships the change manually via `wix release`.

**If the workflow fails:** the PR will show a red ✕ — open the failing job in GitHub Actions to see what broke. Most commonly it's a TypeScript error caught by the `astro check` step. Ask Claude to fix it in the same PR.

### Collection schemas (fields)

If a field name doesn't match exactly what's listed here, the code can't see it. Field names are case-sensitive.

#### `HomePage` — exactly **one** row, never more

| Field | Type | Notes |
|---|---|---|
| heroEyebrow | Text | "Welcome to" |
| heroTitle | Text | "The Ra'anana Community Kollel" |
| heroSubtitle | Text | One-line tagline |
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
| torahVisionEyebrowGold | Text | |
| torahVisionEyebrowNavy | Text | |
| torahVisionTitleLine1 | Text | |
| torahVisionTitleLine2 | Text | |
| torahVisionBody | Text | |
| torahVisionImage | Image | Optional |
| whoWeAreTitle | Text | "Who We Are" |
| whoWeAreHebrew | Text | Hebrew tagline (Pirkei Avot) |
| whoWeAreBody | Text | Paragraph |

#### `HomepageSlides` — one row per slide (5–10 typical)

| Field | Type | Notes |
|---|---|---|
| image | Image | Required |
| title | Text | Shown on the slide |
| caption | Text | Shorter subtitle |
| sortOrder | Number | Lower numbers first |
| active | Boolean | Hide a slide without deleting it |

#### `JoinUsCards` — exactly 3 rows

| Field | Type | Notes |
|---|---|---|
| title | Text | "Daven with Us" |
| subtitle | Text | "Daily Tefillah & Minyanim" |
| href | Text | "/daven" |
| icon | Text | One of: `book`, `reader`, `people` |
| sortOrder | Number | Display order |
| active | Boolean | |

#### `TeamMembers`

See the existing data model — fields: `firstName`, `lastName`, `hebrewName` (opt), `role`, `roleGroup` (one of: `rabbeim`, `kollel`, `administration`, `board`), `bio` (Rich Text), `photo` (Image), `email` (opt), `sortOrder` (Number), `featured` (Boolean).

#### `DaveningTimes`

Fields: `service`, `dayType` (exactly `Weekday` or `Shabbat`), `time` (display string like "7:00 AM"), `notes` (opt), `sortOrder`, `active`.

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

- Branch from `main`. Open PR against `main`. Direct pushes to `main` are blocked by branch protection.
- On PR open / commit push, `.github/workflows/pr-preview.yml` runs: `npm ci` → `astro check` (TypeScript) → `wix build` → `wix preview`. A bot comment with the unique preview URL lands on the PR; it updates in place on subsequent pushes (no comment spam).
- Click the preview URL to verify visually instead of pulling locally for every PR. Local pull still works when you want to debug or step through code.
- Merge to `main`. Ship with `wix release` (manual for now — see design log #002).

### Secrets

`.env.local` is gitignored and must stay that way. The Wix CLI rewrites it via `wix env pull`. If you accidentally commit it, rotate `WIX_CLIENT_SECRET` in the Wix dashboard immediately.

The PR-preview workflow uses a separate **Wix API key** stored as the `WIX_API_KEY` repo secret in GitHub. Rotate it from the [Wix account API keys page](https://manage.wix.com/account/api-keys) if it's ever exposed (e.g. pasted into a chat) and update the GitHub secret via `gh secret set WIX_API_KEY --repo daniellekorn/official-rck-headless` (paste at the prompt — never put it on the command line).

> **Security caveat — `pull_request` event + secrets.** Workflows fire on PRs from same-repo branches with secrets in scope. A malicious `postinstall` in a PR's `package.json` could exfiltrate `WIX_API_KEY`. Trust model: contributors with branch-push access are trusted. If you add a new contributor, also enable GitHub's "Require approval for first-time contributors" setting (Settings → Actions → General).

### What lives in code vs. CMS

Rule of thumb: **anything an editor would conceivably want to change is content.** Sections, layout, styling, behavior is code. If you find yourself hard-coding a string, image URL, or schedule into a component, ask whether it belongs in a CMS collection first.
