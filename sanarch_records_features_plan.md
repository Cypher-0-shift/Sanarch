# ADR: Records Reliability, Preview, and AI Summary Features

**Status:** Proposed
**Date:** 2026-07-09
**Deciders:** Crusader (product owner)

## Context

The upload timeout bug is fixed, but it exposed downstream gaps:
- Failed documents pollute Records with no recovery path or explanation
- Home timeline doesn't update after upload (likely still polling/one-shot fetch instead of `onSnapshot`)
- No document preview anywhere (upload review, Records, Report Details)
- Records cards show raw/placeholder data (`lab_report`, `Report`) instead of extracted title/provider/facility
- Report Details has no extracted values and no original file preview
- No plain-language AI summary for patients

Six requests, but they aren't independent — some are root causes, some are downstream symptoms of the same missing piece (extracted metadata isn't reaching the UI), and one is genuinely new scope (AI summary). Building them in the wrong order means re-touching the same card/detail components twice.

## Decision

Sequence the work in 5 phases. Each phase is a separate, scoped Antigravity prompt — don't run them all at once. Test after each phase before moving to the next.

---

### Phase 0 — Reduce failures at the source (addresses your "shouldn't happen in the first place" point)

**Resolved from code review — retry logic already exists, but there's a real bug in it.**

In `process_document` (`app/workers/extraction_task.py`), the task is already set up with `max_retries=2, default_retry_delay=30`, and the outer `except Exception` block does call `self.retry(exc=exc, countdown=30)`. So retries genuinely happen. The bug is in the ordering:

```python
except Exception as exc:
    logger.error(f"Document {document_id} failed: {exc}", exc_info=True)
    try:
        _update_progress(doc_ref, "failed", 0, status="failed")   # ← sets failed FIRST
    except Exception:
        pass
    raise self.retry(exc=exc, countdown=30)                       # ← then retries
```

Firestore gets `status: "failed"` written on the **very first** transient error — before the retry even fires. Since your frontend Records screen presumably reads status via a listener/fetch, a user can see "Processing failed" flash up even when the document goes on to succeed two retries later. This is very likely a meaningful chunk of the "failed" cards you're seeing in your screenshots — not real failures, just retry attempts being mislabeled.

Two other things worth fixing while in this function:
- `SoftTimeLimitExceeded` (2-minute soft limit) is treated as an immediate hard failure with no retry at all — a slow-but-working Azure DI call on a big multi-page document could trip this legitimately.
- There's no `failure_reason` field anywhere — only the generic `status: "failed"`. Your existing `/documents/{id}/retry` endpoint (already built — good, Phase 1 will reuse it) resets status blindly without knowing *why* it failed.

```
In app/workers/extraction_task.py, fix process_document's retry/failure handling:

1. Only write status: "failed" to Firestore on the FINAL attempt — i.e. when
   self.request.retries >= self.max_retries (this was the last allowed retry)
   or when self.retry() raises MaxRetriesExceededError. On any attempt that
   will still be retried, update processing_stage to something like "retrying"
   without touching status (leave it as "processing" so the frontend doesn't
   show a false failure).

2. Add a failure_reason field (string) written alongside the final
   status: "failed" update. Map common exception cases to short codes:
   - Azure DI errors (from ocr_with_azure_di raising RuntimeError) → "ocr_failed"
   - Groq/httpx errors → "extraction_failed"
   - SoftTimeLimitExceeded → "processing_timeout"
   - anything else → "unknown_error"

3. For SoftTimeLimitExceeded specifically: allow one retry (don't immediately
   hard-fail) unless this is already the final attempt, since large multi-page
   documents can legitimately take close to the 120s soft limit.

4. Do not change retry counts, countdown timing, or the overall task structure
   otherwise — this is a targeted fix to the status-writing order and adding
   failure_reason, not a rewrite.

Report back the final failure_reason values used so Phase 1's notification
copy can be mapped 1:1 to them.
```

---

### Phase 1 — Failed documents: hide from Records, surface in Notifications

**Design decision:** don't hard-delete on failure immediately. Soft-delete (flag + hide from queries) for a retention window, so you have a debugging trail if failures spike. Hard-delete can be a scheduled cleanup later — that's a separate, smaller concern, not blocking.

**Notifications:** I don't see a notification icon in your current Home screen screenshots, so this is a new, small feature — a bell icon on Home, backed by a Firestore `notifications` subcollection per user, populated when a document fails (and later reused for other events like share requests).

