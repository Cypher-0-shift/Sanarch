# SANARCH — Final Staging Prompt
## Pre-deployment: backend wiring, DB, service testing, doctor view, AI summary magic button

---

## CONTEXT — WHAT ALREADY EXISTS

This is a React Native (Expo) + FastAPI + PostgreSQL app called SANARCH.

**Backend stack:**
- FastAPI, SQLAlchemy (sync, not async), PostgreSQL via psycopg2
- Celery workers with Redis as broker/backend
- Backblaze B2 for file storage (boto3 S3-compatible)
- ClamAV for virus scanning
- Firebase Admin SDK for phone OTP auth
- Groq (llama-3.3-70b-versatile) for document structuring
- Azure Document Intelligence for OCR
- Med7/spaCy for medical NER

**Existing DB tables (via Alembic migrations 0001 + 0002):**
- `users` — id (UUID), sanarch_id, phone_number, firebase_uid, full_name, email, dob, height_cm, weight_kg, profile_photo_url, is_active
- `patients` — id, owner_id (FK→users), sanarch_id, relationship_to_owner, full_name, dob, is_active
- `documents` — id, owner_id, patient_id, original_filename, s3_key, s3_tmp_key, mime_type, label, status (enum), extracted_data (JSON), page_count, uploaded_at
- `medical_events` — id, patient_id, document_id, event_date, hospital_name, doctor_name, diagnosis (JSON), medications (JSON), lab_values (JSON), summary, created_at
- `share_tokens` — id, token, owner_id, event_ids (JSON), expires_at, is_revoked, doctor_name, accessed_at, created_at

**Existing routers:** auth, users, patients, documents, timeline, sharing, search, profiles
**Existing services:** extraction.py (Azure DI OCR → Med7 NER → Groq structuring), virus_scan.py, storage.py, firebase_auth.py, sanarch_id.py
**Existing workers:** extraction_task.py (Celery task: download→scan→extract→move→create MedicalEvent)

**Frontend stack:**
- Expo (React Native), TypeScript, NativeWind (Tailwind), Zustand, TanStack Query, Axios
- Firebase Phone Auth (@react-native-firebase/auth)
- Theme colors: primary=#004D36, background=#F5F3F0, surface=white, textDark=#2D3A2F
- Font: Inter (400/500/600/700)
- Existing screens: auth/login, auth/onboarding, home, records, upload (5-step), profile, doctors tab (QRDisplay only), family, settings

**Known issues from pytest_output.txt:**
- Tests were run against SQLite in conftest.py but models use `postgresql.UUID(as_uuid=True)` — UUIDs passed as strings, not uuid.UUID objects. Tests all ERROR at setup.
- Fix: conftest.py must use `uuid.UUID(str)` objects, not raw strings, when constructing model instances.

---

## WHAT TO BUILD — COMPLETE LIST

---

### TASK 1 — Fix the test suite (conftest.py UUID bug)

**File:** `backend/tests/conftest.py`

The test fixture creates a User with `id=str(uuid.uuid4())` (a string). SQLAlchemy's `UUID(as_uuid=True)` column type expects a `uuid.UUID` object, not a string. SQLite processes UUIDs differently than PostgreSQL, causing the `.hex` attribute error seen in pytest_output.txt.

Fix:
1. Change `id=str(uuid.uuid4())` → `id=uuid.uuid4()` (drop the str() call) for ALL model instantiations in conftest.py
2. Use `DATABASE_URL = "sqlite:///:memory:"` only for unit tests. For integration tests, add a note that PostgreSQL is required.
3. Add `native_uuid=False` workaround if SQLite is kept: use `from sqlalchemy.dialects.sqlite import CHAR` and override UUID column type in test engine. The cleanest solution is to always pass `uuid.UUID` objects, not strings.

---

### TASK 2 — Create Alembic migration 0003: add AI summary field to documents

**File:** `backend/alembic/versions/0003_add_ai_summary_to_documents.py`

Add column:
- `ai_summary` TEXT nullable to `documents` table

This stores the Claude-generated "magic summary" per document. Generated on demand (not at upload time) and cached in this column.

```python
revision = "0003"
down_revision = "0002"

def upgrade():
    op.add_column("documents", sa.Column("ai_summary", sa.Text(), nullable=True))

def downgrade():
    op.drop_column("documents", "ai_summary")
```

---

### TASK 3 — AI document summary endpoint (the "magic button")

**File:** `backend/app/routers/documents.py` — add new endpoint

**New endpoint:** `POST /documents/{document_id}/summarize`

