import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.patient import Patient
from app.models.profile import SanarchProfile

def check():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for u in users:
            print(f"User: id={u.id}, sanarch_id={u.sanarch_id}")
            
        patients = db.query(Patient).all()
        for p in patients:
            print(f"Patient: id={p.id}, sanarch_id={p.sanarch_id}")
            
        profiles = db.query(SanarchProfile).all()
        for p in profiles:
            print(f"Profile: sanarch_id={p.sanarch_id}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check()
