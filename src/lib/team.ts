import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "TeamMembers";

export type RoleGroup = "rabbeim" | "kollel" | "administration" | "board";

export const ROLE_GROUPS: { key: RoleGroup; label: string }[] = [
	{ key: "rabbeim", label: "Rabbeim" },
	{ key: "kollel", label: "Kollel Members" },
	{ key: "administration", label: "Administration" },
	{ key: "board", label: "Board" },
];

export interface TeamMember {
	_id: string;
	firstName: string;
	lastName: string;
	hebrewName?: string;
	role: string;
	roleGroup: RoleGroup;
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

		return (results as TeamMember[]).map((m) => ({
			...m,
			photoUrl: resolveImage(m.photo),
		}));
	} catch (err) {
		console.error(`[team] query failed:`, err);
		return [];
	}
}

export function groupByRole(members: TeamMember[]): Record<RoleGroup, TeamMember[]> {
	const groups: Record<RoleGroup, TeamMember[]> = {
		rabbeim: [],
		kollel: [],
		administration: [],
		board: [],
	};
	for (const m of members) {
		const key = (m.roleGroup ?? "kollel") as RoleGroup;
		if (key in groups) groups[key].push(m);
	}
	return groups;
}
