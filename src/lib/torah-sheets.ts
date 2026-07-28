import { gematriyaStrToNum, HDate, Sedra } from "@hebcal/core";
import { items, auth } from "./wix-cms-admin";
import { resolveDocument, resolveImage } from "./wix-media";
import { slugify } from "./slug";

const COLLECTION_ID = "TorahSheets";

export type Series = "Torah Bytes" | "Dor L'Dor" | "Source Sheets";
export type SourceType = "pdf" | "canva";

export interface TorahSheet {
	_id: string;
	title: string;
	series: Series;
	/** Multiple tags allowed — a sheet can combine a parsha with Pirkei Avos and/or Chagim & Special Days and appear under all of them (design-log #053 addendum 7). */
	category?: string[];
	subcategory?: string;
	topic?: string;
	/** Display-only (e.g. "תשפ״ד") — the office doesn't track a full date. */
	year?: string;
	/**
	 * When this row was added — used to pick the featured upload (pickFeatured)
	 * and, for series with no reading-cycle concept, to order the card list
	 * itself (see sortByUploadRecency). Never shown on a card.
	 */
	createdDate?: string;
	sourceType: SourceType;
	canvaEmbedUrl?: string;
	pdfUrl?: string;
	pdfFilename?: string;
	/**
	 * A real page-1 preview, when one exists — only ever shown for the single
	 * "most recent" featured card (see design-log #053 addendum 2), not the
	 * plain icon every other PDF card uses. Most rows won't have one; that's
	 * expected, not an error.
	 */
	pdfThumbnailUrl?: string;
	canvaPdfUrl?: string;
	canvaPdfFilename?: string;
}

export interface SheetGroup {
	key: string;
	label: string;
	sheets: TorahSheet[];
}

export interface SheetSuperGroup {
	key: string;
	label: string;
	groups: SheetGroup[];
}

// Raw (lowercased, trimmed) CMS `series` values → canonical Series. A sheet
// whose series doesn't match anything here is dropped (same "wrong value =
// hidden" rule as Flyers.category — see CONTRIBUTING.md) since there's no
// safe default tab to fall back to across three genuinely different sidebars.
const SERIES_ALIASES: Record<string, Series> = {
	"torah bytes": "Torah Bytes",
	"parsha bytes": "Torah Bytes", // pre-rename value — see design-log #053 addendum
	"dor l'dor": "Dor L'Dor",
	"dor ldor": "Dor L'Dor",
	"source sheets": "Source Sheets",
};

function normalizeSeries(raw: unknown): Series | undefined {
	if (typeof raw !== "string") return undefined;
	return SERIES_ALIASES[raw.trim().toLowerCase()];
}

function normalizeSourceType(raw: unknown): SourceType {
	return typeof raw === "string" && raw.trim().toLowerCase() === "canva" ? "canva" : "pdf";
}

function toDateString(raw: unknown): string | undefined {
	if (!raw) return undefined;
	const d = raw instanceof Date ? raw : new Date(raw as string);
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function getTorahSheets(): Promise<TorahSheet[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID).limit(500).find();

		return (results as Record<string, unknown>[])
			.map((row): TorahSheet | undefined => {
				const series = normalizeSeries(row.series);
				if (!series) return undefined;
				const pdf = resolveDocument(row.pdfFile as string | undefined);
				const canvaPdf = resolveDocument(row.canvaPdfBackup as string | undefined);
				return {
					_id: row._id as string,
					title: (row.title as string) ?? "Untitled",
					series,
					category: Array.isArray(row.category)
						? (row.category as string[]).map((c) => c.trim()).filter(Boolean)
						: undefined,
					subcategory: (row.subcategory as string | undefined)?.trim(),
					topic: (row.topic as string | undefined)?.trim(),
					year: (row.year as string | undefined)?.trim() || undefined,
					createdDate: toDateString(row._createdDate),
					sourceType: normalizeSourceType(row.sourceType),
					canvaEmbedUrl: (row.canvaEmbedUrl as string | undefined)?.trim() || undefined,
					pdfUrl: pdf?.url,
					pdfFilename: pdf?.filename,
					pdfThumbnailUrl: resolveImage(row.pdfThumbnail as string | undefined, 400, 400),
					canvaPdfUrl: canvaPdf?.url,
					canvaPdfFilename: canvaPdf?.filename,
				};
			})
			.filter((s): s is TorahSheet => Boolean(s))
			.sort((a, b) => yearRank(b) - yearRank(a) || compareParshaOrder(a, b) || a.title.localeCompare(b.title));
	} catch (err) {
		console.error(`[torah-sheets] query failed:`, err);
		return [];
	}
}

