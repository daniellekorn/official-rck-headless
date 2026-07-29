# Flow — minyan times

For when someone brings times rather than a design: "the Mincha time changed", "we're starting Selichos", "here's next week's schedule".

## Usually there's nothing to upload

The site computes the weekday Shacharis / Mincha / Maariv times and the whole Shabbos block — hadlakas neiros, Mincha & Kabbalos Shabbos, morning times, Mincha, Maariv — each week from Ra'anana zmanim. They roll to the next week on Motzei Shabbos by themselves.

So when someone sends the week's zmanim or says the schedule changed for the season, tell them it's already handled and offer to check the page with them.

- **Never add a row for a regular minyan.** It shows the time twice and won't update next week.
- **A computed time that disagrees with the printed schedule is Danielle's** — it's a rule in code, not a row. Say which time disagrees and by how much. Don't paper over it with a row.

First, check which of two things they mean: **the times, or the schedule picture?** The picture is a real upload — the Schedules flyer in `flows/flyer.md`.

## What does get a row

Collection `DaveningTimes`, for **extras only** — a service the computed schedule doesn't cover. Selichos is the standard case; also a special week or a seasonal addition.

Rows render after the computed times: `dayType = Weekday` under the weekday table, `dayType = Shabbat` at the end of the Shabbos list.

### Ask

1. **Which service, and what time** — one question.
2. **Which days.** Their words go on the page as written.
3. **Weekday or Shabbos**, if the days don't settle it.
4. **When it stops**, if it's seasonal. There's no automatic expiry — tell them it needs a word from them to come off.

### Fields

| Field | Type | What to put in it |
|---|---|---|
| `service` | Text | `Shacharis`, `Mincha`, `Maariv`, or `Selichos`. Rows group under this heading; another name works and sorts last. |
| `dayType` | Text | `Weekday` or `Shabbat`, exact and capitalised. Anything else and the row joins neither table — it appears nowhere. |
| `orgName` | Text | Present on existing rows (`RCK`, `KBA`). No page reads it, so it changes nothing. Mirror the neighbouring rows and move on. |
| `daySpec` | Text | The days as they should read: `Sunday`, `Mon, Thu`, `Sun – Thu`. |
| `time` | Text | Display text, not a parsed time — `7:00 AM`, `Plag`, `10 min before Shkiya`. |
| `notes` | Text | Extra context only, e.g. `Followed by Daf Yomi`. Never day-of-week info — that's `daySpec`. |
| `sortOrder` | Number | Order within its service group, lower first. |
| `active` | Boolean | Show/hide without deleting. Default true. |

### Shabbos rows: don't add one, don't revive one

The whole Shabbos schedule is computed. `DaveningTimes` is for **weekday** extras in practice — Selichos, a special week.

If you're asked to add a Shabbos time, the answer is almost certainly that it's already on the page. Check `/daven` before writing anything.

There are five rows on the live site with `dayType` spelled `Shabbos` instead of `Shabbat`, which is why they render nowhere. **Leave them alone.** They pre-date the computed Shabbos schedule and duplicate it — Shacharis 8:45 and Tefillat Yeladim 10:00 are exactly the computed values, and correcting the spelling would show each of those twice. If someone asks you to fix them, explain that and send it to Danielle.

Writing `Shabbat` on a genuinely new row still works, and still needs that exact spelling — but ask what it's for first.

## Taking one off

Set `active` to false rather than deleting — Selichos comes back every Elul.

## Verify

Load `/daven` (real base URL from the Wix connector): the row appears **once**, under the right table, after the computed times.

A time listed twice means a regular minyan got a row it shouldn't have — say so and offer to remove it.
