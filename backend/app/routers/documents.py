# app/routers/documents.py
import uuid
import re
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.services.storage import upload_to_tmp, get_presigned_url, delete_object
from app.middleware.auth_middleware import get_current_user
from app.workers.extraction_task import process_document
from app.schemas.document import DocumentUploadResponse, DocumentStatusResponse, DocumentConfirmRequest
from app.logging_config import logger
from app.routers.timeline import invalidate_timeline_cache
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional
import magic  # python-magic for true MIME detection

router = APIRouter(prefix="/documents", tags=["documents"])
limiter = Limiter(key_func=get_remote_address)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}

from app.config import settings as _settings
ALLOWED_EXTENSIONS = _settings.allowed_extensions_set
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20MB

def _validate_file_extension(filename: str) -> bool:
    """Check file extension — independent of content-type header."""
    import os
    ext = os.path.splitext(filename or "")[1].lower()
    return ext in ALLOWED_EXTENSIONS

def _detect_true_mime(file_bytes: bytes) -> str:
    """Use libmagic to detect actual MIME type from file bytes, not client header."""
    try:
        return magic.from_buffer(file_bytes, mime=True)
    except Exception:
        return "application/octet-stream"

@router.post("/upload", response_model=DocumentUploadResponse)
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    patient_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Validate extension (client-controlled, but first line of defense)
    if not _validate_file_extension(file.filename):
        raise HTTPException(400, f"File extension not allowed. Accepted: {ALLOWED_EXTENSIONS}")

    # 2. Read file
    file_bytes = await file.read()

    # 3. Check size
    if len(file_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(400, f"File exceeds {MAX_SIZE_BYTES // 1024 // 1024}MB limit")

    if len(file_bytes) == 0:
        raise HTTPException(400, "File is empty")

    # 4. Detect TRUE MIME type from bytes (not from header — headers are spoofable)
    true_mime = _detect_true_mime(file_bytes)
    if true_mime not in ALLOWED_MIME_TYPES:
        logger.warning(
            f"User {current_user.id} uploaded file with claimed type {file.content_type} "
            f"but true type is {true_mime}"
        )
        raise HTTPException(400, f"File type not allowed. Detected: {true_mime}")

    # 5. Validate patient_id format if provided
    if patient_id:
        try:
            uuid.UUID(patient_id)
        except ValueError:
            raise HTTPException(400, "Invalid patient_id format")

    # 6. Upload to B2 tmp prefix
    doc_id = uuid.uuid4()
    safe_filename = re.sub(r"[^\w\-.]", "_", file.filename or "upload")[:100]

    try:
        tmp_key = upload_to_tmp(
            file_bytes,
            f"{doc_id}_{safe_filename}",
            true_mime,  # use detected MIME, not client-provided
        )
    except Exception as e:
        logger.error(f"B2 upload failed for doc {doc_id}: {e}")
        raise HTTPException(503, "Storage service unavailable — try again")

    # 7. Create DB record
    doc = Document(
        id=doc_id,
        owner_id=current_user.id,
        patient_id=patient_id,
        original_filename=safe_filename,
        s3_tmp_key=tmp_key,
        mime_type=true_mime,
        status=DocumentStatus.uploading,
    )
    db.add(doc)
    db.commit()

    # 8. Queue background processing
    process_document.apply_async(
        args=[str(doc_id)],
        queue="documents",
        task_id=str(doc_id),  # use doc_id as task_id for easy lookup
    )

    logger.info(f"Document {doc_id} queued for processing by user {current_user.id}")
    return DocumentUploadResponse(document_id=str(doc_id), status="processing")


@router.get("/")
def list_documents(
    status: Optional[str] = None,
    patient_id: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List documents for the current user with optional filters."""
    query = db.query(Document).filter(Document.owner_id == current_user.id)

    if status:
        query = query.filter(Document.status == status)
    if patient_id:
        try:
            uuid.UUID(patient_id)
        except ValueError:
            raise HTTPException(400, "Invalid patient_id format")
        query = query.filter(Document.patient_id == uuid.UUID(patient_id))

    total = query.count()
    docs = query.order_by(Document.uploaded_at.desc()).offset(offset).limit(limit).all()

    return {
        "documents": [
            {
                "id": str(d.id),
                "original_filename": d.original_filename,
                "status": d.status.value if d.status else None,
                "label": d.label,
                "mime_type": d.mime_type,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                "patient_id": str(d.patient_id) if d.patient_id else None,
            }
            for d in docs
        ],
        "total": total,
    }


@router.get("/{document_id}")
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single document with full details and presigned URL."""
    try:
        uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(400, "Invalid document_id")

    doc = db.query(Document).filter(
        Document.id == uuid.UUID(document_id),
        Document.owner_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(404, "Document not found")

    presigned_url = None
    if doc.status == DocumentStatus.complete and doc.s3_key:
        presigned_url = get_presigned_url(doc.s3_key)

    return {
        "id": str(doc.id),
        "owner_id": str(doc.owner_id),
        "patient_id": str(doc.patient_id) if doc.patient_id else None,
        "original_filename": doc.original_filename,
        "s3_key": doc.s3_key,
        "mime_type": doc.mime_type,
        "label": doc.label,
        "status": doc.status.value if doc.status else None,
        "extracted_data": doc.extracted_data,
        "page_count": doc.page_count,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "presigned_url": presigned_url,
    }


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(400, "Invalid document_id")

    doc = db.query(Document).filter(
        Document.id == uuid.UUID(document_id),
        Document.owner_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(404, "Document not found")

    return DocumentStatusResponse(
        document_id=document_id,
        status=doc.status.value,
        extracted_data=doc.extracted_data if doc.status == DocumentStatus.pending_review else None,
    )


@router.post("/{document_id}/confirm")
def confirm_document(
    document_id: str,
    body: DocumentConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User reviews and confirms/edits extracted data."""
    try:
        uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(400, "Invalid document_id")

    doc = db.query(Document).filter(
        Document.id == uuid.UUID(document_id),
        Document.owner_id == current_user.id,
        Document.status == DocumentStatus.pending_review,
    ).first()

    if not doc:
        raise HTTPException(404, "Document not found or not in review state")

    doc.extracted_data = body.extracted_data
    doc.label = body.label
    doc.status = DocumentStatus.complete

    try:
        patient_to_invalidate = str(doc.patient_id) if doc.patient_id else str(doc.owner_id)
        invalidate_timeline_cache(patient_to_invalidate)
    except Exception as e:
        logger.warning(f"Cache invalidation failed (non-fatal): {e}")

    db.commit()
    logger.info(f"Document {document_id} confirmed by user {current_user.id}")
    return {"status": "complete", "document_id": str(document_id), "cache_invalidated": True}


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and its B2 storage objects."""
    try:
        uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(400, "Invalid document_id")

    doc = db.query(Document).filter(
        Document.id == uuid.UUID(document_id),
        Document.owner_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(404, "Document not found")

    # Clean up B2 storage — best-effort, don't fail delete if B2 is down
    if doc.s3_key:
        try:
            delete_object(doc.s3_key)
        except Exception as e:
            logger.warning(f"Failed to delete B2 object {doc.s3_key}: {e}")

    if doc.s3_tmp_key:
        try:
            delete_object(doc.s3_tmp_key)
        except Exception as e:
            logger.warning(f"Failed to delete B2 tmp object {doc.s3_tmp_key}: {e}")

    db.delete(doc)
    db.commit()
    logger.info(f"Document {document_id} deleted by user {current_user.id}")
    return {"status": "deleted", "document_id": str(document_id)}