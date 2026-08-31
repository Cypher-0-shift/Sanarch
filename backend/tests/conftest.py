# tests/conftest.py
"""
Test fixtures for Sanarch API tests.
Uses Firestore (same as production) with dev-mode auth bypass.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.firestore import get_db
from app.config import settings
from google.cloud.firestore import SERVER_TIMESTAMP

# Force dev mode for tests to allow auth bypass
settings.dev_mode_enabled = True
settings.environment = "development"

TEST_USER_PHONE = "+910000000000"
TEST_USER_UID = "test-firebase-uid"


def _ensure_test_user():
    """Ensure a test user exists in Firestore for dev-mode auth bypass."""
    db = get_db()
    users = list(db.collection("users").where("phone_number", "==", TEST_USER_PHONE).limit(1).stream())
    if users:
        return users[0].id

    # Create test user
    doc_ref = db.collection("users").document()
    doc_ref.set({
        "sanarch_id": "SAN-IN25M18P00-TEST01T1",
        "phone_number": TEST_USER_PHONE,
        "firebase_uid": TEST_USER_UID,
        "full_name": "Test User",
        "is_active": True,
        "created_at": SERVER_TIMESTAMP,
    })
    return doc_ref.id


@pytest.fixture(scope="session", autouse=True)
def setup_test_user():
    """Create a test user in Firestore once per test session."""
    _ensure_test_user()
    yield


@pytest.fixture
def client():
    """FastAPI test client with dev-mode auth."""
    yield TestClient(app)


@pytest.fixture
def db():
    """Firestore client for direct database access in tests."""
    return get_db()


@pytest.fixture
def dev_headers():
    """Auth headers that trigger dev-mode bypass."""
    return {"Authorization": "Bearer dev-mode-token"}