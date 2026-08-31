# app/workers/extraction_task.py
"""
Document processing pipeline — Celery background task.

Runs completely asynchronously after the upload endpoint returns.
Updates Firestore at each processing stage so the frontend can
show real-time progress.

Stage progression:
  uploaded (20%) → queued (25%) → preparing (35%) → reading_pages (55%)
  → extracting (75%) → generating_summary (90%) → finalizing (95%) → ready (100%)
"""
import asyncio
import time
import json
import httpx

from celery.exceptions import SoftTimeLimitExceeded
from app.workers.celery_app import celery_app
from app.firestore import get_db
from google.cloud.firestore import SERVER_TIMESTAMP
from app.services.extraction import extract_from_image
from app.services.storage import get_presigned_url, get_b2_client, move_to_final
from app.config import settings
from app.logging_config import logger


def run_async(coro):
    """
    Safely run an async coroutine from a sync Celery task.
    Creates a new event loop — never reuses an existing one.
    """
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _update_progress(doc_ref, stage: str, progress: int, **extra_fields):
    """Helper to update processing stage in Firestore."""
    update = {
        "processing_stage": stage,
        "processing_progress": progress,
        "updated_at": SERVER_TIMESTAMP,
        **extra_fields,
    }
    doc_ref.update(update)
    logger.info(f"Document {doc_ref.id}: stage={stage} progress={progress}%")


def _merge_images_to_pdf(image_bytes_list: list) -> bytes:
    """Merge multiple page images into a single in-memory PDF using PyMuPDF."""
    import fitz
    import io
    from PIL import Image

    pdf = fitz.open()
    for img_bytes in image_bytes_list:
        try:
            # Let PyMuPDF attempt to auto-detect the image type (works for JPEG, PNG)
            img_doc = fitz.open(stream=img_bytes)
            img_page = img_doc[0]
            rect = img_page.rect
            img_doc.close()
            final_bytes = img_bytes
        except Exception:
            # Fallback for formats PyMuPDF doesn't natively support (like WebP)
            with Image.open(io.BytesIO(img_bytes)) as pil_img:
                if pil_img.mode in ("RGBA", "P"):
                    pil_img = pil_img.convert("RGB")
                img_byte_arr = io.BytesIO()
                pil_img.save(img_byte_arr, format="JPEG", quality=95)
                final_bytes = img_byte_arr.getvalue()
                
            img_doc = fitz.open(stream=final_bytes)
            img_page = img_doc[0]
            rect = img_page.rect
            img_doc.close()

        # Create a PDF page with the same dimensions and insert the image
        pdf_page = pdf.new_page(width=rect.width, height=rect.height)
        pdf_page.insert_image(pdf_page.rect, stream=final_bytes)
        
    pdf_bytes = pdf.tobytes()
    pdf.close()
    return pdf_bytes


