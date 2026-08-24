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
| Hero subtitle, eyebrow | `HomePage` | Edit the single row, change the relevant field. (The headline — "RCK" + "The Ra'anana Community Kollel" credit line — is brand, not content, and lives in code. See [#009](design-log/009-rck-brand-identity.md) and [#021](design-log/021-cream-bands-bright-yellow-low-radius.md).) |
| Hero background (the big homepage image / video) | `HeroMedia` | **The one place for the hero background.** Add one row with an image for a single static hero, or several rows (images + a silent video) to make them crossfade as a sequence. Ordered by `sortOrder`. See [#029](design-log/029-hero-media-sequence.md), [#030](design-log/030-hero-single-source-of-truth.md). (The old `HomePage.heroImage` field no longer drives the hero — ignore it.) |
| Hero CTA buttons (label or link) | `HomePage` | `heroPrimaryCtaLabel` / `heroPrimaryCtaHref`, same for secondary |
| Impact stats band (the 5 count-up numbers just below the hero) | `HomePage` | `statNumber1`–`statNumber5` / `statLabel1`–`statLabel5`. See schema below and [#051](design-log/051-impact-stats-band.md). |
| Copy in the two image+text bands on the homepage | `HomePage` | The `imageTextSection1*` and `imageTextSection2*` fields (dashboard labels start "Section 1 —" / "Section 2 —") |
| Which side the photo sits on in an image+text band | `HomePage` | `imageTextSection1ImageOn` / `imageTextSection2ImageOn` — type `left` or `right` |
| Which headline line gets the gold marker in an image+text band | `HomePage` | `imageTextSection1AccentLine` / `imageTextSection2AccentLine` — type `line1` or `line2` |
| History timeline under "Who We Are" | `OurHistory` | Add / reorder / hide rows. Each row is one milestone: image + Hebrew accent line + title + caption |
| Join Us cards (3 gold cards) | `HomePage` | `joinUsCard1*` / `joinUsCard2*` / `joinUsCard3*` fields on the single row |
| "Join our WhatsApp community" band (heading, body, join button) | `HomePage` | `whatsapp*` header fields on the single row. See [#032](design-log/032-whatsapp-community-section.md). |
| The list of chat groups (left side) | `WhatsappGroups` | One row per group — the `name` shows in the list. Fill `joinHref` to make that entry clickable (opens that group's invite). Add / reorder (`sortOrder`) / hide (`active`) rows. See [#044](design-log/044-whatsapp-groups-collection.md). |
| Featured groups (the right-side video tiles) | `WhatsappGroups` | Tick `featured` on a row, then add videos either way (or both): drag video files straight into `Video Uploads`, or paste YouTube links into `Video URLs` (one per line — full URLs are fine). Visitors flip between a group's videos with the ‹ › arrows. First four featured rows show. See [#046](design-log/046-whatsapp-video-uploads.md). |
| Team members | `TeamMembers` | Add a row. Photo, name, role, bio, etc. |
| Community FAQ (meals, aliya, gabbai, taharas hamishpacha, beis din) | `CommunityPage` | Edit the single row — one group of fields per topic. See schema below. The Aliya topic has no CMS fields at all — its wording and contact (Rabbi Isaac Bernstein) are hardcoded in `community.astro`, see [#061](design-log/061-community-page-aliya-faq.md). |
| Community members ("Meet some of the members" section on /community) | `CommunityMembers` | Add a row per family: photo, name, description. Same hover/tap-to-reveal card as the team page. |
| Youth programs (on /youth) | `YouthPrograms` | Add a row per program: title, description, contact rabbi, optional photo + flyer. |
| Past events archive (on /events) | `PastEvents` | Add a row per past event: title, date, photo gallery, optional flyer + blurb. Shows newest first. |
| Davening times (weekday + Shabbos) | *(computed)* + `DaveningTimes` | Regular minyanim **and** the Shabbos schedule are calculated from zmanim in code (design-log #040, #041) — don't enter them as rows. Use `DaveningTimes` only for extras (Selichos, special weeks): `dayType = Weekday` rows appear under the weekday table, `dayType = Shabbat` rows under Shabbos Day. |
| Flyers (images / PDFs) | `Flyers` | Add a row per flyer. Set `category` to one of the three slugs that render — `events`, `learning`, `schedules` (see schema below; `youth` is accepted but invisible). For event flyers, set `removeAfter` so they drop off the site on their own. |
| Torah Sheets (Parsha Bytes, Dor L'Dor, Source Sheets) | `TorahSheets` | Add a row per sheet: title, series, category/subcategory (or topic for Source Sheets), date, and either a PDF file or a Canva embed link. See schema below and [#053](design-log/053-torah-sheets-page.md). |
| Footer address, phone, email | `ContactInfo` | Edit the single row. Leave a field empty to hide it from the footer. |
| Footer social links | `ContactInfo` | Fill in any of `facebookUrl`, `instagramUrl`, `youtubeUrl`, `whatsappUrl`, `twitterUrl`, `linkedinUrl`. Empty = icon hidden. (`whatsappUrl` should be the main community invite — same link as `HomePage.whatsappJoinHref`.) |
| Donate page (intro text, suggested amounts, donation designations) | `DonatePage` | Edit the single row. See schema below — the `apiValid` field is what switches the page from a "Donate Securely" link into the full on-site card form. |
| Brand colors (the gold, the navy, the bright accent) | `ThemeSettings` | Edit the single row. Put a hex code (e.g. `#d6a21e`) in `primaryGold` / `primaryNavy` / `accent`. The whole matching scale across the site recolors. Leave a field empty to keep the built-in color. See [#028](design-log/028-cms-editable-theme-colors.md). |

### Two ways to edit content

**1. Wix dashboard**
Open `https://manage.wix.com` → pick the site → CMS → click the collection → edit rows.

**2. Claude.ai + Wix MCP**
Connect the Wix connector/MCP to your Claude.ai account once. Then, tell the chat that you have a Wix site that you want to update content for. The content is all managed in CMS collections, so you can also ask the chat to list those collections first and what they include (they're listed above here too).

Examples:

- "Add this image to the 'Who We Are' history timeline of my Wix site <id> with title 'Beis Medrash Opens'" — Claude uploads + creates the row
- "Add these five milestones to the OurHistory collection on my Wix site <id>, each with a title and caption" — done in one prompt
- "Add a team member to my Wix site <id>: Rabbi Cohen, role 'Maggid Shiur', ..." — done

Connection setup: `https://dev.wix.com/docs/mcp/getting-started`:
Login + grant permission to the site.
Use the same Wix account you've been given site access on.

### What you *cannot* change without a code PR

These are code/design changes:

- Fonts, layout, spacing
- **Fine-grained colors** — individual shades, gradients, or recoloring one component. The *brand anchors* (gold, navy, accent) are editable via the `ThemeSettings` collection above, but the derived shade scale and per-element colors are not.
- Adding a new section to a page
- Adding a new page or route
- Changing how the slideshow behaves (auto-advance speed, transitions)
- Anything involving CSS, HTML structure, or JavaScript

For these, ask Danielle.

### Collection schemas (fields)

If a field name doesn't match exactly what's listed here, the code can't see it. Field names are case-sensitive.

#### `HomePage` — exactly **one** row, never more

| Field | Type | Notes |
|---|---|---|
| heroEyebrow | Text | Optional promo line above the headline (e.g. "Chag Sameach!"). Leave empty for none. |
| heroTitle | Text | **Unused — kept for legacy.** Headline is hardcoded ("RCK" + credit line). See [design-log/009](design-log/009-rck-brand-identity.md). |
| heroSubtitle | Text | One-line tagline under the brand line |
| heroImage | Image | **Unused — legacy.** The hero background now lives in the `HeroMedia` collection (single source of truth). See [design-log/030](design-log/030-hero-single-source-of-truth.md). |
| heroPrimaryCtaLabel | Text | "Our Schedule" |
| heroPrimaryCtaHref | Text | "/daven" (relative path) |
| heroSecondaryCtaLabel | Text | "Our Programs" |
| heroSecondaryCtaHref | Text | "/events" |
| statNumber1 / statLabel1 | Text | **`statNumber1` is ignored** — "Years of Devotion" counts years since RCK's November 1998 founding and is computed in code (`src/lib/founding.ts`), ticking up automatically every November so it never needs editing. `statLabel1` still controls the label text. See [design-log/058](design-log/058-automated-years-of-devotion.md). |
| statNumber2 / statLabel2 | Text | e.g. "100+" / "Shiurim Weekly" |
| statNumber3 / statLabel3 | Text | e.g. "1,000" / "Hours of Torah Weekly" |
| statNumber4 / statLabel4 | Text | e.g. "HUNDREDS" / "Of Families Connected" |
| statNumber5 / statLabel5 | Text | e.g. "THOUSANDS" / "Of Lives Impacted" |
| imageTextSection1EyebrowLead | Text | Optional leading eyebrow word, shown navy *before* the gold word (so the row reads navy → gold → navy). Leave empty for none. Section 1 default: empty. |
| imageTextSection1EyebrowGold | Text | Section 1 (first image+text band). Dashboard label "Section 1 — Eyebrow word (gold)". Default "UNIQUE". |
| imageTextSection1EyebrowNavy | Text | Default "IMPACTFUL" |
| imageTextSection1TitleLine1 | Text | Default "A Community Kollel" |
| imageTextSection1TitleLine2 | Text | Default "in Israel" |
| imageTextSection1Body | Text | Paragraph |
| imageTextSection1Image | Image | Optional |
| imageTextSection1ImageOn | Text | Which side the photo sits on: `left` or `right`. Empty = `left`. Forgiving about case/spacing. |
| imageTextSection1AccentLine | Text | Which headline line gets the animated gold marker: `line1` or `line2`. Empty = `line2`. Also accepts `first`/`second`. |
| imageTextSection2EyebrowLead | Text | Optional leading eyebrow word, shown navy *before* the gold word (navy → gold → navy). Section 2 default: "VIBRANT" (so the eyebrow reads VIBRANT · TORAH · VISION = blue · yellow · blue). |
| imageTextSection2EyebrowGold | Text | Section 2 (second image+text band). Default "TORAH". |
| imageTextSection2EyebrowNavy | Text | Default "VISION" |
| imageTextSection2TitleLine1 | Text | Default "A Kollel Dedicated to" |
| imageTextSection2TitleLine2 | Text | Default "Torah and Growth" |
| imageTextSection2Body | Text | Paragraph |
| imageTextSection2Image | Image | Optional |
| imageTextSection2ImageOn | Text | Which side the photo sits on: `left` or `right`. Empty = `right`. Forgiving about case/spacing. |
| imageTextSection2AccentLine | Text | Which headline line gets the animated gold marker: `line1` or `line2`. Empty = `line2`. Also accepts `first`/`second`. |
| whoWeAreTitle | Text | "Who We Are" |

> **Naming note:** these two bands are named by position (Section 1 / Section 2), not by their current content, so the office can repurpose what each is about without the field names lying. Renamed from `uniqueImpactful*`/`torahVision*` — see [design-log/019](design-log/019-generic-split-section-field-names.md). The legacy keys still exist in the CMS during the transition and are deleted after the rename ships; code reads the new keys with a fallback to the legacy ones.
| whoWeAreHebrew | Text | Hebrew tagline (Pirkei Avot) — the section subtitle |
| joinUsCard1Title | Text | "Daven with Us" |
| joinUsCard1Subtitle | Text | "Daily Tefillah & Minyanim" |
| joinUsCard1Href | Text | "/daven" |
| joinUsCard1Icon | Text | One of: `book`, `reader`, `people`, `minyan` |
| joinUsCard1Image | Image | Optional photo behind the card. A lightened yellow wash sits over it (keeps the brand color, photo still shows). Empty = plain gold card. |
| joinUsCard2Title | Text | "Learn with Us" |
| joinUsCard2Subtitle | Text | "Weekly Shiurim & Chavrutas" |
| joinUsCard2Href | Text | "/learn" |
| joinUsCard2Icon | Text | One of: `book`, `reader`, `people`, `minyan` |
| joinUsCard2Image | Image | Optional photo behind the card (see card 1). |
| joinUsCard3Title | Text | "Our Programs" |
| joinUsCard3Subtitle | Text | "Connection & Community" |
| joinUsCard3Href | Text | "/events" |
| joinUsCard3Icon | Text | One of: `book`, `reader`, `people`, `minyan` |
| joinUsCard3Image | Image | Optional photo behind the card (see card 1). |
| whatsappTitleLead | Text | Heading text *before* the highlighted word. Empty = "Join our WhatsApp". |
| whatsappTitleAccent | Text | The word that gets the animated gold marker. Empty = "community". |
| whatsappTitleTrail | Text | Heading text *after* the highlighted word. Empty = nothing. (Lead + Accent + Trail let you highlight any word in the heading.) |
| whatsappBody | Text | The line under the heading. |
| whatsappJoinLabel | Text | Green join-button label. Empty = "Join the community". |
| whatsappJoinHref | Text | Green join-button link — the main community invite (e.g. a `chat.whatsapp.com/…` link). |
| whatsappMembersNote | Text | Optional small trust line under the button (e.g. "Over 400 members"). Empty = hidden. |

> The chat-group list and the featured video tiles moved to the **`WhatsappGroups`** collection (below) — the old `whatsappChatList` and `whatsappShort1–4` fields are retired. See [design-log/044](design-log/044-whatsapp-groups-collection.md).

#### `WhatsappGroups` — one row per chat group

Drives the WhatsApp band's left-hand group list *and* the featured video tiles on the right.

| Field | Type | Notes |
|---|---|---|
| name | Text | Group name, e.g. "Halacha2Go". Shows in the left-hand list. (Tiles show no title — the videos speak for themselves.) |
| description | Text | One-liner under a featured group's video tile. |
| joinHref | URL | That group's `chat.whatsapp.com` invite. Makes the group's entry in the left-hand list clickable, and shows a "Join chat" link under its video tile. |
| videoGallery | Media Gallery | Drag video files in directly (e.g. exported from a phone) — no URL-pasting needed. Combines with `videoUrls` below; visitors flip between *all* of a group's videos (uploads + links) with ‹ › arrows. See [#046](design-log/046-whatsapp-video-uploads.md). |
| videoUrls | Text | YouTube links, **one per line** — any form works (`watch?v=`, `/shorts/`, `youtu.be`, or a bare video ID). Direct video file links (e.g. copied from Wix's Media Manager) also work here as plain text if you'd rather paste than upload. |
| image | Image | Optional custom poster. Empty = an uploaded video's auto thumbnail, then a YouTube video's thumbnail, then an "RCK" placeholder. |
| featured | Boolean | Tick to show this group as a video tile on the right (first four featured rows appear). Unticked rows only appear in the list. |
| sortOrder | Number | Display order, lower first — for both the list and the tiles. |
| active | Boolean | Untick to hide a group everywhere without deleting it. |

> A subchat tile is shown when it has a name or a video; empty slots are hidden. Four slots max — a fifth needs code.

#### `OurHistory` — one row per milestone (5–10 typical)

Drives the horizontally-scrollable history timeline under "Who We Are" on the homepage. Rows are ordered by `sortOrder`, lowest first — that is the one and only ordering knob.

| Field | Type | Notes |
|---|---|---|
| image | Image | Required. Shown as the milestone photo. |
| hebrew | Text | Optional Hebrew accent line, e.g. `מאין באנו`. Shown in gold in the top-right corner of the card. Leave empty for none. (Renamed from `year` — see [design-log/043](design-log/043-ourhistory-hebrew-field-timeline-nav.md).) |
| title | Text | Milestone heading shown on the photo |
| caption | Text | Description under the title. The "Today and Onward" row's caption contains the token `{{YEARS_IN}}`, replaced at render time with the same computed, spelled-out year count as the homepage's "Years of Devotion" stat (e.g. "Twenty-eight") — keep that token in place rather than typing the number, or it'll stop auto-updating each November. See [design-log/058](design-log/058-automated-years-of-devotion.md). |
| sortOrder | Number | Display order. Lower numbers first. |
| active | Boolean | Hide a milestone without deleting it |

> Renamed from the old `HomepageSlides` collection. See [design-log/015](design-log/015-history-timeline.md) and [design-log/043](design-log/043-ourhistory-hebrew-field-timeline-nav.md).

#### `TeamMembers`

Fields: `firstName`, `lastName`, `hebrewName` (opt), `role`, `roleGroup`, `bio` (Rich Text), `photo` (Image), `email` (opt), `sortOrder` (Number), `featured` (Boolean).

**`roleGroup`** drives which of the **two** sections on /team a member appears in. The page is deliberately just **Kollel Leadership** and **Our Avreichim** — nothing else. The field is case-insensitive and forgiving about exact wording — type whatever feels natural:

| You type… | Lands in section |
|---|---|
| `Founder`, `Director`, `Founder and Director`, `Executive Director`, `Leadership`, `President`, `Rosh Kollel`, `Rosh Chaburah`, `Roshei Kollel`, `Roshei Chaburos`, `Rabbi`, `Rav`, `Maggid Shiur` | **Kollel Leadership** |
| `Avreich`, `Avrech`, `Avreichim`, `Avrechim`, `Kollel`, `Yungerman`, `Yungerleit`, **or anything else / left blank** | **Our Avreichim** |

There is no third section and no catch-all: anything the alias map doesn't recognize falls through to **Our Avreichim**, so a member is never dropped. If a leadership member lands in Avreichim, it's because the value isn't in the leadership list above — fix the wording or ask the developer to extend the alias map in `src/lib/team.ts`.

**Youth rabbis live on the youth page, not here:** there is no longer a "Youth" section on /team. The **/youth page is built from the `YouthPrograms` collection** (see its schema below), where each program names its own contact rabbi. To put a rabbi's chaburah on the youth page, add a **`YouthPrograms`** row, not a team member. A rabbi can still have a `TeamMembers` row for their /team bio (as Leadership or Avreichim) *and* be the contact on a `YouthPrograms` row. See [design-log/017](design-log/017-events-and-youth-pages.md).

See design log [#025](design-log/025-team-page-two-sections.md) for why the taxonomy was cut to two sections (supersedes [#007](design-log/007-team-page-taxonomy-and-hover-reveal.md)).

#### `CommunityPage` — exactly **one** row, never more

Drives the FAQ topics on `/community`. The five questions themselves, and the sentence each name/link sits inside, are fixed page copy (not editable here) — this collection only holds the names/contact details spliced into those fixed sentences. The Aliya topic (see table above) isn't backed by this collection at all — it's fully hardcoded, contact included. See design log [#047](design-log/047-community-page.md), [#049](design-log/049-community-content-refinements.md), [#061](design-log/061-community-page-aliya-faq.md).

| Field | Type | Notes |
|---|---|---|
| mealsFamilyName | Text | Name of the family who coordinates meal hosting. Leave empty and the topic shows a "coming soon" note instead. |
| mealsPhone | Text | Their phone — becomes a tap-to-call link. |
| mealsEmail | Text | Their email — becomes a tap-to-email link. |
| mealsPhoto | Image | Photo of the family. |
| mealsDescription | Rich Text | Who they are / how they help. |
| gabbaiName | Text | The gabbai's name. Feeds directly into the fixed sentence "Contact our gabbai, **{name}**, regarding yahrtzeits, special simchas, and other gabbai matters." — his name links to the contact page with the subject pre-set to "Re: Gabbi". |
| gabbaiWifeName | Text | His wife's name. Feeds the fixed sentence "His wife, **{name}**, also leads our popular and exciting Tefillat Yeladim!" — her name links to the contact page with subject "Re: Tefillat Yeladim". Leave empty to drop that sentence entirely. |
| gabbaiPhone | Text | |
| gabbaiEmail | Text | |
| gabbaiPhoto | Image | |
| taharasEnglishRabbiName | Text | The primary English-speaking rav for taharas hamishpacha shaalos. Links to his `/team` bio section (`#leadership` or `#avreichim`, whichever his `TeamMembers` row is actually in) — keep the names in sync. |
| taharasEnglishRabbiPhone | Text | |
| taharasEnglishRabbiAddress | Text | Displayed exactly as entered (e.g. "46 Hafetz Haim"); the map link auto-appends Ra'anana/Israel behind the scenes, so don't add the city/country here just for that. |
| taharasEnglishRabbi2Name | Text | A second English-speaking rav, shown right under the first one in the same English column. Leave empty to show only one. Same `/team` linking behavior. |
| taharasEnglishRabbi2Phone | Text | |
| taharasEnglishRabbi2Address | Text | Same display/map behavior as `taharasEnglishRabbiAddress`. |
| taharasHebrewRabbiName | Text | The Hebrew-speaking rav. Same linking behavior as above. |
| taharasHebrewRabbiPhone | Text | |
| taharasHebrewRabbiAddress | Text | |
| beisDinContactName | Text | Who to contact to open a case / schedule an appointment. Feeds the fixed sentence "...Contact **{name}** to schedule an appointment." — their name links to their `/team` bio section, same as the taharas rabbis above. The "Our Services" checklist below it (Monetary Disputes, Arbitration & Mediation, Halachic Wills, Shalom Bayis, Halachic Contracts) is fixed page copy, not a field. |
| beisDinContactPhone | Text | |
| beisDinContactEmail | Text | |

> `gabbaiDescription`, `beisDinDescription`, and the `moving*` fields (`movingDescription`, `movingContactName`, `movingContactPhone`, `movingContactEmail`, `movingPhoto`) from the original design have been removed — the "Looking to move here?" topic was dropped entirely, and the gabbai/Beis Din paragraphs became fixed sentence templates with just a name spliced in (see [#049](design-log/049-community-content-refinements.md)).

#### `CommunityMembers` — one row per family

Drives the "Meet some of the members who make up our community!" section on `/community` — the same hover-to-reveal (desktop) / tap-to-reveal (mobile, labeled "Read about us!") card as `/team`. See design log [#047](design-log/047-community-page.md).

| Field | Type | Notes |
|---|---|---|
| familyName | Text | e.g. "The Cohen Family". Shown under the photo. |
| hebrewName | Text (opt) | Shown in gold under the family name. |
| description | Rich Text | Who they are, what they do, how they can help families who are moving here — shown in the hover/tap overlay. |
| photo | Image (opt) | Empty shows an initials monogram, same fallback as `TeamMembers`. |
| sortOrder | Number | Display order, lower first. |
| active | Boolean | Untick to hide a family without deleting the row. |

#### `YouthPrograms` — one row per youth program

Drives the **Youth Programming page** (`/youth`). Each row is one program (Dor L'Dor, Matmidim Chaburos, Teen Learning, …) and renders as its own section on the page. A program **always** needs a `title`, a `description`, and a contact rabbi; the photo is optional. **Every program shows a flyer slot** — if you haven't added a `flyerImage` yet, it shows a "Flyer coming soon" placeholder (so upload one, or accept the placeholder until you do). Rows are ordered by `sortOrder`.

| Field | Type | Notes |
|---|---|---|
| `title` | Text | Program name, e.g. `Dor L'Dor`, `Matmidim Chaburos`, `Teen Learning`. Shown as the big section heading. |
| `description` | Rich Text | What the program is. Paragraphs are preserved. |
| `gallery` | Media Gallery (opt) | Photos of the program's kids/teens — add as many as you like. **One** photo shows as a big banner; **more than one** becomes a big swipeable slideshow (with thumbnails on desktop, dots on mobile) below the flyer/description. Leave empty for none. |
| `flyerImage` | Image (opt) | **Preferred.** A static flyer image (export page 1 of the Canva design as PNG). Gets a click-to-enlarge viewer + Download button. |
| `flyerPdfUrl` | Text (opt) | Direct public PDF URL — fallback for multi-page documents. Checked after the image. |
| `contactName` | Text | The contact rabbi's name, e.g. `Rav Avraham Aharon`. |
| `contactEmail` | Text | The contact rabbi's email — becomes the "Email" link. Leave empty to show only the generic "Contact" button. |
| `sortOrder` | Number | Order of sections, lower first. |
| `active` | Boolean | Show/hide without deleting. |
| `linkedFlyerTitle` | Text (opt) | Exact `title` of a `Flyers` row in the `learning` category — when set, this program's flyer **mirrors that row's image/PDF** instead of `flyerImage`, so updating the Learning flyer updates the youth page too. Leave empty to keep uploading a separate `flyerImage` here. See design-log #057. |

**To add a rabbi's chaburah to the youth page:** add a `YouthPrograms` row — `title` = the program, `description` = the info, `contactName` + `contactEmail` = the rabbi. That's all that's required; add photos to `gallery` and/or a flyer if you have them. (This is separate from `TeamMembers` — see the note above.)

> The `Flyers` collection still has a `youth` category, but the `/youth` page no longer reads it — youth flyers belong on the `YouthPrograms` row now. Put youth flyers there.

**Sharing one flyer with the Learning page (e.g. Dor L'Dor):** if a program's flyer is also posted under `Flyers` (category `learning`, e.g. "Dor L'Dor for Boys"), set `linkedFlyerTitle` on the `YouthPrograms` row to that exact title instead of uploading `flyerImage` separately. From then on, updating the Learning flyer's image updates this program's flyer automatically — no more editing two places.

#### `PastEvents` — one row per past event

Drives the **Past Events archive** on `/events` (below the upcoming flyers). Each
row is one event; the page shows a list of event **names** (newest first) and,
when you click a name, that event's **photos, video(s), and flyer** appear
beside each other. Clicking any photo or video thumbnail opens the full-size
viewer — photos and videos are one continuous "swipe through" sequence there,
videos always last. An event needs a `title`; everything else is optional (an
event with no photos, videos, and no flyer still shows as a titled blurb).
Same field shape as `YouthPrograms`. See design log #027, [#050](design-log/050-past-events-video-and-scrubber.md).

| Field | Type | Notes |
|---|---|---|
| `title` | Text | Event name — this is the clickable label in the side list. |
| `eventDate` | Date (opt) | Used to sort newest-first and to caption the panel (e.g. "November 2025"). Leave empty and the event sinks to the bottom. |
| `gallery` | Media Gallery (opt) | Event photos — add as many as you like. **One** shows as a single image; **more** become a swipeable slideshow (thumbnails on desktop, dots on mobile). |
| `videoUrls` | Text (opt) | Video links, **one per line** — any YouTube URL form (`watch?v=`, `youtu.be/`, `/shorts/`, or a bare video ID) works. Shown as extra thumbnails (with a play-button overlay) after the photos; clicking one opens it right in the same full-size viewer the photos use. Same field convention as `WhatsappGroups.videoUrls`. |
| `flyerImage` | Image (opt) | **Preferred.** A static flyer image (export page 1 of the Canva design as PNG). Gets a click-to-enlarge viewer + Download button. |
| `flyerPdfUrl` | Text (opt) | Direct public PDF URL — fallback for multi-page documents. Checked after the image. |
| `blurb` | Rich Text (opt) | A short description shown above the photos. Paragraphs preserved. |
| `sortOrder` | Number (opt) | Tiebreaker only — orders events that share the same `eventDate` (lower first). |
| `active` | Boolean | Show/hide without deleting. |

**To add a past event:** add a `PastEvents` row — `title` + `eventDate`, drop the
photos into `gallery`, paste any video links into `videoUrls`, and add the flyer
(`flyerImage`, or `flyerPdfUrl`) if you have one. It appears in the archive
automatically, newest first.

#### `DaveningTimes`

**The regular weekday minyanim and the Shabbos schedule are computed in code,
not entered here** (see [design-log/040](design-log/040-computed-davening-times.md)
and [design-log/041](design-log/041-computed-shabbos-times.md)). The site
calculates weekday Shacharis / Mincha / Maariv each week from Ra'anana zmanim
using the rav's rules (mincha gedolah with a 12:50 floor, shkiya − 10, shkiya
+ 18, the seasonal 6:00 pm and 8:00 pm minyanim, Rosh Chodesh 7:00 & 8:05),
fixed for each Sun–Thu week the way the flyer is. The Shabbos block (hadlakas
neiros, Mincha & Kabbalos Shabbos, the fixed morning times, Beis Medrash,
Mincha, Maariv at tzeis) is likewise computed per week and rolls to the next
Shabbos on Motzei Shabbos. **Do not re-add any of those times as rows — they
would show up twice.** If a computed time ever disagrees with the flyer, run
`node scripts/verify-zmanim.mjs` and compare with myzmanim / hebcal, or ask
for a rule change in `src/lib/zmanim-schedule.ts`.

This collection is still used for **extras**: seasonal services (e.g.
Selichos) and special one-off rows. One row per service-time variant.
`dayType = Weekday` rows render *after* the computed weekday times, grouped
by service name; `dayType = Shabbat` rows render at the end of the computed
Shabbos Day list.

> **Five existing rows are broken, on purpose for now — don't "fix" them.** They
> are KBA's Shabbos times, entered before #041 computed the Shabbos block, and
> their `dayType` says `Shabbos` so they render nowhere. Two of them (Shacharis
> 8:45, Tefillat Yeladim 10:00) are *identical* to the computed times and one
> contradicts it (Mincha 7:15 vs the computed 7:10), so correcting the spelling
> would show those times twice on the page. The right cleanup is to untick
> `active` on all five — ask Danielle. Full detail in
> [#008's addendum](design-log/008-davening-flat-layout-shabbat-static.md).

| Field | Type | Notes |
|---|---|---|
| service | Text | `Shacharis`, `Mincha`, `Maariv`, `Selichos` |
| dayType | Text | `Weekday` or `Shabbat` — controls which section the row appears under. **Spelled `Shabbat`, not `Shabbos`**, unlike the rest of the site. Anything else matches neither section and the row appears nowhere, with no error. |
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

#### `DonatePage` — exactly **one** row, never more

Powers `/donate` (design-log [#042](design-log/042-donate-page-nedarim-plus.md)). Payments are processed by **Nedarim Plus** (the same provider as the old site). The page has two modes:

- **`apiValid` empty (current):** the page shows a "Donate Securely" button that opens the Kollel's hosted Nedarim Plus donation page (`hostedPageUrl`). Works today, nothing to configure.
- **`apiValid` filled:** the page shows the full on-site donation form (amounts, one-time/monthly, designations) with only the card fields inside Nedarim Plus's secure iframe. To turn this on, ask the Nedarim Plus office (מוקד נדרים פלוס) for the mosad's **ApiValid** code for iframe integration and paste it into the field.

| Field | Type | Notes |
|---|---|---|
| mosadId | Text | The Kollel's 7-digit Nedarim Plus mosad ID (`7013258`). Don't change unless the Kollel switches Nedarim Plus accounts. |
| apiValid | Text | Nedarim Plus iframe verification code ("טקסט אימות"). Empty = hosted-page fallback mode (see above). |
| hostedPageUrl | Text | The Kollel's hosted Nedarim Plus donation page. Used as the fallback button and as the escape hatch if the card iframe fails to load. |
| introText | Text | The "Why your gift matters" paragraph on the left side of the page. |
| suggestedAmounts | Text | Comma-separated whole shekel amounts for the preset buttons, e.g. `180, 360, 540, 1800`. Empty = only the free-amount box. |
| purposes | Text | One designation per line, formatted `Label \| Nedarim Plus category` — the label is what donors see; the category (after the `\|`) must match a category name in the Kollel's Nedarim Plus dashboard so donations land in the right report bucket. A line with no `\|` is used as both. Empty = no designation dropdown. |

#### `HeroMedia` — one row per hero slide

**The single source for the homepage hero background.** Each row is one slide.
**One** active row with an image = a static hero image. **Several** rows = an
ordered, crossfading sequence of images and silent videos (plays in `sortOrder`
order and loops). If the collection is **empty**, the hero shows the brand
gradient placeholder. (`HomePage.heroImage` is legacy and no longer used — see
[#030](design-log/030-hero-single-source-of-truth.md).) See also
[design-log/029](design-log/029-hero-media-sequence.md).

| Field | Type | Notes |
|---|---|---|
| `image` | Image (opt) | An image slide. Used when `video` on the same row is empty. |
| `video` | Video (opt) | A **silent** video slide. If set, it's used instead of `image` on this row. It plays **once** (muted) then crossfades to the next slide. Keep clips short (~15s) — it autoplays on the homepage. |
| `holdSeconds` | Number (opt) | Image slides only: how many seconds to show before crossfading. Default 6. Ignored for video. |
| `sortOrder` | Number | Slide order, lower first. |
| `active` | Boolean | Uncheck to hide a slide without deleting it. |

**To build an image → video → image sequence:** add three rows — row 1 an
`image` (`sortOrder` 1), row 2 a `video` (`sortOrder` 2), row 3 an `image`
(`sortOrder` 3). Set them all `active`. The hero will fade image → video (which
plays silently once) → image, then loop.

> Videos are muted and play inline. On phones/tablets the sequence still runs.
> Visitors who turn on "reduce motion" see just the first slide (a video shows
> its thumbnail), with no autoplay — by design.

#### `ThemeSettings` — exactly **one** row, never more

Controls the site's brand colors. Each field is a **hex code** typed as text
(e.g. `#d6a21e`). Leave a field **empty** to keep the built-in color for that
family. The site derives a full, coherent light→dark scale from each anchor you
set, so the whole site recolors together while staying legible. See
[design-log/028](design-log/028-cms-editable-theme-colors.md).

| Field | Type | Notes |
|---|---|---|
| primaryGold | Text | Main brand gold. Today's default is `#d6a21e`. Sets the whole gold scale. Empty = keep default. |
| primaryNavy | Text | Main brand navy. Today's default is `#102a56`. Sets the whole navy scale. Empty = keep default. |
| accent | Text | Bright highlight color (the highlight-marker wash, active tabs). Today's default is `#f6ed49`. Empty = keep default. |

> **What this does and doesn't do.** It changes the *hue* and *saturation* of a
> color family while keeping the brand's light/dark structure — so a button
> never ends up with text you can't read. It is intentionally **not** per-shade
> control: if you type a dark color it shifts the brand toward that color's hue
> but stays in the same brightness range. Type a valid hex; if you mistype, the
> site simply keeps the current color (a bad value can't break the page).
>
> **Subtle exception:** a few decorative *glow shadows* (e.g. on the Join Us
> cards) keep their original gold tint and won't follow a recolor. They're faint
> and easy to miss; ask the developer if you need them changed too.

#### `Flyers`

One row per flyer. Set **`imageUrl`** (preferred) or **`pdfUrl`** — a row with neither set shows a "Flyer coming soon" placeholder on the site, so it should have `isActive = false` until you add one. When both are set, the image wins (checked **image → pdf → placeholder**).

> Flyers are **images**, not live Canva embeds. The Canva "Publish to Web" embed was removed (design log #031): it showed every page of a multi-page design and couldn't be downloaded. An exported page-1 image shows exactly one page, gets a click-to-enlarge viewer with a hover zoom, and gives visitors a **Download** button.

| Field | Type | Notes |
|---|---|---|
| title | Text | Display name shown on site. **On a `learning` row, this text also doubles as a link key** — see the callout below the table before renaming one. |
| category | Text | **Use one of:** `schedules`, `learning`, `events` (lowercase, exact). Wrong value = flyer silently hidden. `youth` is a fourth accepted value that **no page renders** — see the slug table below. |
| imageUrl | Text | **Preferred — this is the one the page reads.** A public image URL (export page 1 of the Canva design as PNG). Gets the hover zoom, click-to-enlarge viewer, and Download button. |
| ~~image~~ | — | **Don't use.** The collection has a second image field that nothing reads. Most rows hold the same URL in both, but only `imageUrl` reaches the page — fill `image` alone and the flyer shows "Flyer coming soon". See [#010's addendum](design-log/010-flyers-cms-collection.md). |
| pdfUrl | Text | Direct public PDF URL — fallback for genuinely multi-page documents. Checked after the image. |
| isActive | Boolean | Show/hide without deleting. Default: true (checked). |
| displayOrder | Number | Sort order within the category. Lower = first. |
| subCategory | Tags | Optional. Filter tags — add as many per flyer as apply (e.g. `Halacha`, `Men`, `Sunday`, `Night`). The site groups them automatically into **Topic / Audience / Day / Time** rows in the filter panel: weekdays + `Daily`/`Shabbos`/`Motzei-Shabbos` land under Day, `Morning`/`Afternoon`/`Evening`/`Night` under Time, `Men`/`Women`/`Boys`/`Girls`/`Kids`/`Teens`/`Youth`/`Family`/`Community` under Audience, and anything else under Topic. A flyer must match **every** currently-selected filter to show (picking "Men" and "Monday" hides anything that isn't tagged both). Capitalization doesn't matter (`daily` and `Daily` are the same tag), but tags must not contain the `\|` character. Leave empty if no sub-filtering needed. **Exception:** the `learning` row titled exactly "Community Schedule" always shows, first, under every filter combination, regardless of its own tags — see the callout below. |
| removeAfter | Date | Optional. The last day the flyer should appear. It stays up through that whole day (Israel time) and drops off the site by itself the next morning. **Leave empty for anything evergreen** (a standing schedule, a learning program). Only put a date on things that go stale — mainly event flyers. The row is *not* deleted: to bring a flyer back, just change the date to a future one. |
| linkedFlyerTitle | Text | Optional. Exact `title` of another `Flyers` row in the `learning` category — when set, **this row's image/PDF is ignored** and it mirrors that learning row's `imageUrl`/`pdfUrl` instead. Use this on a `schedules`/`youth`/`events` row that's really the same flyer as one already posted under Learning, so you only update the image once. Learning rows themselves never follow a link (they're always the source). See design-log #057. |

> **Renaming a `learning` flyer's `title` changes what it's linked to — do it on purpose.** `linkedFlyerTitle` (on this collection and on `YouthPrograms`) matches by exact text, not a stable ID, so retitling a `learning` row silently repoints or breaks every link pointing at it: the linked row just keeps showing whatever image it last had, with no error anywhere. As of design-log #057, the rows currently pointing at a `learning` title are: `YouthPrograms` "Dor L'Dor for Boys" → `Dor L'Dor for Boys`, "Dor L'Dor for Girls" → `Dor L'Dor for Girls`, "Matmidim Chaburos & Program" → `Learn & Grow Chaburos for Kids`; and the `Flyers`/`schedules` "Daily Schedule" row → `Community Schedule`. If you rename any of those four `learning` titles, update the matching `linkedFlyerTitle` value(s) to match, or the link quietly stops working.
>
> **The `/learn` page's "always show first" behavior also depends on that exact title.** `src/pages/learn.astro` checks `flyer.title === "Community Schedule"` to decide which `learning` card bypasses every filter and pins to the front of the grid (design-log #059). Renaming that row breaks this the same silent way — the card just becomes a normal, filterable flyer again, no error anywhere.

**Exporting a flyer image from Canva:** open the design → **Share → Download → PNG**, and select **page 1 only**. Upload that PNG into the row's image field (or paste a public image URL). That's the whole step.

**`category` slugs — three that render, one that doesn't:**

| Type this… | Shows under… | On page |
|---|---|---|
| `events` | Events | `/events` |
| `learning` | Learning | `/learn` |
| `schedules` | Schedules | `/daven` — **only with the `daily` tag**, see below |
| ~~`youth`~~ | **nothing — do not use** | none |

> **`youth` is accepted and invisible.** The Youth page is built from `YouthPrograms` rows, not from flyers ([#017](design-log/017-events-and-youth-pages.md)), so a flyer filed under `youth` appears on **no page at all** — the spelling is right, nothing errors, and it simply isn't anywhere. Youth flyers go on the `YouthPrograms` row (see that schema above). A one-off youth *event* is `events` with an audience tag like `Kids` or `Teens`. See [#055](design-log/055-upload-skill-triage.md).

**Special reserved `subCategory` tags — do not reuse for general filtering:**

| category | subCategory tag | Where it appears |
|---|---|---|
| `schedules` | `daily` (any capitalization) | Featured daily learning schedule on the Daven with Us page, below the minyan times. |

> **The Schedules section has exactly one slot**, and the `daily` tag is what fills it. A `schedules` flyer **without** the tag appears on no page; a **second** one with the tag appears on no page either, because only the first active row shows. So a new weekly schedule is a picture replacement on the existing row, not a new row.

To swap the daily schedule: edit the one row with `category = schedules` and the `daily` tag. Update `imageUrl` with the new page-1 export. No code change needed.

> That `schedules` row's `linkedFlyerTitle` is set to `Community Schedule` (a `learning`-category row also shown on `/learn`), so as of design-log #057 **the two pages already share one image** — editing `Community Schedule`'s `imageUrl` updates both. Only touch the `schedules` row's own `imageUrl` if you want it to show something different from `/learn`.

#### The easy way to add a flyer (chat, no dashboard)

You don't have to hunt through the CMS dashboard. Once the Wix connector is linked to your Claude.ai account (see "Claude.ai + Wix MCP" above), export the page-1 PNG from Canva, attach it, and describe the flyer — Claude uploads the image and fills in the row:

> Add a flyer to my Wix site `<site-id>`: title "Shavuos Night Learning", category `events`, [attach the PNG]. Take it down after June 2, 2026.

Claude uploads the image, creates the row with the right `category` slug, and sets `removeAfter` for you. A few more examples:

> Add this to the `learning` flyers, title "Summer Chaburah Schedule", no end date — it's ongoing. [attach the PNG]

> The Pesach event flyer is over — set its `removeAfter` to yesterday so it drops off. (Or: hide it by setting `isActive` to false.)

The **one** thing only you can do is the Canva step: open the design, Download page 1 as PNG. Everything after that is a sentence.

#### Why flyers aren't synced from Canva automatically

A fair question: why can't the site just *watch* a Canva folder and show whatever's in it? Automating it would add a lot of fragile machinery for little gain:

- **There's no official Canva ↔ Wix connection**, and the third-party "connectors" (Zapier, Make) target the old drag-and-drop Wix editor, not the custom headless site we run.
- **Auto-export needs the Canva Connect API** — an OAuth app with token refresh and async export jobs. That's real plumbing that quietly breaks, for a flyer that changes a few times a year. We looked at it (design log #031) and decided it wasn't worth it yet.

So the deliberate, two-click export stays manual. The `removeAfter` date is the part of "automatic" actually worth having: set a take-down date once and old event flyers disappear on their own — that's the cleanup nobody wants to remember, so we automated *that*.

#### `TorahSheets` — one row per sheet

Powers the `/torah-sheets` hub page (Torah Bytes / Dor L'Dor ParshaLink / Source Sheets — the first two display under those labels on-site; `series` still just stores `Torah Bytes` / `Dor L'Dor`, not the full display label). See [design-log/053](design-log/053-torah-sheets-page.md).

| Field | Type | Notes |
|---|---|---|
| title | Text | Display name shown on the card |
| series | Text | **Must be one of** (exact): `Torah Bytes`, `Dor L'Dor`, `Source Sheets`. Wrong value = sheet silently hidden from every tab. (Renamed from `Parsha Bytes` — old value still accepted as an alias.) |
| category | Tags (a **list**, not one value) | For Torah Bytes/Dor L'Dor only — the Sefer, or `Chagim & Special Days`; Dor L'Dor also accepts `Pirkei Avos`. Each entry must be one of (exact): `Bereishis`, `Shemos`, `Vayikra`, `Bamidbar`, `Devarim`, `Chagim & Special Days`, `Pirkei Avos` (Dor L'Dor only). A sheet can carry **several** — that's how one row shows under both its parsha and its chag (see `chagSubcategory` below). Leave empty for Source Sheets. |
| subcategory | Text | The specific parsha (e.g. `Shemos`) or chag/special day (e.g. `Chanukah`) — case-insensitive match against a fixed list (see design-log #053 addendum 9); an unrecognized value still shows, just bucketed under "Other" in the sidebar (parsha buckets only — Chagim & Special Days has no "Other" bucket, so an unrecognized chag name there just doesn't get a filter button). Combined-parsha weeks (e.g. `Matos-Masei`, `Nitzavim-Vayeilech`) are recognized too, and surface under either component parsha's button, not their own. Pirkei Avos sheets don't need this field — use `avosPerek` instead (below). |
| chagSubcategory | Text | Optional — only needed when a sheet is tagged **both** a Sefer and `Chagim & Special Days` and you want it to show under a real chag/special-day name there too (e.g. a "Pinchas" sheet that's also about `Shiva Asar B'Tammuz`: `subcategory` stays `Pinchas` for the parsha filter, `chagSubcategory` = `Shiva Asar B'Tammuz` for the Chagim filter). Leave empty for chag-only sheets — they just use `subcategory` directly. See design-log #053 addendum 10. |
| avosPerek | Text | Required for Pirkei Avos sheets to get a chapter filter button — **must be one of** (exact): `Chapter 1` ... `Chapter 6`. A sheet tagged `Pirkei Avos` without this set still shows in "All Sheets" but gets no chapter filter button (same "real vocabulary only, no guessing" rule as `chagSubcategory`/`subcategory`'s Chagim behavior). See design-log #053 addendum 11. |
| topic | Text | Source Sheets only — any label (e.g. `Halacha`, `Hashkafa`, `Mussar`). Open-ended: the sidebar groups by whatever values actually appear. |
| year | Text | Display-only, e.g. `תשפ״ד` — shown next to the parsha/topic name on the card (no full date is tracked). |
| sourceType | Text | **Must be one of** (exact, lowercase): `pdf` or `canva`. Anything else is treated as `pdf`. |
| pdfFile | Document | Used when `sourceType = pdf`. Upload the PDF directly — that's the whole step, nothing else needed. Without a `pdfThumbnail` (below) the card shows a plain PDF icon with a download badge; clicking it opens the file. |
| pdfThumbnail | Image | Optional page-1 preview. **Never generated automatically** — Wix doesn't render a picture from a PDF, so until someone exports page 1 and uploads it here, the sheet shows the generic PDF icon instead of a real preview. Only the **featured** (top) card in each tab actually displays it, so it matters most in the week a sheet goes up. Once a sheet is no longer featured its thumbnail simply stops being shown — **leave it there.** There's no need to clear old ones "for tidiness": the page decides what to display, an unused value costs nothing, and deleting it throws away a preview that can't come back without re-rendering the PDF. |
| canvaEmbedUrl | Text | Used when `sourceType = canva` — the Canva **"Share → Embed"** link (looks like `https://www.canva.com/design/.../view?embed`). Renders as a live, always-current embed. |
| canvaPdfBackup | Document | Optional, Canva sheets only. A PDF exported from the same Canva design (**Share → Download → PDF**) — adds a download button next to the live embed. |

**Switching an existing sheet from PDF to a live Canva embed** (e.g. once you start updating a sheet after it's posted): change `sourceType` to `canva`, paste the embed link into `canvaEmbedUrl`, and optionally upload a `canvaPdfBackup`. No dev work needed — the page renders whichever `sourceType` each row has.

> Why Canva embeds are back for this collection specifically, after being removed everywhere else (design-log #031): a Torah source sheet is *meant* to show every page, unlike a flyer where showing extra pages was the bug. See design-log #053 for the full reasoning.

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
