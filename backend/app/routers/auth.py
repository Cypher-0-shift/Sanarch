# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.logging_config import logger
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from app.services.firebase_auth import verify_token

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

class FirebaseTokenRequest(BaseModel):
    firebase_token: str

class AuthResponse(BaseModel):
    is_new_user: bool
    firebase_uid: str
    phone_number: str | None

@router.post("/verify-firebase", response_model=AuthResponse)
@limiter.limit("10/minute")
async def verify_firebase_token(
    request: Request,
    body: FirebaseTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Accepts a Firebase ID token from the mobile app.
    Verifies it, checks if user exists.
    Returns is_new_user=True if they need to complete registration.
    The Firebase token itself is used as the bearer token for subsequent requests.
    """
    try:
        decoded = verify_token(body.firebase_token)
    except ValueError as e:
        raise HTTPException(401, str(e))

    firebase_uid = decoded["uid"]
    phone_number = decoded.get("phone_number")

    existing_user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    is_new = existing_user is None

    logger.info(f"Auth: firebase_uid={firebase_uid}, is_new={is_new}")

    return AuthResponse(
        is_new_user=is_new,
        firebase_uid=firebase_uid,
        phone_number=phone_number,
    )