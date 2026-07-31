// RCK opened in November 1998 (see the "Opens in 1998" OurHistory milestone).
// "Years of devotion" and the "Today and Onward" milestone caption both count
// years since founding and must tick up together, each November, at the same
// pace — computed here once so neither can drift out of sync with the other.
// See design-log #058.
const FOUNDING_YEAR = 1998;
const FOUNDING_MONTH_INDEX = 10; // November, 0-indexed

/** Years RCK has been running as of `date` — increments every November. */
export function yearsOfDevotion(date: Date = new Date()): number {
	const yearsSinceFoundingYear = date.getFullYear() - FOUNDING_YEAR;
	return yearsSinceFoundingYear + (date.getMonth() >= FOUNDING_MONTH_INDEX ? 1 : 0);
}

const ONES = [
	"Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
	"Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/** Spells out an integer 0–99 in Title Case (e.g. 28 → "Twenty-eight"). */
export function spellOutYears(n: number): string {
	if (n < 20) return ONES[n];
	const tens = Math.floor(n / 10);
	const ones = n % 10;
	return ones === 0 ? TENS[tens] : `${TENS[tens]}-${ONES[ones].toLowerCase()}`;
}
