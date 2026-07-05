# Donations integration research — Nedarim Plus vs. Wix Donations vs. alternatives

**Date:** 2026-07-05
**Status:** research complete, decision pending
**Question:** the current (old) site uses Nedarim Plus. Do we stay with it, move to Wix Donations, or pick another provider for the new headless site?

**TL;DR recommendation: stay with Nedarim Plus** for ILS donations via its documented iframe integration (`?language=en` supported), and optionally add a JGive/IsraelGives link for US/UK donors who need local tax deductibility. Wix Donations is disqualified for an Israeli amuta on two grounds: Wix Payments doesn't operate in Israel, and Wix cannot issue Section 46 receipts — which, as of Jan 1 2026, must carry a Tax Authority allocation number (מספר הקצאה) from certified, Tax-Authority-integrated receipt software.

---

## 1. Current state of the site

- **The donate page doesn't exist.** `Nav.astro` (desktop + mobile) and `Footer.astro` link to `/donate`, but there is no `src/pages/donate.astro` — the link 404s today.
- No payment integration code anywhere; no donation CMS collection; no design-log entry on payments.
- `matara.pro` appears in `.claude/settings.local.json`'s WebFetch allowlist — Nedarim Plus was scoped at some point but never built.
- Useful existing pattern: third-party embeds on this site are `<iframe>`s whose URL lives in a CMS field (see design-log #010, #013, #031). A donation iframe fits this convention.

## 2. Wix Donations on a headless site — what it can and can't do

**Can (confirmed by docs):**
- Real headless-compatible API: `@wix/donations` Donation Campaigns SDK/REST + payment through the **eCommerce cart/checkout** APIs (donation as a line item with `catalogReference` → app ID `333b456e-dd48-4d6b-b32b-9fd48d74e163`, options: `amount`, `frequency` WEEK/MONTH/YEAR, `donorCoveringFees`).
- One-time + weekly/monthly/yearly recurring, suggested amounts, campaign goals/progress, donor-covers-fees (fixed 2.9%), confirmation emails, dashboard/order-based donor management.
- Docs explicitly frame the checkout-API path as the custom-frontend equivalent of the Donations widget.

**Can't / blockers:**
- **Wix Payments is not available in Israel.** An Israeli site must connect a third-party gateway (Tranzila, Grow by Meshulam, PayPlus, Bit, Pelecard, iCredit, PayPal…). Whether Wix Donations fully works (esp. recurring) through Israeli gateways is **not confirmed by documentation** — Wix's "Accepting Donation Payments" article is written around Wix Payments.
- **No Israeli tax receipts.** Nothing in Wix issues a Section 46 קבלה, and Wix is not integrated with מערכת תרומות ישראל, so it cannot produce the allocation numbers mandatory since 1.1.2026. The receipt layer would have to live in the Israeli gateway or external software (iCount/Green Invoice) regardless.
- Wix Donations isn't in the "Featured Business Solutions for Wix Headless" list; installing it on a headless project is likely-but-unverified.

**Net:** even in the best case, Wix Donations is a campaign-management wrapper around an Israeli gateway that does the actual work — extra moving parts, no added compliance value.

## 3. The compliance constraint that decides this (Section 46 / 2026 rules)

- Donors to a Section 46 amuta expect a קבלה valid for the mas hachnasa credit.
- **Since Jan 1, 2026**, every donation must be reported digitally to the Tax Authority's donations system, and each receipt must carry an auto-generated **allocation number**. Only receipt software interfaced with the Tax Authority can issue these.
- In the Israeli market this is handled by the payment processor itself (Nedarim Plus, Grow, Tranzila, CardCom, Sumit) or by dedicated receipt software fed by webhooks.
- Sources: gov.il digital donations reporting service; SFA law-firm client update on the 1.1.2026 obligation; Grow's donations/allocation-number docs.

## 4. What Nedarim Plus offers that Wix Donations doesn't

| Capability | Nedarim Plus | Wix Donations |
|---|---|---|
| Section 46 receipts | ✅ (verify 2026 certification — see open questions) | ❌ |
| 2026 allocation-number reporting | Actively discussed as compliant ⚠️ verify | ❌ |
| Bank standing order (הו"ק בנקאית) | ✅ core feature | ❌ |
| Credit-card hok keva | ✅ | ✅ (via gateway that supports recurring) |
| Bit | ✅ (~1.5% ⚠️) | Only via Israeli gateway |
| Fees | ~1.2% card, ~₪50/mo + ~₪150 setup ⚠️ forum-sourced | Gateway fees + donor-covers-fees is fixed 2.9% |
| Shul terminal network | ✅ thousands of stands; donors can give to RCK from any terminal | ❌ |
| Phone/IVR donations | ✅ | ❌ |
| Custom-site embed | ✅ documented iframe + postMessage, `?language=en` | ✅ via checkout APIs (unverified for IL) |
| Nonprofit-cooperative pricing | ✅ (it's itself an amuta, ע"ר 580615185) | ❌ |

Nedarim Plus integration mechanics (confirmed from their sample + integration JS):
- Embeddable iframe at `https://matara.pro/nedarimplus/iframe` (`sample2.html` shows the flow). Card fields live in the iframe (PCI); **amount, donor details, and all layout are your own HTML/CSS** — good fit for a custom Astro page.
- Flow: your page posts fields (`Mosad`, `ApiValid`, `PaymentType` = `Ragil`/`HK`/`CreateToken`, `Amount`, `Currency`, `Tashlumim`, `CallBack`, donor info) into the iframe via `PostNedarim()`; results come back via postMessage (`ReadPostMessage()`).
- No direct charge API (iframe-only for card entry); there IS a management/reports API (`matara.pro/nedarimplus/ApiDocumentation.html`, access gated per-mosad).
- Proven on custom English kollel/yeshiva sites: ahavasshalom.org, dvar.org.il, beisdovid.com, torassimcha.org.
- Also offers a plain hosted donation page / direct link (lowest-effort fallback).

## 5. Alternatives compared

| Platform | Fees | Recurring | §46 + 2026 | English | Embed/API | Verdict |
|---|---|---|---|---|---|---|
| **Grow (Meshulam)** | 1.4%→0.9% + ₪1/txn; ₪399 setup for amutot | ✅ | ✅ incl. allocation numbers | Hebrew-first UI | ✅ real dev API | Strongest commercial alternative; at kollel volume fees ≈ NP or worse |
| **Sumit** | SaaS subscription + processing (unpriced) | ✅ | ✅ certified for 2026 system | Hebrew-first | ✅ charge API + payment pages | Better as receipts/accounting backbone than donor-facing |
| **CardCom / Tranzila** | negotiated | ✅ incl. bank הו"ק | ✅ | partial | ✅ classic iframe/API | More raw integration work, no donor network |
| **IsraelGives** | base 3.9% + ₪1.90 → effective ~1.4% + ₪0.70 with donor tip; ₪300 setup; recurring module ₪99/mo | ✅ (paid module) | ✅ | ✅ full EN | ✅ documented iframe/modal embed + POST params | Best single substitute **if foreign donors matter**: receipts in 35 countries (US 501c3, UK, CA…) |
| **JGive** | unpublished; subsidized-nonprofit positioning; DAF 2% | ✅ | ✅ auto-filed | ✅ | ❌ destination platform, no self-site embed | Complement for US donors (its US arm is a 501c3), not a website processor |
| **Charidy** | ~2.9% + processing | campaign-oriented | via local processors | ✅ | ❌ campaign pages | Only relevant for a 24-hour matching campaign |
| **PayBox** | P2P app | ❓ | ❓ no §46 evidence | Hebrew | ❌ | Not suitable |
| **Stripe** | — | — | — | — | — | ❌ not available to Israeli entities (no IL clearing license) |
| **PayPal direct** | ~2.4–3.9% + ₪1.20 | weak | ❌ no §46 | ✅ | buttons/SDK | Secondary button at best |

## 6. Foreign donors (US/UK tax deductibility)

None of the Israeli processors (Nedarim Plus, Grow, Sumit, CardCom, Tranzila) give a US filer anything usable — Israeli §46 receipts only. If US/UK deductibility matters to RCK's donor base:
- **IsraelGives**: receipts in 35 countries through its friends-fund network; intl online 2.6% + 30¢.
- **JGive**: US 501(c)(3) arm routes US-deductible gifts to Israeli amutot — no need for RCK's own "American Friends of".

Cheapest architecture: **Nedarim Plus embed for ILS + a JGive charity-page link (or IsraelGives embed) for foreign donors** on the same `/donate` page.

## 7. Recommendation & proposed page architecture

1. **Stay with Nedarim Plus** — nonprofit-grade fees, native hok keva (bank + card), Bit, the shul-terminal ecosystem donors already know, §46 receipts, and a workable documented English iframe already proven on comparable kollel sites. Nothing Wix offers replaces the receipt/compliance layer, and Wix Payments doesn't even operate in Israel.
2. Build `src/pages/donate.astro` around the Nedarim Plus iframe, following the site's CMS-embed convention: a small `DonatePage` (or reuse-style) collection holding the mosad ID / iframe URL / suggested amounts / EN+HE copy so the office can tweak without code. Custom Astro UI for amount buttons + donor fields; only card entry lives in the iframe.
3. Optionally add a "Donating from abroad?" section linking to a JGive page for US donors.
4. Fallback if the iframe fights us: Nedarim Plus hosted donation page as a styled link/QR — zero integration risk, ship in an hour.

## 8. Open questions (ask Nedarim Plus / the amuta's accountant)

- [ ] Current fee sheet (the ~1.2% / ₪50/mo figures are forum-sourced).
- [ ] Written confirmation they are certified for the Tax Authority's **2026 digital donations reporting** (allocation numbers) — hard requirement for any §46 amuta.
- [ ] RCK's mosad ID + API access approval for the iframe integration.
- [ ] Does the kollel have (or want) any US "friends of" entity, or is JGive routing sufficient for US donors?
- [ ] Confidence caveats: items marked ⚠️ above are forum/secondary-sourced; Wix findings marked unverified would need a sandbox test if we ever revisit Wix Donations.

## Sources

- Wix: Donation Campaigns API intro + eCommerce integration (dev.wix.com); "Available payment providers in your country", "Accepting donation payments" (support.wix.com); headless app-install and Wix-hosted-pages guides.
- Nedarim Plus: matara.pro iframe sample (`/nedarimplus/iframe/sample2.html`), integration JS, API docs thread (mitmachim.top/topic/76183), Hebrew Wikipedia, Guidestar ע"ר 580615185.
- Compliance: gov.il donations-reporting service page; sfa.law client update (1.1.2026 obligation); kolzchut Section 46 article.
- Competitors: grow.business/fees + /donations-israel + /api-developers; help.sumit.co.il (2026 certification, charge API); cardcom.solutions + tranzila.com amutot pages; jgive.com/about/fees; israelgives pricing/international/embed docs (help.israeltoremet.org, help.givingtech.org); Globes on Stripe's absent IL license; PayPal IL business fees.
