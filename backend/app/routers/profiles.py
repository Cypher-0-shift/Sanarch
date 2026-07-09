# app/routers/profiles.py
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from google.cloud.firestore import Client, SERVER_TIMESTAMP

from app.firestore import get_db
from app.logging_config import logger
from app.schemas.profile import (
    CreateDependentProfileRequest,
    CreatePrimaryProfileRequest,
    ProfileResponse,
)
from app.utils.qr import generate_qr_base64, generate_qr_png
from app.utils.sanarch_id import (
    build_sanarch_id,
    generate_serial,
    parse_sanarch_id,
    validate_sanarch_id,
)

router = APIRouter(prefix="/profiles", tags=["profiles"])

TEST_USER_ID = "test-user-001"

_MAX_SERIAL_RETRIES = 3

def _profile_to_response(profile_data: dict) -> ProfileResponse:
    """Convert a dictionary to a response, generating QR on the fly."""
    return ProfileResponse(
        sanarch_id=profile_data["sanarch_id"],
        family_serial=profile_data["family_serial"],
        profile_type=profile_data["profile_type"],
        member_index=profile_data["member_index"],
        country_code=profile_data["country_code"],
        reg_year=profile_data["reg_year"],
        gender_code=profile_data["gender_code"],
        age_band=profile_data["age_band"],
        primary_id=profile_data.get("primary_id"),
        created_at=profile_data.get("created_at") or datetime.now(timezone.utc),
        qr_base64=generate_qr_base64(profile_data["sanarch_id"]),
    )

@router.post("/primary", response_model=ProfileResponse, status_code=201)
def create_primary_profile(
    body: CreatePrimaryProfileRequest,
    db: Client = Depends(get_db),
):
    """
    Create a new primary profile.

    Generates a fresh 6-char family serial and builds a full SANARCH ID.
    Retries up to 3 times on serial collision.
    """
    reg_year = datetime.now(timezone.utc).year

    for attempt in range(_MAX_SERIAL_RETRIES):
        serial = generate_serial()

        # Check serial collision in DB
        existing_docs = list(
            db.collection("sanarch_profiles")
            .where("family_serial", "==", serial)
            .limit(1)
            .stream()
        )
        if existing_docs:
            logger.warning(f"Serial collision on attempt {attempt + 1}: {serial}")
            continue

        sanarch_id = build_sanarch_id(
            country=body.country_code,
            reg_year=reg_year,
            gender=body.gender,
            age=body.age,
            profile_type="P",
            member_index=0,
            family_serial=serial,
        )

        profile_data = {
            "sanarch_id": sanarch_id,
            "family_serial": serial,
            "profile_type": "P",
            "member_index": 0,
            "country_code": body.country_code.upper(),
            "reg_year": reg_year % 100,
            "gender_code": body.gender,
            "age_band": int(sanarch_id.replace("-", "")[8:10]),
            "primary_id": None,
            "created_at": SERVER_TIMESTAMP
        }

        try:
            _, new_ref = db.collection("sanarch_profiles").add(profile_data)
            profile_data["id"] = new_ref.id
            profile_data["created_at"] = datetime.now(timezone.utc)
            logger.info(f"Created primary profile {sanarch_id}")
            return _profile_to_response(profile_data)
        except Exception as e:
            logger.warning(f"Error on attempt {attempt + 1} for serial {serial}: {e}")
            continue

    raise HTTPException(
        status_code=500,
        detail="Failed to generate unique serial after max retries",
    )

@router.post("/dependent", response_model=ProfileResponse, status_code=201)
def create_dependent_profile(
    body: CreateDependentProfileRequest,
    db: Client = Depends(get_db),
):
    """
    Create a dependent profile linked to an existing primary.

    Reuses the primary's family serial and auto-increments member_index.
    """
    primary_docs = list(
        db.collection("sanarch_profiles")
        .where("sanarch_id", "==", body.primary_sanarch_id)
        .limit(1)
        .stream()
    )
    if not primary_docs:
        raise HTTPException(status_code=404, detail="primary profile not found")
        
    primary_doc = primary_docs[0]
    primary_data = primary_doc.to_dict()
    primary_id = primary_doc.id
    
    if primary_data.get("profile_type") != "P":
        raise HTTPException(
            status_code=400,
            detail="specified profile is not a primary (type 'p')",
        )

    dep_docs = list(
        db.collection("sanarch_profiles")
        .where("family_serial", "==", primary_data["family_serial"])
        .where("profile_type", "==", "D")
        .stream()
    )
    next_index = len(dep_docs) + 1

    reg_year = datetime.now(timezone.utc).year
    sanarch_id = build_sanarch_id(
        country=primary_data["country_code"],
        reg_year=reg_year,
        gender=body.gender,
        age=body.age,
        profile_type="D",
        member_index=next_index,
        family_serial=primary_data["family_serial"],
    )

    profile_data = {
        "sanarch_id": sanarch_id,
        "family_serial": primary_data["family_serial"],
        "profile_type": "D",
        "member_index": next_index,
        "country_code": primary_data["country_code"],
        "reg_year": reg_year % 100,
        "gender_code": body.gender,
        "age_band": int(sanarch_id.replace("-", "")[8:10]),
        "primary_id": primary_id,
        "created_at": SERVER_TIMESTAMP
    }

    try:
        _, new_ref = db.collection("sanarch_profiles").add(profile_data)
        profile_data["id"] = new_ref.id
        profile_data["created_at"] = datetime.now(timezone.utc)
        logger.info(f"Created dependent profile {sanarch_id} under {primary_data['sanarch_id']}")
        return _profile_to_response(profile_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"failed to create dependent profile: {e}",
        )

@router.get("/{sanarch_id}", response_model=ProfileResponse)
def get_profile(
    sanarch_id: str,
    db: Client = Depends(get_db),
):
    sanarch_id = sanarch_id.upper()

    if sanarch_id != "SAN-DEV01" and not validate_sanarch_id(sanarch_id):
        raise HTTPException(status_code=400, detail="invalid sanarch id format")

    docs = list(
        db.collection("sanarch_profiles")
        .where("sanarch_id", "==", sanarch_id)
        .limit(1)
        .stream()
    )
    if not docs:
        raise HTTPException(status_code=404, detail="profile not found")

    return _profile_to_response(docs[0].to_dict())

@router.get("/{sanarch_id}/family", response_model=list[ProfileResponse])
def get_family_profiles(
    sanarch_id: str,
    db: Client = Depends(get_db),
):
    sanarch_id = sanarch_id.upper()

    if sanarch_id == "SAN-DEV01":
        family_serial = "DEV01"
    else:
        try:
            parsed = parse_sanarch_id(sanarch_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="invalid sanarch id format")
        family_serial = parsed["family_serial"]

    docs = list(
        db.collection("sanarch_profiles")
        .where("family_serial", "==", family_serial)
        .stream()
    )

    if not docs:
        raise HTTPException(status_code=404, detail="no profiles found for this family")

    profiles = [doc.to_dict() for doc in docs]
    profiles.sort(key=lambda p: p.get("member_index", 0))

    return [_profile_to_response(p) for p in profiles]

@router.get("/{sanarch_id}/qr")
def get_profile_qr(sanarch_id: str):
    sanarch_id = sanarch_id.upper()

    if sanarch_id != "SAN-DEV01" and not validate_sanarch_id(sanarch_id):
        raise HTTPException(status_code=400, detail="invalid sanarch id format")

    png_bytes = generate_qr_png(sanarch_id)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="SANARCH-QR-{sanarch_id}.png"'},
    )
