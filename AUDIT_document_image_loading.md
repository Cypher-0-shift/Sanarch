# Document Image Loading — Audit

**Date:** 2026-09-10  
**Scope:** Investigation only. No code, config, or dependency changes were made.  
**Branch:** `new-frontend`

---

## 1. Upload → Storage Path

### What happens from capture/selection to B2

| Step | File | Detail |
|------|------|--------|
| 1. Capture / pick | `upload.tsx:260-316` | Photo: `ImagePicker.launchImageLibraryAsync` with `quality: 0.92`. PDF: `DocumentPicker.getDocumentAsync`, max 15 MB enforced client-side. |
| 2. Adjust (optional) | `DocumentAdjuster.tsx:263-330` | Rotate and crop via `expo-image-manipulator` `manipulateAsync`, both saved at `compress: 0.95`, `SaveFormat.JPEG`. If the user skips editing the original picker URI is used as-is. |
| 3. Upload URI selection | `upload.tsx:334-356` | For photos: `adjustedUri` (post-crop/rotate) or the raw picker URI. For PDFs: `pdfPageImages[0]` (first converted page). |
| 4. Multipart POST | `api.ts:315-340` -> `ENDPOINTS.UPLOAD_DOCUMENT` | `postForm` sends the file as `multipart/form-data` with a 120 s timeout via axios. |
| 5. MIME verify + ClamAV | `documents.py:162-177` | Backend reads raw bytes, `python-magic` checks true MIME, ClamAV scans, rejects if either fails. |
| 6. B2 upload | `storage.py:19-41` | Raw bytes written to `tmp/<owner_id>/<safe_filename>` via `boto3 put_object`. No compression or resizing server-side. B2 encrypts at rest automatically; no SSE header is sent. |
| 7. Presigned URL (24 h) | `documents.py:188-191` | Immediately after upload a 24-hour presigned URL is generated and stored in Firestore under `b2_file_url`. |
| 8. Firestore record | `documents.py:193-214` | Stores `b2_file_id` (B2 key), `b2_file_url` (24 h signed URL), `status: "uploaded"`. |
| 9. Celery task queued | `documents.py:225-229` | `process_document` task dispatched; during extraction the file is moved from `tmp/` to `docs/` via `move_to_final` (copy + delete). |

### File size / resolution stored

- **No server-side resizing or compression occurs at any point.** The backend stores the raw bytes it receives.
- On the client, `quality: 0.92` is set in `ImagePicker`. Crop/rotate ops use `compress: 0.95`. These are JPEG quality knobs only, not dimension limits.
- The picker does **not** cap dimensions (`maxWidth`/`maxHeight` props absent). Full-resolution device images pass through.
- **Confirmed: only a single original-resolution file is stored.** There is no thumbnail, preview variant, or separate B2 key pattern for lower-resolution copies — anywhere in the system.

---

## 2. Report Details Screen — Image Retrieval

### Fetch sequence when user taps a Records card

| Step | File | Detail |
|------|------|--------|
| 1. Store hydration | `documentsStore.ts:122-196` | On app load `fetchDocuments` calls REST `listDocuments` -> stores `b2_file_url` in Zustand, then attaches a Firestore `onSnapshot` listener. The URL here is the **stale 24-hour URL** set at upload time — not freshly generated. |
| 2. Navigation | `records/index.tsx` -> router | Passes only the `document_id`. |
| 3. Fresh `getDocument` call | `[id].tsx:450-467` + `api.ts:290-307` | `getDocument(id)` hits `GET /documents/{document_id}`. Backend **always regenerates a fresh 15-minute presigned URL** from the stored `b2_file_id`. This is returned as `b2_file_url` on the detail response. |
| 4. Image display | `[id].tsx:469-707` | `const b2Url = record?.b2_file_url`. Plain RN `<Image source={{ uri: b2Url }}>` rendered directly. No intermediate fetch, no proxy. |
| 5. PDF path | `[id].tsx:472-508` | For PDFs: the signed URL is fetched via `fetch(b2Url)`, converted to a base64 Data URI, POSTed to `/documents/pdf/convert` which returns a JPEG array. `pdfImageUrl` state is set to the first JPEG for display. |

### Presigned URL TTL mismatch (key finding)

