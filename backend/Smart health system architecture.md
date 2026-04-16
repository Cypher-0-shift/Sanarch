# SMART Integrated Health Care System
## Product Requirements, System Architecture, Backend Design & Implementation Plan

> **Scope:** Phase 1 — Backend-focused. Frontend assumed complete.
> **Principle:** Patient owns data. Hospitals provide verified inputs. No diagnosis. No marketplace.

---

# TABLE OF CONTENTS

1. [PRD — Product Requirements Document](#1-prd)
2. [System Architecture](#2-system-architecture)
3. [Backend Design Document](#3-backend-design-doc)
4. [IMPLEMENTATION.md](#4-implementationmd)

---

# 1. PRD

## 1.1 Problem Statement

Patients in multi-hospital ecosystems accumulate medical records — prescriptions, lab reports, discharge summaries, follow-up instructions — in paper or scattered digital formats. These records:

- Get physically lost or left at one hospital
- Cannot be retrieved when visiting a different provider
- Are unstructured (PDFs, printouts), making trend tracking impossible
- Have no patient-owned portability layer
- Result in poor follow-up adherence and recovery tracking

**Root cause:** No system exists where hospitals produce verified, structured data that patients own and carry across providers.

---

## 1.2 Goals

### In Scope (Phase 1)
- Hospital-initiated upload of verified structured medical records
- Patient-controlled health profile with full record history
- Structured lab result storage (not just PDF blobs) enabling trend views
- Medication tracking and follow-up reminder system
- Controlled doctor-patient connection via hospital partnership (not open marketplace)
- Secure record sharing (patient → doctor, token-based, time-limited)

### Out of Scope (Phase 1)
- Diagnosis, AI triage, or clinical decision support
- Real-time video/messaging between doctor and patient
- Insurance or billing integration
- Wearable/IoT device sync
- Public API for third-party developers
- Patient self-upload of records (no unverified data in Phase 1)

---

## 1.3 User Personas

### Persona A — Patient
- Age: 25–70, mixed digital literacy
- Visits 1–3 hospitals per year
- Struggles to maintain records across providers
- Wants: unified history, medication reminders, easy record sharing
- Trust concern: who can see my data?

### Persona B — Hospital Admin / Data Entry Operator
- Works at a partner hospital
- Responsible for uploading discharge summaries, prescriptions, lab results post-consultation
- Needs: fast, structured upload forms; patient lookup by ID/phone
- Trust concern: is this HIPAA/data-law compliant?

### Persona C — Doctor (at Partner Hospital)
- Needs to view a patient's full cross-hospital history before/during consultation
- Patient must actively share records with them
- Does not initiate contact; patient drives sharing
- Needs: read-only structured view of timeline + ability to add follow-up notes

---

## 1.4 Core Features (Phase 1)

| # | Feature | Actor |
|---|---------|-------|
| F1 | Patient registration & identity verification | Patient |
| F2 | Hospital onboarding & staff account management | Hospital Admin |
| F3 | Structured medical record upload (prescription, lab, discharge, follow-up) | Hospital Admin |
| F4 | Patient health timeline (chronological, filterable by type/hospital) | Patient |
| F5 | Structured lab result view with trend chart data | Patient |
| F6 | Medication schedule + daily adherence tracking | Patient |
| F7 | Follow-up appointment tracking with reminders | Patient |
| F8 | Time-limited, patient-controlled record sharing with doctors | Patient |
| F9 | Doctor view of shared patient records (read-only) | Doctor |
| F10 | Raw file (PDF/image) access alongside structured data | Patient, Doctor |

---

## 1.5 High-Level User Flows

### Flow 1: Hospital Uploads Record
```
Hospital Admin logs in → Searches patient by phone/ID
→ Selects record type (Lab / Prescription / Discharge / Follow-Up)
→ Fills structured form + optional PDF attachment
→ Submits → Record flagged as "hospital-verified"
→ Patient receives notification
```

### Flow 2: Patient Views Health Timeline
```
Patient logs in → Views chronological timeline
→ Filters by: record type / hospital / date range
→ Taps lab result → sees structured values + trend chart
→ Downloads original PDF if needed
```

### Flow 3: Patient Shares Records with Doctor
```
Patient selects doctor (from partner hospital directory)
→ Chooses records to share (all or specific)
→ Sets expiry (e.g., 7 days / single view)
→ Doctor receives access notification
→ Doctor views read-only structured timeline
→ Access auto-expires or patient revokes
```

### Flow 4: Medication & Follow-Up Tracking
```
Hospital uploads prescription → System creates medication schedule
→ Patient confirms/adjusts doses and times
→ Daily push notification for each dose
→ Patient marks as taken/missed → adherence logged
→ Follow-up date surfaced as calendar reminder
```

---

## 1.6 Success Metrics (Phase 1)

| Metric | Target |
|--------|--------|
| Hospital upload completion rate | ≥ 90% of created records fully structured |
| Patient activation rate (post-record upload) | ≥ 60% open app within 48h |
| Medication adherence tracking rate | ≥ 50% of patients log ≥ 5 days/week |
| Record sharing events per active patient/month | ≥ 1.5 |
| API p95 response time | < 300ms |
| System uptime | ≥ 99.5% |

---

# 2. SYSTEM ARCHITECTURE

## 2.1 High-Level Architecture (Textual Diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│  Mobile App (Patient)    Web Portal (Hospital Admin)    Web (Doctor)│
└───────────────┬──────────────────┬──────────────────────┬───────────┘
                │ HTTPS/TLS        │ HTTPS/TLS            │ HTTPS/TLS
                ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / REVERSE PROXY                      │
│              (Kong / AWS API Gateway / Nginx)                       │
│   Rate limiting · JWT validation · Route mapping · TLS termination  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  Auth Service │    │   Core API       │    │  Notification        │
│  (JWT + RBAC) │    │   (FastAPI)      │    │  Service             │
│               │    │                  │    │  (Push/SMS/Email)    │
│ - Login       │    │ - Patient API    │    │                      │
│ - Token mgmt  │    │ - Hospital API   │    │ - Follow-up alerts   │
│ - Role verify │    │ - Doctor API     │    │ - Medication reminders│
└───────┬───────┘    │ - Records API    │    │ - Upload notifications│
        │            │ - Sharing API    │    └──────────┬───────────┘
        │            │ - Timeline API   │               │
        │            └────────┬─────────┘               │
        │                     │                         │
        ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
├───────────────────┬─────────────────────┬───────────────────────────┤
│  PostgreSQL        │   Redis              │   Object Storage          │
│  (Primary DB)      │   (Cache + Sessions  │   (S3-compatible)         │
│                    │    + Job Queue)      │                           │
│  - All entities    │                     │   - PDF uploads           │
│  - JSONB for flex  │  - Rate limit data  │   - Lab report images     │
│  - Audit logs      │  - Share tokens     │   - Discharge summaries   │
│  - Partitioned by  │  - Notif queue      │   - Encrypted at rest     │
│    patient_id      │                     │                           │
└───────────────────┴─────────────────────┴───────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│  Background Workers       │
│  (Celery / ARQ)           │
│                           │
│  - Notification dispatch  │
│  - File virus scan        │
│  - Reminder scheduling    │
│  - Audit log flushing     │
└──────────────────────────┘
```

---

## 2.2 Components

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| API Gateway | Kong OSS / AWS API GW | Rate limiting, auth pre-check, routing |
| Core API | FastAPI (Python) | Business logic, all CRUD endpoints |
| Auth Service | FastAPI + python-jose | JWT issuance, RBAC, refresh tokens |
| Primary DB | PostgreSQL 15 | All structured data, JSONB for flex fields |
| Cache / Queue | Redis 7 | Session tokens, share token store, job queue |
| Object Storage | AWS S3 / MinIO | Raw file storage (PDFs, images) |
| Background Workers | Celery + Redis broker | Async jobs: reminders, notifications, scans |
| Notification Service | FCM + Twilio + SES | Push notifications, SMS, email |
| CDN | CloudFront / Cloudflare | Signed URL delivery for patient files |

---

## 2.3 Data Flow

### Hospital → System → Patient → Doctor

```
1. UPLOAD FLOW
   Hospital Admin
     → POST /api/v1/records/{type}
     → Auth Service validates hospital JWT + role
     → Core API validates patient identity (phone/DOB match)
     → Structured data written to PostgreSQL (records table)
     → Optional PDF → Object Storage → S3 key stored in record
     → Notification worker queued → patient push notification sent

2. PATIENT VIEW FLOW
   Patient App
     → GET /api/v1/patients/me/timeline
     → Auth: patient JWT
     → Core API aggregates records across all hospitals
     → Ordered chronologically, typed (lab/rx/discharge/followup)
     → Signed S3 URLs generated on-demand (15min TTL) for file access
     → Structured lab values returned for trend rendering

3. SHARE FLOW
   Patient
     → POST /api/v1/sharing (doctor_id, record_ids, expires_at)
     → Share token created → stored in Redis with TTL
     → Doctor notified
     → Doctor GET /api/v1/sharing/{token}/records
     → Auth validates token not expired, not revoked
     → Read-only record payload returned
     → Access event logged in audit_log table
```

---

## 2.4 Multi-Hospital Design

- Each `Hospital` entity has a unique `hospital_id` and an API credential (client_id + secret)
- All `MedicalRecord` rows carry `hospital_id` as a foreign key (verified source)
- Patient identity is **platform-native** — phone + DOB verified at registration; hospitals look up patients by `platform_patient_id`, never by their own internal MRN alone
- Hospital cannot read records from other hospitals for the same patient without patient sharing consent
- Cross-hospital timeline is assembled by the platform, not by any single hospital
- Hospital MRN (local ID) stored as `external_ref` per record for traceability without creating dependencies

---

## 2.5 Scalability Considerations

| Concern | Approach |
|---------|----------|
| High read volume (patient timeline) | Redis cache of aggregated timeline per patient (invalidated on new record upload) |
| Large file storage | S3 with lifecycle policies; CDN signed URLs, never direct DB blobs |
| Multi-tenant hospital isolation | Row-level `hospital_id` scoping on all hospital-actor queries |
| DB growth | PostgreSQL table partitioning on `created_at` for records tables |
| Notification fan-out | Celery task queue; FCM batch sends |
| Horizontal scaling | Stateless FastAPI behind load balancer; session state in Redis |

---

# 3. BACKEND DESIGN DOC

## 3.1 Tech Stack

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| Language | Python 3.11 | Strong async support, medical/data ecosystem, team familiarity |
| Framework | FastAPI | Async-native, auto OpenAPI docs, pydantic validation |
| ORM | SQLAlchemy 2.0 (async) | Mature, supports PostgreSQL JSONB, async sessions |
| Database | PostgreSQL 15 | ACID compliance critical for medical data; JSONB for flex fields |
| Cache/Queue | Redis 7 | Dual use: session/token store + Celery broker |
| Task Queue | Celery 5 | Mature, reliable for notification scheduling |
| Object Storage | AWS S3 | Industry standard; MinIO for self-hosted option |
| Auth | python-jose + passlib | JWT RS256, bcrypt password hashing |
| File Validation | python-magic + ClamAV | MIME type checking + virus scan on upload |
| Migration | Alembic | Schema versioning tied to SQLAlchemy models |
| Testing | pytest + httpx | Async test client for FastAPI |
| Containerization | Docker + Docker Compose | Dev/staging parity |

---

## 3.2 Service Breakdown — Modular Monolith (Phase 1)

**Decision: Modular Monolith, not Microservices.**

Reasoning:
- Phase 1 team is small; microservices overhead (service mesh, distributed tracing, inter-service auth) is premature
- A well-structured monolith with clear module boundaries can be split later
- FastAPI routers provide logical service separation within one codebase
- Single deployment unit reduces operational complexity

**Module structure:**
```
app/
├── modules/
│   ├── auth/          # JWT, RBAC, refresh tokens
│   ├── patients/      # Patient CRUD, profile, timeline
│   ├── hospitals/     # Hospital CRUD, staff management
│   ├── doctors/       # Doctor CRUD, search within partner hospitals
│   ├── records/       # Core record upload + retrieval
│   │   ├── prescriptions/
│   │   ├── lab_results/
│   │   ├── discharge_summaries/
│   │   └── follow_ups/
│   ├── sharing/       # Share token lifecycle
│   ├── tracking/      # Medication adherence, follow-up status
│   └── notifications/ # Push/SMS/email dispatch
├── core/              # DB, config, security utils
└── workers/           # Celery tasks
```

**Migration path:** Each module → independent microservice when load justifies it. DB schema designed with service-boundary-friendly foreign keys.

---

## 3.3 API Design — REST

**Decision: REST over GraphQL.**

Reasoning:
- Hospital admin portal and mobile app have well-defined, discrete data requirements
- REST is simpler to implement, audit, and rate-limit per endpoint
- GraphQL's flexibility is a risk for sensitive data (over-fetching, introspection attacks)
- Clear resource-oriented endpoints map directly to medical record types

**Base URL:** `/api/v1/`

### Auth Endpoints
```
POST   /auth/register/patient          # OTP + phone-based registration
POST   /auth/login                     # Returns access_token + refresh_token
POST   /auth/refresh                   # Rotate refresh token
POST   /auth/logout                    # Revoke refresh token
POST   /auth/hospital/login            # Hospital credential login
```

### Patient Endpoints
```
GET    /patients/me                    # Own profile
PATCH  /patients/me                    # Update profile (non-medical)
GET    /patients/me/timeline           # Full chronological record list
GET    /patients/me/timeline?type=lab&hospital_id=X&from=Y&to=Z
```

### Hospital Admin Endpoints
```
GET    /hospital/patients/lookup       # Search by phone + DOB
POST   /hospital/records/lab           # Upload lab result
POST   /hospital/records/prescription  # Upload prescription
POST   /hospital/records/discharge     # Upload discharge summary
POST   /hospital/records/followup      # Upload follow-up instruction
POST   /hospital/records/{id}/file     # Attach PDF/image to existing record
```

### Doctor Endpoints
```
GET    /doctors/me                     # Own profile
GET    /sharing/{token}/records        # View patient-shared records (token-gated)
POST   /doctors/followup-notes/{record_id}  # Add follow-up note (shared record only)
```

### Sharing Endpoints
```
POST   /sharing                        # Patient creates share (doctor_id, scope, TTL)
GET    /sharing                        # Patient lists active shares
DELETE /sharing/{share_id}             # Patient revokes share
```

### Tracking Endpoints
```
GET    /tracking/medications           # Patient: today's medication schedule
POST   /tracking/medications/{id}/log # Mark dose taken/missed
GET    /tracking/followups             # Upcoming follow-up dates
PATCH  /tracking/followups/{id}        # Mark attended/rescheduled
```

---

## 3.4 Authentication & Authorization

### Authentication Flow
- **Patient:** Phone OTP via SMS → JWT (RS256) access token (15min TTL) + refresh token (30 days, stored in Redis)
- **Hospital Admin:** Username + password (bcrypt) → JWT with `hospital_id` claim
- **Doctor:** Phone/email + password → JWT with `doctor_id` + `hospital_id` claim
- All tokens include: `sub`, `role`, `exp`, `iat`, `jti` (for revocation)

### Role-Based Access Control (RBAC)

| Role | Scope |
|------|-------|
| `patient` | Own records only; manage shares |
| `hospital_admin` | Upload records for patients at their hospital; cannot read other hospitals' records |
| `hospital_staff` | Same as hospital_admin (can be scoped further per hospital config) |
| `doctor` | Read-only access to patient records explicitly shared with them |
| `platform_admin` | Internal only; full audit access |

### Authorization Rules (enforced at service layer, not just gateway)
- All record queries filter by `patient_id` derived from JWT — no patient ID spoofing
- Hospital write operations check `jwt.hospital_id == record.hospital_id`
- Doctor reads check `sharing_token.doctor_id == jwt.doctor_id AND token.expires_at > now()`
- Sharing token access logs every read event to `audit_log`

---

## 3.5 Data Models

### patients
```sql
CREATE TABLE patients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(15) UNIQUE NOT NULL,
    phone_verified  BOOLEAN DEFAULT FALSE,
    full_name       VARCHAR(200) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(10),
    blood_group     VARCHAR(5),
    emergency_contact JSONB,          -- {name, phone, relationship}
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_patients_phone ON patients(phone);
```

### hospitals
```sql
CREATE TABLE hospitals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(300) NOT NULL,
    registration_no VARCHAR(100) UNIQUE NOT NULL,
    address         JSONB NOT NULL,   -- {line1, city, state, pincode, country}
    phone           VARCHAR(15),
    email           VARCHAR(200),
    api_client_id   VARCHAR(100) UNIQUE NOT NULL,
    api_client_secret_hash VARCHAR(256) NOT NULL,   -- bcrypt hashed
    is_active       BOOLEAN DEFAULT TRUE,
    onboarded_at    TIMESTAMPTZ DEFAULT NOW(),
    metadata        JSONB DEFAULT '{}'
);
```

### hospital_staff
```sql
CREATE TABLE hospital_staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id),
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   VARCHAR(256) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'staff',  -- 'admin' | 'staff'
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### doctors
```sql
CREATE TABLE doctors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id),
    full_name       VARCHAR(200) NOT NULL,
    phone           VARCHAR(15) UNIQUE NOT NULL,
    email           VARCHAR(200),
    specialization  VARCHAR(150),
    registration_no VARCHAR(100),   -- Medical council registration
    password_hash   VARCHAR(256) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
```

### medical_records (base table)
```sql
CREATE TABLE medical_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id),
    uploaded_by     UUID NOT NULL REFERENCES hospital_staff(id),
    record_type     VARCHAR(50) NOT NULL,  -- 'lab_result' | 'prescription' | 'discharge' | 'follow_up'
    record_date     DATE NOT NULL,
    title           VARCHAR(300),
    notes           TEXT,
    external_ref    VARCHAR(200),          -- Hospital's internal record/MRN reference
    file_key        VARCHAR(500),          -- S3 key for attached PDF/image
    file_mime_type  VARCHAR(100),
    is_verified     BOOLEAN DEFAULT TRUE,  -- Always true for hospital uploads in Phase 1
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_records_patient_type ON medical_records(patient_id, record_type);
CREATE INDEX idx_records_hospital ON medical_records(hospital_id);
```

### lab_results
```sql
CREATE TABLE lab_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES patients(id),
    test_name       VARCHAR(200) NOT NULL,
    test_category   VARCHAR(100),           -- 'blood', 'urine', 'imaging', etc.
    result_value    NUMERIC,                -- Numeric value for trend tracking
    result_text     VARCHAR(500),           -- For non-numeric results
    unit            VARCHAR(50),
    reference_min   NUMERIC,
    reference_max   NUMERIC,
    reference_text  VARCHAR(200),
    is_abnormal     BOOLEAN,
    test_date       DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- Multiple rows per record_id (one per test parameter)
CREATE INDEX idx_lab_patient_test ON lab_results(patient_id, test_name, test_date);
```

### prescriptions
```sql
CREATE TABLE prescriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES patients(id),
    doctor_name     VARCHAR(200),
    diagnosis_label VARCHAR(300),   -- Label only (e.g., "Type 2 Diabetes") — not diagnostic assertion
    issued_date     DATE NOT NULL,
    valid_until     DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prescription_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_name       VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100),          -- e.g., "500mg"
    frequency       VARCHAR(100),          -- e.g., "twice daily"
    route           VARCHAR(50),           -- e.g., "oral"
    duration_days   INTEGER,
    instructions    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### discharge_summaries
```sql
CREATE TABLE discharge_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES patients(id),
    admission_date  DATE NOT NULL,
    discharge_date  DATE NOT NULL,
    ward            VARCHAR(100),
    attending_doctor VARCHAR(200),
    admission_reason TEXT,
    treatment_summary TEXT,
    discharge_instructions TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### follow_ups
```sql
CREATE TABLE follow_ups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID REFERENCES medical_records(id),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id),
    doctor_id       UUID REFERENCES doctors(id),
    scheduled_date  DATE NOT NULL,
    scheduled_time  TIME,
    reason          TEXT,
    status          VARCHAR(30) DEFAULT 'scheduled',  -- 'scheduled'|'attended'|'missed'|'rescheduled'
    rescheduled_to  DATE,
    reminder_sent   BOOLEAN DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_followups_patient_date ON follow_ups(patient_id, scheduled_date);
```

### medication_tracking
```sql
CREATE TABLE medication_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_item_id UUID NOT NULL REFERENCES prescription_items(id),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    start_date      DATE NOT NULL,
    end_date        DATE,
    times_of_day    JSONB NOT NULL,   -- ["08:00", "20:00"]
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medication_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id     UUID NOT NULL REFERENCES medication_schedules(id),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    scheduled_at    TIMESTAMPTZ NOT NULL,
    logged_at       TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL,  -- 'taken' | 'missed' | 'skipped'
    note            VARCHAR(300),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_medlogs_patient_date ON medication_logs(patient_id, scheduled_at);
```

### sharing_tokens
```sql
CREATE TABLE sharing_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    doctor_id       UUID NOT NULL REFERENCES doctors(id),
    token           VARCHAR(128) UNIQUE NOT NULL,   -- crypto random, also stored in Redis
    scope           JSONB NOT NULL,                 -- {type: 'all'} or {record_ids: [...]}
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    single_use      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tokens_patient ON sharing_tokens(patient_id);
CREATE INDEX idx_tokens_token ON sharing_tokens(token);
```

### audit_log
```sql
CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        UUID NOT NULL,
    actor_role      VARCHAR(50) NOT NULL,
    action          VARCHAR(100) NOT NULL,   -- 'record.view' | 'share.create' | 'file.download'
    resource_type   VARCHAR(100),
    resource_id     UUID,
    patient_id      UUID,
    ip_address      INET,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

---

## 3.6 Entity Relationships

```
patients ──< medical_records >── hospitals
                  │
        ┌─────────┼──────────┬─────────────┐
        ▼         ▼          ▼             ▼
   lab_results  prescriptions  discharge_  follow_ups
                    │         summaries
                    ▼
             prescription_items
                    │
                    ▼
             medication_schedules
                    │
                    ▼
             medication_logs

patients ──< sharing_tokens >── doctors
patients ──< audit_log
```

---

## 3.7 File Storage Strategy

```
S3 Bucket: smart-health-records-{env}
Key pattern: records/{patient_id}/{record_id}/{filename}_{timestamp}.{ext}

Access:
- Never expose S3 bucket publicly
- All file access via pre-signed URLs (15-minute TTL)
- Generated on-demand per request, never stored in DB response caches
- CDN (CloudFront) wraps S3; signed cookies for doctor-share sessions

Upload pipeline:
1. Hospital POSTs multipart file → API validates MIME (pdf/jpeg/png only)
2. File streamed to Lambda/worker for ClamAV virus scan
3. On scan pass → move from /tmp/ prefix to /records/ prefix in S3
4. S3 key stored in medical_records.file_key
5. On scan fail → delete file, flag record, alert ops

Max file size: 20MB per file
Allowed types: application/pdf, image/jpeg, image/png
```

---

## 3.8 Security & Compliance

| Area | Implementation |
|------|---------------|
| Transport | TLS 1.2+ enforced at load balancer; HSTS headers |
| Passwords | bcrypt (cost factor 12) |
| JWT | RS256 asymmetric; short-lived access tokens (15 min); refresh token rotation |
| Token revocation | JTI blacklist in Redis on logout/revoke |
| Data at rest | PostgreSQL encryption via pgcrypto for PII columns; S3 SSE-S3 |
| PII minimization | Only store what's clinically necessary; no SSN/Aadhaar in DB |
| Audit trail | All record access, share creation/read, file downloads → audit_log |
| Rate limiting | API Gateway: 100 req/min per patient; 500 req/min per hospital |
| CORS | Whitelist frontend origins only |
| Input validation | Pydantic strict models on all inputs; no raw SQL (SQLAlchemy ORM only) |
| File security | MIME type validation + ClamAV scan before storage |
| Secrets management | AWS Secrets Manager / HashiCorp Vault (no secrets in env files in prod) |
| HIPAA alignment | Audit logs, access controls, minimum necessary data, TLS, breach logging |

---

# 4. IMPLEMENTATION.md

```markdown
# SMART Health System — Backend Implementation Plan

## Prerequisites
- Python 3.11+
- PostgreSQL 15
- Redis 7
- Docker & Docker Compose
- AWS account (S3) or MinIO for local dev
- Node.js (for any tooling scripts)

---

## PHASE 0: Project Setup

### Step 1: Repository & Structure
```bash
git init smart-health-backend
cd smart-health-backend

# Create directory structure
mkdir -p app/{modules/{auth,patients,hospitals,doctors,records/{lab,prescription,discharge,followup},sharing,tracking,notifications},core,workers,tests}
touch app/main.py app/core/{config.py,database.py,security.py,dependencies.py}
```

### Step 2: Environment & Dependencies
```bash
python -m venv venv && source venv/bin/activate

pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg alembic \
  pydantic pydantic-settings redis celery python-jose[cryptography] passlib[bcrypt] \
  boto3 python-multipart python-magic aiofiles pytest pytest-asyncio httpx \
  slowapi tenacity structlog
```

### Step 3: Docker Compose (Development)
```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: smart_health
      POSTGRES_USER: smart
      POSTGRES_PASSWORD: devpassword
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]

  api:
    build: .
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    env_file: .env
    ports: ["8000:8000"]
    depends_on: [db, redis, minio]

  worker:
    build: .
    command: celery -A app.workers.celery_app worker --loglevel=info
    env_file: .env
    depends_on: [db, redis]

volumes:
  pgdata:
```

### Step 4: Configuration
```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    S3_BUCKET: str
    S3_ENDPOINT: str          # MinIO URL for dev
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    JWT_PRIVATE_KEY: str      # RS256 PEM
    JWT_PUBLIC_KEY: str
    ACCESS_TOKEN_TTL: int = 900      # 15 min
    REFRESH_TOKEN_TTL: int = 2592000 # 30 days
    OTP_TTL: int = 300               # 5 min
    SMS_PROVIDER: str = "twilio"
    TWILIO_SID: str = ""
    TWILIO_TOKEN: str = ""
    FCM_SERVER_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## PHASE 1: Database Schema

### Step 5: Alembic Setup
```bash
alembic init alembic
# Edit alembic/env.py to use async SQLAlchemy + import all models
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

### Step 6: SQLAlchemy Models
Create one model file per module:
- `app/modules/patients/models.py` → Patient
- `app/modules/hospitals/models.py` → Hospital, HospitalStaff
- `app/modules/doctors/models.py` → Doctor
- `app/modules/records/models.py` → MedicalRecord, LabResult, Prescription, PrescriptionItem, DischargeSummary, FollowUp
- `app/modules/tracking/models.py` → MedicationSchedule, MedicationLog
- `app/modules/sharing/models.py` → SharingToken
- `app/core/audit.py` → AuditLog

**All models inherit from a declarative Base defined in `app/core/database.py`.**

### Step 7: Database Partitioning
```sql
-- Run after initial schema migration
CREATE TABLE medical_records_2024 PARTITION OF medical_records
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE medical_records_2025 PARTITION OF medical_records
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
-- Add partition creation to a scheduled job or migration
```

---

## PHASE 2: Auth System

### Step 8: JWT Utilities
```python
# app/core/security.py
# Implement:
# - create_access_token(sub, role, extra_claims) → str
# - create_refresh_token(sub) → str (stored in Redis)
# - verify_token(token) → payload
# - hash_password(plain) → str
# - verify_password(plain, hashed) → bool
# - generate_otp() → str (6-digit)
```

### Step 9: Auth Endpoints
Build in `app/modules/auth/router.py`:
1. `POST /auth/register/patient` — validate phone, send OTP via SMS, store in Redis with TTL
2. `POST /auth/verify-otp` — check OTP from Redis, create patient record, return tokens
3. `POST /auth/login` — for hospital staff + doctors (email/password)
4. `POST /auth/refresh` — validate refresh token from Redis, rotate, return new pair
5. `POST /auth/logout` — add JTI to Redis blacklist, delete refresh token

### Step 10: RBAC Dependencies
```python
# app/core/dependencies.py
# FastAPI Depends:
# - get_current_patient(token) → Patient
# - get_current_hospital_staff(token) → HospitalStaff
# - get_current_doctor(token) → Doctor
# - require_role(*roles) → dependency factory
```

---

## PHASE 3: Core APIs

### Step 11: Patient APIs
`app/modules/patients/router.py`:
- `GET /patients/me` — return own profile
- `PATCH /patients/me` — update non-medical fields
- `GET /patients/me/timeline` — see Step 14

### Step 12: Hospital Admin APIs
`app/modules/hospitals/router.py`:
- `GET /hospital/patients/lookup?phone=&dob=` — find patient by phone + DOB match
- Returns: `{patient_id, full_name, masked_dob}` — no full medical data

### Step 13: Record Upload APIs
Build one router per record type under `app/modules/records/`:

**Lab Result Upload:**
```python
# POST /hospital/records/lab
# Body: LabResultUploadSchema
#   - patient_id, record_date, test_parameters: [{test_name, result_value, unit, ref_min, ref_max}]
#   - optional: file (multipart)
# Logic:
#   1. Verify patient exists
#   2. Create MedicalRecord row
#   3. Bulk insert LabResult rows (one per parameter)
#   4. If file: upload to S3 (via upload pipeline), store key
#   5. Enqueue notification task
#   6. Return created record summary
```

Repeat same pattern for Prescription, Discharge, Follow-Up uploads.

### Step 14: Patient Timeline API
```python
# GET /patients/me/timeline
# Query params: type, hospital_id, from_date, to_date, page, page_size
# Logic:
#   1. Check Redis cache key: timeline:{patient_id}:{param_hash}
#   2. On miss: query medical_records JOIN specific tables by record_type
#   3. Sort by record_date DESC
#   4. Paginate
#   5. For each record with file_key: generate pre-signed URL (15min TTL)
#   6. Cache result (5min TTL), return
```

---

## PHASE 4: File Upload Pipeline

### Step 15: Secure Upload Flow
```python
# app/core/file_upload.py
async def handle_record_file_upload(file: UploadFile, patient_id: str, record_id: str):
    # 1. Validate MIME type with python-magic (not just extension)
    # 2. Check file size < 20MB
    # 3. Write to S3 under temp prefix: records/tmp/{record_id}/{filename}
    # 4. Enqueue ClamAV scan task
    # 5. Return temp_key (record updated to final key after scan passes)

# app/workers/tasks.py
@celery_app.task
def scan_and_move_file(temp_key, final_key, record_id):
    # 1. Download from S3 temp location
    # 2. Run ClamAV scan (subprocess or pyclamd)
    # 3. If clean: move to final key, update medical_records.file_key
    # 4. If infected: delete, mark record file_status='rejected', alert ops
```

---

## PHASE 5: Sharing System

### Step 16: Share Token Lifecycle
```python
# POST /sharing
# 1. Validate doctor exists + is at a partner hospital
# 2. Generate crypto-random token (secrets.token_urlsafe(64))
# 3. Store in PostgreSQL sharing_tokens table
# 4. Mirror in Redis: SET share:{token} "{share_id}" EX {ttl_seconds}
# 5. Notify doctor via push/email

# GET /sharing/{token}/records (doctor access)
# 1. Check Redis first (fast revocation check)
# 2. Validate token in PostgreSQL (not revoked, not expired)
# 3. Resolve scope (all records or specific record_ids)
# 4. Query and return records
# 5. Write access event to audit_log
# 6. If single_use: revoke immediately after return

# DELETE /sharing/{share_id} (patient revokes)
# 1. Set sharing_tokens.revoked_at = NOW()
# 2. Delete from Redis (immediate effect)
```

---

## PHASE 6: Medication & Follow-Up Tracking

### Step 17: Auto-Schedule Creation
```python
# On prescription upload → trigger create_medication_schedules()
# For each PrescriptionItem with duration_days:
#   1. Parse frequency string → list of daily times
#      e.g., "twice daily" → ["08:00", "20:00"]
#   2. Create MedicationSchedule row
#   3. Pre-generate MedicationLog rows for next 7 days (backfill on cron)
```

### Step 18: Daily Reminder Scheduler
```python
# Celery beat task: every day at 07:00 local
@celery_app.task
def generate_daily_medication_logs():
    # For all active schedules with no log for tomorrow
    # Bulk insert MedicationLog rows with status='pending'

# Celery beat task: 30min before each scheduled dose time
@celery_app.task
def send_medication_reminder(log_id):
    # Fetch patient FCM token
    # Send push notification: "Time to take {drug_name} {dosage}"

# Follow-up reminder: 24h before scheduled_date
@celery_app.task
def send_followup_reminder(followup_id):
    # Fetch patient + follow_up details
    # Send push + optional SMS
```

### Step 19: Tracking Endpoints
```python
# GET /tracking/medications — today's schedule with log status
# POST /tracking/medications/{log_id}/log
#   Body: {status: "taken"|"missed"|"skipped", note: ""}
#   1. Update medication_logs.status + logged_at
#   2. Compute adherence % (last 7 days) → store in Redis for quick read

# GET /tracking/followups — upcoming follow-ups sorted by date
# PATCH /tracking/followups/{id} — mark attended / rescheduled
```

---

## PHASE 7: Testing Strategy

### Step 20: Test Structure
```
tests/
├── unit/
│   ├── test_security.py        # JWT, password hashing
│   ├── test_timeline.py        # Aggregation logic
│   └── test_sharing.py         # Token lifecycle
├── integration/
│   ├── test_auth_flow.py       # Register → login → refresh → logout
│   ├── test_record_upload.py   # Hospital uploads → patient sees timeline
│   ├── test_share_flow.py      # Patient shares → doctor reads → revoke
│   └── test_medication.py      # Schedule creation → log → reminder
└── conftest.py                 # Async test DB, fixtures
```

### Step 21: Test Configuration
```python
# conftest.py
# Use pytest-asyncio with separate test DB
# Factory fixtures: make_patient(), make_hospital(), make_record()
# Mock S3 with moto or mock_aws
# Mock SMS/push notifications in all tests
```

**Coverage target:** 80% minimum on `app/modules/`

---

## PHASE 8: Deployment

### Step 22: Production Infrastructure
```
AWS Stack:
- ECS Fargate (API containers) — auto-scaling group min 2, max 10
- RDS PostgreSQL 15 Multi-AZ — automated backups, 7-day retention
- ElastiCache Redis Cluster Mode
- S3 + CloudFront with signed URLs
- SQS (alternative to Redis for Celery in prod)
- ECS task for Celery workers (separate task definition)
- Secrets Manager for all credentials

CI/CD:
- GitHub Actions → build → test → push ECR → deploy ECS
- Alembic migrations run as ECS task before new task definition goes live
- Rollback: keep previous task definition tagged
```

### Step 23: Observability
```
- Structured JSON logging via structlog → CloudWatch Logs
- AWS X-Ray tracing on all API routes
- Custom CloudWatch metrics: record_upload_count, share_create_count, medication_log_rate
- Alerts: p95 API latency > 500ms, error rate > 1%, DB CPU > 80%
- Sentry for exception tracking
```

### Step 24: Pre-Launch Checklist
- [ ] Alembic migration tested on staging DB with production-like data volume
- [ ] S3 bucket policy: private, no public ACLs, versioning enabled
- [ ] All JWT secrets rotated from dev keys
- [ ] Rate limiting validated under load test (locust)
- [ ] ClamAV scan integration tested with EICAR test file
- [ ] Audit log retention policy set (minimum 2 years)
- [ ] CORS origins locked to production frontend domain
- [ ] Refresh token rotation tested (old token reuse = immediate invalidation)
- [ ] Share token expiry tested (expired token returns 401, not 404)
- [ ] Doctor cannot access records beyond share scope
- [ ] Hospital staff cannot access other hospitals' upload history
```

---

## Dependency Summary

| Dependency | Version | Purpose |
|-----------|---------|---------|
| fastapi | 0.110+ | Web framework |
| sqlalchemy | 2.0+ | Async ORM |
| asyncpg | 0.29+ | PostgreSQL async driver |
| alembic | 1.13+ | DB migrations |
| pydantic | 2.0+ | Data validation |
| redis | 5.0+ | Cache + token store |
| celery | 5.3+ | Task queue |
| python-jose | 3.3+ | JWT |
| passlib | 1.7+ | Password hashing |
| boto3 | 1.34+ | S3 integration |
| python-magic | 0.4+ | MIME validation |
| structlog | 24+ | Structured logging |
| pytest-asyncio | 0.23+ | Async testing |

---

*Document version: 1.0 — Phase 1 scope*
*Last updated: 2026-04*