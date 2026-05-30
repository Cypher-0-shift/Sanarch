# app/services/firebase_auth.py
"""
Standalone Firebase token verification helper.
Used by routers that need to verify a token outside
of the get_current_user middleware (e.g. /auth/verify-firebase, /users/create).
"""
import firebase_admin
from firebase_admin import auth as firebase_auth_sdk, credentials
from app.config import settings
from app.logging_config import logger

_initialized = False

def ensure_firebase_initialized() -> None:
    global _initialized
    if _initialized or firebase_admin._apps:
        _initialized = True
        return
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
            # Fall back to file path (local development)
            cred = credentials.Certificate(
                settings.firebase_service_account_path
            )
            
        firebase_admin.initialize_app(cred, {
            "projectId": settings.firebase_project_id
        })
        _initialized = True
        logger.info("Firebase Admin SDK initialized via firebase_auth service")
    except Exception as e:
        logger.error(f"Firebase init failed: {e}")
        if settings.environment == "production":
            raise RuntimeError(f"Firebase initialization error: {e}")
        else:
            logger.warning("Continuing without Firebase (Development Mode)")

def verify_token(id_token: str) -> dict:
    """
    Verifies a Firebase ID token.
    Returns the decoded token dict on success.
    Raises ValueError with a human-readable reason on failure.
    """
    ensure_firebase_initialized()
    try:
        return firebase_auth_sdk.verify_id_token(id_token, check_revoked=True)
    except firebase_auth_sdk.RevokedIdTokenError:
        raise ValueError("Token has been revoked")
    except firebase_auth_sdk.ExpiredIdTokenError:
        raise ValueError("Token has expired")
    except firebase_auth_sdk.InvalidIdTokenError as e:
        raise ValueError(f"Invalid token: {e}")
    except Exception as e:
        raise ValueError(f"Token verification failed: {e}")