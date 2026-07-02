import * as items from "@wix/wix-data-items-sdk";
import { auth } from "@wix/essentials";
import { oklch, formatHex } from "culori";

const COLLECTION_ID = "ThemeSettings";

// The authoritative brand ramps, mirrored from src/styles/global.css @theme.
// These are the source of truth for the lightness/chroma *structure* of each
// family. When the client sets a custom anchor, we keep each shade's lightness,
// adopt the chosen hue, and scale chroma by chosenC / primaryC — see
// design-log/028. The `primary` key marks which shade the client's pick maps to.
const ORIGINAL_GOLD = {
	primary: "500" as const,
	shades: {
		"50": "#fdf8e0",
		"100": "#fbeaa8",
		"200": "#f6d66b",
		"300": "#ebbf42",
		"400": "#dfb030",
		"500": "#d6a21e",
		"600": "#a47915",
		"700": "#6f510e",
	},
};

const ORIGINAL_NAVY = {
	primary: "600" as const,
	shades: {
		"50": "#eaedf3",
		"100": "#c8cfdc",
		"200": "#98a3b9",
		"300": "#6b7790",
		"400": "#3e4d6b",
		"500": "#243c63",
		"600": "#102a56",
		"700": "#07173a",
	},
};

type Ramp = { primary: string; shades: Record<string, string> };

export interface ThemeSettings {
	primaryGold?: string;
	primaryNavy?: string;
	accent?: string;
}

/**
 * Normalize a CMS color string to a valid hex, or undefined if unparseable.
 * Forgiving: accepts "#abc", "abc", "#aabbcc", " #AABBCC ". Anything culori
 * can't parse (typos, named-but-misspelled colors, empty) returns undefined,
 * and the caller keeps the code default — a bad value can never break a render.
 */
function normalizeColor(value: string | undefined): string | undefined {
	const v = value?.trim();
	if (!v) return undefined;
	const withHash = /^[0-9a-fA-F]{3,8}$/.test(v) ? `#${v}` : v;
	const parsed = oklch(withHash);
	if (!parsed) return undefined;
	return formatHex(parsed);
}

/**
 * Derive an 8-step ramp from a chosen primary hex: keep each original shade's
 * lightness, adopt the chosen hue, scale chroma by chosenC / originalPrimaryC.
 * Feeding the original primary back in reproduces the original ramp exactly.
 */
function deriveRamp(original: Ramp, chosenHex: string): Record<string, string> {
	const chosen = oklch(chosenHex);
	const primary = oklch(original.shades[original.primary]);
	if (!chosen || !primary || !primary.c) return original.shades;
	const chromaRatio = (chosen.c ?? 0) / primary.c;
	const out: Record<string, string> = {};
	for (const [step, hex] of Object.entries(original.shades)) {
		const base = oklch(hex);
		if (!base) {
			out[step] = hex;
			continue;
		}
		out[step] = formatHex({
			mode: "oklch",
			l: base.l,
			c: (base.c ?? 0) * chromaRatio,
			h: chosen.h ?? base.h,
		});
	}
	return out;
}

export async function getThemeSettings(): Promise<ThemeSettings | null> {
	try {
		const elevated = auth.elevate(items.query);
		const { items: results } = await elevated(COLLECTION_ID).limit(1).find();
		const row = results[0] as ThemeSettings | undefined;
		return row ?? null;
	} catch (err) {
		console.error(`[theme] query failed:`, err);
		return null;
	}
}

/**
 * Build the runtime CSS that overrides the brand tokens. Only families the
 * client actually set are emitted — an empty/absent ThemeSettings row yields an
 * empty string and the code defaults in global.css stand unchanged.
 *
 * `:root:root` (specificity 0,2,0) beats Tailwind's `:root` (0,1,0) regardless
 * of stylesheet source order, so this wins even if Astro bundles global.css
 * after the inline <style>.
 */
export function buildThemeStyle(settings: ThemeSettings | null): string {
	if (!settings) return "";
	const decls: string[] = [];

	const gold = normalizeColor(settings.primaryGold);
	if (gold) {
		const ramp = deriveRamp(ORIGINAL_GOLD, gold);
		for (const [step, hex] of Object.entries(ramp)) decls.push(`--color-gold-${step}:${hex}`);
	}

	const navy = normalizeColor(settings.primaryNavy);
	if (navy) {
		const ramp = deriveRamp(ORIGINAL_NAVY, navy);
		for (const [step, hex] of Object.entries(ramp)) decls.push(`--color-navy-${step}:${hex}`);
	}

	const accent = normalizeColor(settings.accent);
	if (accent) decls.push(`--color-accent:${accent}`);

	if (!decls.length) return "";
	return `:root:root{${decls.join(";")}}`;
}