// ── Closed vocabularies (never change — see tag-groups.ts precedent) ──

const SEFER_PARSHIOS: Record<string, string[]> = {
	Bereishis: ["Bereishis", "Noach", "Lech Lecha", "Vayeira", "Chayei Sarah", "Toldos", "Vayeitzei", "Vayishlach", "Vayeishev", "Mikeitz", "Vayigash", "Vayechi"],
	Shemos: ["Shemos", "Vaeira", "Bo", "Beshalach", "Yisro", "Mishpatim", "Terumah", "Tetzaveh", "Ki Sisa", "Vayakhel", "Vayakhel-Pekudei", "Pekudei"],
	Vayikra: ["Vayikra", "Tzav", "Shmini", "Tazria", "Tazria-Metzora", "Metzora", "Achrei Mos", "Achrei Mos-Kedoshim", "Kedoshim", "Emor", "Behar", "Behar-Bechukosai", "Bechukosai"],
	Bamidbar: ["Bamidbar", "Naso", "Behaaloscha", "Shlach", "Korach", "Chukas", "Balak", "Pinchas", "Matos", "Matos-Masei", "Masei"],
	Devarim: ["Devarim", "Vaeschanan", "Eikev", "Re'eh", "Shoftim", "Ki Seitzei", "Ki Savo", "Nitzavim", "Nitzavim-Vayeilech", "Vayeilech", "Haazinu", "Vezos Habracha"],
};
const SEFER_ORDER = Object.keys(SEFER_PARSHIOS);

const CHAGIM_LABEL = "Chagim & Special Days";
// Jewish calendar year order (Tishrei → Elul) — extend as new chagim/special
// days get their own sheets.
const CHAGIM_ORDER = ["Rosh Hashanah", "Yom Kippur", "Sukkos", "Chanukah", "Tu BiShvat", "Purim", "Pesach", "Shavuos"];
const PIRKEI_AVOS_LABEL = "Pirkei Avos";
const PIRKEI_AVOS_PERAKIM = ["Perek Aleph", "Perek Beis", "Perek Gimmel", "Perek Daled", "Perek Hei", "Perek Vav"];
const OTHER_LABEL = "Other";

/**
 * Hebrew year → number (e.g. "תשפ״ה" → 785) for sorting once multiple years'
 * sheets coexist in the collection — see yearRank below for why this has to
 * run before compareParshaOrder, not instead of it. Missing/unparseable
 * years (gematriyaStrToNum throws on non-Hebrew-numeral input) rank lowest
 * so a row without a year still shows, just at the end of its reading-cycle
 * position instead of breaking the sort.
 */
function yearRank(s: TorahSheet): number {
	if (!s.year) return -Infinity;
	try {
		return gematriyaStrToNum(s.year);
	} catch {
		return -Infinity;
	}
}

