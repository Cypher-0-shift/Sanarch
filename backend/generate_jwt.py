import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.patient import Patient
from app.models.document import Document
from app.routers.auth import create_access_token

def generate():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.sanarch_id == "SANARCH-DEV-123").first()
        if not user:
            print("User not found!")
            return
            
        token = create_access_token(str(user.id), user.sanarch_id)
        print(f"Generated JWT:\n{token}")
    finally:
        db.close()

if __name__ == "__main__":
    generate()
