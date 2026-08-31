import datetime
from app.workers.celery_app import celery_app
from app.firestore import get_db
from app.logging_config import logger
from app.routers.documents import delete_document

@celery_app.task(name="app.workers.cleanup_task.cleanup_failed_documents")
def cleanup_failed_documents():
    """
    Scheduled task to hard-delete failed documents that are hidden from the list
    and older than 7 days, reusing the existing delete_document logic.
    """
    logger.info("Starting cleanup of old failed documents")
    db = get_db()
    # 7 days ago, UTC
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
    
    # Query failed documents. We filter hidden_from_list and date in memory to avoid needing a composite index.
    query = db.collection("documents").where("status", "==", "failed").stream()
    
    deleted_count = 0
    for d in query:
        data = d.to_dict()
        
        # Only delete if it's hidden (Phase 1 soft-delete)
        if not data.get("hidden_from_list"):
            continue
            
        updated_at = data.get("updated_at")
        if not updated_at:
            continue
            
        # Handle Firestore Datetime
        dt = updated_at
        if hasattr(updated_at, 'timestamp'):
             # It's a google.api_core.datetime_helpers.DatetimeWithNanoseconds or standard datetime
             dt = updated_at
             
        # Normalize to UTC for comparison if it's naive
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
            
        if dt < cutoff:
            logger.info(f"Cleaning up old failed document {d.id} from {dt}")
            try:
                # Mock current_user to satisfy the dependency in delete_document
                mock_user = {"id": data.get("owner_id")}
                # Call the existing logic which cleans up B2 and Firestore
                delete_document(document_id=d.id, db=db, current_user=mock_user)
                deleted_count += 1
            except Exception as e:
                logger.error(f"Failed to cleanup document {d.id}: {e}")
                
    logger.info(f"Finished cleanup. Deleted {deleted_count} documents.")