/**
 * Card list order — most recent first (dates aren't used, the office doesn't
 * track them; "most recent" means furthest along in the reading cycle) —
 * but only as a *tiebreaker within the same year* (see yearRank, applied
 * first by the caller). Without that year-first pass, a combined sheet like
 * "Nitzavim-Vayeilech" from a past year would outrank the current year's
 * plain "Nitzavim" just for sitting one slot later in the vocabulary below —
 * exactly the bug hit when תשפ״ה's sheets were added alongside תשפ״ד's
 * (see design-log #053 addendum 3). Within a year: Sefer reading order
 * *reversed* (Devarim → Bereishis) → parsha order within a Sefer also
 * reversed (last parsha first), then Chagim & Special Days (Jewish calendar
 * year order, also reversed) and Pirkei Avos (perek order, reversed), then
 * anything else (Source Sheets — no reading-order concept, so title is the
 * only sort key, applied as the caller's tiebreaker). An unrecognized
 * category/subcategory still sorts (at the end of its bucket) rather than
 * breaking the sort. The Sefer/Chagim/Pirkei-Avos *bucket* order itself is
 * unchanged (still: 5 Seforim, then Chagim, then Pirkei Avos) — only which
 * end of each bucket comes first flips.
 */
/** Whether a sheet is tagged with the given category label — a sheet can carry several (see TorahSheet.category). */
function hasCategory(s: TorahSheet, label: string): boolean {
	return s.category?.some((c) => c.toLowerCase() === label.toLowerCase()) ?? false;
}

function compareParshaOrder(a: TorahSheet, b: TorahSheet): number {
	const rank = (s: TorahSheet): [number, number] => {
		// A multi-category sheet's reading-cycle position is decided by its
		// Sefer tag first (the primary parsha-cycle identity), even if it's
		// also tagged Chagim/Pirkei Avos — those only decide rank when there's
		// no Sefer tag at all (a pure Pirkei-Avos or pure-chag sheet).
		const seferIndex = SEFER_ORDER.findIndex((sefer) => hasCategory(s, sefer));
		if (seferIndex !== -1) {
			const parshios = SEFER_PARSHIOS[SEFER_ORDER[seferIndex]];
			const subIndex = parshios.findIndex((p) => p.toLowerCase() === s.subcategory?.toLowerCase());
			const minor = subIndex === -1 ? parshios.length : parshios.length - 1 - subIndex;
			return [SEFER_ORDER.length - 1 - seferIndex, minor];
		}
		if (hasCategory(s, CHAGIM_LABEL)) {
			const chagIndex = CHAGIM_ORDER.findIndex((c) => c.toLowerCase() === s.subcategory?.toLowerCase());
			const minor = chagIndex === -1 ? CHAGIM_ORDER.length : CHAGIM_ORDER.length - 1 - chagIndex;
			return [SEFER_ORDER.length, minor];
		}
		if (hasCategory(s, PIRKEI_AVOS_LABEL)) {
			const perekIndex = PIRKEI_AVOS_PERAKIM.findIndex((p) => p.toLowerCase() === s.subcategory?.toLowerCase());
			const minor = perekIndex === -1 ? PIRKEI_AVOS_PERAKIM.length : PIRKEI_AVOS_PERAKIM.length - 1 - perekIndex;
			return [SEFER_ORDER.length + 1, minor];
		}
		return [SEFER_ORDER.length + 2, 0];
	};
	const [aMajor, aMinor] = rank(a);
	const [bMajor, bMinor] = rank(b);
	return aMajor - bMajor || aMinor - bMinor;
}

