# app/config.py
from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str
    db_pool_size: int = 3
    db_max_overflow: int = 5
    db_pool_timeout: int = 30

    # Redis
    redis_url: str

    # Auth — use HS256 for your own JWTs, Firebase for phone OTP
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days
    access_token_expire_minutes: int = 60

    # Extraction
    groq_api_key: str
    azure_di_endpoint: str = ""
    azure_di_key: str = ""

    # Backblaze B2
    b2_key_id: str
    b2_application_key: str
    b2_bucket_name: str
    b2_endpoint_url: str

    # Firebase
    firebase_project_id: str
    firebase_service_account_path: str = ""
    firebase_service_account_base64: Optional[str] = None

    # ClamAV
    clamd_host: str = "localhost"
    clamd_port: int = 3310
    clamd_timeout: int = 60  # seconds — NEW
    clamav_enabled: bool = True
    skip_virus_scan: bool = False

    # App
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"
    max_upload_size_mb: int = 20
    dev_mode_enabled: bool = False  # MUST be False in production
    max_share_token_minutes: int = 10
    allowed_file_extensions: str = ".pdf,.jpg,.jpeg,.png"

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.environment == "production":
            if self.dev_mode_enabled:
                raise ValueError("dev_mode_enabled must be False in production")
            if "*" in self.allowed_origins:
                raise ValueError("Wildcard CORS origin not allowed in production")
            if "localhost" in self.allowed_origins.lower() or "127.0.0.1" in self.allowed_origins:
                raise ValueError("Localhost CORS origin not allowed in production")
        return self

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_extensions_set(self) -> set:
        return {ext.strip().lower() for ext in self.allowed_file_extensions.split(",")}

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

settings = Settings()