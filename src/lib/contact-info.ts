import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";

const COLLECTION_ID = "ContactInfo";

export interface ContactInfo {
	address?: string;
	phone?: string;
	email?: string;
	facebookUrl?: string;
	instagramUrl?: string;
	youtubeUrl?: string;
	twitterUrl?: string;
	linkedinUrl?: string;
}

export async function getContactInfo(): Promise<ContactInfo | null> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID).limit(1).find();
		const row = results[0] as ContactInfo | undefined;
		return row ?? null;
	} catch (err) {
		console.error(`[contact-info] query failed:`, err);
		return null;
	}
}
