# 064 — Every listed phone number becomes Call/WhatsApp buttons (Community + Youth)

**Status:** implemented
**Date:** 2026-08-29
**Author:** claude-session (yosef directing)
**Related:** [#063](063-community-page-second-taharas-rabbi-and-rabbi-links.md) (introduced the Call/WhatsApp button pair, but only for the hardcoded Meals/Aliya contacts), [#017](017-events-and-youth-pages.md) (Youth page origin)

## Background

Two separate but same-shaped asks in one session:

1. On `/community`, some contacts already got the Call + WhatsApp button pair #063 introduced (Meals, Aliya — both hardcoded, no CMS field), but every *CMS-driven* phone number (`mealsPhone`, `gabbaiPhone`, the three Taharas rabbi phones, `beisDinContactPhone`) still rendered as a plain `tel:` text link. Yosef asked for all of them to match: every listed number gets both a Call and a WhatsApp button, since every number on file works on both.
2. On `/youth`, each program's "Contact" button routed to the site's `/contact` form (an email, effectively) with no phone option at all — even though the office already has each contact rabbi's number. Yosef gave the four current numbers (Cornick, Postelnek, Zaslow, Avraham Aharon) and asked for the option to email *or* WhatsApp.

## Design

**Extracted `src/components/ContactButtons.astro`** (`phone`, `name` props) from the three copies of Call/WhatsApp markup #063 left hand-duplicated in `community.astro`. Every plain-`tel:` spot on that page (`mealsPhone`, `gabbaiPhone`, `taharasEnglishRabbiPhone`, `taharasEnglishRabbi2Phone`, `taharasHebrewRabbiPhone`, `beisDinContactPhone`) now renders `<ContactButtons>` instead. The Beis Din phone was previously inline mid-sentence ("...to schedule an appointment: **053-...**") — that sentence now always ends with a period, and the buttons sit on their own line below (matching the Aliya section's existing layout), since two buttons don't read well mid-sentence.

**New shared `src/lib/phone.ts`** (`telHref`, `whatsappHref`) replaces `ContactButtons`' and `community.astro`'s own local phone-formatting helpers. Generalized to handle a number already in full international format (leading `+`, e.g. a U.S. contact) in addition to the existing local-Israeli-format assumption (no country code, `972` prefix derived by stripping a leading `0`) — needed because youth's Devorah Cornick contact is a U.S. number (`+1 (516) 761-5889`), the first non-Israeli contact number on the site.

**Youth page:** kept its own visual language (a plain icon+text "Email" link plus a solid-gold "Contact" CTA) rather than pulling in `ContactButtons`' outlined-pill style, since the two pages don't share a button style today and this session wasn't asked to unify them. Added a new `contactPhone` field to the `YouthPrograms` collection (`src/lib/youth-programs.ts`, `CONTRIBUTING.md`). The "Email" link is now unconditional — `mailto:` when `contactEmail` is set, otherwise the pre-filled `/contact?subject=...` fallback it always used — and the "Contact" button is now a WhatsApp button (same solid-gold styling, new icon/label/href) shown only when `contactPhone` is set. `hasContact` widened to also trigger on `contactPhone` alone.

**Data:** populated `contactPhone` on all 4 live `YouthPrograms` rows via the Data Items API — Postelnek (`0557738379`), Cornick (`+1 (516) 761-5889`), Avraham Aharon (`0539629935`), Zaslow (`053-347-8419`).

## Trade-offs

- Youth and Community now both have Call/WhatsApp-style actions but with two different visual treatments (pill-outlined pair vs. plain-link + solid-CTA pair). Revisit if a future ask wants them to look the same.
- `whatsappHref`'s "assume Israeli if no leading `+`" rule is now load-bearing for two pages instead of one — any future non-Israeli, non-`+`-prefixed number entered by mistake would silently produce a wrong `wa.me` link. No validation added (consistent with the project's existing soft-validation pattern for CMS text fields).

## Verification

Hit a real bug while writing the phone numbers into Wix Data: `Patch Data Item`'s `SET_FIELD` with `setFieldOptions.value` wrapped as `{"stringValue": "..."}` (the literal shape `SearchWixAPISpec` showed for the request schema) persisted that wrapper object itself as the field's stored value instead of unwrapping it to a plain string — confirmed by reading the item back. Passing a bare JSON string as `value` instead stored and read back correctly as a plain string, matching every other text field on the row (`contactName`, `title`, etc.). Re-did all 4 writes with the bare-string form and re-verified via GET before moving on — worth remembering for any future direct Data Items API write on this project: don't hand-wrap `value` in the typed-value shape from the schema, pass the plain scalar.

`astro check`: clean for both changed pages (the pre-existing `index.astro` error predates this change). Ran `npm run dev` and confirmed in raw HTML: `/youth` renders `wa.me/972557738379`, `wa.me/15167615889`, `wa.me/972539629935`, `wa.me/972533478419` for the four programs respectively (Cornick's U.S. number correctly has no `972` prefix), each alongside an Email link (three fall back to `/contact?subject=...` since none of the four rows has `contactEmail` set).
