# 008 — Davening page: flat weekday layout, static Shabbat section

**Status:** implemented — **the Shabbat half is superseded by [#041](041-computed-shabbos-times.md)**; see the addendum at the bottom before trusting anything below about Shabbat.
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** [#003](003-davening-schedule-restructure.md), [#041](041-computed-shabbos-times.md), [#055](055-upload-skill-triage.md)

## Background

#003 shipped a card-based layout: two columns (Weekday | Shabbat), each service in a rounded card with a navy header bar. The client reviewed the live page and found it too heavy and structured — not lean enough for a simple schedule.

## Problem

Two issues in the card layout:

1. **Visual weight too high.** Rounded cards with navy header bars, ring shadows, and hover effects — appropriate for a feature section, not a utility schedule table.
2. **Shabbat CMS data will never exist.** RCK davens Shabbat at KBA (a partner shul), not at their own space. No Shabbat times will be entered in CMS. The Shabbat column would always show "No Shabbat times listed yet."

## Questions and Answers

- **Q:** Should Shabbat times ever be in the CMS?
  **A:** No — RCK davens at KBA on Shabbat. The page should direct people there, not list times. Shabbat becomes static content.

- **Q:** What about multiple Mincha / Maariv times on the same day?
  **A:** Supported by the existing schema (multiple rows per service). The flat layout collapses them into one line with ` · ` separators. If rows share the same `daySpec`, they're grouped on one line; different daySpecs get separate lines under the same service header.

- **Q:** Should the `dayType` field and `Shabbat` schema concept be removed from the CMS?
  **A:** No — leave the field in place. Removing a CMS field requires a full PUT of the schema and risks silent data loss. The `Shabbat` value is simply ignored by the page. `CONTRIBUTING.md` updated to say so.

## Design

**Weekday** — flat row list, no cards:
- Gold eyebrow: "Daily Minyanim"
- `divide-y` rows; each row: `[service name | daySpec | times]`
- Service: `w-24/w-28 shrink-0 font-black uppercase tracking-[0.18em] text-navy-700`
- daySpec: `text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-navy-400`, `sm:w-28 shrink-0`
- Times: `text-sm text-navy-600`, rows within a service group joined with ` · `
- Multiple daySpec groups (e.g. Mincha Sun–Thu + Erev Shabbat) stack vertically within the service row

**Shabbat** — static section:
- Gold eyebrow: "Shabbat"
- KBA logo placeholder (dashed border box, `w-20 h-14 rounded-xl`)
- Copy: "Join us at KBA for Shabbat davening." + "Location details and Shabbat times coming soon."
- Logo and address to be added once available

**CMS** — `dayType = Shabbat` rows stored but not rendered. `CONTRIBUTING.md` updated.

## Trade-offs

- Shabbat is now hardcoded. If RCK ever moves to hosting their own Shabbat tefillos, this section needs to become CMS-driven again. At that point, create a new design log entry and re-examine the schema.
- The ` · ` time-joining format assumes all times for a service on the same days are roughly equivalent options. If one is "primary" and others are secondary, the flat join hides that hierarchy. Revisit if editors need to mark a "main" time.

## Implementation Results

Page rewritten. `CONTRIBUTING.md` updated. Design log added.
`davening.ts` lib unchanged — `getDaveningGrouped()` still returns both day types; the page only consumes `grouped.Weekday`.

## Addendum — the Shabbat decisions here are no longer true (2026-07-29)

Two claims above are now false, and both were still being read as current. Found while verifying the upload skill against the live CMS ([#055](055-upload-skill-triage.md)).

**"Shabbat CMS data will never exist."** It exists. Five rows, entered at some point after this entry, and still active.

**"`dayType = Shabbat` rows stored but not rendered."** They render. [#041](041-computed-shabbos-times.md) computed the Shabbos block and `daven.astro` appends CMS `Shabbat` rows to it as extras (`shabbosExtras`), the same way #040 left room for weekday extras. The Implementation Results note — "the page only consumes `grouped.Weekday`" — stopped being true then.

So the trade-off recorded above ("if RCK ever moves to hosting their own Shabbat tefillos… create a new design log entry and re-examine the schema") was half-answered by #041 without this entry being revisited.

**What the live data actually looks like.** Five active rows, all `orgName: KBA`, all with `dayType` spelled **`Shabbos`** rather than `Shabbat` — so they match neither filter in `getDaveningGrouped()` and appear on no page:

| service | time | vs computed |
|---|---|---|
| Shacharis | 8:45 AM | identical — #041's fixed 8:45 |
| Tefillat Yeladim | 10:00 AM | identical — #041's fixed 10:00 |
| Mincha | 7:15 PM | contradicts the computed 7:10 |
| Maariv | At Tzeis | the computed row already says 8:18 PM |
| Parsha of the Week | Parshas Pinchas | stale; the page computes "Parshas Eikev" |

**The misspelling is the only thing preventing a visible bug.** Correct it to `Shabbat` and the Shabbos Day list shows Shacharis twice, Tefillat Yeladim twice, two contradicting Mincha times, and a stale parsha. #040 disabled the equivalent RCK weekday rows (`active: false`) when it computed them; #041 did not do the same for these.

**Recommended fix: `active: false` on all five**, matching what #040 did. That has no visible effect today (they render nowhere) and removes the trap for whoever eventually notices the spelling. Not done here — it's live content, and retiring KBA's times is the office's call to make.

**Do not make the `dayType` comparison lenient.** Accepting `Shabbos` as a synonym looks like a friendly robustness fix and is the exact wrong move: it unmasks the duplicates. If the field is ever normalized, these rows must be retired first.
