import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { resolveImage } from "./wix-media";

const COLLECTION_ID = "TeamMembers";

// Canonical role group keys. The /team page is deliberately just two
// sections: the people who lead the kollel, and the avreichim who learn in
// it. Everything an editor types in `roleGroup` routes to one of these two
// via the alias map below; there are no dormant or catch-all groups. See
// design log #025 (supersedes the broader taxonomy of #007/#002).
export type RoleGroup = "leadership" | "avreichim";

export const ROLE_GROUPS: { key: RoleGroup; label: string }[] = [
	{ key: "leadership", label: "Kollel Leadership" },
	{ key: "avreichim", label: "Our Avreichim" },
];

// Map raw (lowercased, trimmed) roleGroup values from the CMS to canonical
// keys. Extend liberally — the editor can type "Rosh Kollel" or "Director"
// or "Founder" and they all land in Kollel Leadership. Anything that doesn't
// match here falls through to `avreichim` (see normalizeRoleGroup): the
// rank-and-file is the safe default, so a member is never dropped and no
// third section can ever appear.
const ROLE_GROUP_ALIASES: Record<string, RoleGroup> = {
	// Kollel Leadership — founder/director, roshei kollel, roshei chaburah,
	// and titled rabbeim. Generic "leadership" terms route here too.
	"founder": "leadership",
	"founders": "leadership",
	"director": "leadership",
	"directors": "leadership",
	"founder and director": "leadership",
	"founder & director": "leadership",
	"executive director": "leadership",
	"executive": "leadership",
	"leadership": "leadership",
	"leader": "leadership",
	"president": "leadership",
	"rosh kollel": "leadership",
	"rosh chaburah": "leadership",
	"rosh chabura": "leadership",
	"roshei": "leadership",
	"roshei kollel": "leadership",
	"roshei chaburah": "leadership",
	"roshei chaburos": "leadership",
	"rabbi": "leadership",
	"rabbis": "leadership",
	"rabbeim": "leadership",
	"rabbanim": "leadership",
	"rav": "leadership",
	"maggid shiur": "leadership",

	// Our Avreichim — the kollel members. This is also the fallback for any
	// unrecognized value (see normalizeRoleGroup), so these aliases are only
	// here for clarity/intent.
	"avreichim": "avreichim",
	"avreich": "avreichim",
	"avrech": "avreichim",
	"avrechim": "avreichim",
	"kollel": "avreichim",
	"kollel member": "avreichim",
	"kollel members": "avreichim",
	"yungerman": "avreichim",
	"yungerleit": "avreichim",
};

function normalizeRoleGroup(raw: unknown): RoleGroup {
	if (typeof raw !== "string") return "avreichim";
	const key = raw.trim().toLowerCase();
	if (!key) return "avreichim";
	return ROLE_GROUP_ALIASES[key] ?? "avreichim";
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

export async function getTeam(): Promise<TeamMember[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.ascending("sortOrder")
			.limit(200)
			.find();

		return (results as Array<TeamMember & { roleGroup: unknown }>).map((m) => ({
			...m,
			photoUrl: resolveImage(m.photo, 640, 853),
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
		avreichim: [],
	};
	for (const m of members) {
		groups[m.roleGroup].push(m);
	}
	return groups;
}
