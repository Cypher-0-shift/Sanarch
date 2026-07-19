import uuid

class TestPatientsEndpoint:

    def test_create_patient_requires_auth(self, client):
        response = client.post("/patients/create", json={
            "full_name": "Test", "relationship_to_owner": "self"
        })
        assert response.status_code == 403

    def test_create_patient_success(self, client, dev_headers):
        response = client.post("/patients/create", headers=dev_headers, json={
            "full_name": "John Doe",
            "date_of_birth": "1990-01-15",
            "relationship_to_owner": "self"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == "John Doe"
        assert data["sanarch_id"].startswith("SAN-")
        assert len(data["sanarch_id"]) == 29

    def test_create_patient_rejects_invalid_relationship(self, client, dev_headers):
        response = client.post("/patients/create", headers=dev_headers, json={
            "full_name": "Test Patient",
            "relationship_to_owner": "enemy"  # invalid
        })
        assert response.status_code == 422

    def test_create_patient_rejects_html_in_name(self, client, dev_headers):
        response = client.post("/patients/create", headers=dev_headers, json={
            "full_name": "<script>alert('xss')</script>",
            "relationship_to_owner": "self"
        })
        assert response.status_code == 422

    def test_create_patient_rejects_short_name(self, client, dev_headers):
        response = client.post("/patients/create", headers=dev_headers, json={
            "full_name": "A",
            "relationship_to_owner": "self"
        })
        assert response.status_code == 422

    def test_get_patients_returns_list(self, client, dev_headers):
        response = client.get("/patients/", headers=dev_headers)
        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert "total" in data
        assert isinstance(data["patients"], list)

    def test_get_patient_by_id(self, client, dev_headers):
        # First create one
        create_resp = client.post("/patients/create", headers=dev_headers, json={
            "full_name": "Get Test Patient",
            "relationship_to_owner": "child"
        })
        assert create_resp.status_code == 201
        patient_id = create_resp.json()["id"]
        
        # Then fetch it
        get_resp = client.get(f"/patients/{patient_id}", headers=dev_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == patient_id

    def test_get_nonexistent_patient_returns_404(self, client, dev_headers):
        response = client.get(f"/patients/{uuid.uuid4()}", headers=dev_headers)
        assert response.status_code == 404
