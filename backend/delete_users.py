import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.firestore import get_db

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f"Deleting doc {doc.id} => {doc.to_dict()}")
        doc.reference.delete()
        deleted += 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

if __name__ == "__main__":
    db = get_db()
    
    print("Deleting users...")
    delete_collection(db.collection("users"), 100)
    
    print("Deleting sanarch_profiles...")
    delete_collection(db.collection("sanarch_profiles"), 100)
    
    print("All users and profiles deleted.")
