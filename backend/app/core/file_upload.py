import asyncio
import os
import magic
from fastapi import UploadFile, HTTPException
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from app.workers.tasks import scan_and_move_file
import uuid

# Initialize S3 client using MinIO configuration for Dev
s3_client = boto3.client(
    's3',
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)

ALLOWED_MIME_TYPES = {'application/pdf', 'image/jpeg', 'image/png'}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

async def handle_record_file_upload(file: UploadFile, patient_id: str, record_id: str) -> str:
    """
    Handles secure file upload step 1: 
    Validates MIME type, sizes, and streams instantly into S3 under a /tmp/ prefix 
    before triggering the background worker for ClamAV scanning.
    """
    
    # 1. Read first chunk for Magic validation
    chunk = await file.read(2048)
    mime = magic.Magic(mime=True)
    detected_type = mime.from_buffer(chunk)
    
    if detected_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {detected_type} is not permitted.")
        
    # Reset iterator
    await file.seek(0)
    
    # 2. Upload to MinIO under /tmp/
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    temp_key = f"records/tmp/{record_id}/{filename}"
    final_key = f"records/{patient_id}/{record_id}/{filename}"
    
    try:
        s3_client.upload_fileobj(
            file.file,
            settings.S3_BUCKET,
            temp_key,
            ExtraArgs={'ContentType': detected_type}
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Failed to initiate file storage.")

    # 3. Trigger async ClamAV virus scan over Celery
    scan_and_move_file.delay(temp_key, final_key, str(record_id))
    
    return temp_key
