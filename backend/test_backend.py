"""
Quick backend API test script.
Generates a valid JWT and tests all critical endpoints.
"""
import requests
import json
import sys
import os
from datetime import datetime, timezone, timedelta
from jose import jwt

# ── Config ──────────────────────────────────────────────────────────────────
BASE = "http://localhost:8000"
JWT_SECRET = "0f7cb1867fca2cc70b98bccea31ac7319ff204da552c1c6db6d3694a240d4cbcfe453c75baccdb4bf0d917e6d0494ebefe7e06dda6423b822bcd5a659d1353b4"
JWT_ALGO = "HS256"

def make_token(user_id: str, sanarch_id: str = "TEST-001") -> str:
    payload = {
        "sub": user_id,
        "sanarch_id": sanarch_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def header(token: str):
    return {"Authorization": f"Bearer {token}"}

def test(name: str, method: str, url: str, token: str = None, **kwargs):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"  {method} {url}")
    try:
        headers = header(token) if token else {}
        headers.update(kwargs.pop("headers", {}))
        resp = getattr(requests, method.lower())(url, headers=headers, timeout=15, **kwargs)
        print(f"  Status: {resp.status_code}")
        try:
            data = resp.json()
            print(f"  Body: {json.dumps(data, indent=2, default=str)[:500]}")
        except:
            print(f"  Body: {resp.text[:300]}")
        return resp
    except requests.exceptions.ConnectionError:
        print("  ❌ Connection refused — is the backend running?")
        return None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def main():
    # 1. Health check
    r = test("Health Check", "GET", f"{BASE}/health")
    if not r or r.status_code != 200:
        print("\n⚠️  Backend is not reachable. Exiting.")
        sys.exit(1)
    
    # 2. List users — we need a real user ID to test authenticated endpoints
    #    Let's first try with a fake user to see what happens
    fake_token = make_token("fake-user-999")
    
    # 3. Test /users/me with fake token (should 404)
    test("GET /users/me (fake user)", "GET", f"{BASE}/users/me", fake_token)
    
    # 4. Test timeline with fake user (should 404 or empty)
    test("GET /timeline (fake user)", "GET", f"{BASE}/timeline/fake-user-999?limit=3&offset=0", fake_token)
    
    # 5. List docs
    test("GET /api/v1/documents (fake user)", "GET", f"{BASE}/api/v1/documents", fake_token)
    
    # Now let's try to find a real user. 
    # We can check the /users/me endpoint with a known pattern.
    # For now, let's see if there's a way to list users via the API.
    
    # 6. Test OpenAPI docs reachable
    test("OpenAPI docs", "GET", f"{BASE}/docs")
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print("="*60)
    print("""
To test with a REAL user:
  1. Get your user_id from Firestore console
  2. Run: python test_backend.py <user_id>
  
The timeline 500 fix will show as either:
  - 404 (fake user) — auth working, user not found
  - 200 with empty events — working correctly!
  - 500 — fix not applied (container needs rebuild)
""")

    # If user_id provided as arg, test with real user
    if len(sys.argv) > 1:
        real_user_id = sys.argv[1]
        real_token = make_token(real_user_id)
        print(f"\n🔑 Testing with real user: {real_user_id}")
        
        test("GET /users/me (real user)", "GET", f"{BASE}/users/me", real_token)
        test("GET /timeline (real user)", "GET", f"{BASE}/timeline/{real_user_id}?limit=3&offset=0", real_token)
        test("GET /documents (real user)", "GET", f"{BASE}/api/v1/documents", real_token)

if __name__ == "__main__":
    main()
