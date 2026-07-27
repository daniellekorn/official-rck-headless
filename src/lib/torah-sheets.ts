import { items, auth } from "./wix-cms-admin";
import { resolveDocument, resolveImage, resolveImageFit } from "./wix-media";
import { slugify } from "./slug";

const COLLECTION_ID = "TorahSheets";

export type Series = "Torah Bytes" | "Dor L'Dor" | "Source Sheets";
export type SourceType = "pdf" | "canva";

export interface TorahSheet {
	_id: string;
	title: string;
	series: Series;
	category?: string;
	subcategory?: string;
	topic?: string;
	/** Display-only (e.g. "תשפ״ד") — the office doesn't track a full date. */
	year?: string;
	/** When this row was added — used only to feature the newest upload, never shown or sorted on. */
	createdDate?: string;
	sourceType: SourceType;
	canvaEmbedUrl?: string;
	pdfUrl?: string;
	pdfFilename?: string;
	/** Row-sized crop, for the list thumbnail. */
	pdfThumbnailUrl?: string;
	/** Larger, uncropped — for the "view larger" lightbox. */
	pdfThumbnailLargeUrl?: string;
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
				const thumbnail = row.pdfThumbnail as string | undefined;
				return {
					_id: row._id as string,
					title: (row.title as string) ?? "Untitled",
					series,
					category: (row.category as string | undefined)?.trim(),
					subcategory: (row.subcategory as string | undefined)?.trim(),
					topic: (row.topic as string | undefined)?.trim(),
					year: (row.year as string | undefined)?.trim() || undefined,
					createdDate: toDateString(row._createdDate),
					sourceType: normalizeSourceType(row.sourceType),
					canvaEmbedUrl: (row.canvaEmbedUrl as string | undefined)?.trim() || undefined,
					pdfUrl: pdf?.url,
					pdfFilename: pdf?.filename,
					pdfThumbnailUrl: resolveImage(thumbnail, 260, 260),
					pdfThumbnailLargeUrl: resolveImageFit(thumbnail, 1000, 1000),
					canvaPdfUrl: canvaPdf?.url,
					canvaPdfFilename: canvaPdf?.filename,
				};
			})
			.filter((s): s is TorahSheet => Boolean(s))
			.sort((a, b) => compareParshaOrder(a, b) || a.title.localeCompare(b.title));
	} catch (err) {
		console.error(`[torah-sheets] query failed:`, err);
		return [];
	}
}

// ── Closed vocabularies (never change — see tag-groups.ts precedent) ──

const SEFER_PARSHIOS: Record<string, string[]> = {
	Bereishis: ["Bereishis", "Noach", "Lech Lecha", "Vayeira", "Chayei Sarah", "Toldos", "Vayeitzei", "Vayishlach", "Vayeishev", "Mikeitz", "Vayigash", "Vayechi"],
	Shemos: ["Shemos", "Vaeira", "Bo", "Beshalach", "Yisro", "Mishpatim", "Terumah", "Tetzaveh", "Ki Sisa", "Vayakhel", "Pekudei"],
	Vayikra: ["Vayikra", "Tzav", "Shmini", "Tazria", "Metzora", "Achrei Mos", "Kedoshim", "Emor", "Behar", "Bechukosai"],
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
 * Card list order (dates aren't used — the office doesn't track them):
 * Sefer reading order → parsha order within it, then Chagim & Special Days
 * (Jewish calendar year order), then Pirkei Avos (perek order), then anything
 * else (Source Sheets — no parsha concept, so title is the only sort key,
 * applied as the caller's tiebreaker). An unrecognized category/subcategory
 * still sorts (at the end of its bucket) rather than breaking the sort.
 */
function compareParshaOrder(a: TorahSheet, b: TorahSheet): number {
	const rank = (s: TorahSheet): [number, number] => {
		const seferIndex = SEFER_ORDER.findIndex((sefer) => sefer.toLowerCase() === s.category?.toLowerCase());
		if (seferIndex !== -1) {
			const parshios = SEFER_PARSHIOS[SEFER_ORDER[seferIndex]];
			const subIndex = parshios.findIndex((p) => p.toLowerCase() === s.subcategory?.toLowerCase());
			return [seferIndex, subIndex === -1 ? parshios.length : subIndex];
		}
		if (s.category?.toLowerCase() === CHAGIM_LABEL.toLowerCase()) {
			const chagIndex = CHAGIM_ORDER.findIndex((c) => c.toLowerCase() === s.subcategory?.toLowerCase());
			return [SEFER_ORDER.length, chagIndex === -1 ? CHAGIM_ORDER.length : chagIndex];
		}
		if (s.category?.toLowerCase() === PIRKEI_AVOS_LABEL.toLowerCase()) {
			const perekIndex = PIRKEI_AVOS_PERAKIM.findIndex((p) => p.toLowerCase() === s.subcategory?.toLowerCase());
			return [SEFER_ORDER.length + 1, perekIndex === -1 ? PIRKEI_AVOS_PERAKIM.length : perekIndex];
		}
		return [SEFER_ORDER.length + 2, 0];
	};
	const [aMajor, aMinor] = rank(a);
	const [bMajor, bMinor] = rank(b);
	return aMajor - bMajor || aMinor - bMinor;
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
		const inSefer = sheets.filter((s) => s.category?.toLowerCase() === sefer.toLowerCase());
		const groups = bySubcategory(inSefer, parshios);
		const other = otherGroup(inSefer, parshios);
		return { key: slugify(sefer), label: sefer, groups: other ? [...groups, other] : groups };
	});

	const chagim = sheets.filter((s) => s.category?.toLowerCase() === CHAGIM_LABEL.toLowerCase());
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

	const pirkeiAvos = dorLDor.filter((s) => s.category?.toLowerCase() === PIRKEI_AVOS_LABEL.toLowerCase());
	const perakimGroups = bySubcategory(pirkeiAvos, PIRKEI_AVOS_PERAKIM);
	const other = otherGroup(pirkeiAvos, PIRKEI_AVOS_PERAKIM);
	const pirkeiAvosGroups = other ? [...perakimGroups, other] : perakimGroups;
	if (pirkeiAvosGroups.length > 0) {
		superGroups.push({ key: slugify(PIRKEI_AVOS_LABEL), label: PIRKEI_AVOS_LABEL, groups: pirkeiAvosGroups });
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
