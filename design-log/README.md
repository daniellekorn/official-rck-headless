# Design Log

A persistent, in-repo memory for *why* this codebase looks the way it does. Chat sessions disappear. The repo doesn't. When a future Claude session — or a future human — asks "why did we do it this way?", the answer lives here.

## When to write one

**Must** write a design log for:

- **CMS schema changes.** Adding a collection, renaming a field, changing field types. The friend's content edits and the code's queries depend on field names being stable; silent breakage is the failure mode. Log it before the schema ships.
- **New pages or major sections.** Anything that adds a route or a top-level page section.
- **Content-vs-code boundary decisions.** "Should this be editable in CMS, or hardcoded?" is the central architectural question on this project. Log every meaningful answer.
- **Architecture choices with alternatives.** Picking one auth pattern, data shape, or third-party tool over another.
- **Workflow changes affecting the non-technical collaborator.** Anything that changes what they edit, where, or how.
- **Bilingual / RTL behavior.** Anything affecting Hebrew rendering, direction, or fallback fonts.

**Skip** the log for: typo fixes, single-property style tweaks, simple copy updates that don't change data shape, dependency bumps without API surface changes.

## Process

### Before you build

1. Read `design-log/` for related prior decisions. Cite by number in conversation ("see #003").
2. Write the design log first when the change is non-trivial. Get approval.
3. For ambiguous decisions, **ask questions in the log file** and leave them in even after they're answered — the trail of reasoning is the point.

### While building

1. Don't rewrite the "design" section of the log once implementation starts. Append, don't overwrite.
2. Append an **Implementation Results** section as work progresses, including commit SHAs.
3. Document deviations explicitly: where did the implementation diverge from the original design, and why?

### Reversing an earlier decision — required, not optional

**If your change makes an existing entry's decision untrue, amend that entry in the same PR.** Edit its `**Status:**` line to say what superseded it, and append an addendum with what's now true. This is the one rule that keeps the log from becoming actively misleading.

