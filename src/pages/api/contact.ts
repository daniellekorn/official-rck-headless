import type { APIRoute } from "astro";
import { getContactInfo } from "../../lib/contact-info";

export const prerender = false;

interface Payload {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	message?: string;
	/** Honeypot — real users never fill this. */
	company?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (status: number, body: Record<string, unknown>) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

const escapeHtml = (s: string) =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/**
 * Read an env var. On the Wix cloud runtime these arrive on `locals`
 * (the fetch adapter exposes them as locals.VAR); local `wix dev` also
 * populates process.env from .env.local, so we fall back to that.
 */
const readEnv = (locals: Record<string, unknown>, key: string): string | undefined => {
	const fromLocals = locals?.[key];
	if (typeof fromLocals === "string" && fromLocals) return fromLocals;
	const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
	return proc?.env?.[key] || undefined;
};

export const POST: APIRoute = async ({ request, locals }) => {
	let data: Payload;
	try {
		data = (await request.json()) as Payload;
	} catch {
		return json(400, { ok: false, error: "Invalid request." });
	}

	// Honeypot: pretend success without sending.
	if (data.company && data.company.trim() !== "") {
		return json(200, { ok: true });
	}

	const firstName = data.firstName?.trim() ?? "";
	const lastName = data.lastName?.trim() ?? "";
	const email = data.email?.trim() ?? "";
	const phone = data.phone?.trim() ?? "";
	const message = data.message?.trim() ?? "";

	const errors: Record<string, string> = {};
	if (!firstName) errors.firstName = "Please enter your first name.";
	if (!lastName) errors.lastName = "Please enter your last name.";
	if (!email) errors.email = "Please enter your email.";
	else if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email.";
	if (!phone) errors.phone = "Please enter your phone number.";

	if (Object.keys(errors).length > 0) {
		return json(422, { ok: false, error: "Please check the highlighted fields.", fields: errors });
	}

	const localsObj = (locals ?? {}) as Record<string, unknown>;
	const apiKey = readEnv(localsObj, "RESEND_API_KEY");
	const fromEmail = readEnv(localsObj, "CONTACT_FROM_EMAIL") || "RCK Website <onboarding@resend.dev>";

	let toEmail = readEnv(localsObj, "CONTACT_TO_EMAIL");
	if (!toEmail) {
		// Fall back to the office address in the ContactInfo collection.
		const contact = await getContactInfo();
		toEmail = contact?.email ?? undefined;
	}

	if (!apiKey || !toEmail) {
		// Validation passed, but delivery isn't wired up yet. Tell the client
		// so it can show the fallback office email. See design-log/014.
		return json(503, {
			ok: false,
			error: "Email delivery isn't configured yet.",
			code: "not_configured",
		});
	}

	const subject = `New website contact from ${firstName} ${lastName}`;
	const lines = [
		`Name:  ${firstName} ${lastName}`,
		`Email: ${email}`,
		`Phone: ${phone}`,
		"",
		"Message:",
		message || "(none)",
	];
	const html = `<h2>New website contact</h2>
<p><strong>Name:</strong> ${escapeHtml(`${firstName} ${lastName}`)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
<p><strong>Message:</strong><br>${message ? escapeHtml(message).replace(/\n/g, "<br>") : "(none)"}</p>`;

	try {
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: fromEmail,
				to: [toEmail],
				reply_to: email,
				subject,
				text: lines.join("\n"),
				html,
			}),
		});

		if (!res.ok) {
			const detail = await res.text().catch(() => "");
			console.error(`[contact] Resend send failed (${res.status}): ${detail}`);
			return json(502, { ok: false, error: "We couldn't send your message. Please try again." });
		}

		return json(200, { ok: true });
	} catch (err) {
		console.error("[contact] send threw:", err);
		return json(502, { ok: false, error: "We couldn't send your message. Please try again." });
	}
};
