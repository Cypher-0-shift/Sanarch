from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from app.core.database import get_db
from app.core.dependencies import get_current_patient
from app.modules.tracking.models import MedicationSchedule, MedicationLog
from app.modules.records.models import FollowUp

router = APIRouter()

class LogMedicationRequest(BaseModel):
    status: str # 'taken', 'missed', 'skipped'
    note: Optional[str] = None

@router.get("/medications")
async def get_today_medications(
    current_patient: dict = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    # Get all active medication schedules
    # Find logs for today
    today = date.today()
    
    stmt = select(MedicationLog).where(
        MedicationLog.patient_id == current_patient["id"]
    )
    # Simple bounds check for Postgres DateTime handling vs local timezone
    # Real app would use strict local time bounds
    res = await db.execute(stmt)
    logs = res.scalars().all()
    
    # Filter logs strictly mapped to today
    today_logs = [log for log in logs if log.scheduled_at.date() == today]
    
    payload = []
    for log in today_logs:
        payload.append({
            "log_id": str(log.id),
            "status": log.status,
            "scheduled_at": log.scheduled_at.isoformat(),
            "logged_at": log.logged_at.isoformat() if log.logged_at else None,
            "note": log.note
        })
        
    return payload

@router.post("/medications/{log_id}/log")
async def log_medication(
    log_id: str,
    req: LogMedicationRequest,
    current_patient: dict = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MedicationLog).where(
        MedicationLog.id == log_id,
        MedicationLog.patient_id == current_patient["id"]
    )
    res = await db.execute(stmt)
    log = res.scalars().first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Medication log not found")
        
    if req.status not in ("taken", "missed", "skipped"):
        raise HTTPException(status_code=400, detail="Invalid status")
        
    log.status = req.status
    log.logged_at = datetime.utcnow()
    log.note = req.note
    
    await db.commit()
    
    # Calculate Adherence and emit to Redis (Mocked here)
    # adherence_rate = compute_adherence(...)
    # await redis_client.set(f"adherence:{current_patient['id']}", adherence_rate)
    
    return {"message": f"Medication marked as {req.status}"}

@router.get("/followups")
async def get_upcoming_followups(
    current_patient: dict = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FollowUp).where(
        FollowUp.patient_id == current_patient["id"],
        FollowUp.scheduled_date >= date.today()
    ).order_by(FollowUp.scheduled_date.asc())
    
    res = await db.execute(stmt)
    followups = res.scalars().all()
    
    payload = []
    for f in followups:
        payload.append({
            "id": str(f.id),
            "hospital_id": str(f.hospital_id),
            "scheduled_date": f.scheduled_date.isoformat(),
            "scheduled_time": f.scheduled_time.isoformat() if f.scheduled_time else None,
            "reason": f.reason,
            "status": f.status
        })
        
    return payload
