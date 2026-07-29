# 056 — The KBA Shabbos location block on /daven is hardcoded

**Status:** Recorded after the fact. Behaviour unchanged by this entry.
**Date:** 2026-07-29
**Related:** [#008](008-davening-flat-layout-shabbat-static.md) (direct people to KBA), [#041](041-computed-shabbos-times.md) (computed Shabbos times), [#055](055-upload-skill-triage.md)

## Why this exists

Written because the block couldn't be accounted for. Asked "where did this come from?", the answer took a git-blame — the design log had nothing, and the change read as someone else's.

The KBA logo and address were added 2026-07-07 (`c4dcfa3 add kba logo`, `2ac3db4 daven: fix map pin with exact coordinates, correct street to Tel Khai`), in a run of small commits about logo sizing and map zoom. No entry was written. `grep` across `design-log/` and `CONTRIBUTING.md` for `logo-kba`, `Tel Khai`, or `Shabbos Location` returned nothing.

This is the log's other failure mode. #055 covers entries that go stale; this is a change that never got one, which is worse in a specific way: **when absence of an entry means nothing, the log can't answer "was this deliberate?"** — which is most of what it's for.

## What the block is made of

The Shabbos section of `/daven` mixes three sources, and only one is editable:

| On the page | Source |
|---|---|
| KBA logo | `public/logo-kba.png`, hardcoded `<img src="/logo-kba.png">` in `src/pages/daven.astro` |
| "Shabbos Location" / "Tel Khai 8, Ra'anana" | Hardcoded strings in the same block |
| Friday Night and Shabbos Day times | Computed — `getComputedShabbosSchedule()`, #041 |
| Extra rows appended after the computed ones | `DaveningTimes` rows with `dayType = Shabbat` |

## The content-vs-code call

`AGENTS.md` says to ask, before hardcoding a string or image URL, whether it belongs in a collection. The honest answer here is that **the address probably should be**, and isn't.

- The **logo is brand**, and brand lives in code on this project (#009, #021). Correct as-is.
- The **location name and address are content.** They're a partner shul's details on a page the office maintains, and changing them currently needs a PR.

Not moved in this entry, for a reason worth recording: `ContactInfo.address` already exists and holds **RCK's own** address for the footer. KBA's Shabbos location is a different address, so the move needs a *new* field — a schema write on the live collection plus a `CONTRIBUTING.md` row. That's a real change, not a cleanup, and it should be its own entry.

**Deferred, not rejected.** The trigger to do it: anyone asking to change the address, or KBA moving.

## Trade-off accepted for now

The block is stable — a partner shul's address changes roughly never — so hardcoding costs little in practice. What it cost was legibility: three sources of truth in one visual block, none of them labelled, and no entry explaining the mix. That part is fixed by this entry existing.
