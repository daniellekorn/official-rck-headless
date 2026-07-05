/**
 * Groups flyer subCategory tags into labeled rows for the filter UI (design log #038).
 *
 * Day / Time / Audience are closed vocabularies inferred in code — no CMS "tag type"
 * field for the office to maintain or mistype. Anything unrecognized falls back to
 * Topic, which is the open-ended group, so a brand-new tag still shows up somewhere
 * sensible. All matching is against lowercase tags (see normalizeTags in flyers.ts).
 */

export interface TagGroup {
	key: "topic" | "audience" | "day" | "time";
	label: string;
	tags: string[];
}

/** Order inside these arrays is the display order inside the group. */
const DAY_TAGS = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"shabbos",
	"motzei-shabbos",
	"daily",
] as const;

const TIME_TAGS = ["morning", "afternoon", "evening", "night"] as const;

const AUDIENCE_TAGS = [
	"men",
	"women",
	"boys",
	"girls",
	"kids",
	"teens",
	"youth",
	"family",
	"community",
] as const;

function byVocabulary(tags: string[], vocabulary: readonly string[]): string[] {
	return vocabulary.filter((v) => tags.includes(v));
}

/**
 * Splits a flat (lowercase) tag list into ordered groups. Groups with no tags are
 * dropped. Topic sorts alphabetically; the closed groups keep vocabulary order
 * (Sunday before Monday, morning before night).
 */
export function groupTags(tags: string[]): TagGroup[] {
	const day = byVocabulary(tags, DAY_TAGS);
	const time = byVocabulary(tags, TIME_TAGS);
	const audience = byVocabulary(tags, AUDIENCE_TAGS);
	const known = new Set<string>([...day, ...time, ...audience]);
	const topic = tags.filter((t) => !known.has(t)).sort();

	const groups: TagGroup[] = [
		{ key: "topic", label: "Topic", tags: topic },
		{ key: "audience", label: "Audience", tags: audience },
		{ key: "day", label: "Day", tags: day },
		{ key: "time", label: "Time", tags: time },
	];
	return groups.filter((g) => g.tags.length > 0);
}
