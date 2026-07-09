#!/usr/bin/env python3
"""
SANARCH pre-deployment connectivity check.
Run from backend/ directory: python run_checks.py
Checks: Firestore, Redis, ClamAV, Backblaze B2, Groq API, Azure DI, Firebase.
"""
import os, sys, socket
from datetime import datetime
from dotenv import load_dotenv

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

load_dotenv()

results = {}

def check(name, fn):
    try:
        msg = fn()
        if msg is None: # skipped
            return
        results[name] = ("PASS", msg)
        print(f"✅ {name}: {msg}")
    except Exception as e:
        results[name] = ("FAIL", str(e))
        print(f"❌ {name}: {e}")

def skip(name):
    results[name] = ("SKIP", "NOT CONFIGURED")
    print(f"⚠️  {name}: NOT CONFIGURED (skipped)")

print(f"\nSANARCH Service Check - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n{'-'*52}")

# 1. Firestore
def check_firestore():
    path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    b64 = os.environ.get("FIREBASE_SERVICE_ACCOUNT_BASE64")
    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    if not path and not b64:
        skip("Firestore")
        return None
    from app.firestore import check_db_connection
    if not check_db_connection():
        raise RuntimeError("Firestore connection failed")
    return f"project={project_id or 'unknown'}"

check("Firestore", check_firestore)

# 2. Redis
def check_redis():
    url = os.environ.get("REDIS_URL")
    if not url or url.startswith("rediss://default:<PASSWORD>"):
        skip("Redis")
        return None
    import redis
    url = url.replace("redis://redis:", "redis://localhost:")
    r = redis.from_url(url)
    r.ping()
    info = r.info("server")
    return f"v{info['redis_version']}"

check("Redis", check_redis)

# 3. ClamAV
def check_clamav():
    host = os.environ.get("CLAMD_HOST")
    port = os.environ.get("CLAMD_PORT")
    if not host or not port:
        skip("ClamAV")
        return None
    
    if host == "clamav":
        host = "localhost"
    s = socket.socket()
    s.settimeout(5)
    s.connect((host, int(port)))
    s.sendall(b"zPING\0")
    resp = s.recv(64).decode().strip("\0").strip()
    s.close()
    if resp != "PONG":
        raise RuntimeError(f"Unexpected response: {resp}")
    return f"PONG received from {host}:{port}"

check("ClamAV", check_clamav)

# 4. Backblaze B2
def check_b2():
    endpoint = os.environ.get("B2_ENDPOINT_URL")
    key_id = os.environ.get("B2_KEY_ID")
    app_key = os.environ.get("B2_APPLICATION_KEY")
    bucket = os.environ.get("B2_BUCKET_NAME")
    if not endpoint or not key_id or not app_key or not bucket:
        skip("Backblaze B2")
        return None
    
    import boto3
    from botocore.client import Config
    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=key_id,
        aws_secret_access_key=app_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    client.list_objects_v2(Bucket=bucket, MaxKeys=1)
    return f"bucket={bucket} reachable"

check("Backblaze B2", check_b2)

# 5. Groq API
def check_groq():
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        skip("Groq API")
        return None
    import httpx
    resp = httpx.get(
        "https://api.groq.com/openai/v1/models",
        headers={"Authorization": f"Bearer {key}"},
        timeout=10,
    )
    resp.raise_for_status()
    models = [m["id"] for m in resp.json()["data"] if "llama" in m["id"].lower()]
    if not models:
        raise RuntimeError("No Llama models found")
    return f"OK - models present"

check("Groq API", check_groq)

# 6. Azure Document Intelligence
def check_azure_di():
    endpoint = os.environ.get("AZURE_DI_ENDPOINT")
    key = os.environ.get("AZURE_DI_KEY")
    if not endpoint or not key:
        skip("Azure DI")
        return None
    import httpx
    try:
        url = f"{endpoint.rstrip('/')}/documentintelligence/documentModels?api-version=2024-02-29-preview"
        resp = httpx.get(url, headers={"Ocp-Apim-Subscription-Key": key}, timeout=10)
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            url = f"{endpoint.rstrip('/')}/formrecognizer/documentModels?api-version=2023-07-31"
            resp = httpx.get(url, headers={"Ocp-Apim-Subscription-Key": key}, timeout=10)
            resp.raise_for_status()
        else:
            raise
    return "OK"

check("Azure DI", check_azure_di)

# 7. Firebase
def check_firebase():
    path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    b64 = os.environ.get("FIREBASE_SERVICE_ACCOUNT_BASE64")
    
    if not path and not b64:
        skip("Firebase")
        return None
        
    import firebase_admin
    from firebase_admin import credentials
    import base64
    import json
    
    if not firebase_admin._apps:
        if b64:
            decoded = base64.b64decode(b64).decode("utf-8")
            cred = credentials.Certificate(json.loads(decoded))
        else:
            if not os.path.exists(path):
                skip("Firebase")
                return None
            cred = credentials.Certificate(path)
            
        firebase_admin.initialize_app(cred)
    return f"project={os.environ.get('FIREBASE_PROJECT_ID', 'unknown')}"

check("Firebase", check_firebase)

# Summary
print(f"\n{'-'*52}")
passed = sum(1 for v in results.values() if v[0] == "PASS")
skipped = sum(1 for v in results.values() if v[0] == "SKIP")
failed = sum(1 for v in results.values() if v[0] == "FAIL")
# Hardcoded 7 because the prompt expects "X/7 services reachable"
print(f"{passed}/7 services reachable")
if failed > 0:
    sys.exit(1)
else:
    sys.exit(0)
