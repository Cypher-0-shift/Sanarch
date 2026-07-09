# app/schemas/profile.py
"""
Pydantic v2 schemas for SANARCH profile endpoints.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class CreatePrimaryProfileRequest(BaseModel):
    """Request body for creating a primary (P) profile."""

    country_code: str = Field(
        ...,
        min_length=2,
        max_length=2,
        description="ISO 3166-1 alpha-2 country code, uppercase",
    )
    gender: Literal["M", "F", "X"]
    age: int = Field(..., ge=0, le=120)

    @field_validator("country_code")
    @classmethod
    def uppercase_country(cls, v: str) -> str:
        return v.upper()


class CreateDependentProfileRequest(BaseModel):
    """Request body for adding a dependent (D) under an existing primary."""

    primary_sanarch_id: str = Field(
        ..., description="The full SANARCH ID of the primary profile"
    )
    gender: Literal["M", "F", "X"]
    age: int = Field(..., ge=0, le=120)

    @field_validator("primary_sanarch_id")
    @classmethod
    def uppercase_id(cls, v: str) -> str:
        return v.upper()


class ProfileResponse(BaseModel):
    """Response schema for a SANARCH profile, always includes QR base64."""

    sanarch_id: str
    family_serial: str
    profile_type: str
    member_index: int
    country_code: str
    reg_year: int
    gender_code: str
    age_band: int
    primary_id: Optional[str] = None
    created_at: datetime
    qr_base64: str = Field(
        ...,
        description="Base64-encoded PNG of the QR code (no data-URI prefix)",
    )

    class Config:
        from_attributes = True
