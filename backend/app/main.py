from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title="SMART Health System API",
    description="API for SMART Integrated Health Care System",
    version="1.0.0"
)

from app.modules.auth.router import router as auth_router
from app.modules.patients.router import router as patients_router
from app.modules.hospitals.router import router as hospitals_router
from app.modules.records.router import router as records_router
from app.modules.sharing.router import router as sharing_router
from app.modules.tracking.router import router as tracking_router

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": "development"}

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(patients_router, prefix="/api/v1/patients", tags=["patients"])
app.include_router(hospitals_router, prefix="/api/v1/hospital", tags=["hospitals"])
app.include_router(records_router, prefix="/api/v1/hospital/records", tags=["records"])
app.include_router(sharing_router, prefix="/api/v1/sharing", tags=["sharing"])
app.include_router(tracking_router, prefix="/api/v1/tracking", tags=["tracking"])
