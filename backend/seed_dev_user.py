import os
import sys
from datetime import datetime, timezone

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.firestore import get_db
from google.cloud.firestore import SERVER_TIMESTAMP

def seed_user():
    db = get_db()
    try:
        users = db.collection("users").limit(1).stream()
        user = next(users, None)
        if user:
            u = user.to_dict()
            print(f"User already exists. ID: {user.id}, Sanarch ID: {u.get('sanarch_id')}, Phone: {u.get('phone_number')}")
            return

        print("No user found. Seeding dev user...")
        doc_ref = db.collection("users").document()
        doc_ref.set({
            "sanarch_id": "SANARCH-DEV-123",
            "phone_number": "+919999999999",
            "firebase_uid": "dev-firebase-uid-123",
            "full_name": "Developer User",
            "email": "dev@sanarch.io",
            "is_active": True,
            "created_at": SERVER_TIMESTAMP
        })
        print(f"Successfully created dev user! ID: {doc_ref.id}, Sanarch ID: SANARCH-DEV-123")
        
    except Exception as e:
        print(f"Error seeding user: {e}")

if __name__ == "__main__":
    seed_user()
