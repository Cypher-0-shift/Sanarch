import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.firestore import get_db
from app.utils.sanarch_id import parse_sanarch_id
from google.cloud.firestore import SERVER_TIMESTAMP

if __name__ == "__main__":
    db = get_db()
    users = list(db.collection("users").stream())
    
    for u in users:
        data = u.to_dict()
        sanarch_id = data.get("sanarch_id")
        if sanarch_id:
            print(f"Creating profile for {sanarch_id}")
            try:
                parsed = parse_sanarch_id(sanarch_id)
                profile_data = {
                    "sanarch_id": sanarch_id,
                    "family_serial": parsed["family_serial"],
                    "profile_type": parsed["profile_type"],
                    "member_index": int(parsed["member_index"]),
                    "country_code": parsed["country"],
                    "reg_year": int(parsed["reg_year"]),
                    "gender_code": parsed["gender"],
                    "age_band": int(parsed["age_band"]),
                    "primary_id": None,
                    "created_at": SERVER_TIMESTAMP
                }
                db.collection("sanarch_profiles").add(profile_data)
                print("Successfully added profile for", sanarch_id)
            except Exception as e:
                print("Failed to add profile for", sanarch_id, ":", e)
