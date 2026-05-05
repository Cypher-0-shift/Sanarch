import uuid

class TestSharingEndpoint:

    def test_generate_token_requires_auth(self, client):
        response = client.post("/sharing/generate-token", json={
            "event_ids": ["some-id"]
        })
        assert response.status_code == 403

    def test_generate_token_rejects_empty_event_ids(self, client, dev_headers):
        response = client.post("/sharing/generate-token", headers=dev_headers, json={
            "event_ids": []
        })
        assert response.status_code == 400

    def test_generate_token_success(self, client, dev_headers):
        response = client.post("/sharing/generate-token", headers=dev_headers, json={
            "event_ids": [str(uuid.uuid4())],
            "doctor_name": "Dr. Test"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "expires_at" in data
        assert data["qr_payload"].startswith("sanarch://share/")

    def test_access_invalid_token_returns_404(self, client):
        response = client.get("/sharing/access/completely-fake-token-that-does-not-exist")
        assert response.status_code == 404

    def test_revoke_token_requires_auth(self, client):
        response = client.post("/sharing/revoke/sometoken")
        assert response.status_code == 403
