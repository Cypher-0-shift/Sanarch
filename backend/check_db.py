import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.firestore import get_db

if __name__ == "__main__":
    db = get_db()
    
    print("--- USERS ---")
    users = db.collection("users").stream()
    for u in users:
        print(u.id, u.to_dict())
        
    print("\n--- SANARCH PROFILES ---")
    profiles = db.collection("sanarch_profiles").stream()
    for p in profiles:
        print(p.id, p.to_dict())
