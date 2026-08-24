import { items, auth } from "./wix-cms-admin";
import { resolveImage } from "./wix-media";

const PAGE_COLLECTION_ID = "CommunityPage";
const MEMBERS_COLLECTION_ID = "CommunityMembers";

export interface CommunityPage {
	mealsFamilyName?: string;
	mealsPhone?: string;
	mealsEmail?: string;
	mealsPhoto?: string;
	mealsPhotoUrl?: string;
	mealsDescription?: unknown;

	// gabbaiDescription retired — the gabbai topic's paragraph is now a fixed
	// sentence template in community.astro with gabbaiName/gabbaiWifeName
	// spliced in as links. See design log #047 (superseded here) / #049.
	gabbaiName?: string;
	gabbaiWifeName?: string;
	gabbaiPhone?: string;
	gabbaiEmail?: string;
	gabbaiPhoto?: string;
	gabbaiPhotoUrl?: string;

	taharasEnglishRabbiName?: string;
	taharasEnglishRabbiPhone?: string;
	taharasEnglishRabbiAddress?: string;
	taharasEnglishRabbi2Name?: string;
	taharasEnglishRabbi2Phone?: string;
	taharasEnglishRabbi2Address?: string;
	taharasHebrewRabbiName?: string;
	taharasHebrewRabbiPhone?: string;
	taharasHebrewRabbiAddress?: string;

	// beisDinDescription retired for the same reason as gabbaiDescription above.
	beisDinContactName?: string;
	beisDinContactPhone?: string;
	beisDinContactEmail?: string;
}

export async function getCommunityPage(): Promise<CommunityPage | null> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(PAGE_COLLECTION_ID).limit(1).find();
		const row = results[0] as CommunityPage | undefined;
		if (!row) return null;

		return {
			...row,
			mealsPhotoUrl: resolveImage(row.mealsPhoto, 480, 480),
			gabbaiPhotoUrl: resolveImage(row.gabbaiPhoto, 480, 480),
		};
	} catch (err) {
		console.error(`[community] CommunityPage query failed:`, err);
		return null;
	}
}

export interface CommunityMember {
	_id: string;
	familyName: string;
	hebrewName?: string;
	description?: unknown;
	photo?: string;
	photoUrl?: string;
	sortOrder?: number;
	active?: boolean;
}

export async function getCommunityMembers(): Promise<CommunityMember[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(MEMBERS_COLLECTION_ID)
			.ascending("sortOrder")
			.limit(200)
			.find();

		return (results as CommunityMember[])
			.filter((m) => m.active !== false)
			.map((m) => ({
				...m,
				photoUrl: resolveImage(m.photo, 640, 640),
			}));
	} catch (err) {
		console.error(`[community] CommunityMembers query failed:`, err);
		return [];
	}
}
