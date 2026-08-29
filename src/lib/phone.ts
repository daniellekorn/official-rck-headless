// Shared tel:/WhatsApp link derivation for any contact number on the site.
//
// Numbers are entered either in local Israeli mobile format (e.g.
// "053-347-8419", "0557738379" — no country code, leading 0) or already
// fully international with a leading "+" (e.g. "+1 (516) 761-5889" for a
// U.S. contact). WhatsApp's `wa.me` links need the full number with country
// code and no symbols; local-format numbers are assumed Israeli (972) since
// that's every non-"+" number entered on this site to date.
function digitsOnly(phone: string): string {
	return phone.replace(/[^\d+]/g, "");
}

export function telHref(phone: string): string {
	return `tel:${digitsOnly(phone)}`;
}

export function whatsappHref(phone: string): string {
	const digits = digitsOnly(phone);
	const international = digits.startsWith("+") ? digits.slice(1) : `972${digits.replace(/^0/, "")}`;
	return `https://wa.me/${international}`;
}
