from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import uuid
import uuid

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, generate_otp, verify_password
from app.core.redis import set_otp, get_otp, delete_otp
from app.modules.patients.models import Patient
from app.modules.hospitals.models import HospitalStaff
from app.modules.doctors.models import Doctor

router = APIRouter()

class RegisterPatientRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    full_name: str
    date_of_birth: str

class HospitalLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register/patient")
async def register_patient(req: RegisterPatientRequest):
    # In production, we'd integrate Twilio/FCM SMS here.
    otp = generate_otp()
    await set_otp(req.phone, otp)
    # mock SMS send: print(f"Sending OTP {otp} to {req.phone}")
    return {"message": "OTP sent successfully. Valid for 5 minutes.", "mock_otp": otp}

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    cached_otp = await get_otp(req.phone)
    if not cached_otp or cached_otp != req.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
    
    # Check if patient exists
    stmt = select(Patient).where(Patient.phone == req.phone)
    result = await db.execute(stmt)
    patient = result.scalars().first()
    
    if not patient:
        # Create new patient
        patient = Patient(
            phone=req.phone,
            phone_verified=True,
            full_name=req.full_name,
            date_of_birth=req.date_of_birth
        )
        db.add(patient)
        await db.commit()
        await db.refresh(patient)
    
    await delete_otp(req.phone)
    
    access_token = create_access_token(subject=str(patient.id), role="patient")
    refresh_token = create_refresh_token(subject=str(patient.id))
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer",
        "patient_id": patient.id
    }

@router.post("/hospital/login")
async def hospital_login(req: HospitalLoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(HospitalStaff).where(HospitalStaff.email == req.email)
    result = await db.execute(stmt)
    staff = result.scalars().first()
    
    if not staff or not verify_password(req.password, staff.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    access_token = create_access_token(subject=str(staff.id), role=staff.role)
    return {"access_token": access_token, "token_type": "bearer"}
