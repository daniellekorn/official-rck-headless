# 014 — Contact page with a working email form

**Status:** implemented
**Date:** 2026-05-29
**Author:** claude-session (danielle directing)
**Related:** #011 (ContactInfo collection), #009 (RCK brand identity)

## Background

Client review of demo sites. The nav gained a dedicated Contact button, which
needs a destination. The client pointed at dallastorah.org/contact (a real
contact form: "Get Involved Today!" → First/Last/Email/Phone/Message) and
yukollella.com (contact info beside a form), and asked for the tagline
"Want to get involved? Looking to learn? We want to hear from you!"

## Problem

The site is a headless Astro app on Wix (`output: "server"`). There is no Wix
Forms / CRM / triggered-email package installed, so there is no built-in form
endpoint. We need a real form that delivers submissions to the office inbox.

## Questions and Answers

- **Q:** Where do submissions go — a CMS collection, or email?
  **A:** Email to the office inbox (client's choice). A `ContactSubmissions`
  collection was the alternative; the office preferred not to manage a
  collection of submissions and wants them to land in an inbox.

- **Q:** How do we send email from a headless Wix Astro app with no email
  package available?
  **A:** A server endpoint (`src/pages/api/contact.ts`) that calls a
  transactional email API over `fetch`. We use **Resend** — it's a single REST
  call (no npm dependency, nothing to bundle) and has a free tier. The API key
  and addresses are environment variables, never committed. SendGrid/Mailgun
  would work identically; swapping is a one-function change in the endpoint.

- **Q:** What if the email credential isn't set yet?
  **A:** The endpoint returns a clear 503 and the form shows a friendly "couldn't
  send" message with the office email as a fallback. The form, its validation,
  and its UX do not depend on the credential — only actual delivery does.

- **Q:** Is the form copy/structure content or code?
  **A:** Structure. Field set and tagline are hardcoded (like the nav and hero
  brand lockup, see #009). The office edits phone/email/address via the
  ContactInfo collection (#011), which the page and footer both read.

## Design

**Route:** `src/pages/contact.astro` — PageHeader ("Contact Us") + tagline, then
a two-column layout: contact info (phone → email → address, + small map) on the
left, the form on the right. Single column on mobile.

**Form fields:** First Name, Last Name, Email, Phone (all required), Message
(optional). Plus a hidden `company` honeypot for spam. Client JS POSTs JSON to
`/api/contact` and renders inline success/error without a page reload.

**Endpoint:** `src/pages/api/contact.ts`, `export const POST`. Validates the
payload, drops honeypot hits silently, then sends via Resend.

Environment variables (set with `wix env set`, read from `context.locals` at
runtime with a `process.env` fallback for local dev):
- `RESEND_API_KEY` — Resend API key (required for delivery)
- `CONTACT_TO_EMAIL` — destination inbox; falls back to `ContactInfo.email`
- `CONTACT_FROM_EMAIL` — verified sender; defaults to `onboarding@resend.dev`
  for testing until the office verifies their domain in Resend.

## Trade-offs

- **External dependency on Resend.** A third-party service is now in the
  contact path. Mitigated by isolating it to one function and using only its
  REST API (no SDK lock-in). If the office later installs Wix CRM/Forms, the
  endpoint body can be swapped without touching the page.
- **No stored record.** Email-only means no on-site archive of submissions. The
  office's inbox is the record. Revisit with a `ContactSubmissions` collection
  if they later want searchable history.

## Go-live setup (one time)

1. Create a Resend account, verify the sending domain.
2. `wix env set --key RESEND_API_KEY --value <key>`
3. `wix env set --key CONTACT_TO_EMAIL --value <office inbox>`
4. `wix env set --key CONTACT_FROM_EMAIL --value <verified sender>`

Until step 2, the form validates and submits but reports that delivery isn't
configured yet.

## Verification

Page renders with empty and populated ContactInfo. Submitting with missing/
invalid fields shows inline validation; a valid submit with the key configured
sends an email and shows success; with no key it shows the not-configured
message. Honeypot-filled submissions return ok without sending.
