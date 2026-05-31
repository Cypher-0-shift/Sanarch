import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.patient import Patient
from app.models.document import Document
from app.models.medical_event import MedicalEvent
from app.models.share_token import ShareToken

def check_docs():
    db = SessionLocal()
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).limit(5).all()
    print("Latest 5 documents:")
    for doc in docs:
        print(f"ID: {doc.id} | Status: {doc.status.value if doc.status else 'None'} | Date: {doc.uploaded_at}")
    db.close()

if __name__ == "__main__":
    check_docs()