@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    name="app.workers.extraction_task.process_document",
)
def process_document(self, document_id: str, owner_id: str) -> dict:
    """
    Background processing pipeline for uploaded documents.
    Each stage updates Firestore so the frontend can poll progress.
    """
    start_time = time.time()
    logger.info(f"Processing document {document_id} for user {owner_id}")

    db = get_db()
    doc_ref = db.collection("documents").document(document_id)

    try:
        # ── STAGE 1: PREPARING (35%) ──────────────────────────────────────
        _update_progress(doc_ref, "preparing", 35, status="processing")

        doc_snap = doc_ref.get()
        if not doc_snap.exists:
            logger.error(f"Document {document_id} not found in Firestore")
            return {"status": "not_found"}

        doc = doc_snap.to_dict()
        b2_key = doc.get("b2_file_id")
        mime_type = doc.get("file_type")

        b2_page_keys = doc.get("b2_page_keys", [])

        if not b2_key and not b2_page_keys:
            logger.error(f"Document {document_id} has no B2 key or page keys")
            _update_progress(doc_ref, "failed", 0, status="failed")
            return {"status": "no_file"}

        # ── STAGE 2: READING PAGES (55%) ──────────────────────────────────
        _update_progress(doc_ref, "reading_pages", 55)

        client = get_b2_client()

        if b2_page_keys:
            # ── Multi-page path: download all pages, merge into PDF ──
            logger.info(f"Multi-page document: downloading {len(b2_page_keys)} pages")
            page_bytes_list = []
            for i, page_key in enumerate(b2_page_keys):
                logger.info(f"Downloading page {i+1}: {page_key}")
                resp = client.get_object(
                    Bucket=settings.b2_bucket_name,
                    Key=page_key,
                )
                page_bytes_list.append(resp["Body"].read())

            # Merge all page images into a single PDF for Azure DI
            logger.info(f"Merging {len(page_bytes_list)} pages into PDF")
            file_bytes = _merge_images_to_pdf(page_bytes_list)
            mime_type = "application/pdf"  # Override: merged PDF

            # Upload merged PDF to B2 so it can be previewed
            merged_pdf_key = f"docs/{owner_id}/{document_id}/merged.pdf"
            try:
                client.put_object(
                    Bucket=settings.b2_bucket_name,
                    Key=merged_pdf_key,
                    Body=file_bytes,
                    ContentType="application/pdf"
                )
                logger.info(f"Uploaded merged PDF to {merged_pdf_key}")
            except Exception as upload_err:
                logger.warning(f"Failed to upload merged PDF (non-fatal): {upload_err}")
                merged_pdf_key = None

            # Move each page to final location
            final_page_keys = []
            for i, page_key in enumerate(b2_page_keys):
                final_key = f"docs/{owner_id}/{document_id}/page_{i+1}"
                try:
                    move_to_final(page_key, final_key)
                    final_page_keys.append(final_key)
                    logger.info(f"Moved {page_key} → {final_key}")
                except Exception as move_err:
                    logger.warning(f"Move page {i+1} to final failed (non-fatal): {move_err}")
                    final_page_keys.append(page_key)  # Keep original key

            update_data = {
                "b2_page_keys": final_page_keys,
                "updated_at": SERVER_TIMESTAMP,
            }
            if merged_pdf_key:
                update_data["b2_file_id"] = merged_pdf_key
                
            doc_ref.update(update_data)
        else:
            # ── Single-file path: unchanged ──
            logger.info(f"Downloading {b2_key} from B2")
            response = client.get_object(
                Bucket=settings.b2_bucket_name,
                Key=b2_key,
            )
            file_bytes = response["Body"].read()
            logger.info(f"Downloaded {len(file_bytes)} bytes")

            # Move from tmp/ to final docs/ location
            final_key = f"docs/{owner_id}/{document_id}"
            try:
                move_to_final(b2_key, final_key)
                doc_ref.update({
                    "b2_file_id": final_key,
                    "updated_at": SERVER_TIMESTAMP,
                })
                logger.info(f"Moved {b2_key} → {final_key}")
            except Exception as move_err:
                logger.warning(f"Move to final failed (non-fatal): {move_err}")
                # Continue with extraction even if move fails

        # ── STAGE 3: EXTRACTING (75%) ─────────────────────────────────────
        _update_progress(doc_ref, "extracting", 75)

        extracted = run_async(extract_from_image(file_bytes, mime_type))
        logger.info(
            f"Extraction complete for {document_id}: "
            f"type={extracted.get('document_type')}"
        )

        # Derive document_title from extracted data
        doc_type = extracted.get("document_type", "Document")
        hospital = extracted.get("hospital_name")
        doc_date = extracted.get("document_date")

        title_parts = [doc_type.replace("_", " ").title()]
        if hospital:
            title_parts.append(f"from {hospital}")
        if doc_date:
            title_parts.append(f"({doc_date})")
        document_title = " ".join(title_parts)

        # ── STAGE 4: GENERATING SUMMARY (90%) ────────────────────────────
        _update_progress(doc_ref, "generating_summary", 90)

        summary = extracted.get("summary", "")
        # If the extraction returned a summary, use it directly.
        # Otherwise generate one from the structured data.
        if not summary or summary == "Extraction failed — please review document manually.":
            summary = _generate_summary_from_data(extracted)

        # ── STAGE 5: FINALIZING (95%) ─────────────────────────────────────
        _update_progress(doc_ref, "finalizing", 95)

        # Validate and clean extracted data
        if not isinstance(extracted, dict):
            extracted = {}

        # ── STAGE 6: READY (100%) ─────────────────────────────────────────
        condition_terms_raw = extracted.get("condition_terms_raw", [])
        condition_groups = extracted.get("condition_groups", [])
        
        doc_ref.update({
            "status": "ready",
            "processing_progress": 100,
            "processing_stage": "ready",
            "document_title": document_title,
            "extracted_data": extracted,
            "condition_terms_raw": condition_terms_raw,
            "condition_groups": condition_groups,
            "summary": summary,
            "updated_at": SERVER_TIMESTAMP,
        })

        # Create corresponding entry in medical_events collection
        try:
            from datetime import datetime, timezone
            event_date_str = extracted.get("document_date")
            if not event_date_str or len(str(event_date_str)) < 10:
                event_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            else:
                event_date_str = str(event_date_str)[:10]

            patient_id = doc.get("patient_id") or owner_id
            event_data = {
                "patient_id": str(patient_id),
                "document_id": document_id,
                "event_date": event_date_str,
                "hospital_name": extracted.get("hospital_name"),
                "doctor_name": extracted.get("doctor_name"),
                "diagnosis": extracted.get("diagnosis", []),
                "medications": extracted.get("medications", []),
                "lab_values": extracted.get("lab_values", []),
                "condition_terms_raw": condition_terms_raw,
                "condition_groups": condition_groups,
                "summary": summary,
                "created_at": SERVER_TIMESTAMP,
            }
            db.collection("medical_events").document(document_id).set(event_data)
            logger.info(f"Created medical_event for document {document_id}")
        except Exception as event_err:
            logger.error(f"Failed to create medical_event for {document_id}: {event_err}", exc_info=True)

        # Invalidate the timeline cache so the frontend can sync immediately
        from app.routers.timeline import invalidate_timeline_cache
        try:
            invalidate_timeline_cache(str(doc.get("patient_id") or owner_id))
        except Exception as e:
            logger.warning(f"Failed to invalidate timeline cache for {owner_id}: {e}")

        elapsed = time.time() - start_time
        logger.info(f"Document {document_id} ready in {elapsed:.1f}s")

        return {"status": "ready", "document_id": document_id}

    except SoftTimeLimitExceeded as exc:
        logger.error(f"Document {document_id} exceeded soft time limit "
                     f"(attempt {self.request.retries + 1}/{self.max_retries + 1})")
        is_final_attempt = self.request.retries >= self.max_retries
        if is_final_attempt:
            try:
                _update_progress(
                    doc_ref, "failed", 0,
                    status="failed",
                    failure_reason="processing_timeout",
                    hidden_from_list=True,
                )
                db.collection("users").document(owner_id).collection("notifications").document().set({
                    "type": "processing_failed",
                    "document_id": document_id,
                    "title": "One of your documents is taking longer than expected — we're still trying.",
                    "created_at": SERVER_TIMESTAMP,
                    "read": False
                })
            except Exception:
                pass
            return {"status": "timeout"}
        # Not final — allow one retry for legitimately slow documents
        try:
            _update_progress(doc_ref, "retrying", 0)
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)

    except Exception as exc:
        logger.error(f"Document {document_id} failed: {exc} "
                     f"(attempt {self.request.retries + 1}/{self.max_retries + 1})",
                     exc_info=True)

        # Classify the failure for downstream use (notifications, UI)
        failure_reason = "unknown_error"
        exc_str = str(exc).lower()
        if isinstance(exc, (RuntimeError,)) and ("azure" in exc_str or "ocr" in exc_str or "document intelligence" in exc_str):
            failure_reason = "ocr_failed"
        elif isinstance(exc, (httpx.HTTPError, httpx.TimeoutException)):
            failure_reason = "extraction_failed"
        elif "groq" in exc_str or "structur" in exc_str:
            failure_reason = "extraction_failed"

        is_final_attempt = self.request.retries >= self.max_retries
        if is_final_attempt:
            # Final attempt exhausted — NOW mark as failed
            try:
                _update_progress(
                    doc_ref, "failed", 0,
                    status="failed",
                    failure_reason=failure_reason,
                    hidden_from_list=True,
                )
                
                msg_map = {
                    "ocr_failed": "We couldn't read one of your documents. Please try re-uploading it.",
                    "extraction_failed": "One of your uploads couldn't be processed. Please try again.",
                    "processing_timeout": "One of your documents is taking longer than expected — we're still trying.",
                    "unknown_error": "Something went wrong with one of your uploads."
                }
                
                db.collection("users").document(owner_id).collection("notifications").document().set({
                    "type": "processing_failed",
                    "document_id": document_id,
                    "title": msg_map.get(failure_reason, msg_map["unknown_error"]),
                    "created_at": SERVER_TIMESTAMP,
                    "read": False
                })
            except Exception:
                pass
            # Don't call self.retry() — retries are exhausted, let Celery
            # handle MaxRetriesExceededError naturally by not re-raising
            return {"status": "failed", "failure_reason": failure_reason}

        # Non-final attempt — mark as retrying, keep status as "processing"
        try:
            _update_progress(doc_ref, "retrying", 0)
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


def _generate_summary_from_data(extracted: dict) -> str:
    """Generate a basic summary from structured extraction data."""
    parts = []

    doc_type = extracted.get("document_type", "document")
    parts.append(f"This is a {doc_type.replace('_', ' ')}.")

    diagnosis = extracted.get("diagnosis", [])
    if diagnosis:
        parts.append(f"Diagnosis: {', '.join(diagnosis[:3])}.")

    meds = extracted.get("medications", [])
    if meds:
        med_names = [m.get("name", "") for m in meds[:3] if m.get("name")]
        if med_names:
            parts.append(f"Medications prescribed: {', '.join(med_names)}.")

    lab_values = extracted.get("lab_values", [])
    flagged = [lv for lv in lab_values if lv.get("flag") in ("high", "low")]
    if flagged:
        names = [f.get("test_name", "") for f in flagged[:3] if f.get("test_name")]
        if names:
            parts.append(f"Abnormal values: {', '.join(names)}.")

    follow_up = extracted.get("follow_up_instructions")
    if follow_up:
        parts.append(f"Follow-up: {follow_up}")

    return " ".join(parts) if parts else "Document processed successfully."