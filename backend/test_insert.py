import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.firestore import get_db
from google.cloud.firestore import SERVER_TIMESTAMP

if __name__ == "__main__":
    db = get_db()
    
    try:
        profile_data = {
            "sanarch_id": "SAN-TEST",
            "family_serial": "TEST01",
            "profile_type": "P",
            "member_index": 0,
            "country_code": "IN",
            "reg_year": 24,
            "gender_code": "X",
            "age_band": 35,
            "primary_id": None,
            "created_at": SERVER_TIMESTAMP
        }
        print("Adding to sanarch_profiles...")
        _, ref = db.collection("sanarch_profiles").add(profile_data)
        print("Success! Ref ID:", ref.id)
    except Exception as e:
        print("ERROR:", e)
