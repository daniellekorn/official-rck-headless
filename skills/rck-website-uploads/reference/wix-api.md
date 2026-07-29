# Talking to Wix

Read this **before your first write**, so you don't spend time rediscovering it. Do **not** web-search for Wix API information — if something here fails, use the Wix documentation tool.

## The one that will bite you: updating is a full replace

Wix Data's update is **`PUT`, not `PATCH`.** It replaces the entire item with whatever you send. Sending only the field you meant to change **deletes every other field on that row.**

This has already happened once on this site: an attempt to clear one image field from a Torah sheet wiped that sheet's title, parsha, and PDF along with it.

So to change one field:

1. **Read the row** and keep the whole `data` object.
2. **Merge** your change into it.
3. **Send the complete object back**, including `_id` and every field you didn't touch.

Never construct an update body from scratch. Never send a partial one.

## Endpoints

| Job | Call |
|---|---|
| Read rows | `POST /wix-data/v2/items/query` — `{ dataCollectionId, query }` |
| Create a row | `POST /wix-data/v2/items` — `{ dataCollectionId, dataItem: { data } }` |
| Update a row | `PUT /wix-data/v2/items/{dataItemId}` — `{ dataCollectionId, dataItem: { data } }` (**full replace**, see above) |
| Import a file by URL | `POST /site-media/v1/files/import` — `{ url, mimeType, displayName, parentFolderId }` |
| List media folders | `GET /site-media/v1/folders` |

Images can also go through the connector's dedicated image-upload tool, which accepts chat attachments as well as URLs and returns a `wixstatic.com` URL. PDFs can't — they need the import endpoint above.

If a call 404s or the shape is rejected, look it up with the Wix documentation tool rather than guessing variations.

## Field formats — read a row first

Before your first write to a collection, read one existing row. Field *keys* are listed in `torah-sheets.md` and `flyers.md`, but the **value format** for media fields is only reliably learned by looking, and getting it wrong fails silently rather than erroring:

- `Flyers.imageUrl` — a **plain public URL** (`https://static.wixstatic.com/media/…`). A `wix:image://` value here renders a broken image.
- `TorahSheets.pdfFile`, `canvaPdfBackup` — Document fields, which **do** take Wix's internal reference format.
- `TorahSheets.pdfThumbnail` — an Image field.

Mirror exactly what the existing row uses.

## The site's public URL

**Don't assume a domain.** Get the live URL from the Wix connector (the site-context call returns it) and use that when telling someone where to look. Guessing a domain sends people to a page that doesn't exist.
