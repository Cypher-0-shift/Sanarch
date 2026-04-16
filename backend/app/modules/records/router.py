from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import json
import uuid
from datetime import date

from app.core.database import get_db
from app.core.dependencies import require_role
from app.modules.records.models import MedicalRecord, LabResult, Prescription, PrescriptionItem, DischargeSummary, FollowUp
from app.core.redis import redis_client

router = APIRouter()

from app.core.file_upload import handle_record_file_upload

# ---
# Helper function: Invalidates patient timeline cache when a new record is uploaded
# ---
async def invalidate_timeline_cache(patient_id: str):
    # Retrieve all keys matching the patient pattern (we'll implement this strictly in prod)
    # Using async redis pattern scan:
    cursor = b'0'
    while cursor:
        cursor, keys = await redis_client.scan(cursor=cursor, match=f"timeline:{patient_id}:*")
        if keys:
            await redis_client.delete(*keys)

@router.post("/lab")
async def upload_lab_result(
    # Real implementation would use Pydantic schemas or Form inputs heavily
    patient_id: str = Form(...),
    record_date: date = Form(...),
    title: Optional[str] = Form(None),
    test_parameters_json: str = Form(...),  # stringified JSON
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    staff_payload: dict = Depends(require_role(["hospital_admin", "hospital_staff"]))
):
    hospital_id = staff_payload.get("hospital_id") # Note: we'd parse this fully in real setup
    # For Phase 3 implementation, we mock the hospital ID extraction
    staff_id = staff_payload.get("sub")
    
    # 1. Verify patient exists (omitted for brevity)
    
    # 2. Create the core medical record
    record = MedicalRecord(
        patient_id=patient_id,
        hospital_id=uuid.uuid4(), # Mocked hospital ID
        uploaded_by=staff_id,
        record_type="lab_result",
        record_date=record_date,
        title=title or "Lab Result"
    )
    db.add(record)
    await db.flush() # To get the record.id
    
    # 3. Create lab result detailed items
    params = json.loads(test_parameters_json)
    for p in params:
        lab_result = LabResult(
            record_id=record.id,
            patient_id=patient_id,
            test_name=p["test_name"],
            result_value=p.get("result_value"),
            unit=p.get("unit"),
            reference_min=p.get("reference_min"),
            reference_max=p.get("reference_max"),
            test_date=record_date
        )
        db.add(lab_result)
        
    # 4. Handle file if exists (integrates via Phase 4 pipeline)
    if file:
        temp_key = await handle_record_file_upload(file, patient_id, str(record.id))
        record.file_key = temp_key
        
    await db.commit()
    await invalidate_timeline_cache(str(patient_id))
    
    return {"message": "Lab result uploaded successfully", "record_id": str(record.id)}

# Endpoints for /prescription, /discharge, /followup follow similar architecture...
