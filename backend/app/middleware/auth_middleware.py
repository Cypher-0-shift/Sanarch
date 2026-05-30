# app/middleware/auth_middleware.py
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.config import settings
from app.logging_config import logger
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

# Initialize Firebase Admin SDK once at module load
_firebase_initialized = False

def _init_firebase():
    global _firebase_initialized
    if not _firebase_initialized and not firebase_admin._apps:
        try:
            import os
            import base64
            import json
            
            b64 = os.environ.get("FIREBASE_SERVICE_ACCOUNT_B64", "")
            if b64:
                json_bytes = base64.b64decode(b64)
                service_account = json.loads(json_bytes)
                cred = credentials.Certificate(service_account)
            else:
                cred = credentials.Certificate(settings.firebase_service_account_path)
                
            firebase_admin.initialize_app(cred, {
                "projectId": settings.firebase_project_id
            })
            _firebase_initialized = True
            logger.info("Firebase Admin SDK initialized")
        except Exception as e:
            logger.error(f"Firebase Admin SDK initialization failed: {e}")
            if settings.environment == "production":
                raise RuntimeError(f"Cannot initialize Firebase: {e}")
            else:
                logger.warning("Continuing without Firebase (Development Mode)")

_init_firebase()

security = HTTPBearer(auto_error=True)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials

    # Dev mode bypass — ONLY in development and NEVER in production
    if (
        settings.dev_mode_enabled
        and settings.environment != "production"
        and token == "dev-mode-token"
    ):
        logger.warning("DEV MODE: bypassing authentication")
        user = db.query(User).first()
        if user:
            return user
        raise HTTPException(status_code=404, detail="No users in database for dev mode")

    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return user