import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";

const COLLECTION_ID = "JoinUsCards";

export type JoinUsIcon = "book" | "reader" | "people";

export interface JoinUsCard {
	_id: string;
	title?: string;
	subtitle?: string;
	href?: string;
	icon?: JoinUsIcon;
	sortOrder?: number;
	active?: boolean;
}

export async function getJoinUsCards(): Promise<JoinUsCard[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID)
			.eq("active", true)
			.ascending("sortOrder")
			.limit(20)
			.find();
		return results as JoinUsCard[];
	} catch (err) {
		console.error(`[join-us-cards] query failed:`, err);
		return [];
	}
}
