// Every address on the site should be tappable into a real navigation app —
// Ra'anana visitors lean heavily on Waze, so both it and Google Maps are
// offered side by side rather than picking one. Both URL schemes are
// "universal links": on mobile they open the installed app directly; on
// desktop/without the app they fall back to the web version.

/** Opens Google Maps (app on mobile if installed, web otherwise) centered on a search for this address. */
export function googleMapsUrl(address: string): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Opens Waze (app on mobile if installed, web planner otherwise) navigating to this address. */
export function wazeUrl(address: string): string {
	return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}
