# app/middleware/auth_middleware.py
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.cloud.firestore import Client
from app.firestore import get_db
from app.config import settings
from app.logging_config import logger

security = HTTPBearer(auto_error=True)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
) -> dict:
    token = credentials.credentials

    if token == "dev-mode-token" and settings.environment == "development":
        return {"id": "dev-user-id", "is_active": True, "full_name": "Dev User"}

    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError as e:
        if "expired" in str(e).lower():
            logger.info("Expired token rejected")
        else:
            logger.warning(f"Invalid token rejected: {type(e).__name__}")
        raise HTTPException(status_code=401, detail="invalid or expired token")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

    doc_ref = db.collection("users").document(user_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = doc_snap.to_dict()
    user_data["id"] = doc_snap.id
    
    if not user_data.get("is_active", True):
        raise HTTPException(status_code=401, detail="account is deactivated")

    return user_data