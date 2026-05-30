from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.logging_config import logger
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from app.services.firebase_auth import verify_token
from app.config import settings
from datetime import datetime, timezone, timedelta
from jose import jwt

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

class FirebaseTokenRequest(BaseModel):
    firebase_token: str

def create_access_token(user_id: str, sanarch_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": user_id,
        "sanarch_id": sanarch_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret_key,
                      algorithm=settings.jwt_algorithm)

@router.post("/verify-firebase")
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
    If returning user, issues SANARCH access token.
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

    if is_new:
        return {
            "is_new_user": True,
            "firebase_token": body.firebase_token
        }
    else:
        access_token = create_access_token(str(existing_user.id), existing_user.sanarch_id)
        return {
            "is_new_user": False,
            "firebase_uid": firebase_uid,
            "phone_number": phone_number,
            "access_token": access_token,
            "token_type": "bearer",
            "user": existing_user
        }