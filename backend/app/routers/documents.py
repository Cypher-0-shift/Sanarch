# app/routers/documents.py
"""
Decoupled document upload & background processing.
Upload returns immediately; AI processing happens in Celery.
"""
import re
import base64
import json
import time
import httpx
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request, Query
from typing import Optional, List
from google.cloud.firestore import Client, SERVER_TIMESTAMP
from app.config import settings as _settings
from app.firestore import get_db
from app.services.storage import upload_to_tmp, get_presigned_url, delete_object
from app.services.virus_scan import scan_bytes
from app.middleware.auth_middleware import get_current_user
from app.workers.extraction_task import process_document
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentListItem,
    DocumentListResponse,
    DocumentDetailResponse,
    AISummaryResponse,
)
from app.logging_config import logger
from slowapi import Limiter
from slowapi.util import get_remote_address
import magic  # python-magic for true MIME detection
import fitz  # PyMuPDF
from datetime import datetime

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])
limiter = Limiter(key_func=get_remote_address)

# --- Constants ---
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_SIZE_BYTES = _settings.max_upload_size_bytes  # 20MB default


def _detect_true_mime(file_bytes: bytes) -> str:
    """Use libmagic to detect actual MIME type from raw bytes."""
    try:
        return magic.from_buffer(file_bytes, mime=True)
    except Exception:
        return "application/octet-stream"


