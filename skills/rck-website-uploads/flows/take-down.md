# Flow — taking something down

Work out **what kind of thing it is** first — it decides what "take down" means. Everything except a Torah sheet has a reversible hide.

| What it is | How it comes down | Reversible |
|---|---|---|
| A flyer | `removeAfter` → yesterday | yes |
| A youth program | `active` → false | yes |
| A past event | `active` → false | yes |
| A special minyan time | `active` → false | yes |
| A Torah sheet | delete the row | **no** |

Find the row and **read its title back** before touching anything. Titles repeat across years — if more than one matches, ask which; don't pick.

This is an update or a delete on an existing row: read `reference/wix.md` before you write.

## Offer the hide

Set the field, it's off the site, and putting it back is the same change reversed. Title, picture, photos, and dates all stay.

Say it's reversible. Delete only if they ask a second time knowing that.

For a flyer, `removeAfter` set to yesterday is the hide — it behaves exactly like a flyer that expired on its own.

## An event that's over

If the flyer is coming down because the event happened, offer the archive — photos and flyer go into the past-events list instead of disappearing. `flows/past-event.md`.

Offer it, don't assume it. Keep it as a second change with its own line in the read-back.

## A Torah sheet can't be hidden

`TorahSheets` has no hide or expiry field. Taking one down means **deleting the row**; it can only come back by re-uploading. Say that plainly and get an explicit yes.

The PDF stays in the Media Manager, so a re-upload wouldn't start from nothing. Mention that.

## Read-back

```
Flyer:    Shavuos Night Learning
Doing:    hiding it — comes off the site now
Staying:  everything else; say the word and it's back
```

For a delete, be explicit that it isn't reversible:

```
Sheet:    Eikev (Torah Bytes, תשפ״ו)
Doing:    deleting the row — this can't be undone
Staying:  the PDF stays in the Media Manager, so it can be re-uploaded
```

## Verify

Load the page and confirm it's gone. For a hidden flyer, confirm the rest of its section still looks right.

Which page: a flyer is on `/events`, `/learn`, or `/daven` by section; a youth program on `/youth`; a past event in the `/events` archive; a minyan time on `/daven`; a Torah sheet on `/torah-sheets`.
