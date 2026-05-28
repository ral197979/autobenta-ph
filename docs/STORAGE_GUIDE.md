# AutoBenta PH — Storage Guide

## Overview

Photo storage is abstracted behind a provider interface. Select the provider at runtime via the `STORAGE_PROVIDER` environment variable. The same upload/delete code works for both providers.

---

## Providers

### `local` (default)

Files are written to disk by multer and served as static files from `/uploads`. Suitable for local development and Render free tier (note: Render free tier has ephemeral disk — photos are lost on restart).

**No extra env vars required.**

### `r2` (Cloudflare R2 — production)

Photos are uploaded to Cloudflare R2 (S3-compatible). R2 has no egress fees, making it ideal for a PH marketplace.

**Required env vars:**
```
STORAGE_PROVIDER=r2
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET_NAME=autobenta-photos
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

---

## Setting Up Cloudflare R2

1. Create a Cloudflare account → Storage → R2
2. Create a bucket (e.g., `autobenta-photos`)
3. Enable **Public Access** on the bucket for read access
4. Create an **API Token** with Object:Read and Object:Write permissions
5. Copy the endpoint URL from bucket settings

In Render:
- Set `STORAGE_PROVIDER=r2`
- Add all `R2_*` env vars in the Render service's Environment settings

---

## How Photos Are Stored

```
Upload flow:
  1. Client sends multipart POST to /api/listings/:id/photos
  2. multer writes temp file to disk (always, before provider selection)
  3. storage.saveFile(file) is called:
     - local: returns /uploads/<uuid>.ext — file already on disk
     - r2: PutObjectCommand to R2, deletes local temp file, returns CDN URL
  4. VehiclePhoto record created with { url, storageKey, provider }

Delete flow:
  1. GET photo record → storageKey
  2. storage.deleteFile(storageKey) → unlinks local or sends DeleteObjectCommand
  3. VehiclePhoto record deleted
```

---

## Photo Model Fields

| Field | Purpose |
|-------|---------|
| `url` | Public URL for display (relative for local, absolute for R2) |
| `storageKey` | Internal key for deletion (`filename` for local, `photos/<uuid>.ext` for R2) |
| `provider` | `'local'` or `'r2'` — recorded at upload time |
| `isPrimary` | First photo per listing, shown in search cards |
| `sortOrder` | Display order (0-indexed) |
| `sizeBytes` | File size in bytes |

---

## Migrating from Local to R2

1. Deploy with `STORAGE_PROVIDER=r2` set
2. New uploads go to R2 automatically
3. Existing photos remain on local disk — their `VehiclePhoto.provider = 'local'`
4. Run a migration script to copy existing files to R2 and update records:

```javascript
// scripts/migrate-photos-to-r2.js (example)
const photos = await prisma.vehiclePhoto.findMany({ where: { provider: 'local' } });
for (const photo of photos) {
  const localPath = path.join('uploads', photo.storageKey);
  const r2Key = `photos/${photo.storageKey}`;
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: fs.readFileSync(localPath),
  }));
  await prisma.vehiclePhoto.update({
    where: { id: photo.id },
    data: { url: `${process.env.R2_PUBLIC_URL}/${r2Key}`, storageKey: r2Key, provider: 'r2' },
  });
}
```

---

## Photo Limits

- Max 20 photos per listing
- Max 10 MB per file
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- multer is configured in `src/middleware/upload.js`
