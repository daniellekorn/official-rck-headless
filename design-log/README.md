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

### After building

1. Add a **Verification** section: how do we know it works? For us, that usually means: page renders correctly with empty CMS, page renders correctly with populated CMS, friend's workflow described in CONTRIBUTING.md still applies.
2. If the change affected `CONTRIBUTING.md` (the non-technical contributor's instructions), confirm that doc was updated.

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