This is the "magic button" the patient taps to get a plain-English summary of a document.

Logic:
1. Fetch document — verify ownership via `current_user`
2. If `doc.ai_summary` is already set, return it immediately (cached — no re-call to AI)
3. If `doc.extracted_data` is None or empty, raise HTTP 400 "Document not yet processed"
4. Build a prompt from `doc.extracted_data` and `doc.label`
5. Call Groq API (same pattern as `extraction.py::structure_with_groq`) with this system prompt:

```
You are a friendly health assistant explaining a medical document to a patient in plain English.
The patient is not a doctor. Be warm, clear, and concise.
Return ONLY a JSON object with these keys:
{
  "headline": "One sentence (max 15 words) describing what this document is about",
  "summary": "3-5 sentences explaining what was found, what it means, and what action (if any) the patient should take",
  "key_points": ["Up to 4 bullet points of the most important facts"],
  "flag": "normal | attention | urgent — based on whether any values are abnormal or follow-up is needed",
  "flag_reason": "One sentence explaining why this was flagged (null if normal)"
}
```

User message: `json.dumps(doc.extracted_data, indent=2)`

6. Parse the JSON response
7. Store result in `doc.ai_summary = json.dumps(result)` and `db.commit()`
8. Return the parsed dict as the response

**Response schema** (add to `backend/app/schemas/document.py`):
```python
class AISummaryResponse(BaseModel):
    document_id: str
    headline: str
    summary: str
    key_points: List[str]
    flag: str  # "normal" | "attention" | "urgent"
    flag_reason: Optional[str]
    cached: bool  # True if returned from stored ai_summary, False if freshly generated
```

**Error handling:**
- If Groq call fails, return HTTP 503 with `{"detail": "AI service temporarily unavailable"}`
- Never return partial/empty summaries — raise 503 rather than return garbage

---

### TASK 4 — Doctor view service (backend)

**New file:** `backend/app/routers/doctor_view.py`

This router handles what a doctor sees when they scan a patient's SANARCH share QR code. The share token system already exists (`/sharing/generate-token`, `/sharing/access/{token}`). The doctor view is a READ-ONLY structured view of the shared events, optimized for clinical use.

**Existing:** `GET /sharing/access/{token}` returns raw event data.

**New endpoint:** `GET /doctor-view/{token}`

This is a richer version of the existing access endpoint, formatted specifically for the doctor-facing screen.

Logic:
1. Look up ShareToken by token — same validation as existing (not expired, not revoked)
2. Stamp `accessed_at`
3. Fetch the owner User (for SANARCH ID, name)
4. Fetch all MedicalEvents in `share.event_ids`
5. For each event, also fetch the linked Document (for label, filename, ai_summary if present)
6. Return a structured `DoctorViewResponse`

**Response schema** (`backend/app/schemas/share_token.py` — add):
```python
class DoctorEventItem(BaseModel):
    event_id: str
    event_date: str
    hospital_name: Optional[str]
    doctor_name: Optional[str]
    diagnosis: List[str]
    medications: List[dict]
    lab_values: List[dict]
    summary: Optional[str]           # extracted summary from MedicalEvent
    ai_summary: Optional[str]        # Claude-generated plain English summary (if generated)
    document_label: Optional[str]    # Lab Report, Prescription, etc.
    document_filename: Optional[str]

class DoctorViewResponse(BaseModel):
    patient_sanarch_id: str
    patient_name: Optional[str]
    accessed_at: datetime
    expires_at: datetime
    token_valid: bool
    events: List[DoctorEventItem]
    total_events: int
```

**Register in main.py:**
```python
from app.routers import doctor_view
app.include_router(doctor_view.router)
```

**Add to `frontend/constants/api.ts`:**
```typescript
DOCTOR_VIEW: (token: string) => `/doctor-view/${token}`,
```

---

### TASK 5 — Doctor view frontend screen

**File:** `frontend/app/(tabs)/doctors.tsx`

The existing `doctors.tsx` only renders `<QRDisplay />` (the patient shows their QR). Replace the entire screen with a two-tab layout:

**Tab A: "My QR" (existing QRDisplay component — keep as-is)**

**Tab B: "Scan Result" — shows what the doctor sees after scanning**

