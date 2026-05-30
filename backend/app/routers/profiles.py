# app/routers/profiles.py
"""
SANARCH profile endpoints — create, retrieve, and manage structured health IDs.

No auth yet — uses TEST_USER_ID placeholder.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.logging_config import logger
from app.models.profile import SanarchProfile
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


def _profile_to_response(profile: SanarchProfile) -> ProfileResponse:
    """Convert a DB model to a response, generating QR on the fly."""
    return ProfileResponse(
        sanarch_id=profile.sanarch_id,
        family_serial=profile.family_serial,
        profile_type=profile.profile_type,
        member_index=profile.member_index,
        country_code=profile.country_code,
        reg_year=profile.reg_year,
        gender_code=profile.gender_code,
        age_band=profile.age_band,
        primary_id=profile.primary_id,
        created_at=profile.created_at,
        qr_base64=generate_qr_base64(profile.sanarch_id),
    )


# ── POST /profiles/primary ───────────────────────────────────────────────────

@router.post("/primary", response_model=ProfileResponse, status_code=201)
def create_primary_profile(
    body: CreatePrimaryProfileRequest,
    db: Session = Depends(get_db),
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
        existing = (
            db.query(SanarchProfile)
            .filter(SanarchProfile.family_serial == serial)
            .first()
        )
        if existing:
            logger.warning(
                f"Serial collision on attempt {attempt + 1}: {serial}"
            )
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

        profile = SanarchProfile(
            sanarch_id=sanarch_id,
            family_serial=serial,
            profile_type="P",
            member_index=0,
            country_code=body.country_code.upper(),
            reg_year=reg_year % 100,
            gender_code=body.gender,
            age_band=int(sanarch_id.split("-")[4]),  # parsed from built ID
            primary_id=None,
        )

        try:
            db.add(profile)
            db.commit()
            db.refresh(profile)
            logger.info(f"Created primary profile {sanarch_id}")
            return _profile_to_response(profile)
        except IntegrityError:
            db.rollback()
            logger.warning(
                f"IntegrityError on attempt {attempt + 1} for serial {serial}"
            )
            continue

    raise HTTPException(
        status_code=500,
        detail="Failed to generate unique serial after max retries",
    )


# ── POST /profiles/dependent ─────────────────────────────────────────────────

@router.post("/dependent", response_model=ProfileResponse, status_code=201)
def create_dependent_profile(
    body: CreateDependentProfileRequest,
    db: Session = Depends(get_db),
):
    """
    Create a dependent profile linked to an existing primary.

    Reuses the primary's family serial and auto-increments member_index.
    """
    # 1. Look up primary
    primary = (
        db.query(SanarchProfile)
        .filter(SanarchProfile.sanarch_id == body.primary_sanarch_id)
        .first()
    )
    if not primary:
        raise HTTPException(status_code=404, detail="primary profile not found")
    if primary.profile_type != "P":
        raise HTTPException(
            status_code=400,
            detail="specified profile is not a primary (type 'p')",
        )

    # 2. Determine next member_index
    dep_count = (
        db.query(SanarchProfile)
        .filter(
            SanarchProfile.family_serial == primary.family_serial,
            SanarchProfile.profile_type == "D",
        )
        .count()
    )
    next_index = dep_count + 1

    # 3. Build dependent ID (reuse family serial)
    reg_year = datetime.now(timezone.utc).year
    sanarch_id = build_sanarch_id(
        country=primary.country_code,
        reg_year=reg_year,
        gender=body.gender,
        age=body.age,
        profile_type="D",
        member_index=next_index,
        family_serial=primary.family_serial,
    )

    profile = SanarchProfile(
        sanarch_id=sanarch_id,
        family_serial=primary.family_serial,
        profile_type="D",
        member_index=next_index,
        country_code=primary.country_code,
        reg_year=reg_year % 100,
        gender_code=body.gender,
        age_band=int(sanarch_id.split("-")[4]),
        primary_id=primary.id,
    )

    try:
        db.add(profile)
        db.commit()
        db.refresh(profile)
        logger.info(
            f"Created dependent profile {sanarch_id} under {primary.sanarch_id}"
        )
        return _profile_to_response(profile)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="failed to create dependent profile (possible index collision)",
        )


# ── GET /profiles/{sanarch_id} ────────────────────────────────────────────────

@router.get("/{sanarch_id}", response_model=ProfileResponse)
def get_profile(
    sanarch_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve a single profile by its SANARCH ID."""
    sanarch_id = sanarch_id.upper()

    if not validate_sanarch_id(sanarch_id):
        raise HTTPException(status_code=400, detail="invalid sanarch id format")

    profile = (
        db.query(SanarchProfile)
        .filter(SanarchProfile.sanarch_id == sanarch_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")

    return _profile_to_response(profile)


# ── GET /profiles/{sanarch_id}/family ─────────────────────────────────────────

@router.get("/{sanarch_id}/family", response_model=list[ProfileResponse])
def get_family_profiles(
    sanarch_id: str,
    db: Session = Depends(get_db),
):
    """
    Return all profiles (primary + dependents) sharing the same family serial.

    Ordered by member_index ascending.
    """
    sanarch_id = sanarch_id.upper()

    try:
        parsed = parse_sanarch_id(sanarch_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid sanarch id format")

    family_serial = parsed["family_serial"]

    profiles = (
        db.query(SanarchProfile)
        .filter(SanarchProfile.family_serial == family_serial)
        .order_by(SanarchProfile.member_index.asc())
        .all()
    )

    if not profiles:
        raise HTTPException(status_code=404, detail="no profiles found for this family")

    return [_profile_to_response(p) for p in profiles]


# ── GET /profiles/{sanarch_id}/qr ─────────────────────────────────────────────

@router.get("/{sanarch_id}/qr")
def get_profile_qr(sanarch_id: str):
    """
    Return the QR code as a raw PNG image.

    Useful for direct ``<img src="...">`` embedding without base64 overhead.
    No DB lookup needed — QR encodes the ID string only.
    """
    sanarch_id = sanarch_id.upper()

    if not validate_sanarch_id(sanarch_id):
        raise HTTPException(status_code=400, detail="invalid sanarch id format")

    png_bytes = generate_qr_png(sanarch_id)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="SANARCH-QR-{sanarch_id}.png"'},
    )
