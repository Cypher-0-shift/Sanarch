# app/workers/extraction_task.py
"""
Document processing pipeline Celery task.
IMPORTANT: asyncio.run() is used carefully here.
Celery workers are synchronous by default. We run async services
using asyncio.run() but ONLY after verifying no running loop exists.
"""
import asyncio

from celery.exceptions import SoftTimeLimitExceeded
from app.workers.celery_app import celery_app
from app.database import SessionLocal
# Import ALL models so SQLAlchemy can resolve all mapper relationships
from app.models.user import User  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.document import Document, DocumentStatus
from app.models.medical_event import MedicalEvent
from app.models.share_token import ShareToken  # noqa: F401
from app.services.virus_scan import scan_bytes
from app.services.extraction import extract_from_image
from app.services.storage import move_to_final, delete_object, get_b2_client
from app.config import settings
from app.logging_config import logger
from datetime import date

def run_async(coro):
    """
    Safely run an async coroutine from a sync Celery task.
    Creates a new event loop for this call — never tries to reuse one.
    """
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    name="app.workers.extraction_task.process_document",
)
def process_document(self, document_id: str) -> dict:
    logger.info(f"Processing document {document_id}")
    db = SessionLocal()
    doc = None

    try:
        # 1. Fetch document record
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found in DB")
            return {"status": "not_found"}

        if not doc.s3_tmp_key:
            logger.error(f"Document {document_id} has no tmp key — cannot process")
            doc.status = DocumentStatus.failed
            db.commit()
            return {"status": "no_tmp_key"}

        # 2. Download file from B2 tmp prefix
        client = get_b2_client()
        logger.info(f"Downloading {doc.s3_tmp_key} from B2")
        response = client.get_object(
            Bucket=settings.b2_bucket_name,
            Key=doc.s3_tmp_key
        )
        file_bytes = response["Body"].read()
        logger.info(f"Downloaded {len(file_bytes)} bytes")

        # 3. Virus scan
        doc.status = DocumentStatus.scanning
        db.commit()

        is_clean, reason = scan_bytes(file_bytes)
        if not is_clean:
            logger.warning(f"Document {document_id} INFECTED: {reason}")
            doc.status = DocumentStatus.failed
            db.commit()
            # Delete infected file — never keep it
            try:
                delete_object(doc.s3_tmp_key)
            except Exception as del_err:
                logger.error(f"Failed to delete infected file {doc.s3_tmp_key}: {del_err}")
            return {"status": "infected", "reason": reason}

        logger.info(f"Document {document_id} passed virus scan")

        # 4. Extract structured data
        doc.status = DocumentStatus.extracting
        db.commit()

        extracted = run_async(extract_from_image(file_bytes, doc.mime_type))
        doc.extracted_data = extracted
        logger.info(f"Extraction complete for {document_id}: type={extracted.get('document_type')}")

        # 5. Move to final prefix
        final_key = f"docs/{doc.owner_id}/{document_id}"
        move_to_final(doc.s3_tmp_key, final_key)
        doc.s3_key = final_key
        doc.s3_tmp_key = None

        # 6. Create MedicalEvent if patient is linked
        if doc.patient_id is None:
            logger.warning(
                f"Document {document_id} has no patient_id — skipping MedicalEvent creation."
            )
        else:
            event_date_str = extracted.get("document_date")
            try:
                event_date = date.fromisoformat(event_date_str) if event_date_str else date.today()
            except (ValueError, TypeError):
                event_date = date.today()
                logger.warning(f"Could not parse date '{event_date_str}' — using today")

            medical_event = MedicalEvent(
                patient_id=doc.patient_id,
                document_id=doc.id,
                event_date=event_date,
                hospital_name=extracted.get("hospital_name"),
                doctor_name=extracted.get("doctor_name"),
                diagnosis=extracted.get("diagnosis", []),
                medications=extracted.get("medications", []),
                lab_values=extracted.get("lab_values", []),
                summary=extracted.get("summary"),
            )
            db.add(medical_event)
            logger.info(
                f"MedicalEvent created for patient {doc.patient_id} "
                f"date={event_date} hospital={extracted.get('hospital_name')}"
            )

        # 7. Mark document as pending_review and commit everything
        doc.status = DocumentStatus.pending_review
        db.commit()
        logger.info(f"Document {document_id} processing complete — status: pending_review")

        # 8. Invalidate timeline cache
        if doc.patient_id:
            try:
                from app.routers.timeline import invalidate_timeline_cache
                invalidate_timeline_cache(str(doc.patient_id))
            except Exception as cache_err:
                logger.warning(f"Cache invalidation failed (non-fatal): {cache_err}")

        return {"status": "pending_review", "document_id": document_id}

    except SoftTimeLimitExceeded:
        logger.error(f"Document {document_id} exceeded time limit")
        if doc:
            try:
                doc.status = DocumentStatus.failed
                db.commit()
            except Exception:
                db.rollback()
        return {"status": "timeout"}

    except Exception as exc:
        logger.error(f"Document {document_id} failed: {exc}", exc_info=True)
        if doc:
            try:
                doc.status = DocumentStatus.failed
                db.commit()
            except Exception:
                db.rollback()
        raise self.retry(exc=exc, countdown=30)

    finally:
        db.close()