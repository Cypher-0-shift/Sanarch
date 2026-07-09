# app/firestore.py
from firebase_admin import firestore
from app.services.firebase_auth import ensure_firebase_initialized
from google.cloud.firestore import Client

def get_db() -> Client:
    """
    Returns a Firestore database client.
    Ensures Firebase is initialized before returning.
    """
    ensure_firebase_initialized()
    return firestore.client()

def check_db_connection() -> bool:
    try:
        db = get_db()
        db.collection("users").limit(1).get()
        return True
    except Exception as e:
        import logging
        logging.error(f"Firestore connection failed: {e}")
        return False
