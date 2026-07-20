# 052 — CMS auth: temporary admin-operations bypass for the hosted NIL instance ID

**Status:** Shipped as a workaround (pending Wix platform fix). Revert when #6 below lands.
**Date:** 2026-07-20

## Problem

Every CMS-backed section on the **live** site rendered empty while local `wix dev`
worked perfectly. The hosted runtime threw, inside Wix's auto-generated auth
middleware (`@wix/sdk` `AppStrategy.getAuthHeaders`, `instanceId` branch):

```
Failed to exchange instance ID for access token.
Unexpected status code from Wix OAuth API: 404
```

Root cause (full evidence in `../WIX-HEADLESS-INSTANCE-ID-BUG-REPORT.md`): the
Wix-managed **hosted (BaaS) env** ships `WIX_CLIENT_INSTANCE_ID` as
`00000000-0000-0000-0000-000000000000` (`NIL_UUID`), written immutable
(`Mutability.STATIC`) by the platform. `auth.elevate()` builds an instance-scoped
token from that NIL value; the `client_credentials` exchange with a NIL
`instance_id` returns **404** ("app not found in any meta-site"). Local works
because the CLI scaffold wrote the **real** instance ID into `.env.local`.

This is a Wix platform provisioning bug, not our code — confirmed: the auth
middleware tarball is byte-identical across our only dependency change, no commit
touches auth/env, and `wix env set` + release cannot fix it (the var is STATIC at
the BaaS layer; a fresh cold container still served zeros).

## Options considered

1. **Wait for Wix to fix it.** Correct long-term, but leaves the live site broken
   indefinitely with no ETA.
2. **`wix env set WIX_CLIENT_INSTANCE_ID <real>` + release.** Tried. Fails — the
   BaaS var is immutable; the value does not reach the hosted runtime.
3. **Override the instance ID inside `@wix/essentials` contextual auth.** Rejected —
   requires fighting framework-internal `getContextualAuth`; fragile.
4. **Documented admin-operations flow (chosen).** A `client_credentials` token with
   **no `instance_id`** (https://dev.wix.com/docs/go-headless/get-started/about-admin-operations).
   Verified: the token resolves to this site's data and returns the real `HomePage`
   row. It never references `WIX_CLIENT_INSTANCE_ID`, so the NIL value can't affect it.

## Decision

Option 4. New server-only helper `src/lib/wix-cms-admin.ts` mints and caches the
admin token, binds the Wix Data module to a `createClient` using it, and re-exports
drop-in `items` + a no-op `auth.elevate`. Each of the 13 `src/lib/*.ts` CMS modules
swaps its two SDK import lines for `import { items, auth } from "./wix-cms-admin";` —
**query bodies unchanged.**

## Trade-offs / risks

- **Broader privilege.** The admin token grants full read/write to business data,
  wider than the instance-scoped elevation it replaces. Acceptable **only** because
  it is used server-side (SSR `src/lib`, secret never in the client bundle). Do not
  import `wix-cms-admin.ts` from client code.
- **Masks the platform bug.** The Wix report is filed independently; this bypass is
  not a reason to drop the escalation.
- **Temporary.** Revert to `@wix/essentials` `auth.elevate` once the hosted instance
  ID is correct — delete `wix-cms-admin.ts`, restore the two original import lines
  per file (documented in the helper's header).

## Verification

- `astro check`: no new type errors (one pre-existing unrelated error in `index.astro`).
- Dev server: homepage served 33 CMS media refs / 294 KB (broken live: 2 / 64 KB).
- HTTP probe: admin token (no instance) → `HomePage` row returned; NIL instance → 404.

## Implementation Results

- Files: `src/lib/wix-cms-admin.ts` (new) + 13 `src/lib/*.ts` import swaps.
- Commit SHA: _pending (owner is managing the release)._
- Revert tracking: remove when Wix confirms the hosted `WIX_CLIENT_INSTANCE_ID` is
  populated with the real instance (`786e88ca-50f0-4d77-b6c9-fc01cc6629f8`).
