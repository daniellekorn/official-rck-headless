// Every address on the site should be tappable into a real navigation app —
// Ra'anana visitors lean heavily on Waze, so both it and Google Maps are
// offered side by side rather than picking one. Both URL schemes are
// "universal links": on mobile they open the installed app directly; on
// desktop/without the app they fall back to the web version.

/**
 * Every address on this site is in Ra'anana, Israel, but not every CMS field
 * spells that out — e.g. a rav's address is often just entered as "46
 * Chafetz Chaim". Street name alone is ambiguous (Chafetz Chaim exists in
 * multiple Israeli cities) and a bare search could resolve to the wrong
 * place, or the wrong country entirely, depending on the visitor's own
 * location. Append the city/country for the map query only — never for the
 * address as *displayed* on the page, which should stay exactly as entered.
 */
function withRaanana(address: string): string {
	return /ra.?anana/i.test(address) ? address : `${address}, Ra'anana, Israel`;
}

/** Opens Google Maps (app on mobile if installed, web otherwise) centered on a search for this address. */
export function googleMapsUrl(address: string): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(withRaanana(address))}`;
}

/** Opens Waze (app on mobile if installed, web planner otherwise) navigating to this address. */
export function wazeUrl(address: string): string {
	return `https://waze.com/ul?q=${encodeURIComponent(withRaanana(address))}&navigate=yes`;
}