// hebcal's own parsha names (Sephardi/Modern-leaning spelling, e.g. "Bereshit",
// "Vaetchanan") → this site's Ashkenazi transliteration vocabulary above
// (SEFER_PARSHIOS). Only entries that actually differ; anything not listed
// here (Bamidbar, Beshalach, Bo, Devarim, Eikev, Emor, Korach, Mishpatim,
// Nitzavim-Vayeilech, Noach, Pinchas, Re'eh, Shmini, Shoftim, Tazria-Metzora,
// Terumah, Tetzaveh, Tzav, Vayechi, Vayeilech, Vayigash, Vayikra, Vayishlach)
// is already spelled the same in both. hebcal combines different parsha
// pairs in different Hebrew years (leap year / Israel vs Diaspora), so this
// covers both the standalone and combined forms of each.
const HEBCAL_TO_SITE_PARSHA: Record<string, string> = {
	"Achrei Mot-Kedoshim": "Achrei Mos-Kedoshim",
	"Achrei Mot": "Achrei Mos",
	"Beha'alotcha": "Behaaloscha",
	"Behar-Bechukotai": "Behar-Bechukosai",
	Bechukotai: "Bechukosai",
	Bereshit: "Bereishis",
	"Chayei Sara": "Chayei Sarah",
	Chukat: "Chukas",
	"Ha'azinu": "Haazinu",
	"Ki Tavo": "Ki Savo",
	"Ki Teitzei": "Ki Seitzei",
	"Ki Tisa": "Ki Sisa",
	"Lech-Lecha": "Lech Lecha",
	"Matot-Masei": "Matos-Masei",
	Matot: "Matos",
	Masei: "Masei",
	Miketz: "Mikeitz",
	Nasso: "Naso",
	"Sh'lach": "Shlach",
	Shemot: "Shemos",
	Toldot: "Toldos",
	Vaera: "Vaeira",
	Vaetchanan: "Vaeschanan",
	"Vayakhel-Pekudei": "Vayakhel-Pekudei",
	Vayera: "Vayeira",
	Vayeshev: "Vayeishev",
	Vayetzei: "Vayeitzei",
	Yitro: "Yisro",
};

/**
 * This site's vocabulary name(s) for whichever parsha the most recently
 * completed Shabbos actually read, per the real Hebrew calendar (via
 * hebcal) — used only to break ties within a batch upload (see pickFeatured
 * below). "Most recently completed" rather than "upcoming" because a Torah
 * Bytes sheet is a review of a parsha already read, not a preview of next
 * week's. A combined name hebcal doesn't have a direct site match for
 * (mismatched combination for this particular year vs. what the office
 * actually designed) is split on its hyphen so either half still matches.
 * Returns [] for a chag-only Shabbos with no regular parsha reading — the
 * caller falls back to the old reading-order heuristic in that case.
 */
function currentParshaSiteNames(today: Date = new Date()): string[] {
	const hd = new HDate(today);
	const shabbos = hd.onOrBefore(6);
	const sedra = new Sedra(shabbos.getFullYear(), false);
	const { parsha } = sedra.lookup(shabbos);
	if (!parsha || parsha.length === 0) return [];
	const hebcalName = parsha.join("-");
	const direct = HEBCAL_TO_SITE_PARSHA[hebcalName] ?? hebcalName;
	return [direct, ...direct.split("-")];
}

const BATCH_WINDOW_MS = 30 * 60 * 1000;

/**
 * Newest-upload-first order. Used where there's no reading-cycle concept to
 * order by instead (Source Sheets — see the "no reading-order concept" note
 * on getTorahSheets' sort) or where the ask is explicitly to ignore the
 * reading cycle and show what's newest regardless of series/year (All
 * Publications' unfiltered list). Missing/unparseable dates sort last rather
 * than breaking the order.
 */
export function sortByUploadRecency(sheets: TorahSheet[]): TorahSheet[] {
	const time = (s: TorahSheet) => (s.createdDate ? new Date(s.createdDate).getTime() : -Infinity);
	return [...sheets].sort((a, b) => time(b) - time(a));
}

/**
 * Which sheet in a tab gets pulled to the top of the list with a real
 * preview. A single new upload becomes that immediately (whatever the
 * newest `_createdDate` is) — no calendar lookup needed, it's simply *the*
 * current one now. Several sheets landing together (a batch import, several
 * `_createdDate`s within BATCH_WINDOW_MS of each other) have no individual
 * "most recent," so among those the pick falls back to whichever actually
 * matches the real current Hebrew-calendar parsha (currentParshaSiteNames)
 * — not just whichever sorts "furthest along" in the batch, which doesn't
 * track the real calendar once a batch spans many weeks (e.g. a 43-sheet
 * batch covering an entire year: the *last* parsha in reading order is
 * usually months away, not "now"). If nothing in the batch matches this
 * week's parsha (a chag-only Shabbos, or the batch just doesn't include the
 * current week), falls back further to the old furthest-along heuristic
 * rather than featuring nothing.
 */
