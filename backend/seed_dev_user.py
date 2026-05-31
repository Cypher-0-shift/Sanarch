import os
import sys
from datetime import datetime, timezone

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.patient import Patient
from app.models.document import Document
from app.models.medical_event import MedicalEvent

def seed_user():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if user:
            print(f"User already exists. ID: {user.id}, Sanarch ID: {user.sanarch_id}, Phone: {user.phone_number}")
            return

        print("No user found. Seeding dev user...")
        dev_user = User(
            sanarch_id="SANARCH-DEV-123",
            phone_number="+919999999999",
            firebase_uid="dev-firebase-uid-123",
            full_name="Developer User",
            email="dev@sanarch.io",
            created_at=datetime.now(timezone.utc)
        )
        db.add(dev_user)
        db.commit()
        db.refresh(dev_user)
        print(f"Successfully created dev user! ID: {dev_user.id}, Sanarch ID: {dev_user.sanarch_id}")
        
    except Exception as e:
        print(f"Error seeding user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_user()
