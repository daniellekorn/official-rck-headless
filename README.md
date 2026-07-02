# Ra'anana Community Kollel (RCK)

The website for RCK — the Ra'anana Community Kollel. Built with [Astro](https://astro.build) on [Wix Headless](https://dev.wix.com/docs/go-headless): page structure and styling live in this repo, while all editable content (schedules, flyers, team members, photos, theme colors) lives in Wix CMS collections so the office can update the site without code changes.

## Getting started

```sh
npm install
npm run dev      # wix dev — local dev server bound to the Wix site
npm run build    # wix build
```

The Wix CLI handles auth and site binding (`wix.config.json`). CLI reference: `node_modules/@wix/cli/agents/instructions.md`.

## Where things live

| What | Where |
|---|---|
| Editor guide + CMS collection schemas | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Design decisions and their reasoning | [`design-log/`](design-log/) — numbered decision records |
| Agent / process instructions | [`AGENTS.md`](AGENTS.md) |
| Pages | `src/pages/` (Astro, SSR) |
| Data access (one module per CMS collection) | `src/lib/` |
| Components | `src/components/` |
| Brand tokens (colors, fonts) | `src/styles/global.css` (`@theme`), CMS-overridable via `ThemeSettings` |

The central rule of the codebase: **content belongs in the CMS, structure belongs in code.** Before hardcoding a string, image, or schedule, read `CONTRIBUTING.md` and check the design log — field names break silently if mistyped.