The failure it prevents, from the record: [#008](008-davening-flat-layout-shabbat-static.md) decided Shabbat times would never be in the CMS and that `dayType = Shabbat` rows are "stored but not rendered". [#041](041-computed-shabbos-times.md) then computed the Shabbos block *and* started rendering those rows — without touching #008, which went on asserting the opposite. Three weeks later that stale text was read as current and produced a wrong instruction in a shipped editor skill ([#055](055-upload-skill-triage.md)).

[#020](020-homepage-stale-cache-no-store.md) is the counter-example, and the standard to copy: it records its own reversal in an *Outcome* section — "the `src/middleware.ts` from this change is a no-op, so it was reverted" — so nobody has to rediscover it.

**A supersession note beats a new entry** when the decision is genuinely reversed. Write a new entry when the *problem* is new; amend the old one when the *answer* changed.

### More than about three addenda means the entry needs consolidating

An entry accumulating addendum after addendum has become a diary, and the "write the conclusion, not the diary" rule above applies to it. On ship, fold the addenda into the design as it now stands and keep only the reversals someone might otherwise re-attempt.

### After building

0. Run `npm run check:design-log`. It flags entries citing files or `UPPER_SNAKE` constants that no longer exist, and cross-references to entries that don't exist. The baseline is clean, so any hit is yours. A hit is a prompt, not a verdict — either the entry needs a supersession note, or it's naming something gone on purpose (a rename record, a reverted change), which goes in `design-log/.stale-ok` **with a line saying which**.

   It does **not** catch CMS *field* drift — `embedUrl` sat in [#010's](010-flyers-cms-collection.md) schema table long after [#031](031-flyer-image-lightbox.md) removed it, and no amount of grepping finds that. Field names can only be checked against the live collection.

1. Add a **Verification** section: how do we know it works? One short prose paragraph, not a long checklist. For us, that usually means: page renders correctly with empty CMS, page renders correctly with populated CMS, friend's workflow described in CONTRIBUTING.md still applies.
2. If the change affected `CONTRIBUTING.md` (the non-technical contributor's instructions), confirm that doc was updated.
3. **Trim the log.** Once shipped, the entry should shrink — see "Lifecycle" below.

### Lifecycle: write big, trim down

A log is meant to outlive the session that produced it. The size that's useful *during* the design is much bigger than the size that's useful *six months later*. When the entry moves from `accepted` → `implemented`, do a trim pass:

- **Delete the Implementation Plan section.** It was scaffolding for the build. The commits are the actual record of what shipped.
- **Collapse Verification to one or two sentences.** "Verified that X renders with empty and populated CMS; friend's editing workflow unchanged." Drop unchecked boxes — if a check never got performed, it's not going to.
- **Delete one-time migration artifacts.** Old→new mapping tables, scripts that ran once, the list of rows you patched. The *decision* stays ("we re-anchored on the new brand spec and re-derived tints"); the migration mechanics go.
- **Strip "files touched" lists.** `git log` and `git show <sha>` are authoritative; mirroring them in prose just rots.
- **Cut Q&A items that didn't actually have an alternative.** "Should we do X — yes" carries no decision. Keep Q&A only where a real alternative was weighed.

The log should get *smaller* over its lifecycle, not stay the same size. A 200-line log that explains five decisions is more useful than a 600-line log that buries them in process scaffolding.

### Multi-pass design iterations

If the design went through several attempts before landing (e.g. tried library A, then library B, then a CSS rewrite), write the **conclusion**, not the diary. One paragraph naming the rejected approaches + *why* they were wrong is enough — anyone reaching for one of them later needs the warning, not the play-by-play. The body of the log describes the *final* design as the design.

Reach for a session transcript if you want the full chronology; the design log is a memory, not a journal.

## Structure of an entry

Each entry is `design-log/NNN-kebab-case-slug.md`. Numbers are zero-padded and monotonically increasing.

```markdown
# 003 — Title in present tense

**Status:** proposed | accepted | implemented | superseded by #NNN
**Date:** 2026-05-27
**Author:** danielle (or "claude-session")
**Related:** #001, #002

## Background
One paragraph. What was the context — recent work, existing system, constraint.

## Problem
What needed solving. Be specific. Include user-visible symptoms if relevant.

## Questions and Answers
Bullet questions raised during design, with their resolutions inline. Keep
the question even after it's answered — the reasoning is the point.

- **Q:** Should `HomePage` be a single-row collection or key/value?
  **A:** Single-row. Images need typed Image fields; key/value strings can't hold them.

## Design
The proposal. Short, specific. File paths, type signatures, collection names,
field names — anything a reader would need to verify the design against the code.

Include a mermaid diagram when it clarifies data flow.

## Implementation Plan
Numbered steps. Each one should be small enough to commit independently.
**Delete this section once the work has shipped — the commits are the record.**

## Examples
Show good vs. bad patterns. Real code snippets.

✅ Right:
```ts
const elevated = auth.elevate(items.query);
const { items } = await elevated("TeamMembers").find();
```

❌ Wrong:
```ts
// Silently returns zero rows when collection is non-public
const { items } = await items.query("TeamMembers").find();
```

## Trade-offs
What did we give up? What did we make harder for future work?

## Verification
How we'll confirm the design is met. Concrete checks, not "tests pass".
Prefer prose to checkboxes; after ship, collapse to one or two sentences.

## Implementation Results (appended after work ships)
- Commit SHAs
- Deviations from the design + why
- Test/verification outcomes
```

## Anti-patterns

- Logs written *after* the work is done, summarizing what happened. The point is to think before you build. Retrospective logs have their place but mark them clearly.
- Logs that describe *what* the code does. The code is right there. Logs are for *why*.
- Logs that don't name files, fields, or commit SHAs. A log without specifics rots into vague aspirations.
- "Future work" sections that grow forever. If something is future work, open an issue or add a TODO in code; the design log records *this* decision.
- **Stale verification checklists.** Pages of `- [ ]` checkboxes, some checked, some left pending forever ("friend will test in browser"). After ship, collapse to one prose line.
- **Migration tables that have already run.** Old→new mappings, schema-revision bumps, row IDs you patched — these are exhaust from the build, not memory of the design.
- **Pass-by-pass narratives of failed iterations.** A 2000-word account of "we tried A, user pushed back, we tried B, user pushed back" is a session transcript. Compress to: "Approaches A and B were rejected because X — don't reach for them again."
- **Q&A where there's no actual alternative.** "Should we do the thing — yes" isn't a decision; it's a soliloquy. Keep Q&A for forks in the road.
- **Recurring filler lines.** "Browser verification deferred to the user" repeated in every Verification section adds bytes and no information. Once is enough; better yet, just don't say it.

## Naming and numbering

- `NNN-short-slug.md` (e.g. `001-cms-driven-content-architecture.md`)
- Next number = highest existing + 1, regardless of status
- Don't re-use numbers for superseded logs; mark them `Status: superseded by #NNN` and leave them in place

## Quick reference

| Trigger | Log it? |
|---|---|
| Add a new CMS collection | **Yes** |
| Rename a CMS field | **Yes** |
| Add a new page | **Yes** |
| Move content out of code into CMS | **Yes** |
| Pick between two competing libs | **Yes** |
| Add a language / change RTL behavior | **Yes** |
| Fix a typo | No |
| Change one color in a single component | No |
| Bump a dependency (no API change) | No |
| Reorder a section's children with no semantic change | No |