**Resolved from code review — two endpoints already exist and should be reused, not rebuilt:**
- `POST /{document_id}/retry` already resets a failed document to `queued` and re-fires `process_document`. Once Phase 0 adds `failure_reason`, this endpoint can stay almost as-is — no need to build new retry logic.
- `DELETE /{document_id}` already cleans up B2 objects (single-file and multi-page) and the Firestore doc. This is exactly what the scheduled cleanup in step 3 below should call, rather than duplicating B2-deletion logic in a new Celery beat task.

```
Implement failed-document handling and a basic notifications system.

BACKEND:
1. When process_document's final failure branch writes status: "failed" and
   failure_reason (from Phase 0), also write a document to a new Firestore
   subcollection: users/{owner_id}/notifications/{notification_id} with fields:
   { type: 'processing_failed', document_id, title: <user-friendly message
   based on failure_reason>, created_at, read: false }

   Friendly message examples by failure_reason (using the codes from Phase 0):
   - 'ocr_failed' → "We couldn't read one of your documents. Please try re-uploading it."
   - 'extraction_failed' → "One of your uploads couldn't be processed. Please try again."
   - 'processing_timeout' → "One of your documents is taking longer than expected — we're still trying."
   - 'unknown_error' / fallback → "Something went wrong with one of your uploads."

   Note: virus-scan and unsupported-format rejections already happen
   synchronously in the /upload endpoint (HTTPException 422/415) before a
   Firestore document is even created, so they don't need a notification —
   the user already sees an immediate error in the upload flow for those.

2. Add a `hidden_from_list: true` field on the document itself when
   process_document's final failure branch runs (don't delete yet — keeps a
   debugging trail). Update GET /api/v1/documents (list_documents) to filter
   out documents where hidden_from_list == true.

3. Add a scheduled cleanup (Celery beat task, daily) that calls the EXISTING
   delete_document logic (reuse it directly, don't reimplement B2 cleanup)
   for documents with status: "failed" and hidden_from_list: true older than
   7 days.

FRONTEND:
4. In store/documentsStore.ts, replace the one-shot `apiClient.get('/api/v1/documents')`
   fetch in fetchDocuments() with a Firestore onSnapshot listener on the
   documents collection (where owner_id == current user, hidden_from_list != true).
   This is also very likely the direct fix for Phase 2 (Home timeline not
   updating) — same underlying cause.

5. Add a notifications icon (bell) to the Home screen header. Use onSnapshot
   on users/{owner_id}/notifications ordered by created_at desc, badge with
   unread count. Tapping opens a simple list (bottom sheet or new screen) of
   notification messages. Tapping a notification marks it read: true.

6. Remove the existing "Processing failed / Tap to retry" card rendering
   from the Records screen for documents that are now hidden_from_list —
   these no longer appear in the list at all, so this rendering path becomes
   dead code and can be deleted, not just hidden.

Do not change the visual styling of existing components beyond what's
necessary to add the bell icon and notification list — keep it functionally
plain for now, matching the existing color scheme (#004D36 primary green).
```

---

### Phase 2 — Home timeline not updating

This is very likely the *same root cause* as Records not refreshing: a one-shot `fetchDocuments()` call instead of a live `onSnapshot` listener. Phase 1's step 4 (switching `documentsStore` to `onSnapshot`) should fix this automatically. Confirm after Phase 1 before writing a separate prompt — I don't want to have Antigravity build two different data-fetching mechanisms for the same data.

If it's still not updating after Phase 1, the likely secondary cause is the Home screen's timeline component reading from local state set once on mount rather than subscribing to the Zustand store. I'll give you a targeted prompt for that only if Phase 1 doesn't resolve it — tell me after you test.

---

### Phase 3 — Document preview

**Needed everywhere:** upload review step, Records card thumbnail, Report Details.

**Resolved from code review — signed URLs already work for single-file uploads, but there's a gap for multi-page ones.**

`GET /{document_id}` (get_document) already calls `get_presigned_url(b2_key)` fresh on every request and returns it as `b2_file_url` — that part just needs wiring into the UI, no new backend endpoint required for single-file/single-photo documents.

**The gap:** in the multi-page upload path, `process_document` merges page images into a PDF (`_merge_images_to_pdf`) purely in-memory to send to Azure DI — that merged PDF is never uploaded back to B2. `b2_file_id` stays `""` for multi-page documents (set that way at creation in the router), so `get_document`'s `b2_key = doc.get("b2_file_id")` is falsy and `b2_url` comes back `None`. Multi-page documents currently have **no way to generate a preview at all** — this needs a small addition, not just frontend wiring.

