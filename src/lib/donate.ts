import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";

const COLLECTION_ID = "DonatePage";

export interface DonateConfig {
	mosadId?: string;
	apiValid?: string;
	hostedPageUrl?: string;
	introText?: string;
	suggestedAmounts?: string;
	purposes?: string;
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

export function parseSuggestedAmounts(raw: string | undefined): number[] {
	if (!raw) return [];
	return raw
		.split(",")
		.map((s) => Number.parseInt(s.trim(), 10))
		.filter((n) => Number.isFinite(n) && n > 0);
}

/** Each line is `Label | Nedarim Plus category`; a line without `|` is both. */
export function parsePurposes(raw: string | undefined): DonatePurpose[] {
	if (!raw) return [];
	return raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const sep = line.indexOf("|");
			if (sep === -1) return { label: line, category: line };
			return {
				label: line.slice(0, sep).trim(),
				category: line.slice(sep + 1).trim(),
			};
		})
		.filter((p) => p.label.length > 0);
}
