# app/routers/users.py
from fastapi import APIRouter, HTTPException, Depends
from google.cloud.firestore import Client, SERVER_TIMESTAMP
from app.firestore import get_db
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
    db: Client = Depends(get_db),
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
    users_ref = db.collection("users")
    query = users_ref.where("firebase_uid", "==", firebase_uid).limit(1).stream()
    existing_doc = next(query, None)
    if existing_doc:
        data = existing_doc.to_dict()
        data["id"] = existing_doc.id
        
        # Auto-create profile if it doesn't exist (backward compatibility)
        if "sanarch_id" in data:
            profile_query = db.collection("sanarch_profiles").where("sanarch_id", "==", data["sanarch_id"]).limit(1).stream()
            if not next(profile_query, None):
                from app.utils.sanarch_id import parse_sanarch_id
                try:
                    if data["sanarch_id"] == "SAN-DEV01":
                        profile_data = {
                            "sanarch_id": "SAN-DEV01",
                            "family_serial": "DEV01",
                            "profile_type": "P",
                            "member_index": 0,
                            "country_code": "IN",
                            "reg_year": 24,
                            "gender_code": "X",
                            "age_band": 35,
                            "primary_id": None,
                            "created_at": SERVER_TIMESTAMP
                        }
                    else:
                        parsed = parse_sanarch_id(data["sanarch_id"])
                        profile_data = {
                            "sanarch_id": data["sanarch_id"],
                            "family_serial": parsed["family_serial"],
                            "profile_type": parsed["profile_type"],
                            "member_index": int(parsed["member_index"]),
                            "country_code": parsed["country"],
                            "reg_year": int(parsed["reg_year"]),
                            "gender_code": parsed["gender"],
                            "age_band": int(parsed["age_band"]),
                            "primary_id": None,
                            "created_at": SERVER_TIMESTAMP
                        }
                    db.collection("sanarch_profiles").add(profile_data)
                    logger.info(f"Auto-created missing profile for {data['sanarch_id']}")
                except Exception as e:
                    logger.error(f"Failed to auto-create profile for {data['sanarch_id']}: {e}")
        
        return data

    from datetime import datetime
    age = 35 # Default
    if body.date_of_birth:
        try:
            dob = datetime.strptime(body.date_of_birth, "%Y-%m-%d").date()
            today = datetime.now().date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except ValueError:
            pass

    family_serial = generate_serial()
    sanarch_id = build_sanarch_id(
        country="IN",
        reg_year=datetime.now().year,
        gender="X", # Default
        age=age,
        profile_type="P",
        member_index=0,
        family_serial=family_serial
    )
    
    user_data = {
        "sanarch_id": sanarch_id,
        "phone_number": phone_number,
        "firebase_uid": firebase_uid,
        "full_name": body.full_name.strip(),
        "email": body.email,
        "date_of_birth": body.date_of_birth,
        "height_cm": body.height_cm,
        "weight_kg": body.weight_kg,
        "is_active": True,
        "created_at": SERVER_TIMESTAMP
    }
    
    _, new_ref = users_ref.add(user_data)
    user_data["id"] = new_ref.id
    # Add an approximate created_at for the response since SERVER_TIMESTAMP hasn't resolved
    user_data["created_at"] = datetime.now() 
    
    # Also create the sanarch_profiles record
    profile_data = {
        "sanarch_id": sanarch_id,
        "family_serial": family_serial,
        "profile_type": "P",
        "member_index": 0,
        "country_code": "IN",
        "reg_year": datetime.now().year % 100,
        "gender_code": "X",
        "age_band": int(sanarch_id.replace("-", "")[8:10]),
        "primary_id": None,
        "created_at": SERVER_TIMESTAMP
    }
    db.collection("sanarch_profiles").add(profile_data)
    
    logger.info(f"Created user {new_ref.id} with Sanarch ID {sanarch_id}")
    return user_data

