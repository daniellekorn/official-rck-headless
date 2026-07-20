import { items, auth } from "./wix-cms-admin";

const COLLECTION_ID = "DonatePage";
const PURPOSES_COLLECTION_ID = "DonatePurposes";

export interface DonateConfig {
	mosadId?: string;
	apiValid?: string;
	hostedPageUrl?: string;
	introText?: string;
	suggestedAmounts?: string;
}

export interface DonatePurpose {
	label: string;
	// Passed verbatim as the Nedarim Plus `Groupe` so the donation lands in the
	// category the office already uses in their Nedarim Plus reports.
	category: string;
}

export async function getDonateConfig(): Promise<DonateConfig | null> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID).limit(1).find();
		const row = results[0] as DonateConfig | undefined;
		return row ?? null;
	} catch (err) {
		console.error(`[donate] query failed:`, err);
		return null;
	}
}

export async function getDonatePurposes(): Promise<DonatePurpose[]> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(PURPOSES_COLLECTION_ID)
			.ascending("sortOrder")
			.limit(50)
			.find();
		return (results as Array<Record<string, unknown>>)
			.map((r) => ({
				label: String(r.label ?? ""),
				category: String(r.category ?? ""),
			}))
			.filter((p) => p.label.length > 0);
	} catch (err) {
		console.error(`[donate] purposes query failed:`, err);
		return [];
	}
}

export function parseSuggestedAmounts(raw: string | undefined): number[] {
	if (!raw) return [];
	return raw
		.split(",")
		.map((s) => Number.parseInt(s.trim(), 10))
		.filter((n) => Number.isFinite(n) && n > 0);
}
