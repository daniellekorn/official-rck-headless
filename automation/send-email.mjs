// Emails the rendered flier via Resend (https://resend.com) — an API key
// instead of an SMTP password, which is what Gmail kept refusing.
//
//   RESEND_API_KEY=re_xxx MAIL_TO=you@example.com node automation/send-email.mjs
//
// Run after automation/render.mjs, which leaves the files and meta.json in
// automation/out/.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "out");

const apiKey = process.env.RESEND_API_KEY;
const to = process.env.MAIL_TO;
// Resend's shared onboarding sender. It can only deliver to the address that
// owns the Resend account — which is exactly what we want. To send to other
// people later, verify a domain in Resend and change this.
const from = process.env.MAIL_FROM || "RCK Flier Robot <onboarding@resend.dev>";

if (!apiKey) throw new Error("RESEND_API_KEY is not set");
if (!to) throw new Error("MAIL_TO is not set");

const { weekOf, base } = JSON.parse(await readFile(path.join(outDir, "meta.json"), "utf8"));

const attach = async (ext) => ({
  filename: `${base}.${ext}`,
  content: (await readFile(path.join(outDir, `${base}.${ext}`))).toString("base64"),
});

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to: to.split(",").map((s) => s.trim()),
    subject: `Davening flier — week of ${weekOf}`,
    text: [
      "This week's weekday davening flier is attached: JPG for WhatsApp, PDF for printing.",
      "",
      "Times were computed by the same code that runs rckollel.com/daven.",
      "Please glance at them before sending it out.",
    ].join("\n"),
    attachments: [await attach("jpg"), await attach("pdf")],
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Resend refused (${res.status}): ${body}`);
  process.exit(1);
}
console.log(`Sent to ${to} — ${body}`);
