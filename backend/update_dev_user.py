import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.patient import Patient
from app.models.document import Document
from app.utils.sanarch_id import build_sanarch_id
from app.routers.auth import create_access_token

def update():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.sanarch_id == "SANARCH-DEV-123").first()
        if not user:
            user = db.query(User).filter(User.email == "dev@sanarch.io").first()
            if not user:
                print("User not found!")
                return
        
        # Build a perfectly valid SANARCH ID
        valid_id = build_sanarch_id(
            country="IN",
            reg_year=26,
            gender="M",
            age=30,
            profile_type="P",
            member_index=0
        )
        
        user.sanarch_id = valid_id
        db.commit()
        db.refresh(user)
        
        token = create_access_token(str(user.id), user.sanarch_id)
        print(f"VALID_ID={valid_id}")
        print(f"JWT={token}")
    finally:
        db.close()

if __name__ == "__main__":
    update()