def _get_user_or_ip(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer ") and auth != "Bearer dev-mode-token":
        return f"user:{auth[7:27]}"
    return get_remote_address(request)


# ─────────────────────────────────────────────────────────────────────────────
# POST /upload — Upload document, return immediately, process in background
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
@limiter.limit("10/minute", key_func=_get_user_or_ip)
async def upload_document(
    request: Request,
    file: UploadFile = File(None),
    files: Optional[List[UploadFile]] = File(None),
    document_label: str = Form("Other"),
    document_title: str = Form(""),
    notes: str = Form(""),
    pages_count: int = Form(1),
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    owner_id = current_user["id"]

    # Determine if this is a multi-page upload
    multi_page = files is not None and len(files) > 0

    if not multi_page and file is None:
        raise HTTPException(400, "No file provided")

    if multi_page:
        # ── Multi-page upload path ──────────────────────────────────────
        if len(files) > 20:
            raise HTTPException(400, "Maximum 20 pages per document")

        b2_page_keys = []
        for i, page_file in enumerate(files):
            if len(page_file.filename or "") > 200:
                raise HTTPException(400, f"filename too long for page {i+1}")

            page_bytes = await page_file.read()

            if len(page_bytes) == 0:
                raise HTTPException(400, f"page {i+1} is empty")
            if len(page_bytes) > MAX_SIZE_BYTES:
                raise HTTPException(400, f"page {i+1} exceeds {MAX_SIZE_BYTES // 1024 // 1024}MB limit")

            # MIME verification
            true_mime = _detect_true_mime(page_bytes)
            if true_mime not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    415,
                    f"Page {i+1}: unsupported file type {true_mime}. "
                    f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
                )

            # ClamAV scan
            is_clean, reason = scan_bytes(page_bytes)
            if not is_clean:
                logger.warning(f"User {owner_id} page {i+1} infected: {reason}")
                raise HTTPException(422, f"Page {i+1} rejected by virus scan: {reason}")

            # Upload to B2
            safe_filename = re.sub(r"[^\w\-.]", "_", page_file.filename or "upload")[:100]
            try:
                b2_key = upload_to_tmp(
                    page_bytes,
                    f"{owner_id}/{safe_filename}_page_{i+1}",
                    true_mime,
                )
                b2_page_keys.append(b2_key)
            except Exception as e:
                logger.error(f"B2 upload failed for page {i+1}: {e}")
                raise HTTPException(503, "Storage service unavailable — try again")

        actual_pages_count = len(files)

        # Create Firestore document with page keys
        doc_data = {
            "owner_id": owner_id,
            "file_name": f"{actual_pages_count}_pages",
            "file_type": "multi-page/images",
            "b2_file_id": "",  # No single file
            "b2_file_url": "",
            "b2_page_keys": b2_page_keys,
            "document_label": document_label,
            "document_title": document_title,
            "notes": notes,
            "status": "uploaded",
            "processing_progress": 20,
            "processing_stage": "uploaded",
            "extracted_data": {},
            "summary": "",
            "pages_count": actual_pages_count,
            "created_at": SERVER_TIMESTAMP,
            "updated_at": SERVER_TIMESTAMP,
        }
    else:
        # ── Single-file upload path (unchanged) ────────────────────────
        # 1. Basic validation
        if len(file.filename or "") > 200:
            raise HTTPException(400, "filename too long")

        file_bytes = await file.read()

        if len(file_bytes) == 0:
            raise HTTPException(400, "file is empty")

        if len(file_bytes) > MAX_SIZE_BYTES:
            raise HTTPException(400, f"file exceeds {MAX_SIZE_BYTES // 1024 // 1024}MB limit")

        # 2. MIME verification via python-magic on raw bytes
        true_mime = _detect_true_mime(file_bytes)
        if true_mime not in ALLOWED_MIME_TYPES:
            logger.warning(
                f"User {owner_id} uploaded file with true type {true_mime} — rejected"
            )
            raise HTTPException(
                415,
                f"Unsupported file type: {true_mime}. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
            )

        # 3. ClamAV virus scan
        is_clean, reason = scan_bytes(file_bytes)
        if not is_clean:
            logger.warning(f"User {owner_id} uploaded infected file: {reason}")
            raise HTTPException(422, f"File rejected by virus scan: {reason}")

        # 4. Upload to Backblaze B2
        safe_filename = re.sub(r"[^\w\-.]", "_", file.filename or "upload")[:100]
        try:
            b2_key = upload_to_tmp(file_bytes, f"{owner_id}/{safe_filename}", true_mime)
        except Exception as e:
            logger.error(f"B2 upload failed for user {owner_id}: {e}")
            raise HTTPException(503, "Storage service unavailable — try again")

        # Generate a presigned URL for the uploaded file
        # TTL is 1 hour to match the client-side URL cache in documentsStore.
        try:
            b2_url = get_presigned_url(b2_key, expires_in=3600)  # 1h
        except Exception:
            b2_url = ""

        # 5. Create Firestore document
        doc_data = {
            "owner_id": owner_id,
            "file_name": safe_filename,
            "file_type": true_mime,
            "b2_file_id": b2_key,
            "b2_file_url": b2_url,
            "document_label": document_label,
            "document_title": document_title,
            "notes": notes,
            "status": "uploaded",
            "processing_progress": 20,
            "processing_stage": "uploaded",
            "extracted_data": {},
            "summary": "",
            "pages_count": pages_count,
            "created_at": SERVER_TIMESTAMP,
            "updated_at": SERVER_TIMESTAMP,
        }

    doc_ref = db.collection("documents").document()
    doc_ref.set(doc_data)
    document_id = doc_ref.id

    # 6. Queue Celery task & update status to "queued"
    doc_ref.update({
        "status": "queued",
        "processing_progress": 25,
        "processing_stage": "queued",
        "updated_at": SERVER_TIMESTAMP,
    })

    process_document.apply_async(
        args=[document_id, owner_id],
        queue="documents",
        task_id=document_id,
    )

    logger.info(f"Document {document_id} uploaded and queued for user {owner_id}")

    # 7. Return immediately
    return DocumentUploadResponse(
        document_id=document_id,
        status="queued",
        message="Document uploaded successfully. AI processing has started.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET / — List all documents for authenticated user
# ─────────────────────────────────────────────────────────────────────────────
@router.get("", response_model=DocumentListResponse)
def list_documents(
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    owner_id = current_user["id"]
    query = db.collection("documents").where("owner_id", "==", owner_id)
    docs_stream = query.stream()

    documents = []
    for d in docs_stream:
        data = d.to_dict()
        if data.get("hidden_from_list"):
            continue
            
        created_at_val = data.get("created_at")
        if isinstance(created_at_val, datetime):
            created_at_str = created_at_val.isoformat()
        elif hasattr(created_at_val, "isoformat"):
            created_at_str = created_at_val.isoformat()
        elif hasattr(created_at_val, "toDate"):
            created_at_str = created_at_val.toDate().isoformat()
        else:
            created_at_str = str(created_at_val) if created_at_val else None

        updated_at_val = data.get("updated_at")
        if isinstance(updated_at_val, datetime):
            updated_at_str = updated_at_val.isoformat()
        elif hasattr(updated_at_val, "isoformat"):
            updated_at_str = updated_at_val.isoformat()
        elif hasattr(updated_at_val, "toDate"):
            updated_at_str = updated_at_val.toDate().isoformat()
        else:
            updated_at_str = str(updated_at_val) if updated_at_val else None

        documents.append(DocumentListItem(
            document_id=d.id,
            document_title=data.get("document_title", ""),
            document_label=data.get("document_label", ""),
            status=data.get("status", "unknown"),
            processing_progress=data.get("processing_progress", 0),
            processing_stage=data.get("processing_stage", "unknown"),
            file_type=data.get("file_type", ""),
            b2_file_url=data.get("b2_file_url"),
            thumbnail_url=data.get("thumbnail_url"),
            extracted_data=data.get("extracted_data") or {},
            condition_terms_raw=data.get("condition_terms_raw") or [],
            condition_groups=data.get("condition_groups") or [],
            summary=data.get("summary") or "",
            created_at=created_at_str,
            updated_at=updated_at_str,
        ))

    # Sort newest first
    documents.sort(key=lambda x: x.created_at or "", reverse=True)

    return DocumentListResponse(documents=documents)


# ─────────────────────────────────────────────────────────────────────────────
# GET /{document_id} — Document detail with extracted data
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: str,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    doc_snap = db.collection("documents").document(document_id).get()
    if not doc_snap.exists:
        raise HTTPException(404, "Document not found")

    doc = doc_snap.to_dict()

    # Ownership check — return 403 if not owner
    if doc.get("owner_id") != current_user["id"]:
        raise HTTPException(403, "You do not have access to this document")

    # Generate fresh presigned URL if we have a B2 key.
    # TTL is 1 hour — matches the client-side URL cache in documentsStore.
    b2_url = None
    b2_key = doc.get("b2_file_id")
    if b2_key:
        try:
            b2_url = get_presigned_url(b2_key, expires_in=3600)  # 1h
        except Exception:
            b2_url = doc.get("b2_file_url")

    # Generate fresh presigned URL for the thumbnail (Phase C).
    thumbnail_url = None
    thumb_key = doc.get("thumbnail_file_id")
    if thumb_key:
        try:
            thumbnail_url = get_presigned_url(thumb_key, expires_in=3600)  # 1h
        except Exception:
            thumbnail_url = doc.get("thumbnail_url")

    return DocumentDetailResponse(
        document_id=document_id,
        document_title=doc.get("document_title", ""),
        document_label=doc.get("document_label", ""),
        status=doc.get("status", "unknown"),
        processing_progress=doc.get("processing_progress", 0),
        processing_stage=doc.get("processing_stage", "unknown"),
        file_name=doc.get("file_name", ""),
        file_type=doc.get("file_type", ""),
        extracted_data=doc.get("extracted_data", {}),
        summary=doc.get("summary", ""),
        b2_file_url=b2_url,
        thumbnail_url=thumbnail_url,
        created_at=doc.get("created_at").isoformat() if isinstance(doc.get("created_at"), datetime) else None,
        updated_at=doc.get("updated_at").isoformat() if isinstance(doc.get("updated_at"), datetime) else None,
    )


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /{document_id} — Delete document + B2 file
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    doc_ref = db.collection("documents").document(document_id)
    doc_snap = doc_ref.get()

    if not doc_snap.exists:
        raise HTTPException(404, "Document not found")

    doc = doc_snap.to_dict()
    if doc.get("owner_id") != current_user["id"]:
        raise HTTPException(403, "You do not have access to this document")

    # Delete from B2
    b2_key = doc.get("b2_file_id")
    if b2_key:
        try:
            delete_object(b2_key)
        except Exception as e:
            logger.warning(f"Failed to delete B2 object {b2_key}: {e}")

    # Delete multi-page files if present
    b2_page_keys = doc.get("b2_page_keys", [])
    for page_key in b2_page_keys:
        try:
            delete_object(page_key)
        except Exception as e:
            logger.warning(f"Failed to delete B2 page object {page_key}: {e}")

    # Also clean up any old tmp/final keys
    for key_field in ["s3_key", "s3_tmp_key"]:
        old_key = doc.get(key_field)
        if old_key and old_key != b2_key:
            try:
                delete_object(old_key)
            except Exception:
                pass

    # Delete from Firestore
    doc_ref.delete()
    try:
        db.collection("medical_events").document(document_id).delete()
        from app.routers.timeline import invalidate_timeline_cache
        invalidate_timeline_cache(str(doc.get("patient_id") or doc.get("owner_id") or current_user["id"]))
    except Exception as e:
        logger.warning(f"Failed to delete medical_event or invalidate cache for {document_id}: {e}")
    logger.info(f"Document {document_id} deleted by user {current_user['id']}")

    return {"status": "deleted", "document_id": document_id}


# ─────────────────────────────────────────────────────────────────────────────
# POST /pdf/convert — Convert PDF to page images (used by frontend)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/pdf/convert")
async def convert_pdf_to_images(
    pdf_uri: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        if pdf_uri.startswith("data:"):
            base64_content = pdf_uri.split(",", 1)[1]
            pdf_bytes = base64.b64decode(base64_content)
        else:
            raise HTTPException(400, "please send pdf as base64-encoded data uri")

        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(pdf_document)

        if page_count == 0:
            raise HTTPException(400, "pdf has no pages")
        if page_count > 200:
            raise HTTPException(400, f"pdf has too many pages ({page_count}). maximum 200.")

        images = []
        for page_num in range(page_count):
            page = pdf_document[page_num]
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("jpeg")
            img_base64 = base64.b64encode(img_data).decode("utf-8")
            images.append(f"data:image/jpeg;base64,{img_base64}")

        pdf_document.close()
        logger.info(f"Converted PDF with {page_count} pages for user {current_user['id']}")

        return {"success": True, "page_count": page_count, "images": images}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF conversion failed: {e}")
        raise HTTPException(500, f"failed to convert pdf: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /{document_id}/summarize — AI summary (used by frontend)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/{document_id}/summarize", response_model=AISummaryResponse)
@limiter.limit("10/minute")
async def summarize_document(
    request: Request,
    document_id: str,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    doc_snap = db.collection("documents").document(document_id).get()
    if not doc_snap.exists:
        raise HTTPException(404, "Document not found")

    doc = doc_snap.to_dict()
    if doc.get("owner_id") != current_user["id"]:
        raise HTTPException(403, "You do not have access to this document")

    # Return cached summary if available
    if doc.get("ai_summary"):
        try:
            cached = json.loads(doc["ai_summary"])
            return AISummaryResponse(**cached, cached=True, document_id=document_id)
        except Exception:
            pass

    if not doc.get("extracted_data"):
        raise HTTPException(400, "Document not yet processed")

    system_prompt = (
        "You are a friendly health assistant explaining a medical document to a patient in plain English.\n"
        "The patient is not a doctor. Be warm, clear, and concise. "
        "Explicitly state that you are an AI assistant and this is not a medical diagnosis.\n"
        "If there are any flagged or abnormal lab values, explicitly mention their normal reference ranges and explain in plain, non-alarmist terms what an out-of-range value could mean if left unaddressed.\n"
        "Return ONLY a JSON object with these keys:\n"
        "{\n"
        '  "headline": "One sentence (max 15 words) describing what this document is about",\n'
        '  "summary": "3-5 sentences explaining what was found, what it means, and what action (if any) the patient should take",\n'
        '  "key_points": ["Up to 4 bullet points of the most important facts"],\n'
        '  "flag": "normal | attention | urgent — based on whether any values are abnormal or follow-up is needed",\n'
        '  "flag_reason": "One sentence explaining why this was flagged (null if normal)"\n'
        "}"
    )

    user_message = json.dumps(doc["extracted_data"], indent=2)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {_settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": 0.0,
                    "max_tokens": 1024,
                },
            )
            response.raise_for_status()
            raw = response.json()["choices"][0]["message"]["content"].strip()

            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1] if len(parts) > 1 else raw
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            result = json.loads(raw)

            # Cache the result
            doc_ref = db.collection("documents").document(document_id)
            doc_ref.update({"ai_summary": json.dumps(result)})

            return AISummaryResponse(**result, cached=False, document_id=document_id)

    except Exception as e:
        logger.error(f"AI summarization failed for doc {document_id}: {e}")
        raise HTTPException(503, "AI service temporarily unavailable")


# ─────────────────────────────────────────────────────────────────────────────
# POST /{document_id}/retry — Re-queue a failed document for processing
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/{document_id}/retry")
def retry_document(
    document_id: str,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    doc_ref = db.collection("documents").document(document_id)
    doc_snap = doc_ref.get()

    if not doc_snap.exists:
        raise HTTPException(404, "Document not found")

    doc = doc_snap.to_dict()
    if doc.get("owner_id") != current_user["id"]:
        raise HTTPException(403, "You do not have access to this document")

    if doc.get("status") != "failed":
        raise HTTPException(409, "Only failed documents can be retried")

    # Reset Firestore fields
    doc_ref.update({
        "status": "queued",
        "processing_progress": 25,
        "processing_stage": "queued",
        "updated_at": SERVER_TIMESTAMP,
    })

    # Re-queue Celery task with a unique task_id to avoid conflicts
    retry_task_id = f"{document_id}-retry-{int(time.time())}"
    process_document.apply_async(
        args=[document_id, current_user["id"]],
        queue="documents",
        task_id=retry_task_id,
    )

    logger.info(f"Document {document_id} retried by user {current_user['id']}")

    return {"status": "queued", "document_id": document_id}