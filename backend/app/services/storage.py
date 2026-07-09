# app/services/storage.py
import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.config import settings
from app.logging_config import logger

def get_b2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.b2_endpoint_url,
        aws_access_key_id=settings.b2_key_id,
        aws_secret_access_key=settings.b2_application_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",  # B2 requires a region even though it ignores it
    )

def _sanitize_filename(filename: str) -> str:
    """Remove path traversal characters and limit length."""
    # Strip path components
    filename = os.path.basename(filename)
    # Remove any non-alphanumeric except dash, underscore, dot
    import re
    filename = re.sub(r"[^\w\-.]", "_", filename)
    # Limit length
    return filename[:100]

def upload_to_tmp(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Upload to tmp/ prefix before virus scan passes.
    NOTE: Backblaze B2 does NOT support ServerSideEncryption header.
    B2 encrypts all data at rest by default — no client-side header needed.
    """
    client = get_b2_client()
    safe_filename = _sanitize_filename(filename)
    key = f"tmp/{safe_filename}"
    try:
        client.put_object(
            Bucket=settings.b2_bucket_name,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
            # NO ServerSideEncryption header — B2 does not support it
            # B2 encrypts all objects at rest automatically
        )
        logger.info(f"Uploaded to tmp: {key} ({len(file_bytes)} bytes)")
        return key
    except ClientError as e:
        logger.error(f"B2 upload failed: {e}")
        raise

def move_to_final(tmp_key: str, final_key: str) -> None:
    """Move from tmp/ to docs/ after scan passes."""
    if tmp_key == final_key:
        return
    client = get_b2_client()
    try:
        client.copy_object(
            Bucket=settings.b2_bucket_name,
            CopySource={"Bucket": settings.b2_bucket_name, "Key": tmp_key},
            Key=final_key,
        )
        client.delete_object(Bucket=settings.b2_bucket_name, Key=tmp_key)
        logger.info(f"Moved {tmp_key} → {final_key}")
    except ClientError as e:
        logger.error(f"B2 move failed: {e}")
        raise

def delete_object(key: str) -> None:
    """Delete an object from B2. Used to clean up infected files."""
    client = get_b2_client()
    try:
        client.delete_object(Bucket=settings.b2_bucket_name, Key=key)
        logger.info(f"Deleted from B2: {key}")
    except ClientError as e:
        logger.error(f"B2 delete failed for {key}: {e}")
        raise

def get_presigned_url(key: str, expires_in: int = 900) -> str:
    """Generate a time-limited presigned URL. Default 15 minutes."""
    client = get_b2_client()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.b2_bucket_name, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        logger.error(f"Presigned URL generation failed: {e}")
        raise