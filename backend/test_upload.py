import requests
import sys

BASE_URL = "http://localhost:8000"

def test_upload(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    files = {
        "file": ("test.pdf", b"%PDF-1.4\n%EOF", "application/pdf")
    }
    data = {
        "document_label": "Report",
        "pages_count": 1
    }
    print("Uploading file...")
    resp = requests.post(f"{BASE_URL}/api/v1/documents/upload", headers=headers, files=files, data=data)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_upload.py <user_id>")
        sys.exit(1)
    
    # Generate token using the logic from test_backend.py
    import test_backend
    token = test_backend.make_token(sys.argv[1])
    test_upload(token)
