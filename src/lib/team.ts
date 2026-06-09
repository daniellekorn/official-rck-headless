import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "TeamMembers";

// Canonical role group keys. Add a new key here + extend ROLE_GROUP_ALIASES
// below to introduce a new group. Groups with zero members don't render —
// the dormant ones (rabbis, staff, board) exist for editor flexibility, not
// because they're guaranteed to populate. See design log #008.
export type RoleGroup =
	| "founder_director"
	| "roshei"
	| "kollel"
	| "rabbis"
	| "youth"
	| "staff"
	| "board"
	| "other";

export const ROLE_GROUPS: { key: RoleGroup; label: string }[] = [
	{ key: "founder_director", label: "Founder & Director" },
	{ key: "roshei", label: "Roshei Kollel" },
	{ key: "kollel", label: "Kollel Avreichim" },
	{ key: "rabbis", label: "Rabbis" },
	// Youth programming leads. Renders as a "Youth Programming" section on
	// /team like any other group (only when populated). It does NOT drive the
	// /youth page — that page is built entirely from the separate YouthPrograms
	// collection (see youth.astro + design log #017). roleGroup affects /team only.
	{ key: "youth", label: "Youth Programming" },
	{ key: "staff", label: "Staff" },
	{ key: "board", label: "Board" },
	// "other" is the catch-all for values that don't match any alias. It
	// renders at the bottom so unmatched members never silently disappear.
	{ key: "other", label: "Team" },
];

// Map raw (lowercased, trimmed) roleGroup values from the CMS to canonical
// keys. Extend liberally — the editor can type "Rabbi" or "rabbeim" or
// "Rabbis" and they all land in the same place. Anything that doesn't match
// here goes to "other" rather than getting dropped.
const ROLE_GROUP_ALIASES: Record<string, RoleGroup> = {
	// Founder & Director — the singular leadership slot. Generic
	// "leadership" terms route here intentionally; if the org ever needs a
	// broader leadership bucket, add a separate key.
	"founder": "founder_director",
	"founders": "founder_director",
	"director": "founder_director",
	"directors": "founder_director",
	"founder and director": "founder_director",
	"founder & director": "founder_director",
	"executive director": "founder_director",
	"executive": "founder_director",
	"leadership": "founder_director",
	"leader": "founder_director",
	"president": "founder_director",

	// Roshei Kollel — heads of the kollel and of chaburos within it.
	"rosh kollel": "roshei",
	"rosh chaburah": "roshei",
	"rosh chabura": "roshei",
	"roshei": "roshei",
	"roshei kollel": "roshei",
	"roshei chaburah": "roshei",
	"roshei chaburos": "roshei",

	// Kollel Avreichim — the rank-and-file kollel members.
	"kollel": "kollel",
	"kollel member": "kollel",
	"kollel members": "kollel",
	"avreich": "kollel",
	"avrech": "kollel",
	"avreichim": "kollel",
	"avrechim": "kollel",
	"yungerman": "kollel",
	"yungerleit": "kollel",

	// Rabbis (dormant by default — populated only if the editor adds rows).
	"rabbi": "rabbis",
	"rabbis": "rabbis",
	"rabbeim": "rabbis",
	"rabbanim": "rabbis",
	"rav": "rabbis",
	"maggid shiur": "rabbis",

	// Youth Programming — leads of the youth chaburos and programs. Editors
	// normally type "Youth"; the program-name aliases below are a safety net
	// in case someone types the program itself into roleGroup. See #017.
	"youth": "youth",
	"youth programming": "youth",
	"youth program": "youth",
	"youth programs": "youth",
	"teen": "youth",
	"teens": "youth",
	"teen learning": "youth",
	"dor l'dor": "youth",
	"dor ldor": "youth",
	"matmidim": "youth",
	"pirchei": "youth",

	// Staff (dormant).
	"staff": "staff",
	"admin": "staff",
	"administration": "staff",
	"administrative": "staff",
	"administrator": "staff",
	"hanhala": "staff",
	"office": "staff",

	// Board (dormant).
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
		founder_director: [],
		roshei: [],
		kollel: [],
		rabbis: [],
		youth: [],
		staff: [],
		board: [],
		other: [],
	};
	for (const m of members) {
		groups[m.roleGroup].push(m);
	}
	return groups;
}
