# 042 — Donate page with Nedarim Plus iframe

**Status:** implemented
**Date:** 2026-07-05
**Author:** claude-session (provider decision by danielle via `donations-provider-research.md`)
**Related:** #001 (CMS-driven content), #014 (contact page — form styling reused), #021 (low-radius controls)

## Background

`Nav.astro` and `Footer.astro` have linked to `/donate` since the visual refresh, but the page never existed — the site's most important CTA 404'd. The old site (rckollel.com) takes donations through a hosted Nedarim Plus page (`matara.pro/nedarimplus/online/?S=wcHH`).

The provider comparison (Nedarim Plus vs. Wix Donations vs. Grow/Sumit/IsraelGives/JGive/etc.) lives in **`donations-provider-research.md`** at the repo root. Short version: Wix Donations is disqualified for an Israeli amuta (Wix Payments doesn't operate in Israel; no Section 46 receipts, which since 1.1.2026 must carry Tax Authority allocation numbers). Nedarim Plus keeps the receipt/compliance layer, the shul-terminal network, bank/card hok keva, and nonprofit pricing — and the Kollel already has the account. US-tax-deductible giving (JGive/IsraelGives) was explicitly deferred.

## Problem

Build `/donate` on Nedarim Plus without the one credential we can't self-serve: the per-mosad **ApiValid** code for their iframe integration, which the office must request from Nedarim Plus support. The page must be useful *now* and upgrade to the embedded form without a code change later.

## Questions and Answers

- **Q:** Embed the hosted Nedarim Plus page in an iframe (it sends no `X-Frame-Options`), link out to it, or build the custom iframe form?
  **A:** Both ends: link out today, custom form when credentials arrive. Embedding the *hosted* page was rejected — it's a full app with its own branding/header and would look foreign inside ours; the *card-fields* iframe is the integration Nedarim Plus actually documents for custom sites.
- **Q:** Where does `ApiValid` live — env var/secret or CMS?
  **A:** CMS (`DonatePage.apiValid`, anyone-can-read). It is not a secret in this integration: their own sample posts it from browser JS into the iframe, so it ends up in page HTML regardless. Keeping it in the CMS makes "turn on the real form" an office edit, not a deploy. (It is *not* the same as their gated management/reports API access.)
- **Q:** Hardcode the donation designations or CMS them?
  **A:** CMS (`purposes`), because the categories must match the Kollel's Nedarim Plus dashboard *verbatim* to land in the right report bucket, and the office adds/removes categories there without us. Format `Label | category` so donors see clean English while the category string stays exact. Prefilled from the live `GetMosad` API response for mosad 7013258.
- **Q:** Support installments (Ragil `Tashlumim` > 1) and fixed-length hok keva?
  **A:** No — one-time (`Ragil`, `Tashlumim=1`) and open-ended monthly (`HK`, `Tashlumim` empty = until cancelled) only. Fewer choices on a donation form; the hosted page covers exotic cases.

## Design

- **`DonatePage` collection** (single row, read ANYONE / writes ADMIN): `mosadId`, `apiValid`, `hostedPageUrl`, `introText`, `suggestedAmounts`, `purposes`. Schema table in `CONTRIBUTING.md`.
- **`src/lib/donate.ts`** — `getDonateConfig()` (standard elevated single-row read), `parseSuggestedAmounts()`, `parsePurposes()`.
- **`src/pages/donate.astro`** — PageHeader + two-column section (why-give info left, form card right, contact-page styling). Two modes decided server-side:
  - *Fallback* (`apiValid` empty): gold CTA opening `hostedPageUrl` in a new tab; `/contact` CTA if that's empty too.
  - *Embedded form*: frequency toggle (one-time/monthly), preset + custom amount, designation select, donor fields, dedication, and Nedarim Plus's PCI iframe (`https://matara.pro/nedarimplus/iframe?language=en`) holding only card number/expiry/CVV. Submission = `postMessage` `FinishTransaction2` with `Mosad`/`ApiValid`/`PaymentType`/`Amount`/donor fields; result via `TransactionResponse` message (origin-checked to `matara.pro`). Success swaps the card's content for a thank-you block.
- Key protocol facts (from their API doc + `sample2.html`): `Currency: 1` = ILS; `HK` `Amount` is per-month and empty `Tashlumim` means charge until cancelled; **postMessage is ignored from localhost** — the embedded form can only be exercised on a deployed domain; if the iframe never reports its height within 8s the page reveals a "donate on the hosted page instead" escape hatch.

## Trade-offs

- Card entry UX is Nedarim Plus's iframe — we control everything around it but not the card fields themselves.
- No server-side `CallBack` webhook yet; the office's source of truth for donations is the Nedarim Plus dashboard (as it already is with the hosted page).
- ILS only (`Currency: 1`). Foreign-deductibility (JGive link) deliberately deferred — see research doc §6.

## Verification

Fallback mode (the live mode until ApiValid arrives) verified against the dev server with the real CMS row. The embedded form renders but cannot complete a charge from localhost by design; first real-card test must happen on the deployed site once the office obtains ApiValid (a ₪1–18 test donation, then refund/cancel from the Nedarim Plus dashboard).

## Open items for the office

- Ask Nedarim Plus support for the mosad's iframe **ApiValid** code (mosad 7013258) and paste it into `DonatePage.apiValid`.
- While on the phone: confirm current fee sheet and their certification for the 2026 allocation-number reporting (research doc §8).

## Implementation Results

- (append commit SHA on ship)
