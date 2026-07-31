# 058 — Automate "Years of Devotion" instead of a manually-typed CMS number

**Status:** implemented
**Date:** 2026-07-31
**Author:** claude-session (yosef directing)
**Related:** [#051](051-impact-stats-band.md) (impact stats band), [#043](043-ourhistory-hebrew-field-timeline-nav.md) (OurHistory schema)

## Background

Two homepage spots state how long RCK has been running: the impact stats band's first number ("28+ Years of Devotion", `HomePage.statNumber1`) and the "Today and Onward" `OurHistory` milestone's caption ("Twenty-eight years in, RCK is still growing…"). Both were plain free-text CMS fields the office had to remember to bump by hand each year — easy to forget, and the two numbers could drift out of sync with each other.

## Problem

Yosef asked for the number to advance itself every November (RCK's founding month, November 1998) rather than needing an annual manual edit, with the same yearly pace every year (no skipped or doubled year), and asked specifically that the two places read the same number.

## Design

New `src/lib/founding.ts`:
- `yearsOfDevotion(date = new Date())` — years since November 1998, incrementing the moment the calendar reaches November each year. `src/pages/index.astro` calls this directly for the impact stat's `value` (`` `${yearsOfDevotion()}+` ``), ignoring `HomePage.statNumber1` entirely (its CMS value is now a "(computed automatically…)" placeholder so the office doesn't think editing it does anything; `statLabel1` still controls the label text).
- `spellOutYears(n)` — spells an integer 0–99 in Title Case (e.g. `28` → `"Twenty-eight"`), matching the existing caption's prose style. `OurHistory`'s "Today and Onward" row now stores its caption with a literal `{{YEARS_IN}}` token in place of the number; `index.astro`'s `history.map()` does a plain `.replace("{{YEARS_IN}}", spellOutYears(yearsOfDevotion()))` on every caption (a no-op on the other milestones, which don't contain the token).

Both call sites derive from the same `yearsOfDevotion()`, so the stat and the caption can't drift apart, and both advance by exactly one every November — the "same pace" Yosef asked for is a property of the formula (a plain year+month comparison, not an anniversary-of-launch timer that could compound rounding).

## Trade-offs

- `statNumber1` is now dead weight in the CMS — kept (not deleted) as a field, repurposed as an in-dashboard note, since removing a `HomePage` field is a bigger schema change than this request needed.
- The `{{YEARS_IN}}` token is stringly-typed inside a free-text field: an editor could overwrite the whole caption and drop the token, silently freezing that sentence's number. Same class of risk this codebase already accepts elsewhere (`linkedFlyerTitle` title-matching, #057) — documented in CONTRIBUTING.md's `OurHistory.caption` row so an editor rewriting that sentence knows to keep the token.
- `spellOutYears` only covers 0–99 — fine for a kollel that opened in 1998.

## Verification

`yearsOfDevotion(new Date("2026-07-31"))` → 28, `yearsOfDevotion(new Date("2026-11-01"))` → 29, matching the live "28+"/"Twenty-eight years in" content before this change and the requested "29+"/"Twenty-nine years in" after the Nov 2026 rollover; `npx astro check` clean (no new errors).