The Scan Result tab is only shown when the user navigates here with a `?token=xxx` param (deep link from scanning another patient's QR, or from a share link).

Full screen layout for Scan Result tab:

```
┌─────────────────────────────────────────┐
│  Doctor view                            │  ← header
│  Shared by: [patient SANARCH ID]        │
│  Expires: [relative time] · [events] records │
├─────────────────────────────────────────┤
│  Patient: [Name if available]           │
│  ID: SAN-IN-25-F-35-P-00-XXXXXX-XX     │
│                                         │
│  ─── Medical events ─────────────────  │
│                                         │
│  [EventCard]                            │
│   📅 Nov 14, 2025                       │
│   🏥 City Diagnostic Lab                │
│   👨‍⚕️ Dr. Emily Stone                   │
│   🏷 Lab Report                         │
│   [AI Summary pill if available]        │
│   ▸ Diagnosis: [list]                   │
│   ▸ Medications: [list]                 │
│   ▸ Lab values: [table — name/value/flag]│
│                                         │
│  [EventCard] ...                        │
└─────────────────────────────────────────┘
```

**Implementation:**

```typescript
// frontend/app/(tabs)/doctors.tsx

import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

// When token param is present, fetch and show doctor view
const { token } = useLocalSearchParams<{ token?: string }>();

const { data, isLoading, error } = useQuery({
  queryKey: ['doctor-view', token],
  queryFn: () => apiClient.get(ENDPOINTS.DOCTOR_VIEW(token!)).then(r => r.data),
  enabled: !!token,
  staleTime: 60_000, // token is short-lived anyway
});
```

**EventCard component** (inline in doctors.tsx or extract to `components/doctors/EventCard.tsx`):
- Show all fields from `DoctorEventItem`
- Lab values table: test name | value | unit | colored flag badge (green=normal, amber=high/low)
- If `ai_summary` is present, show a "AI Summary" pill that expands the Claude summary
- Flag badge on the card header: green dot = normal, yellow = attention, red = urgent
- Collapsible sections for medications list and lab values table (collapsed by default, expand on tap)

**Loading state:** SkeletonLoader (existing component) × 3 cards
**Error state:** Show "This link has expired or is invalid" if 404/410
**Empty token state (no scan yet):** Show the "My QR" tab content with instruction text: "Ask your doctor to scan this QR code to share your selected records"

---

### TASK 6 — Wire AI summary magic button in records screen

**Files:**
- `frontend/app/(tabs)/records/[id].tsx` — record detail screen
- `frontend/services/api.ts` — add `summarizeDocument` function

**Add to `frontend/services/api.ts`:**
```typescript
export async function summarizeDocument(documentId: string): Promise<{
  document_id: string;
  headline: string;
  summary: string;
  key_points: string[];
  flag: 'normal' | 'attention' | 'urgent';
  flag_reason: string | null;
  cached: boolean;
}> {
  const response = await apiClient.post(ENDPOINTS.SUMMARIZE_DOCUMENT(documentId));
  return response.data;
}
```

**Add to `frontend/constants/api.ts`:**
```typescript
SUMMARIZE_DOCUMENT: (id: string) => `/documents/${id}/summarize`,
```

**In `frontend/app/(tabs)/records/[id].tsx`:**

Add a "Summarize with AI" button below the document details section. It should:
1. Only show if document status is `complete` or `pending_review`
2. Show a loading state ("Analysing document...") while the API call is in flight
3. On success, render the summary inline — no navigation needed:

```
┌────────────────────────────────────────┐
│  ✨ AI Summary          [normal ✓]     │  ← headline + flag badge
│                                        │
│  Your CBC results show all blood       │
│  counts within normal range. No        │
│  action needed.                        │
│                                        │
│  • Haemoglobin: 14.2 g/dL (normal)    │
│  • WBC: 7,200/μL (normal)             │
│  • Platelets: 2.4 lakh (normal)       │
│  • No abnormal flags detected          │
└────────────────────────────────────────┘
```

Flag badge colors:
- `normal` → green background (#E8F5E9), green text (#004D36)
- `attention` → amber background (#FFF8E1), amber text (#F57F17)
- `urgent` → red background (#FFEBEE), red text (#C62828)

Button style: matches existing `primaryBtn` style from upload.tsx with a sparkle icon (MaterialCommunityIcons `"auto-fix"` or `"creation"`).

4. If the summary is already cached (`cached: true` in response), show it immediately without a loading state — store in component state keyed by document ID.

---

### TASK 7 — Backend health check + service connectivity test script

**New file:** `backend/run_checks.py` (this file exists but may be empty — replace with full implementation)

A standalone script to verify all services are reachable before deployment. Run with: `python run_checks.py`

```python
#!/usr/bin/env python3
"""
SANARCH pre-deployment connectivity check.
Run from backend/ directory: python run_checks.py
Checks: PostgreSQL, Redis, ClamAV, Backblaze B2, Groq API, Azure DI, Firebase.
"""
import os, sys, socket, json
from datetime import datetime

results = {}

def check(name, fn):
    try:
        msg = fn()
        results[name] = ("✅", msg)
        print(f"  ✅  {name}: {msg}")
    except Exception as e:
        results[name] = ("❌", str(e))
        print(f"  ❌  {name}: {e}")

print(f"\nSANARCH Service Check — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n{'─'*52}")

# 1. PostgreSQL
def check_postgres():
    import psycopg2
    url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("SELECT version()")
    ver = cur.fetchone()[0].split(",")[0]
    conn.close()
    return ver

check("PostgreSQL", check_postgres)

# 2. Redis
def check_redis():
    import redis
    r = redis.from_url(os.environ["REDIS_URL"])
    r.ping()
    info = r.info("server")
    return f"v{info['redis_version']}"

check("Redis", check_redis)

# 3. ClamAV
def check_clamav():
    host = os.environ.get("CLAMD_HOST", "localhost")
    port = int(os.environ.get("CLAMD_PORT", 3310))
    s = socket.socket()
    s.settimeout(5)
    s.connect((host, port))
    s.sendall(b"zPING\0")
    resp = s.recv(64).decode().strip("\0").strip()
    s.close()
    if resp != "PONG":
        raise RuntimeError(f"Unexpected response: {resp}")
    return f"PONG received from {host}:{port}"

check("ClamAV", check_clamav)

# 4. Backblaze B2
def check_b2():
    import boto3
    from botocore.client import Config
    client = boto3.client(
        "s3",
        endpoint_url=os.environ["B2_ENDPOINT_URL"],
        aws_access_key_id=os.environ["B2_KEY_ID"],
        aws_secret_access_key=os.environ["B2_APPLICATION_KEY"],
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    bucket = os.environ["B2_BUCKET_NAME"]
    resp = client.list_objects_v2(Bucket=bucket, MaxKeys=1)
    return f"bucket={bucket} reachable"

check("Backblaze B2", check_b2)

# 5. Groq API
def check_groq():
    import httpx
    resp = httpx.get(
        "https://api.groq.com/openai/v1/models",
        headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
        timeout=10,
    )
    resp.raise_for_status()
    models = [m["id"] for m in resp.json()["data"] if "llama" in m["id"]][:2]
    return f"OK — models: {', '.join(models)}"

check("Groq API", check_groq)

# 6. Azure Document Intelligence
def check_azure_di():
    endpoint = os.environ.get("AZURE_DI_ENDPOINT", "")
    key = os.environ.get("AZURE_DI_KEY", "")
    if not endpoint or not key:
        return "SKIPPED (not configured)"
    import httpx
    url = f"{endpoint.rstrip('/')}/documentintelligence/documentModels?api-version=2023-07-31"
    resp = httpx.get(url, headers={"Ocp-Apim-Subscription-Key": key}, timeout=10)
    resp.raise_for_status()
    return "OK"

check("Azure DI", check_azure_di)

# 7. Firebase
def check_firebase():
    import firebase_admin
    from firebase_admin import credentials
    path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
    if not path or not os.path.exists(path):
        return "SKIPPED (service account not found)"
    if not firebase_admin._apps:
        cred = credentials.Certificate(path)
        firebase_admin.initialize_app(cred)
    return f"project={os.environ.get('FIREBASE_PROJECT_ID', 'unknown')}"

check("Firebase", check_firebase)

# Summary
print(f"\n{'─'*52}")
passed = sum(1 for v in results.values() if v[0] == "✅")
total = len(results)
print(f"Result: {passed}/{total} services reachable\n")
if passed < total:
    sys.exit(1)
```

---

### TASK 8 — `.env.example` with all required keys

**File:** `backend/.env.example`

Replace with the complete list of all env vars the app needs, with comments:

```env
# Database
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/sanarch
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30

# Redis
REDIS_URL=redis://localhost:6379/0

# Auth
JWT_SECRET_KEY=change-this-to-a-random-64-char-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Groq (document structuring + AI summary)
GROQ_API_KEY=gsk_...

# Azure Document Intelligence (OCR — optional if using fallback)
AZURE_DI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DI_KEY=your-azure-key

# Backblaze B2
B2_KEY_ID=your-b2-key-id
B2_APPLICATION_KEY=your-b2-application-key
B2_BUCKET_NAME=sanarch-docs
B2_ENDPOINT_URL=https://s3.us-west-004.backblazeb2.com

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=/app/firebase-service-account.json

# ClamAV
CLAMD_HOST=localhost
CLAMD_PORT=3310
CLAMD_TIMEOUT=60

# App
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19000
MAX_UPLOAD_SIZE_MB=20
DEV_MODE_ENABLED=true
MAX_SHARE_TOKEN_MINUTES=10
ALLOWED_FILE_EXTENSIONS=.pdf,.jpg,.jpeg,.png
```

---

### TASK 9 — Alembic migration instructions (README section)

**File:** `backend/MIGRATION_GUIDE.md` (create new)

```markdown
# Running Migrations

## First time setup
```bash
cd backend
docker compose up postgres -d          # start DB
alembic upgrade head                   # run all migrations (0001 → latest)
```

## After pulling new code
```bash
alembic upgrade head
```

## Create a new migration
```bash
alembic revision --autogenerate -m "describe_the_change"
# Review the generated file in alembic/versions/ before running
alembic upgrade head
```

## Current migration chain
- 0001: initial schema (users, patients, documents, medical_events, share_tokens)
- 0002: add is_active to patients
- 0003: add ai_summary to documents
```

---

### TASK 10 — Frontend: wire doctors tab deep link for QR scan

**File:** `frontend/app/(tabs)/doctors.tsx`

The QRDisplay component currently just shows the patient's own QR code. Add a second flow: when the user scans ANOTHER patient's share QR (which encodes `sanarch://share/<token>`), the app should navigate to the doctors tab with the token.

**In the existing QRDisplay or doctors.tsx, add a "Scan" button:**

```typescript
import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';

// "Scan a patient's QR" button — opens camera, reads QR
// On successful scan of sanarch://share/<token>, navigate:
router.push(`/(tabs)/doctors?token=${scannedToken}`);
```

Handle the deep link in the tab:
```typescript
const { token } = useLocalSearchParams<{ token?: string }>();
// If token present → show DoctorView
// If no token → show MyQR tab
```

Use `expo-camera` (already in dependencies) for QR scanning. The scan button only appears on the doctors tab, not the patient-facing QR card.

---

## CONSTRAINTS AND NOTES

- Do NOT change the sync SQLAlchemy pattern to async. The codebase uses sync `Session` everywhere — keep it consistent.
- Do NOT add any new Python dependencies without noting them. Only use what's already in requirements.txt: httpx, sqlalchemy, fastapi, pydantic, celery, redis, firebase-admin, boto3, qrcode, pillow, python-magic, fitz (PyMuPDF), spacy.
- The Groq call for AI summary follows the exact same pattern as `extraction.py::structure_with_groq` — reuse that function or extract a shared helper.
- The sharing token TTL is 10 minutes (`MAX_SHARE_TOKEN_MINUTES=10` in config). The doctor view must check expiry.
- Frontend color palette is fixed: primary=#004D36, background=#F5F3F0, textDark=#2D3A2F, textMuted=#5C6E60. Match the existing design system exactly — no new colors.
- All new FastAPI endpoints must use `Depends(get_current_user)` for auth except `/doctor-view/{token}` and `/sharing/access/{token}` which are public read-only endpoints (the token itself is the auth).
- The `ai_summary` column stores JSON as TEXT (not JSON column) to avoid PostgreSQL-specific JSON operators in queries.
- `run_checks.py` must load `.env` automatically — add `from dotenv import load_dotenv; load_dotenv()` at the top.

---

## DELIVERY CHECKLIST

When done, confirm each of these works:

Backend:
- [ ] `python run_checks.py` passes all checks (or clearly notes skipped optional services)
- [ ] `alembic upgrade head` runs cleanly from 0001 → 0003
- [ ] `POST /documents/{id}/summarize` returns AISummaryResponse on first call, returns cached on second
- [ ] `GET /doctor-view/{token}` returns DoctorViewResponse with events + ai_summary per event
- [ ] `pytest tests/test_sanarch_id.py` all pass (UUID bug fixed)

Frontend:
- [ ] Records detail screen shows "Summarize with AI" button on complete documents
- [ ] Tapping the button shows loading state then renders the inline summary card
- [ ] Doctors tab shows MyQR by default, switches to DoctorView when `?token=xxx` param is present
- [ ] DoctorView renders event cards with lab value table and flag badges
- [ ] `ENDPOINTS.SUMMARIZE_DOCUMENT` and `ENDPOINTS.DOCTOR_VIEW` are in constants/api.ts