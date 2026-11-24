/**
 * Browser-side half of the Hebrew/English flip (design-log #084). Any element
 * with `data-bilingual`, `data-flyer-id` and `data-view` is a flip card; inside
 * it, `data-face="english|hebrew"` marks what belongs to each side and
 * `data-flip-toggle` is the button (FlipToggle.astro).
 */

export type FlyerView = "english" | "hebrew";

const cards = () => [...document.querySelectorAll<HTMLElement>("[data-bilingual]")];

/** The side facing away is `inert`, so it can't be tabbed to or tapped through. */
function syncFaces(card: HTMLElement) {
	card.querySelectorAll<HTMLElement>("[data-face]").forEach((el) => {
		el.inert = el.dataset.face !== card.dataset.view;
	});
}

/**
 * Turn flip cards to `view` — all of them, or every copy of one flyer (carousel
 * loop clones and the Learn carousel/grid pair must agree).
 */
export function setFlyerView(view: FlyerView, flyerId?: string) {
	for (const card of cards()) {
		if (flyerId !== undefined && card.dataset.flyerId !== flyerId) continue;
		card.dataset.view = view;
		syncFaces(card);
	}
}

// Runs once however many components import it — modules are singletons.
cards().forEach(syncFaces);
document.addEventListener("click", (e) => {
	const card = (e.target as HTMLElement).closest("[data-flip-toggle]")?.closest<HTMLElement>("[data-bilingual]");
	if (card) setFlyerView(card.dataset.view === "hebrew" ? "english" : "hebrew", card.dataset.flyerId);
});
