import pytest
import uuid

@pytest.mark.asyncio
async def test_doctor_cannot_access_unshared_records(async_client, unauthorized_doctor_token):
    """
    Tests that a generic doctor token cannot blindly hit an unshared timeline or 
    unauthorized share token.
    """
    headers = {"Authorization": f"Bearer {unauthorized_doctor_token}"}
    
    # Try accessing a random share token
    response = await async_client.get(f"/api/v1/sharing/random-fake-token/records", headers=headers)
    
    # Needs to return 401 rigidly because share token is invalid
    assert response.status_code == 401
    assert response.json()["detail"] in ("Token is expired, revoked, or non-existent", "Invalid token")

@pytest.mark.asyncio
async def test_hospital_admin_cannot_lookup_without_exact_match(async_client, hospital_admin_token):
    headers = {"Authorization": f"Bearer {hospital_admin_token}"}
    
    # Try looking up without exact DOB
    response = await async_client.get("/api/v1/hospital/patients/lookup?phone=9999999999&dob=2024-01-01", headers=headers)
    
    # Assuming patient doesn't exist, it should gracefully 404, not leak partial data
    assert response.status_code == 404
    assert "No patient matches" in response.json()["detail"]
