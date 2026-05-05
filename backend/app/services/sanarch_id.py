# app/services/sanarch_id.py
import random
import string
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.patient import Patient

def generate_sanarch_id(db: Session, prefix: str = "SAN") -> str:
    """
    Generates a unique Sanarch ID in the format SAN-XXXXXX.
    Retries up to 10 times to avoid collision (astronomically unlikely).
    """
    for _ in range(10):
        suffix = ''.join(random.choices(string.digits, k=6))
        candidate = f"{prefix}-{suffix}"
        # Check uniqueness across both users and patients
        user_exists = db.query(User).filter(User.sanarch_id == candidate).first()
        patient_exists = db.query(Patient).filter(Patient.sanarch_id == candidate).first()
        if not user_exists and not patient_exists:
            return candidate
    raise RuntimeError("Failed to generate unique Sanarch ID after 10 attempts")