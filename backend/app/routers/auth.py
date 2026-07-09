from fastapi import APIRouter, HTTPException, Depends, Request
from google.cloud.firestore import Client
from app.firestore import get_db
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

def _mask_phone(phone: str) -> str:
    if not phone or len(phone) < 6:
        return "***"
    return phone[:3] + "X" * (len(phone) - 6) + phone[-3:]

class FirebaseTokenRequest(BaseModel):
    firebase_token: str

def create_access_token(user_id: str, sanarch_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expire_minutes
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
@limiter.limit("5/minute")
async def verify_firebase_token(
    request: Request,
    body: FirebaseTokenRequest,
    db: Client = Depends(get_db),
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

    users_ref = db.collection("users")
    query = users_ref.where("firebase_uid", "==", firebase_uid).limit(1).stream()
    existing_user_doc = next(query, None)
    
    is_new = existing_user_doc is None

    masked_phone = _mask_phone(phone_number) if phone_number else "none"
    logger.info(f"Auth: new_user={is_new}, phone={masked_phone}")

    if is_new:
        return {
            "is_new_user": True,
            "firebase_token": body.firebase_token
        }
    else:
        user_data = existing_user_doc.to_dict()
        user_id = existing_user_doc.id
        user_data["id"] = user_id
        
        access_token = create_access_token(user_id, user_data.get("sanarch_id", ""))
        return {
            "is_new_user": False,
            "firebase_uid": firebase_uid,
            "phone_number": phone_number,
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }