from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.dependencies import require_role, get_current_user_token
from app.modules.patients.models import Patient
import datetime

router = APIRouter()

@router.get("/patients/lookup")
async def lookup_patient(
    phone: str = Query(..., description="Patient's verified phone number"),
    dob: datetime.date = Query(..., description="Patient's date of birth (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    staff_payload: dict = Depends(require_role(["hospital_admin", "hospital_staff"]))
):
    stmt = select(Patient).where(
        Patient.phone == phone,
        Patient.date_of_birth == dob
    )
    result = await db.execute(stmt)
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="No patient matches the provided phone and DOB")
        
    return {
        "patient_id": str(patient.id),
        "full_name": patient.full_name,
        "masked_dob": f"****-**-{patient.date_of_birth.day:02d}"
    }
