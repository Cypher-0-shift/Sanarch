import os
from google.cloud import firestore

def check_doc(doc_id):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "firebase-service-account.json"
    db = firestore.Client()
    doc = db.collection("documents").document(doc_id).get()
    if doc.exists:
        data = doc.to_dict()
        print(f"Document {doc_id}:")
        print(f"  b2_file_id: {data.get('b2_file_id')}")
        print(f"  owner_id: {data.get('owner_id')}")
        print(f"  file_name: {data.get('file_name')}")
    else:
        print("Document not found")

if __name__ == "__main__":
    import sys
    check_doc("AMNZJoJiQrBOqQLRxSef")
