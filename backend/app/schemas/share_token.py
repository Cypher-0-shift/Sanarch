# app/schemas/share_token.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GenerateTokenRequest(BaseModel):
    event_ids: List[str]
    doctor_name: Optional[str] = None

class ShareTokenResponse(BaseModel):
    token: str
    expires_at: datetime
    qr_payload: str