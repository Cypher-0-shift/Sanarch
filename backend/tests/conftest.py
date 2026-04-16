import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

# Mocking JWT dependencies for boundary tests
@pytest.fixture
def hospital_admin_token():
    from app.core.security import create_access_token
    import uuid
    # Mock some UUID as sub
    return create_access_token(sub=str(uuid.uuid4()), role="hospital_admin")

@pytest.fixture
def unauthorized_doctor_token():
    from app.core.security import create_access_token
    import uuid
    return create_access_token(sub=str(uuid.uuid4()), role="doctor")
