# 013 — Daven page: featured daily learning schedule

> **Note (#031, 2026-06-30):** the `embedUrl` rendering path was removed. The
> schedule now renders `imageUrl` only (the schedule PDF was exported to a PNG),
> opening in the shared lightbox with a download control.

**Status:** implemented
**Date:** 2026-05-28
**Author:** claude-session (danielle directing)
**Related:** #010 (Flyers CMS collection), #003 (davening schedule restructure)

## Background

The Daven with Us page shows minyan times. The rabbi wanted to show the daily learning schedule (a Canva-produced flyer) below the times, with the ability to swap it from the CMS without code changes.

## Questions and Answers

- **Q:** New collection, or reuse `Flyers`?
  **A:** Reuse `Flyers`. The schedule is just another flyer — it has an image/embed URL and can be swapped. A dedicated collection adds overhead for no gain.

- **Q:** How to distinguish this specific slot from other schedule flyers?
  **A:** `category = schedules` + `subCategory = daily`. The page queries `getFlyers("schedules", "daily")` and takes the first active result. Other schedule flyers (weekly, Shabbat, etc.) with different subCategories don't appear here.

- **Q:** Should there be a download button?
  **A:** No. For images, opening in a new tab feels odd. For Canva embeds, Canva provides its own expand/download control natively. Adding a button duplicates that and looks strange.

- **Q:** What goes below the schedule instead of a download button?
  **A:** A soft callout linking to `/learn` — "Looking for more than set weekly times? Explore our learning opportunities →". Connects the two pages naturally without being pushy.

## Design

Section added below existing davening content in `src/pages/daven.astro`. Renders `imageUrl` as a full-width `<img>` or `embedUrl` as a `3:4` aspect-ratio iframe. Max-width `sm` (384px), centered, with a light ring and shadow. Section hidden entirely if no matching CMS row exists.

**CMS slot:** `category = schedules`, `subCategory = daily`. Only one row should have this combination. Office swaps the schedule by editing that row's `imageUrl` or `embedUrl`.

## Trade-offs

- **Single featured slot.** There's no UI to show multiple daily schedules. If multiple rows match, only the first (by `displayOrder`) is shown. The intent is one canonical daily schedule at a time.
- **`subCategory = daily` is a reserved value.** Documented in CONTRIBUTING.md. If an editor uses `daily` as a general sub-filter on a learning flyer, it won't break anything — but the slot is specifically tied to `category = schedules`.
