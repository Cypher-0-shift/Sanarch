# app/routers/users.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.middleware.auth_middleware import get_current_user
from app.utils.sanarch_id import generate_serial, build_sanarch_id
from app.logging_config import logger
from app.services.firebase_auth import verify_token
from pydantic import BaseModel, field_validator
from app.utils import sanitize_string
from typing import Optional
import threading

router = APIRouter(prefix="/users", tags=["users"])

class CreateUserBody(BaseModel):
    firebase_token: str
    full_name: str
    date_of_birth: str | None = None
    height_cm: str | None = None
    weight_kg: str | None = None
    email: str | None = None
    account_type: str = "self"

    @field_validator("full_name", "email", mode="before")
    @classmethod
    def sanitize_fields(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return sanitize_string(v)
        return v

@router.post("/create", response_model=UserResponse, status_code=201)
async def create_user(
    body: CreateUserBody,
    db: Session = Depends(get_db),
):
    """
    Called after OTP verification when is_new_user=True.
    Creates the user record and returns their Sanarch ID.
    """
    try:
        decoded = verify_token(body.firebase_token)
    except ValueError as e:
        raise HTTPException(401, str(e))

    firebase_uid = decoded["uid"]
    phone_number = decoded.get("phone_number", "")

    # Idempotent — if user already exists, return them
    existing = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if existing:
        return existing

    from datetime import datetime
    age = 35 # Default
    if body.date_of_birth:
        try:
            dob = datetime.strptime(body.date_of_birth, "%Y-%m-%d").date()
            today = datetime.now().date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except ValueError:
            pass

    sanarch_id = build_sanarch_id(
        country="IN",
        reg_year=datetime.now().year,
        gender="X", # Default
        age=age,
        profile_type="P",
        member_index=0,
        family_serial=generate_serial()
    )
    user = User(
        sanarch_id=sanarch_id,
        phone_number=phone_number,
        firebase_uid=firebase_uid,
        full_name=body.full_name.strip(),
        email=body.email,
        date_of_birth=body.date_of_birth,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Created user {user.id} with Sanarch ID {sanarch_id}")
    return user
def _warm_timeline_cache(patient_id: str):
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.routers.timeline import get_patient_timeline
        mock_user = type('U', (), {'id': patient_id})()
        get_patient_timeline(patient_id=patient_id, limit=20, offset=0, db=db, current_user=mock_user)
    except Exception as e:
        logger.warning(f"Cache warming failed: {e}")
    finally:
        db.close()

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    threading.Thread(
        target=_warm_timeline_cache,
        args=[str(current_user.id)],
        daemon=True
    ).start()
    return current_user


class UpdateUserBody(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    height_cm: Optional[str] = None
    weight_kg: Optional[str] = None

    @field_validator("full_name", "email", mode="before")
    @classmethod
    def sanitize_fields(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return sanitize_string(v)
        return v


@router.put("/me", response_model=UserResponse)
def update_me(
    body: UpdateUserBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile fields. Never allows changing phone_number, firebase_uid, or sanarch_id."""
    import re as _re

    if body.full_name is not None:
        name = body.full_name.strip()
        if not (2 <= len(name) <= 100):
            raise HTTPException(400, "full_name must be between 2 and 100 characters")
        if _re.search(r'[<>"\'`]', name):
            raise HTTPException(400, "full_name contains invalid characters")
        current_user.full_name = name

    if body.email is not None:
        email = body.email.strip()
        if "@" not in email or "." not in email:
            raise HTTPException(400, "invalid email format")
        current_user.email = email

    if body.date_of_birth is not None:
        current_user.date_of_birth = body.date_of_birth

    if body.height_cm is not None:
        current_user.height_cm = body.height_cm

    if body.weight_kg is not None:
        current_user.weight_kg = body.weight_kg

    db.commit()
    db.refresh(current_user)
    logger.info(f"User {current_user.id} profile updated")
    return current_user


@router.post("/deactivate")
def deactivate_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft-deactivate user account."""
    current_user.is_active = False
    db.commit()
    logger.info(f"User {current_user.id} account deactivated")
    return {
        "status": "deactivated",
        "message": "Account has been deactivated. Data retained for 30 days.",
    }

@router.delete("/me")
def hard_delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete user account and all associated data."""
    from app.models.document import Document
    from app.models.patient import Patient
    
    # Delete associated records to prevent foreign key constraint failures
    db.query(Document).filter(Document.owner_id == current_user.id).delete()
    db.query(Patient).filter(Patient.owner_id == current_user.id).delete()
    
    # Delete the user
    db.delete(current_user)
    db.commit()
    logger.info(f"User {current_user.id} account permanently deleted")
    return {
        "status": "deleted",
        "message": "Account and all associated data have been permanently deleted.",
    }