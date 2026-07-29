# 054 — Linking duplicate flyers with `linkedFlyerTitle`

**Status:** implemented
**Date:** 2026-07-29
**Author:** claude-session
**Related:** #002, #010, #017, #037

## Background

Some physical flyers are posted in two places that read from different rows: the youth page's "Dor L'Dor for Boys"/"Dor L'Dor for Girls" flyers duplicate rows already posted under `Flyers` (category `learning`, per #017), and the Daven page's featured schedule (`Flyers`, category `schedules`, tag `daily`) duplicates the "Community Schedule" row also shown on `/learn`. Each pair was maintained as two independent uploads with no connection between them.

## Problem

The office wants to update a flyer once and have it reflect everywhere it's duplicated, instead of re-exporting and re-uploading the same PNG to two CMS rows.

## Questions and Answers

- **Q:** Use a true Wix reference/multi-reference field to link the rows?
  **A:** No. #002, #010, and #017 each independently rejected reference fields between these collections for the same reasons: dashboard friction (a reference picker vs. typing a value) and query complexity (`.include()`, resolving IDs on every filter). There's also a type mismatch — `Flyers.imageUrl` is a plain Text URL, `YouthPrograms.flyerImage` is a real Wix Image field — so a reference wouldn't resolve to the same shape without extra bridging code anyway.
- **Q:** What identifies the row to link to — a synthetic key/slug, or the row's own title?
  **A:** The row's own `title`, exact match. This codebase already keys off exact CMS titles elsewhere (`FLYER_ALT_TEXT` in `src/lib/flyers.ts`), and a title is something the office already sees and edits — no second vocabulary to maintain in sync.
- **Q:** Which direction does the link point?
  **A:** Always toward a `Flyers` row with `category = "learning"`. Learning is the collection every duplicate turned out to originate from in practice, so it's the fixed source of truth; a learning row never itself follows a link (only checked when `category !== "learning"`), which also sidesteps any resolution-chain complexity.

## Design

New optional Text field, same name and meaning in both collections: **`linkedFlyerTitle`** — the exact `title` of a `Flyers` row with `category = "learning"` whose `imageUrl`/`pdfUrl` this row should mirror.

- `src/lib/flyers.ts`: `getFlyers()` now, for any non-"learning" result with `linkedFlyerTitle` set, looks it up (case-insensitive, trimmed) against a fresh `category = "learning"` query and overwrites `imageUrl`/`pdfUrl` from the match. Unset or unmatched → the row's own `imageUrl`/`pdfUrl` is used, unchanged.
- `src/lib/youth-programs.ts`: `getYouthPrograms()` does the same lookup against `getFlyers("learning")`, overwriting `flyerImageUrl`/`flyerPdfUrl` (and clearing `flyerAspect`, since a linked flyer isn't sized from `YouthPrograms.flyerImage`'s own Image-field metadata). Unset or unmatched → falls back to the row's own `flyerImage`/`flyerPdfUrl`, unchanged from before this change.

Live rows linked: `YouthPrograms` "Dor L'Dor for Boys" → `linkedFlyerTitle: "Dor L'Dor for Boys"`; "Dor L'Dor for Girls" → `"Dor L'Dor for Girls"`; "Matmidim Chaburos & Program" → `"Learn & Grow Chaburos for Kids"` (titles differ across collections — found by comparing the underlying media file ID, not the title, since the two rows had drifted to different names); `Flyers` "Daily Schedule" (`schedules`) → `linkedFlyerTitle: "Community Schedule"`.

## Trade-offs

- A title match is stringly-typed: renaming the target learning row's `title` silently breaks the link (falls back to the linked row's own stale image/PDF rather than erroring). Acceptable — the same risk already exists for `FLYER_ALT_TEXT`, and a broken link degrades to the pre-#054 behavior, not a crash. This isn't hypothetical: "Matmidim Chaburos & Program" (`YouthPrograms`) and "Learn & Grow Chaburos for Kids" (`Flyers`/learning) were already the same image under two different titles before this change — the title-based match had to be set up by hand after confirming the duplicate via matching media file IDs, not discovered automatically.
- `getFlyers()` now does a second query when any result in a non-learning category carries a link, and `getYouthPrograms()` now always imports `flyers.ts` and may issue one extra query. Negligible at this data volume (build-time SSG, dozens of rows).

## Verification

Confirmed both `getFlyers("schedules", "daily")` and `getYouthPrograms()` resolve the linked image/pdf from the matching `learning` row when `linkedFlyerTitle` is set, and fall through to the row's own image when it's empty or unmatched; `npx astro check` passes. CONTRIBUTING.md documents the new field on both collections and the Daven/Learn schedule sharing behavior.
