/**
 * The link line under a flyer's title (design-log #084). The office pastes the
 * link that's on the flyer; the words are theirs if they typed some, otherwise
 * they're picked from the kind of link it is.
 */

export interface FlyerLink {
	href: string;
	/** Opens in a new tab — anything that isn't a page on this site. */
	external: boolean;
	text: string;
	textHebrew: string;
}

interface LinkFields {
	linkUrl?: string;
	linkText?: string;
	linkTextHebrew?: string;
}

/**
 * Normalize what was typed into a safe href, or null when it isn't a link:
 * a site path ("/youth"), a web address (with or without https://), an email
 * address, or mailto:/tel:. Every other scheme is refused.
 */
function resolveHref(raw: string | undefined): { href: string; external: boolean } | null {
	const link = raw?.trim();
	if (!link || /\s/.test(link)) return null;
	if (link.startsWith("/")) return link.startsWith("//") ? null : { href: link, external: false };
	if (/^(mailto|tel):/i.test(link)) return { href: link, external: false };
	if (/^[^@/:]+@[^@/:]+\.[a-z]{2,}$/i.test(link)) return { href: `mailto:${link}`, external: false };

	// "forms.gle/abc" — a bare web address, as it's often printed on a flyer.
	const withScheme = /^https?:\/\//i.test(link) ? link : `https://${link}`;
	try {
		const url = new URL(withScheme);
		if (url.username || url.password || !/\.[a-z]{2,}$/i.test(url.hostname)) return null;
		return /^(www\.)?rckollel\.com$/i.test(url.hostname)
			? { href: `${url.pathname}${url.search}${url.hash}`, external: false }
			: { href: url.href, external: true };
	} catch {
		return null;
	}
}

const DEFAULT_WORDS: { match: RegExp; text: string; textHebrew: string }[] = [
	{
		match: /^https?:\/\/(docs\.google\.com\/forms|forms\.gle|(www\.)?jotform\.com|form\.jotform\.com|forms\.office\.com)/i,
		text: "Click here to sign up",
		textHebrew: "לחצו כאן להרשמה",
	},
	{
		match: /^https?:\/\/(([\w-]+\.)?zoom\.us|meet\.google\.com|teams\.microsoft\.com|chat\.whatsapp\.com)/i,
		text: "Click here to join",
		textHebrew: "לחצו כאן להצטרפות",
	},
	{
		match: /^https?:\/\/(wa\.me|api\.whatsapp\.com)/i,
		text: "Click here to WhatsApp us",
		textHebrew: "לחצו כאן לשליחת הודעת ווצאפ",
	},
	{
		match: /^https?:\/\/((www\.|m\.)?youtube\.com|youtu\.be)/i,
		text: "Click here to watch",
		textHebrew: "לחצו כאן לצפייה",
	},
	{ match: /^mailto:/i, text: "Click here to email us", textHebrew: "לחצו כאן לשליחת מייל" },
	{ match: /^tel:/i, text: "Click here to call", textHebrew: "לחצו כאן להתקשר" },
];

const FALLBACK_WORDS = { text: "Click here for more details", textHebrew: "לחצו כאן לפרטים נוספים" };

/** The link line for a flyer row, or null when it has no usable link. */
export function flyerLink(flyer: LinkFields): FlyerLink | null {
	const resolved = resolveHref(flyer.linkUrl);
	if (!resolved) return null;
	const words = DEFAULT_WORDS.find((w) => w.match.test(resolved.href)) ?? FALLBACK_WORDS;
	return {
		...resolved,
		text: flyer.linkText?.trim() || words.text,
		textHebrew: flyer.linkTextHebrew?.trim() || words.textHebrew,
	};
}
