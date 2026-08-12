# 060 — Temporarily hide Dor L'Dor / ParshaLink behind a feature flag

**Status:** implemented
**Date:** 2026-08-12
**Author:** claude-session
**Related:** #053

## Background

The `Dor L'Dor` series (public-facing brand name "ParshaLink", see #053) is a fully built, fully populated Torah Sheets publication: its own tab, rows mixed into "All Publications", and its own sidebar filters (Sefer/Chagim/Pirkei Avos groups).

## Problem

Yosef wants ParshaLink off the live, published site for now — not visible in its own tab, not showing up in "All Publications," not offered as a sidebar filter, and not reachable by a stale/bookmarked `#dor-ldor` link — without deleting any of the series' code, grouping logic, or CMS data, since it's meant to come back later.

## Design

A single flag in `src/pages/torah-sheets.astro`, `SHOW_PARSHALINK` (currently `false`), gates two things:

1. The base `sheets` array is filtered to exclude `series === "Dor L'Dor"` whenever the flag is off, before it's handed to every grouping/sorting helper (`groupAllSheets`, `sortByUploadRecency`, etc.) — this alone removes ParshaLink rows from "All Publications" and any shared featured-pick logic.
2. The `dor-ldor` entry in the `tabs` array (its own panel + its "Publication" sidebar pill, rendered from that same array via `TorahSheetsSidebar`) is conditionally spread in only when the flag is on.

Because the client-side hash router (`activateTab`) falls back to `DEFAULT_TAB_KEY` whenever the requested hash doesn't match any rendered panel, a stale `#dor-ldor` link degrades gracefully to the Torah Bytes tab instead of erroring.

## Trade-offs

Re-enabling is one line (`SHOW_PARSHALINK = true`), but until then the CMS collection keeps accepting new Dor L'Dor rows silently — they just won't render anywhere. Anyone editing content won't get feedback that their upload is currently invisible; that's expected given the ask ("gate it behind a feature flag"), just worth remembering if a future session sees "missing" ParshaLink uploads.

## Verification

Ran `astro check` and `npm run build` clean (pre-existing, unrelated `index.astro` type error only). Confirmed via the `tabs` construction that with the flag off, `dor-ldor` never appears in the array `TorahSheetsSidebar`'s "Publication" switcher iterates over, and `sheets` fed to "All Publications"/its grouping helpers excludes every `series: "Dor L'Dor"` row.
