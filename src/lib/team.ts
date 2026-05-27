import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "TeamMembers";

// Canonical role group keys. Add a new key here + extend ROLE_GROUP_ALIASES
// below to introduce a new group. Groups with zero members don't render.
export type RoleGroup =
	| "leadership"
	| "rabbis"
	| "kollel"
	| "staff"
	| "board"
	| "other";

export const ROLE_GROUPS: { key: RoleGroup; label: string }[] = [
	{ key: "leadership", label: "Leadership" },
	{ key: "rabbis", label: "Rabbis" },
	{ key: "kollel", label: "Kollel" },
	{ key: "staff", label: "Staff" },
	{ key: "board", label: "Board" },
	// "other" is the catch-all for values that don't match any alias.
	// It renders at the bottom of the page so unmatched members never
	// silently disappear — surfaces typos / new categories quickly.
	{ key: "other", label: "Team" },
];

// Map raw (lowercased, trimmed) roleGroup values from the CMS to canonical
// keys. Extend liberally — the friend can type "Rabbi" or "rabbeim" or
// "Rabbis" and they all land in the same place. Anything that doesn't match
// here goes to "other" rather than getting dropped.
const ROLE_GROUP_ALIASES: Record<string, RoleGroup> = {
	// Leadership
	"leadership": "leadership",
	"leader": "leadership",
	"founder": "leadership",
	"founders": "leadership",
	"director": "leadership",
	"directors": "leadership",
	"executive": "leadership",
	"president": "leadership",
	"rosh kollel": "leadership",

	// Rabbis
	"rabbi": "rabbis",
	"rabbis": "rabbis",
	"rabbeim": "rabbis",
	"rabbanim": "rabbis",
	"rav": "rabbis",
	"maggid shiur": "rabbis",

	// Kollel members
	"kollel": "kollel",
	"kollel member": "kollel",
	"kollel members": "kollel",
	"avrech": "kollel",
	"avreich": "kollel",
	"avreichim": "kollel",
	"yungerman": "kollel",
	"yungerleit": "kollel",

	// Staff / Administration
	"staff": "staff",
	"admin": "staff",
	"administration": "staff",
	"administrative": "staff",
	"administrator": "staff",
	"hanhala": "staff",
	"office": "staff",

	// Board
	"board": "board",
	"board member": "board",
	"board members": "board",
	"trustee": "board",
	"trustees": "board",
};

function normalizeRoleGroup(raw: unknown): RoleGroup {
	if (typeof raw !== "string") return "other";
	const key = raw.trim().toLowerCase();
	if (!key) return "other";
	return ROLE_GROUP_ALIASES[key] ?? "other";
}

export interface TeamMember {
	_id: string;
	firstName: string;
	lastName: string;
	hebrewName?: string;
	role: string;
	roleGroup: RoleGroup;
	roleGroupRaw?: string; // what the editor actually typed, for debugging
	bio?: unknown;
	photo?: string;
	photoUrl?: string;
	email?: string;
	sortOrder?: number;
	featured?: boolean;
}

function resolveImage(wixImageUrl?: string, w = 640, h = 640): string | undefined {
	if (!wixImageUrl) return undefined;
	try {
		return media.getScaledToFillImageUrl(wixImageUrl, w, h, {});
	} catch {
		return undefined;
	}
}

export async function getTeam(): Promise<TeamMember[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.ascending("sortOrder")
			.limit(200)
			.find();

		return (results as Array<TeamMember & { roleGroup: unknown }>).map((m) => ({
			...m,
			photoUrl: resolveImage(m.photo),
			roleGroupRaw: typeof m.roleGroup === "string" ? m.roleGroup : undefined,
			roleGroup: normalizeRoleGroup(m.roleGroup),
		}));
	} catch (err) {
		console.error(`[team] query failed:`, err);
		return [];
	}
}

export function groupByRole(members: TeamMember[]): Record<RoleGroup, TeamMember[]> {
	const groups: Record<RoleGroup, TeamMember[]> = {
		leadership: [],
		rabbis: [],
		kollel: [],
		staff: [],
		board: [],
		other: [],
	};
	for (const m of members) {
		groups[m.roleGroup].push(m);
	}
	return groups;
}