- Upload endpoint issues a **24-hour** URL stored in Firestore.
- `listDocuments` (REST) returns this **stale stored URL** — no regeneration.
- `getDocument` (detail view) **regenerates a 15-minute URL** per call.
- Firestore `onSnapshot` also reads the stale URL.
- **Risk:** The store's `b2_file_url` for list cards is valid for up to 24 h; after expiry any image rendered from it would 403. Currently `DocumentCard` does not render images inline so this is latent.

---

## 3. B2 / CDN Configuration

| Item | Finding |
|------|---------|
| CDN | **None.** All requests go directly to the B2 S3-compatible endpoint (`settings.b2_endpoint_url`). No CloudFront, Cloudflare, or edge cache layer configured. |
| Signed URL generation | Server-side `boto3.generate_presigned_url` with `s3v4` signature. |
| Bucket visibility | Not confirmed from code; assumed private (presigned URLs are required for all access). |
| Region | `region_name="us-east-1"` in boto3 client is a placeholder acknowledged in comments — B2 ignores it. |
| Encryption | B2 encrypts at rest automatically. SSE header intentionally omitted (with explanatory comment). |
| Upload `Cache-Control` | No `Cache-Control` header set on `put_object`. B2 uses its default. |

---

## 4. Client-Side Image Caching

| Item | Finding |
|------|---------|
| Image component | Plain React Native `<Image>` from `react-native`. **Not** `expo-image`. |
| Caching | RN `Image` uses OS HTTP cache (NSURLCache on iOS, OkHttp on Android). No explicit `cache` prop set — defaults to OS `default` policy. |
| Effective cache behavior | The cache key is the full signed URL including the HMAC signature. Since `getDocument` generates a **new** URL on every call, the cache key changes on every visit. **This defeats the OS-level HTTP cache entirely — each visit re-downloads the full-resolution image from B2.** |
| In-memory / disk cache layer | None. No `react-native-fast-image`, no `expo-image`, no custom caching middleware. |
| PDF base64 path | PDF blob fetched, read into a Data URI in JS memory, sent to convert endpoint. No caching of the converted JPEG between sessions or navigation visits. |

---

## 5. Identified Issues & Risk Inventory

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| I-1 | **High** | Cache busting on every detail view — full-res image re-downloaded on each open | `documents.py:326`, `[id].tsx:457`, `[id].tsx:700-706` |
| I-2 | **Medium** | No thumbnail/preview variant — always loading original-resolution image | `storage.py` (no resize), `upload.tsx:266-269` (no maxWidth) |
| I-3 | **Medium** | TTL mismatch: store holds 24 h URL, detail endpoint issues 15 min URL, no expiry/refresh logic on client | `documents.py:189 vs 326`, `documentsStore.ts:140,176` |
| I-4 | **Low** | No CDN/edge layer — B2 requests may have high latency for users far from the B2 region | No CDN config found in codebase |
| I-5 | **Low** | PDF convert re-fetches and re-converts on every detail view; converted JPEG not cached | `[id].tsx:472-508` |
| I-6 | **Low** | `launchImageLibraryAsync` uses `quality: 0.92` but no `maxWidth`/`maxHeight` — full-resolution multi-MB photos can be uploaded | `upload.tsx:266-269` |

---

## 6. Out-of-Scope Confirmations

- No signed URL rotation / refresh logic exists on the client (no expiry timer, no 401 retry with URL regeneration).
- No background pre-fetch of images is implemented.
- No service worker, IndexedDB image cache, or custom caching middleware exists anywhere in the frontend.

---

## 7. Recommended Follow-Up Phases (implementation not in scope of this audit)

| Phase | Description |
|-------|-------------|
| A | **`expo-image` + disk cache** — swap `<Image>` for `expo-image` with `cachePolicy="disk"`. Cache key stability still requires Phase B. |
| B | **Stable cache keys** — either (a) serve images via a CDN URL + Authorization header so the URL itself is stable, or (b) only regenerate presigned URLs when the existing one is near expiry (check TTL before calling `getDocument`). |
| C | **Server-side thumbnail** — add a Pillow resize step in the Celery extraction worker to produce a `thumb_<key>` at ≤800 px wide and store its key in Firestore. List views and preview heroes load the thumb; full-screen loads the original. |
| D | **Upload dimension cap** — add `maxWidth: 2048, maxHeight: 2048` to `launchImageLibraryAsync`. Sufficient for document scanning quality, significantly reduces upload payload size. |
| E | **PDF convert cache** — persist the converted first-page JPEG URI to a local cache keyed by `document_id + updated_at` so repeated detail-screen visits skip the re-download and re-convert cycle. |
