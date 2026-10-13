# 082 — Fast-day Mincha and Maariv

**Status:** implemented
**Date:** 2026-10-13
**Author:** claude-session (Yosef directing)
**Related:** [#068](068-computed-taanis-times.md), [#077](077-flier-a4-portrait-print-pdf.md)

## Background

[#068](068-computed-taanis-times.md) computes each fast's start and end. The
week's Mincha and Maariv (#040/#079) are one posted time per row for Sun–Thu, so
a fast on, say, Monday had no davening times of its own.

## Rules (Yosef)

On a fast day, two extra times are posted **in addition to** the regular ones
(the week's early Mincha / 18:00 / late Mincha and Maariv rows are unchanged):

- **Mincha** — a minute that is a multiple of 5, between 20 and 25 minutes
  before shkiya. The window is exactly 5 minutes wide, so one always exists;
  measured from shkiya to the second (not the rounded minute). On an exact tie
  at both ends the earlier is taken (never observed: it needs shkiya to land on
  a whole minute that is itself a multiple of 5).
- **Maariv** — 2 minutes before the posted end of the fast (shkiya + 19, as in
  #068), so end − 2.
- **Which fasts:** Tzom Gedaliah, Asara B'Tevet, Ta'anit Esther, 17 Tammuz.
  **Not Tisha B'Av**, which keeps its #068 behaviour (no extra times).

Asked and answered with Yosef: keep the regular times as well (not replace
them); exclude Tisha B'Av; show the new times **inside the fast-day column**,
not as their own Mincha/Maariv rows.

## Design

- `getComputedTaanisRows()` adds optional `minchaTime` / `maarivTime` to
  `ComputedTaanisRow` (absent for Tisha B'Av). Constants live next to
  `TAANIS_END_AFTER_SHKIYA`; the Mincha minute comes from
  `fastMinchaMinutes()`.
- `/daven` lists them in the existing Taanis row as `"<fast> — Mincha"` and
  `"<fast> — Maariv"` between Begins and Ends, gated on `endInWeek` like Ends.
- Fliers: the fast column (wide) and the fast card (A4) show Start, Mincha,
  Maariv, End in that order. A Mincha or Maariv before 18:00 gets the same
  "Down Stairs" mark as the regular ones (#077) — e.g. Asara B'Tevet 2026
  (Mincha 16:15, Maariv 16:56).

## Verification

Checked across ~200 weeks (15 fasts of the four kinds): every Mincha is a
multiple of 5 and 20–25 minutes before raw sunset (from @hebcal/core, not the
module), every Maariv is exactly 2 minutes before the end. Examples:

| Fast | Shkiya | Mincha | Maariv | Fast ends |
|---|---|---|---|---|
| Tzom Gedaliah, Mon 14 Sep 2026 | 18:48:08 | 6:25 PM | 7:05 PM | 7:07 PM |
| Asara B'Tevet, Sun 20 Dec 2026 | 16:39:17 | 4:15 PM | 4:56 PM | 4:58 PM |
| Ta'anit Esther, Mon 22 Mar 2027 | 17:53:06 | 5:30 PM | 6:10 PM | 6:12 PM |
| 17 Tammuz, Thu 22 Jul 2027 | 19:44:56 | 7:20 PM | 8:02 PM | 8:04 PM |

64 weeks rendered through `render.mjs` with no failures; no wide-flier overflow.

## Confirmed with Yosef

The fast-day Mincha and Maariv are marked "Down Stairs" when before 18:00, the
same as the regular ones, and the Mincha tie-break (earlier on an exact tie) is
accepted.
