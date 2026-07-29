# Talking to Wix

Read this **before your first write**. **Use the Wix connector** (the MCP tools) — it's authenticated and knows the site. The docs links at the bottom are for when it isn't enough. Don't web-search for Wix API details.

## Changing one field on an existing row

There are two update endpoints and picking the wrong one destroys data.

**Use `PATCH` when you're changing part of a row** — a flyer's image, a take-down date, a typo in a title. Only the fields you name change; everything else is left alone.

```
PATCH /wix-data/v2/items/{dataItemId}
{
  "dataCollectionId": "Flyers",
  "patch": {
    "dataItemId": "{dataItemId}",
    "fieldModifications": [
      { "fieldPath": "imageUrl", "action": "SET_FIELD",
        "setFieldOptions": { "value": "https://static.wixstatic.com/media/…" } }
    ]
  }
}
```

Other actions: `REMOVE_FIELD`, `INCREMENT_FIELD`.

**`PUT` is a full replace.** Wix's own docs: *"After an item is updated, it only contains the fields included in the `dataItem.data` payload in the request. If the existing item has fields with values and those fields aren't included in the updated item, their values are lost."*

So **never send a partial `PUT`.** This has already destroyed data on this site once: an attempt to clear one image field wiped that sheet's title, parsha, and PDF with it. If you do use `PUT`, it's read-merge-write — read the row, merge your change into the complete `data` object, send all of it back including `_id`. Never build a `PUT` body from scratch.

`PATCH` avoids that whole class of mistake. Prefer it.

## Endpoints

| Job | Call |
|---|---|
| Read rows | `POST /wix-data/v2/items/query` — `{ dataCollectionId, query }` |
| Create a row | `POST /wix-data/v2/items` — `{ dataCollectionId, dataItem: { data } }` |
| **Change part of a row** | `PATCH /wix-data/v2/items/{dataItemId}` — see above |
| Replace a whole row | `PUT /wix-data/v2/items/{dataItemId}` — full replace, see above |
| Import a file by URL | `POST /site-media/v1/files/import` — `{ url, mimeType, displayName, parentFolderId }` |
| List media folders | `GET /site-media/v1/folders` |

Images can also go through the connector's dedicated image-upload tool, which accepts chat attachments as well as URLs and returns a `wixstatic.com` URL. PDFs can't — they need the import endpoint.

## Importing a file is not instant

Two things bite here:

**The MIME type.** The import needs either a `mimeType` in the request or a file extension in `displayName` or `url`. A Canva export URL often has neither, so **set `mimeType` explicitly** (`application/pdf`, `image/png`) and give `displayName` a real extension.

**It comes back `PENDING`.** The response's `operationStatus` is `PENDING` — the file is still processing and isn't usable yet. Wix: *"When you import a file, it's not immediately available, meaning you can't manage or use the file straight away."*

So **don't create the row off the import response.** Wait until the file is actually ready (re-read the file descriptor), then write the row. A row pointing at a file that isn't there yet renders a broken card, which is exactly the failure that looks like a successful upload.

## Field formats — read a row first

Before your first write to a collection, read one existing row. Field *keys* are in the flow files, but the **value format** for media fields is only reliably learned by looking, and getting it wrong fails silently:

- `Flyers.imageUrl` — a **plain public URL** (`https://static.wixstatic.com/media/…`). A `wix:image://` value renders a broken image.
- `TorahSheets.pdfFile`, `canvaPdfBackup` — Document fields, which **do** take Wix's internal reference format.
- `TorahSheets.pdfThumbnail` — an Image field.

Mirror exactly what the existing row uses.

## The site's public URL

**Don't assume a domain.** Get the live URL from the Wix connector (the site-context call returns it). Guessing sends people to a page that doesn't exist — it happened, with `rckollel.org`.

## When the connector isn't enough

If a call 404s, a shape is rejected, or the connector's docs search comes back empty, the REST reference is readable as plain markdown. **Append `.md` to any `dev.wix.com/docs/` URL.**

| For | Fetch |
|---|---|
| Index of everything | `https://dev.wix.com/docs/llms.txt` |
| All data-item endpoints | `https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items.md` |
| Patch (partial update) | `…/cms/data-items/patch-data-item.md` |
| Update (full replace) | `…/cms/data-items/update-data-item.md` |
| What an error code means | `https://dev.wix.com/docs/api-reference/business-solutions/cms/wix-data-error-codes.md` |
| Media Manager files | `https://dev.wix.com/docs/api-reference/assets/media/media-manager/files.md` |
| Importing a file | `…/media-manager/files/import-file.md` |

`llms-full.txt` also exists but it's ~38 MB — never fetch it.

This is a fallback, not the first move: it tells you the shape of a call, not the state of this site. The connector stays the way you actually read and write.
