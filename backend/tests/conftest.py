# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, String
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.user import User
import uuid
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.config import settings

# ---------- SQLite ↔ PostgreSQL UUID compatibility ----------
# The models use sqlalchemy.dialects.postgresql.UUID(as_uuid=True).
# That type's bind processor calls value.hex, which expects a real
# uuid.UUID object.  On SQLite there is no native UUID column type,
# so we compile PG_UUID → CHAR(32) and let SQLAlchemy's processor
# transparently convert UUID ↔ 32-char hex string.
from sqlalchemy.ext.compiler import compiles

@compiles(PG_UUID, "sqlite")
def compile_pg_uuid_for_sqlite(type_, compiler, **kw):
    return "CHAR(32)"

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Force dev mode for tests to allow auth bypass
settings.dev_mode_enabled = True
settings.environment = "development"

# Use SQLite in-memory for tests — no PostgreSQL needed
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    db = TestingSessionLocal()
    yield db
    db.close()

@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = override_get_db
    # Create a test user for dev mode
    test_user = db.query(User).filter(User.phone_number == "+910000000000").first()
    if not test_user:
        test_user = User(
            id=uuid.uuid4(),
            sanarch_id="SAN-000001",
            phone_number="+910000000000",
            firebase_uid="test-firebase-uid",
            full_name="Test User",
            is_active=True,
        )
        db.add(test_user)
        db.commit()
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def dev_headers():
    return {"Authorization": "Bearer dev-mode-token"}