```
Add document preview support end-to-end.

BACKEND:
1. In process_document (app/workers/extraction_task.py), after building the
   merged PDF via _merge_images_to_pdf in the multi-page branch, also upload
   that merged PDF to B2 (e.g. key: docs/{owner_id}/{document_id}/merged.pdf)
   and write it to the document's b2_file_id field, same as the single-file
   path already does with move_to_final. This makes the existing
   get_presigned_url flow in get_document work identically for both
   single-file and multi-page documents — no separate preview logic needed
   on the read side.

2. Do not change ALLOWED_MIME_TYPES, the upload endpoint, or single-file
   handling — this only fills the missing B2 write for the multi-page path.

FRONTEND:
3. In app/(tabs)/upload.tsx step 5 (Review), replace the static file-type
   icon row with an actual thumbnail preview of adjustedUri (for photos) or
   the first page of pdfPageImages (for PDFs) — this is local state already,
   no backend call needed for this step specifically.

4. In the Report Details screen, replace the "Document preview — Available
   after upload" placeholder with an actual <Image> or PDF preview using the
   b2_file_url already returned by GET /{document_id} — this field exists
   today for single-file docs and will exist for multi-page docs after step 1.
   Add a loading skeleton while the URL/image loads, and a fallback icon
   state if b2_file_url is null (only relevant for documents processed
   before this fix — old multi-page docs won't retroactively have a file).

5. Records screen: this depends on Phase 4's card redesign — hold off on
   adding thumbnails to Records cards until that prompt, to avoid touching
   the card component twice.

Keep this scoped to preview rendering only — do not change layout/spacing
beyond what's needed to fit the image.
```

---

### Phase 4 — Records card redesign (data-driven, not purely visual)

You flagged this before as wanting the card to show title, category icon, and provider/facility — this is mostly a **data plumbing problem**, not a design problem: the extracted fields exist in `extracted_data` from the AI pipeline but aren't being read into the card. I'll treat the layout part as minimal/functional per your stated priority, not a redesign.

**Resolved from code review — exact field names, no guessing needed.**

Your `structure_with_groq` prompt schema (`app/services/extraction.py`) confirms `extracted_data` has these fields once a document is `ready`: `document_type`, `document_date`, `hospital_name`, `doctor_name`, `patient_name`, `diagnosis[]`, `medications[]`, `lab_values[]`, `follow_up_date`, `follow_up_instructions`, `summary`. There's no separate "provider" vs "facility" split — `hospital_name` is the facility, `doctor_name` is the provider. Your screenshots showing raw `lab_report` text under the title is because the card is rendering `document_label` (the raw category id sent at upload time, e.g. `'lab_report'`) directly as text instead of mapping it through your existing `CATEGORIES` constant from `upload.tsx` for the icon + friendly name.

```
Update the Records screen card component to display real extracted data.

1. Update the Records card to show:
   - document_title (already generated server-side in process_document, e.g.
     "Lab Report from Healthians (2026-07-09)") as the primary line — this
     already works, just confirm it's not being truncated oddly by numLines
     or a fixed-width container (screenshots show "Lab Report from Healthians …"
     cut off — check if that's an intentional numberOfLines={1} or a layout bug)
   - category icon: map document_label to the same CATEGORIES constant used
     in app/(tabs)/upload.tsx (icon + color + bg) — import/reuse that array,
     don't duplicate it in the Records screen
   - a secondary line combining extracted_data.hospital_name and
     extracted_data.doctor_name, e.g. "Dr. {doctor_name} · {hospital_name}" —
     if both are null (document not yet processed, or Groq returned null),
     fall back to "Details pending" rather than "Unknown" (matches the
     friendlier tone from Phase 1's notification copy)
   - created_at date (already present)
   - a small thumbnail using the b2_file_url from Phase 3, only rendered
     once status === 'ready' (avoid triggering a fetch for in-progress docs)

2. Fix the card width/padding issue — cards currently render narrower than
   the screen width with awkward wrapping. Inspect the current card
   container style and correct the horizontal margin/padding so cards span
   consistently. This is a functional layout fix (cards are currently
   visually broken), not a redesign — keep existing colors/fonts.

Do not touch the failed-card rendering path — that's removed entirely per
Phase 1 (hidden_from_list filters it out of the query itself).
```

---

### Phase 5 — "Magic Summary" AI explainer button + screen

