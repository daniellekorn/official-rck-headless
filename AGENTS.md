## CLI Commands

All CLI instructions can be found at:
node_modules/@wix/cli/agents/instructions.md

## Skills

This project comes with a set of skills that can be used when the user asks for help with specific tasks.
If you're using the instructions provided by a skill and fail, or if you do not find a relevant skill for the task,
you can try updating the skills by running the following command:

`wix skills update`

This will update the skills to the latest version.

## Design Log

Before making non-trivial changes, **read `design-log/`** for prior decisions and check whether a new entry is required. Required entries cover: new/renamed CMS collections or fields, new pages, content-vs-code boundary decisions, library choices with alternatives, workflow changes affecting the non-technical collaborator, and bilingual/RTL behavior. Process and exclusions in `design-log/README.md`.

Cite prior entries by number in conversation when relevant ("see #001"). For in-flight work, append an **Implementation Results** section with commit SHAs once shipped.

## Editor-facing content

This codebase separates *content* (Wix CMS collections) from *structure* (Astro code). Before hardcoding a string, image URL, or schedule into a component, ask whether it belongs in a collection so the office can edit it without code. The full content/code split, collection schemas (exact field names — they break silently if mistyped), and editor workflow are in `CONTRIBUTING.md`. Any change to a CMS field name must update both the doc and a design log entry.