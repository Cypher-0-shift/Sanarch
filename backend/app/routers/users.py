# app/routers/users.py
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.middleware.auth_middleware import get_current_user
from app.services.sanarch_id import generate_sanarch_id
from app.logging_config import logger
from app.services.firebase_auth import verify_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

class CreateUserBody(BaseModel):
    firebase_token: str
    full_name: str
    date_of_birth: str | None = None
    height_cm: str | None = None
    weight_kg: str | None = None
    email: str | None = None
    account_type: str = "self"

@router.post("/create", response_model=UserResponse)
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

    sanarch_id = generate_sanarch_id(db)
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

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


class UpdateUserBody(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    height_cm: Optional[str] = None
    weight_kg: Optional[str] = None


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
            raise HTTPException(400, "Invalid email format")
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


@router.delete("/me")
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