export function pickFeatured(sheets: TorahSheet[]): TorahSheet | undefined {
	const withDates = sheets.filter((s): s is TorahSheet & { createdDate: string } => Boolean(s.createdDate));
	if (withDates.length === 0) return sheets[0];
	const maxTime = Math.max(...withDates.map((s) => new Date(s.createdDate).getTime()));
	const batch = withDates.filter((s) => maxTime - new Date(s.createdDate).getTime() <= BATCH_WINDOW_MS);
	if (batch.length === 1) return batch[0];

	const currentNames = currentParshaSiteNames().map((n) => n.toLowerCase());
	const calendarMatch = batch.find((s) => s.subcategory && currentNames.includes(s.subcategory.toLowerCase()));
	if (calendarMatch) return calendarMatch;

	// A batch with no Sefer/Chagim/Pirkei-Avos category (Source Sheets) has no
	// reading-order concept to fall back to — compareParshaOrder would just
	// tie every row into the same catch-all bucket and decide by title
	// instead, which isn't "most recent" by any real measure. Newest upload
	// wins instead, matching sortByUploadRecency's ordering for that series.
	if (batch.every((s) => !s.category || s.category.length === 0)) {
		return [...batch].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())[0];
	}

	return [...batch].sort(
		(a, b) => yearRank(b) - yearRank(a) || compareParshaOrder(a, b) || a.title.localeCompare(b.title),
	)[0];
}

/** Case/whitespace-insensitive match against a closed vocabulary list, preserving the list's canonical casing. */
function matchVocabulary(value: string | undefined, vocabulary: string[]): string | undefined {
	if (!value) return undefined;
	const needle = value.trim().toLowerCase();
	return vocabulary.find((v) => v.toLowerCase() === needle);
}

function bySubcategory(sheets: TorahSheet[], vocabulary: string[]): SheetGroup[] {
	return vocabulary
		.map((name) => ({
			key: slugify(name),
			label: name,
			sheets: sheets.filter((s) => matchVocabulary(s.subcategory, vocabulary) === name),
		}))
		.filter((g) => g.sheets.length > 0);
}

/** Sheets whose subcategory didn't match the given vocabulary — bucketed under "Other" rather than dropped. */
function otherGroup(sheets: TorahSheet[], vocabulary: string[]): SheetGroup | undefined {
	const leftover = sheets.filter((s) => !matchVocabulary(s.subcategory, vocabulary));
	return leftover.length > 0 ? { key: "other", label: OTHER_LABEL, sheets: leftover } : undefined;
}

/** Shared by Parsha Bytes and Dor L'Dor: one super-group per Sefer with populated parshios, plus Chagim & Special Days. */
function groupBySeferAndChagim(sheets: TorahSheet[]): SheetSuperGroup[] {
	const bySefer = Object.entries(SEFER_PARSHIOS).map(([sefer, parshios]): SheetSuperGroup => {
		const inSefer = sheets.filter((s) => hasCategory(s, sefer));
		const groups = bySubcategory(inSefer, parshios);
		const other = otherGroup(inSefer, parshios);
		return { key: slugify(sefer), label: sefer, groups: other ? [...groups, other] : groups };
	});

	const chagim = sheets.filter((s) => hasCategory(s, CHAGIM_LABEL));
	const chagimGroups: SheetGroup[] = [...new Set(chagim.map((s) => s.subcategory).filter((v): v is string => Boolean(v)))]
		.sort((a, b) => a.localeCompare(b))
		.map((name) => ({ key: slugify(name), label: name, sheets: chagim.filter((s) => s.subcategory === name) }));

	const superGroups = [...bySefer];
	if (chagimGroups.length > 0) superGroups.push({ key: slugify(CHAGIM_LABEL), label: CHAGIM_LABEL, groups: chagimGroups });

	return superGroups.filter((g) => g.groups.length > 0);
}

