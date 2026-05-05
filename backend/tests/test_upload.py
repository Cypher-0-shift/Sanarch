# tests/test_upload.py
import pytest
import io
from unittest.mock import patch, MagicMock

class TestUploadEndpoint:

    def test_upload_requires_auth(self, client):
        response = client.post(
            "/documents/upload",
            files={"file": ("test.pdf", b"fake content", "application/pdf")},
        )
        # No auth header — should be 403
        assert response.status_code == 403

    def test_upload_rejects_wrong_extension(self, client, dev_headers):
        response = client.post(
            "/documents/upload",
            headers=dev_headers,
            files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
        )
        assert response.status_code == 400
        assert "extension" in response.json()["detail"].lower()

    def test_upload_rejects_empty_file(self, client, dev_headers):
        response = client.post(
            "/documents/upload",
            headers=dev_headers,
            files={"file": ("empty.pdf", b"", "application/pdf")},
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_rejects_oversized_file(self, client, dev_headers):
        # 21MB file
        big_file = b"A" * (21 * 1024 * 1024)
        response = client.post(
            "/documents/upload",
            headers=dev_headers,
            files={"file": ("big.pdf", big_file, "application/pdf")},
        )
        assert response.status_code == 400
        assert "exceeds" in response.json()["detail"].lower()

    def test_upload_accepts_valid_pdf(self, client, dev_headers):
        # Minimal valid PDF magic bytes
        pdf_bytes = b"%PDF-1.4 fake pdf content"
        with patch("app.routers.documents._detect_true_mime", return_value="application/pdf"), \
             patch("app.routers.documents.upload_to_tmp", return_value="tmp/test.pdf"), \
             patch("app.routers.documents.process_document.apply_async"):
            response = client.post(
                "/documents/upload",
                headers=dev_headers,
                files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
            )
        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        assert data["status"] == "processing"

    def test_status_endpoint_returns_404_for_unknown_doc(self, client, dev_headers):
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.get(
            f"/documents/{fake_id}/status",
            headers=dev_headers,
        )
        assert response.status_code == 404

    def test_status_endpoint_rejects_invalid_uuid(self, client, dev_headers):
        response = client.get(
            "/documents/not-a-uuid/status",
            headers=dev_headers,
        )
        assert response.status_code == 400