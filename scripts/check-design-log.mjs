#!/usr/bin/env node
/**
 * Flags design log entries that cite code which no longer exists.
 *
 * The log's failure mode isn't being wrong when written — it's staying
 * confidently wrong afterwards. #008 asserted "dayType = Shabbat rows stored
 * but not rendered" for three weeks after #041 started rendering them, and
 * #010's field table still listed `embedUrl` long after #031 removed it. Both
 * were found by hand, by accident.
 *
 * So: extract the code identifiers an entry cites, check they still exist, and
 * report the ones that don't. A hit means "this entry may describe code that's
 * gone" — sometimes that's correct and deliberate (an entry explaining why a
 * field was removed *should* name it), which is what `.stale-ok` is for.
 *
 *   node scripts/check-design-log.mjs            # report, exit 0
 *   node scripts/check-design-log.mjs --strict   # exit 1 on findings (CI)
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logDir = join(root, "design-log");
const strict = process.argv.includes("--strict");

/**
 * Two token shapes only, both unambiguous in this repo.
 *
 * Deliberately NOT checked: PascalCase (`FlyerCategory` the type is
 * indistinguishable from `TitleLine1` the CMS field fragment or `HomepageSlides`
 * the rejected collection name) and camelCase (every CMS field looks like every
 * local variable). Checking either buries four real findings under forty false
 * ones, and a check people learn to ignore is worse than no check.
 *
 * The consequence: this does not catch CMS *field* drift — #010's stale
 * `embedUrl` slips through. Field names can only be verified against the live
 * collection, which is a different job (see #055).
 */
const PATH_RE = /^(?:src|scripts|public|design-log)\/[\w./-]+$/;
/** UPPER_SNAKE with at least one underscore — exported constants, nothing else. */
const IDENT_RE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

/** Wix's own field types and permission levels, not our constants. */
const WIX_VOCAB = new Set([
	"ARRAY_OF_STRINGS", "ARRAY_STRING", "MEDIA_GALLERY", "SINGLE_ITEM", "RICH_TEXT", "MULTI_REFERENCE",
	"SITE_MEMBER", "SITE_MEMBER_AUTHOR", "ANYONE", "ADMIN_ONLY", "CURSOR_PAGING",
	"SET_FIELD", "REMOVE_FIELD", "INCREMENT_FIELD",
]);

function loadAllowlist() {
	const file = join(logDir, ".stale-ok");
	if (!existsSync(file)) return new Map();
	const map = new Map();
	for (const line of readFileSync(file, "utf8").split("\n")) {
		const trimmed = line.replace(/#.*$/, "").trim();
		if (!trimmed) continue;
		const [entry, ...rest] = trimmed.split(/\s+/);
		if (!rest.length) continue;
		if (!map.has(entry)) map.set(entry, new Set());
		for (const token of rest) map.get(entry).add(token);
	}
	return map;
}

/** One grep over src/ per identifier, via git so ignored files don't count. */
function existsInSource(token) {
	try {
		execSync(`git grep -q -w -F -- ${JSON.stringify(token)} src/`, { cwd: root, stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

const allowlist = loadAllowlist();
const entries = readdirSync(logDir).filter((f) => /^\d{3}-.*\.md$/.test(f)).sort();
const identCache = new Map();
const findings = [];

for (const file of entries) {
	const id = file.slice(0, 3);
	const allowed = new Set([...(allowlist.get(id) ?? []), ...(allowlist.get("*") ?? [])]);
	const body = readFileSync(join(logDir, file), "utf8");

	const missingPaths = new Set();
	const missingIdents = new Set();

	for (const [, token] of body.matchAll(/`([^`\n]+)`/g)) {
		const t = token.trim();
		if (allowed.has(t)) continue;

		if (PATH_RE.test(t)) {
			if (!existsSync(join(root, t))) missingPaths.add(t);
			continue;
		}
		if (!IDENT_RE.test(t) || WIX_VOCAB.has(t)) continue;
		if (!identCache.has(t)) identCache.set(t, existsInSource(t));
		if (!identCache.get(t)) missingIdents.add(t);
	}

	// Cross-references to entries that don't exist — cheap and exact.
	const brokenRefs = new Set();
	for (const [, num] of body.matchAll(/#(\d{3})\b/g)) {
		if (num !== id && !entries.some((e) => e.startsWith(num))) brokenRefs.add(`#${num}`);
	}

	if (missingPaths.size || missingIdents.size || brokenRefs.size) {
		findings.push({
			file,
			paths: [...missingPaths],
			idents: [...missingIdents],
			refs: [...brokenRefs],
		});
	}
}

if (findings.length === 0) {
	console.log(`design log: ${entries.length} entries, no stale code references.`);
	process.exit(0);
}

console.log(`design log: ${findings.length} of ${entries.length} entries cite code that no longer exists.\n`);
for (const { file, paths, idents, refs } of findings) {
	console.log(file);
	for (const p of paths) console.log(`  missing file    ${p}`);
	for (const i of idents) console.log(`  not in src/     ${i}`);
	for (const r of refs) console.log(`  no such entry   ${r}`);
	console.log();
}
console.log("Each hit is a prompt, not a verdict. Either the entry needs a supersession note,");
console.log("or the reference is deliberately historical — add it to design-log/.stale-ok.");
process.exit(strict ? 1 : 0);
