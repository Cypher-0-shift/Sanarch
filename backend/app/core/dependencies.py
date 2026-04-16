from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_token
from app.modules.patients.models import Patient
import uuid

security = HTTPBearer()

def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def require_role(roles: list[str]):
    def role_checker(payload: dict = Depends(get_current_user_token)):
        if payload.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return payload
    return role_checker

async def get_current_patient(
    payload: dict = Depends(require_role(["patient"])),
    db: AsyncSession = Depends(get_db)
) -> Patient:
    patient_id = payload.get("sub")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    
    # Query patient from DB or return Mock (omitted db query for now)
    # Since we are setting up, just returning payload ID
    # A real implementation would: db.get(Patient, uuid.UUID(patient_id))
    return {"id": patient_id, "role": "patient"}

# Additional dependencies for hospital staff and doctors will be implemented here
