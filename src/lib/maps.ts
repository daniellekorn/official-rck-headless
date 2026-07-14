// Every address on the site should be tappable into Google Maps. The URL
// scheme below is a "universal link": on mobile it opens the installed app
// directly; on desktop/without the app it falls back to the web version.

/**
 * Every address on this site is in Ra'anana, Israel, but not every CMS field
 * spells that out — e.g. a rav's address is often just entered as "46
 * Chafetz Chaim", and even the office address ("Ahuza St 198, Ra'anana")
 * names the city but not the country. Either gap is ambiguous (Chafetz Chaim
 * exists in multiple Israeli cities; Ra'anana alone has no country) and a
 * bare search could resolve to the wrong place, or the wrong country
 * entirely, depending on the visitor's own location. Append whichever part
 * is missing for the map query only — never for the address as *displayed*
 * on the page, which should stay exactly as entered.
 */
function withRaanana(address: string): string {
	const hasCity = /ra.?anana/i.test(address);
	const hasCountry = /israel/i.test(address);
	if (hasCity && hasCountry) return address;
	if (hasCity) return `${address}, Israel`;
	return `${address}, Ra'anana, Israel`;
}

/** Opens Google Maps (app on mobile if installed, web otherwise) centered on a search for this address. */
export function googleMapsUrl(address: string): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(withRaanana(address))}`;
}
