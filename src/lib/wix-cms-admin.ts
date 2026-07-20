// TEMPORARY WORKAROUND — remove once Wix fixes the hosted WIX_CLIENT_INSTANCE_ID.
//
// The Wix-managed hosted (BaaS) runtime ships WIX_CLIENT_INSTANCE_ID as
// 00000000-0000-0000-0000-000000000000 (NIL_UUID), written immutable
// (Mutability.STATIC) by the platform. Because of that, @wix/essentials'
// auth.elevate() builds an instance-scoped token whose client_credentials
// exchange returns 404 ("app not found in any meta-site"), so every CMS query
// silently falls back to empty on the live site. Full root cause + evidence:
// WIX-HEADLESS-INSTANCE-ID-BUG-REPORT.md.
//
// This bypasses the broken instance-scoped auth using Wix's documented
// "admin operations" flow: a client_credentials access token with NO
// instance_id (https://dev.wix.com/docs/go-headless/get-started/about-admin-operations).
// That token authenticates as the app itself and resolves to this site's data
// (verified against the HomePage collection).
//
// ⚠️  SERVER ONLY. This module uses the app secret and mints an admin-scoped
//     token (full read/write to business data). It must never be imported from
//     client-side code. When Wix corrects the hosted instance ID, delete this
//     file and restore in each src/lib/*.ts:
//         import * as items from "@wix/wix-data-items-sdk";
//         import { auth } from "@wix/essentials";

import { createClient } from "@wix/sdk";
import * as itemsSdk from "@wix/wix-data-items-sdk";
import { WIX_CLIENT_ID } from "astro:env/client";
import { WIX_CLIENT_SECRET } from "astro:env/server";

let cached: { token: string; expiresAt: number } | null = null;

async function getAuthHeaders() {
	if (cached && cached.expiresAt > Date.now()) {
		return { headers: { Authorization: cached.token } };
	}
	const res = await fetch("https://www.wixapis.com/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			grant_type: "client_credentials",
			client_id: WIX_CLIENT_ID,
			client_secret: WIX_CLIENT_SECRET,
		}),
	});
	if (!res.ok) {
		throw new Error(
			`admin-ops token exchange failed: ${res.status} (request id: ${res.headers.get("x-wix-request-id")})`,
		);
	}
	const json = (await res.json()) as { access_token: string; expires_in: number };
	cached = {
		token: json.access_token,
		// refresh a minute before the ~4h expiry
		expiresAt: Date.now() + (json.expires_in - 60) * 1000,
	};
	return { headers: { Authorization: cached.token } };
}

const adminClient = createClient({ auth: { getAuthHeaders } });

// Drop-in replacements so each lib only swaps its two import lines. `items`
// exposes the same query builder bound to the admin client; `auth.elevate` is a
// no-op passthrough because the client is already elevated.
export const items = adminClient.use(itemsSdk);
export const auth = { elevate: <T>(fn: T): T => fn };