export function groupTorahBytes(sheets: TorahSheet[]): SheetSuperGroup[] {
	return groupBySeferAndChagim(sheets.filter((s) => s.series === "Torah Bytes"));
}

export function groupDorLDor(sheets: TorahSheet[]): SheetSuperGroup[] {
	const dorLDor = sheets.filter((s) => s.series === "Dor L'Dor");
	const superGroups = groupBySeferAndChagim(dorLDor);

	const pirkeiAvos = dorLDor.filter((s) => hasCategory(s, PIRKEI_AVOS_LABEL));
	const perakimGroups = bySubcategory(pirkeiAvos, PIRKEI_AVOS_PERAKIM);
	const other = otherGroup(pirkeiAvos, PIRKEI_AVOS_PERAKIM);
	const pirkeiAvosGroups = other ? [...perakimGroups, other] : perakimGroups;
	if (pirkeiAvosGroups.length > 0) {
		superGroups.push({ key: slugify(PIRKEI_AVOS_LABEL), label: PIRKEI_AVOS_LABEL, groups: pirkeiAvosGroups });
	}

	return superGroups;
}

/**
 * "All Publications": every sheet from every series in one browsable tree.
 * Sefer/Chagim buckets merge Torah Bytes and Dor L'Dor sheets under the same
 * parsha (so e.g. "Noach" shows both series' sheets together — the reading-
 * order vocabulary doesn't care which series a sheet belongs to), Pirkei
 * Avos folds in Dor L'Dor's perek sheets the same way groupDorLDor does, and
 * Source Sheets' topics get their own trailing super-group since they don't
 * fit the parsha-cycle structure at all.
 */
export function groupAllSheets(sheets: TorahSheet[]): SheetSuperGroup[] {
	const superGroups = groupBySeferAndChagim(sheets);

	const pirkeiAvos = sheets.filter((s) => hasCategory(s, PIRKEI_AVOS_LABEL));
	const perakimGroups = bySubcategory(pirkeiAvos, PIRKEI_AVOS_PERAKIM);
	const otherPerakim = otherGroup(pirkeiAvos, PIRKEI_AVOS_PERAKIM);
	const pirkeiAvosGroups = otherPerakim ? [...perakimGroups, otherPerakim] : perakimGroups;
	if (pirkeiAvosGroups.length > 0) {
		superGroups.push({ key: slugify(PIRKEI_AVOS_LABEL), label: PIRKEI_AVOS_LABEL, groups: pirkeiAvosGroups });
	}

	const sourceSheetGroups = groupSourceSheets(sheets);
	if (sourceSheetGroups.length > 0) {
		superGroups.push({ key: "source-sheets", label: "Source Sheets", groups: sourceSheetGroups });
	}

	return superGroups;
}

/** Source Sheets: flat groups by open-ended topic (sorted alphabetically), same "Other" bucket for untagged rows. */
export function groupSourceSheets(sheets: TorahSheet[]): SheetGroup[] {
	const sourceSheets = sheets.filter((s) => s.series === "Source Sheets");
	const topics = [...new Set(sourceSheets.map((s) => s.topic).filter((v): v is string => Boolean(v)))].sort((a, b) =>
		a.localeCompare(b),
	);
	const groups = topics.map((topic) => ({
		key: slugify(topic),
		label: topic,
		sheets: sourceSheets.filter((s) => s.topic === topic),
	}));
	const untagged = sourceSheets.filter((s) => !s.topic);
	return untagged.length > 0 ? [...groups, { key: "other", label: OTHER_LABEL, sheets: untagged }] : groups;
}
