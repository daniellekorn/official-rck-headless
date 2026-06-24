/**
 * URL-/anchor-safe slug from a human title. Drops apostrophes so "Dor L'Dor"
 * becomes "dor-ldor", collapses everything else non-alphanumeric to hyphens.
 * Used to anchor page sections and the matching nav-submenu / section-pager
 * links to the same id.
 */
export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/['’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