**Resolved from code review — good news, most of the backend is already built.** `POST /{document_id}/summarize` already exists in `app/routers/documents.py` and does almost exactly what this phase needs: it sends `extracted_data` to Groq with a system prompt asking for plain-English `headline`, `summary`, `key_points[]`, `flag` (normal/attention/urgent), and `flag_reason` — and it already caches the result in an `ai_summary` field so repeat views don't re-call Groq. This phase is now mostly **frontend wiring**, plus two small backend refinements.

```
Wire up the AI-generated plain-language summary feature using the existing
POST /{document_id}/summarize endpoint.

BACKEND (small refinements only — do not rebuild the endpoint):
1. The current system prompt in summarize_document doesn't explicitly ask
   for reference ranges on lab values or "what happens if this stays
   abnormal" — add one sentence to the existing system_prompt instructing
   it to mention the normal reference range for any flagged lab_values and,
   in plain terms, what an out-of-range value could mean if left unaddressed
   — while keeping the existing explicit instruction that this is not a
   diagnosis (add that disclaimer line to the prompt if it isn't already
   implied strongly enough — currently the prompt doesn't state it outright,
   only "not a doctor" framing, which is a bit weaker than an explicit
   non-diagnosis disclaimer).

2. Confirm the 400 "Document not yet processed" case (when extracted_data
   is empty) is what the frontend should treat as "hide the button" per
   frontend step 3 below — no change needed here if so, just confirming
   contract.

FRONTEND:
3. Add a small circular button (similar treatment to the existing "+" FAB
   on Home) on the Report Details screen — icon suggestion: a sparkle or
   lightbulb icon from MaterialCommunityIcons, NOT a magic wand (reads more
   clinical/trustworthy for a health context). Label it "Explain This".
   Only render it when the document's status is 'ready' (matches the
   backend's extracted_data check).

4. Tapping it calls POST /{document_id}/summarize and opens a new
   screen/modal rendering headline, summary, and key_points as a simple
   bulleted list. Show a loading state on first call (cached=false in the
   response); subsequent opens should feel instant since cached=true skips
   the Groq round-trip.

5. Use the flag field to show a small colored indicator (normal = neutral,
   attention = amber, urgent = red) next to the headline, and render
   flag_reason underneath when present.

6. Include a persistent, non-dismissible disclaimer at the top of this
   screen: "This is a simplified explanation, not medical advice. Always
   consult your doctor about your results." — independent of whatever the
   backend prompt says, this should always be shown client-side too.

Keep the explanation screen visually simple (plain text, no new design
system) — functionality first per project priority.
```

---

## Suggested order

1. **Phase 0** first — always. Reduces how often you'll see failures at all.
2. **Phase 1** — fixes the failed-card clutter + adds notifications + fixes the `onSnapshot` root cause.
3. **Test Phase 2 for free** — confirm Home timeline updates now; only write a new prompt if it doesn't.
4. **Phase 3** — preview plumbing (needed by Phase 4 and 5's context, so do it before the card redesign).
5. **Phase 4** — Records card data + layout fix.
6. **Phase 5** — new AI summary feature, once everything above is stable.

## Resolved from code review (2026-07-09)

- `extracted_data` shape confirmed exactly — see Phase 4. Field names are `hospital_name` / `doctor_name`, not "provider"/"facility."
- Celery retry logic exists (`max_retries=2`) but has a status-ordering bug that likely explains a chunk of your "Processing failed" cards — see Phase 0.
- B2 uses signed URLs already (`get_presigned_url`, generated fresh per request in `get_document`) — confirmed, Phase 3 assumption was correct for single-file uploads.
- `/retry` and `DELETE` endpoints already exist and are reused in Phases 1 and 3 rather than rebuilt.
- `/summarize` endpoint already exists and does most of what Phase 5 needs — that phase is now mostly frontend wiring.

## New issues surfaced by the code review (not part of your original 6 asks — flagging, not auto-fixing)

- **Multi-page documents have no B2 file at all** (`b2_file_id` stays empty) — only individual page images get moved to final storage, the merged PDF used for OCR is never persisted. This blocks preview (fixed in Phase 3) and also means multi-page documents currently have no downloadable/shareable original file — worth confirming this doesn't affect your share-with-doctor flow for multi-page uploads before you rely on it.
- `SoftTimeLimitExceeded` (documents that take longer than 120s) currently gets zero retries even though it's often a legitimate "still working, just slow" case, not a real failure — addressed in Phase 0's fix.
- The known PyMuPDF `filetype="png"` hardcoding issue (from your earlier audit notes) doesn't appear in `_merge_images_to_pdf` — it correctly tries native format detection first with a PIL fallback. Worth double-checking whether that gap is elsewhere in the codebase, since it looks like it may already be resolved here.