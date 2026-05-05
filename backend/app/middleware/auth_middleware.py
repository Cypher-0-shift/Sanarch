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
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True)
        firebase_uid = decoded_token["uid"]
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except firebase_auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase token: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found — complete registration first")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return user