# app/schemas/user.py
from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
import re

class UserCreateRequest(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    height_cm: Optional[str] = None
    weight_kg: Optional[str] = None
    email: Optional[str] = None
    account_type: str  # "self" or "patient"

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("full_name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("full_name too long")
        # Basic sanitization — no HTML/script tags
        if re.search(r"[<>\"'`]", v):
            raise ValueError("full_name contains invalid characters")
        return v

    @field_validator("account_type")
    @classmethod
    def valid_account_type(cls, v: str) -> str:
        if v not in {"self", "patient"}:
            raise ValueError("account_type must be 'self' or 'patient'")
        return v

class UserResponse(BaseModel):
    id: UUID
    sanarch_id: str
    phone_number: str
    full_name: Optional[str]
    email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True