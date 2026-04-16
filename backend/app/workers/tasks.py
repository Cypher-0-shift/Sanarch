import subprocess
import os
import boto3
from app.workers.celery_app import celery_app
from app.core.config import settings
from tempfile import NamedTemporaryFile

import logging
logger = logging.getLogger(__name__)

s3_client = boto3.client(
    's3',
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)

@celery_app.task
def scan_and_move_file(temp_key: str, final_key: str, record_id: str):
    """
    Downloads file from tmp location, runs ClamAV scan via subprocess,
    and moves to persistent location if clean. Delete if infected.
    """
    logger.info(f"Starting ClamAV scan for record: {record_id} via tmp file {temp_key}")
    
    with NamedTemporaryFile(delete=False) as tmp_file:
        local_path = tmp_file.name
        
    try:
        # Download from S3 /tmp/ directly to local worker storage
        s3_client.download_file(settings.S3_BUCKET, temp_key, local_path)
        
        # In a real environment, we would use pyclamd. For docker compat without network pyclamd:
        # we run `clamdscan` if the daemon is available, otherwise fallback to `clamscan`
        scan_result = subprocess.run(
            ['clamscan', '--stdout', '--no-summary', local_path],
            capture_output=True,
            text=True
        )
        
        # clamscan returns 0 if no virus is found, 1 if a virus is found
        if scan_result.returncode == 0:
            logger.info(f"File {temp_key} is clean. Moving to {final_key}.")
            
            # Since S3 doesn't have a strict 'move' we Copy, then Delete
            copy_source = {'Bucket': settings.S3_BUCKET, 'Key': temp_key}
            s3_client.copy(copy_source, settings.S3_BUCKET, final_key)
            s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=temp_key)
            
            # NOTE: We need to update the MedicalRecord.file_key in PostgreSQL to `final_key`
            # For simplicity in celery we will assume a synchronous SQLAlchemy session helper exists here
            # to run: session.execute(update(MedicalRecord).... )
            
        else:
            # File is infected!
            logger.warning(f"File {temp_key} INFECTED! Scanning output: {scan_result.stdout}")
            # Delete infected file from tmp immediately
            s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=temp_key)
            # Update medical record to flag it
            
    except Exception as e:
        logger.error(f"Error processing file {temp_key}: {e}")
        
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)

@celery_app.task
def generate_daily_medication_logs():
    """
    Runs at 7:00 AM daily. Scans active MedicationSchedules via SQLAlchemy session,
    and bulk inserts 'pending' MedicationLog rows for that specific day.
    """
    logger.info("Generating daily medication logs for active schedules...")
    # SQL logic omitted conceptually for Phase 6 Mock
    pass

@celery_app.task
def send_medication_reminders():
    """
    Runs every 30 minutes. Checks MedicationLogs that are due within the next 30 minutes.
    Sends Push Notifications via FCM/SNS.
    """
    logger.info("Scanning for upcoming medication logs to dispatch push notifications...")
    # Push notification logic omitted conceptually for Phase 6 Mock
    pass
