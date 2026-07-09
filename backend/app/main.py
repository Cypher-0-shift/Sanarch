# app/main.py
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.logging_config import setup_logging, logger
from app.firestore import check_db_connection
from app.routers import documents, auth, users, timeline, sharing, search, patients, profiles, doctor_view

setup_logging("DEBUG" if settings.environment == "development" else "INFO")

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting Sanarch API — environment: {settings.environment}")
    
    # DB check
    if not check_db_connection():
        logger.error("FATAL: Cannot connect to database on startup")
        # In production, fail fast
        if settings.environment == "production":
            raise RuntimeError("Database unavailable on startup")
    
    # Redis check
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        logger.info("Redis: connected")
    except Exception as e:
        logger.warning(f"Redis unavailable on startup: {e}")
    
    logger.info("Sanarch API ready")
    yield
    
    # Shutdown
    logger.info("Sanarch API shutting down gracefully")
    # Firestore client does not require explicit connection pool disposal
    logger.info("Database connection closed")

app = FastAPI(
    title="Sanarch API",
    version="1.0.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — never use wildcard with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        # Only add HSTS in production
        if "production" in str(request.url):
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Global exception handler — never leak stack traces to client
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}",
        exc_info=exc,
        extra={"request_id": request_id}
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": request_id}
    )

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(documents.router)
app.include_router(timeline.router)
app.include_router(sharing.router)
app.include_router(search.router)
app.include_router(profiles.router)
app.include_router(doctor_view.router)

@app.get("/health", tags=["health"])
async def health():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "environment": settings.environment,
    }

@app.get("/ready", tags=["health"])
def readiness_check():
    checks = {}

    # DB
    checks["database"] = "ok" if check_db_connection() else "fail"

    # Redis
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "fail"

    # ClamAV
    try:
        import socket
        s = socket.socket()
        s.settimeout(3)
        s.connect((settings.clamd_host, settings.clamd_port))
        s.sendall(b"zPING\0")
        resp = s.recv(64).decode().strip("\0").strip()
        s.close()
        checks["clamav"] = "ok" if resp == "PONG" else "degraded"
    except Exception:
        checks["clamav"] = "degraded"  # non-fatal — app can run without it

    all_critical_ok = (
        checks["database"] == "ok" and
        checks["redis"] == "ok"
    )

    return JSONResponse(
        status_code=200 if all_critical_ok else 503,
        content={
            "status": "ready" if all_critical_ok else "not_ready",
            "checks": checks,
        }
    )