def _warm_timeline_cache(patient_id: str):
    from app.firestore import get_db
    db = get_db()
    try:
        from app.routers.timeline import get_patient_timeline
        mock_user = {"id": patient_id}
        get_patient_timeline(patient_id=patient_id, limit=20, offset=0, db=db, current_user=mock_user)
    except Exception as e:
        logger.warning(f"Cache warming failed: {e}")

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    # Auto-create profile if missing (backward compatibility)
    if "sanarch_id" in current_user:
        profile_query = db.collection("sanarch_profiles").where("sanarch_id", "==", current_user["sanarch_id"]).limit(1).stream()
        if not next(profile_query, None):
            from app.utils.sanarch_id import parse_sanarch_id
            try:
                if current_user["sanarch_id"] == "SAN-DEV01":
                    profile_data = {
                        "sanarch_id": "SAN-DEV01",
                        "family_serial": "DEV01",
                        "profile_type": "P",
                        "member_index": 0,
                        "country_code": "IN",
                        "reg_year": 24,
                        "gender_code": "X",
                        "age_band": 35,
                        "primary_id": None,
                        "created_at": SERVER_TIMESTAMP
                    }
                else:
                    parsed = parse_sanarch_id(current_user["sanarch_id"])
                    profile_data = {
                        "sanarch_id": current_user["sanarch_id"],
                        "family_serial": parsed["family_serial"],
                        "profile_type": parsed["profile_type"],
                        "member_index": int(parsed["member_index"]),
                        "country_code": parsed["country"],
                        "reg_year": int(parsed["reg_year"]),
                        "gender_code": parsed["gender"],
                        "age_band": int(parsed["age_band"]),
                        "primary_id": None,
                        "created_at": SERVER_TIMESTAMP
                    }
                db.collection("sanarch_profiles").add(profile_data)
                logger.info(f"Auto-created missing profile for {current_user['sanarch_id']} in get_me")
            except Exception as e:
                logger.error(f"Failed to auto-create profile for {current_user['sanarch_id']} in get_me: {e}")

    threading.Thread(
        target=_warm_timeline_cache,
        args=[current_user["id"]],
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
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Update profile fields. Never allows changing phone_number, firebase_uid, or sanarch_id."""
    import re as _re

    updates = {}
    if body.full_name is not None:
        name = body.full_name.strip()
        if not (2 <= len(name) <= 100):
            raise HTTPException(400, "full_name must be between 2 and 100 characters")
        if _re.search(r'[<>"\'`]', name):
            raise HTTPException(400, "full_name contains invalid characters")
        updates["full_name"] = name
        current_user["full_name"] = name

    if body.email is not None:
        email = body.email.strip()
        if "@" not in email or "." not in email:
            raise HTTPException(400, "invalid email format")
        updates["email"] = email
        current_user["email"] = email

    if body.date_of_birth is not None:
        updates["date_of_birth"] = body.date_of_birth
        current_user["date_of_birth"] = body.date_of_birth

    if body.height_cm is not None:
        updates["height_cm"] = body.height_cm
        current_user["height_cm"] = body.height_cm

    if body.weight_kg is not None:
        updates["weight_kg"] = body.weight_kg
        current_user["weight_kg"] = body.weight_kg

    if updates:
        db.collection("users").document(current_user["id"]).update(updates)

    logger.info(f"User {current_user['id']} profile updated")
    return current_user


@router.post("/deactivate")
def deactivate_me(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Soft-deactivate user account."""
    db.collection("users").document(current_user["id"]).update({"is_active": False})
    logger.info(f"User {current_user['id']} account deactivated")
    return {
        "status": "deactivated",
        "message": "Account has been deactivated. Data retained for 30 days.",
    }

@router.delete("/me")
def hard_delete_me(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Permanently delete user account and all associated data."""
    user_id = current_user["id"]
    
    # Delete associated documents
    docs = db.collection("documents").where("owner_id", "==", user_id).stream()
    for doc in docs:
        doc.reference.delete()
        
    # Delete associated patients
    patients = db.collection("patients").where("owner_id", "==", user_id).stream()
    for patient in patients:
        patient.reference.delete()
        
    # Delete the user
    db.collection("users").document(user_id).delete()
    
    logger.info(f"User {user_id} account permanently deleted")
    return {
        "status": "deleted",
        "message": "Account and all associated data have been permanently deleted.",
    }