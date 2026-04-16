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

# Clean up PEM strings (remove surrounding quotes from repr and fix newlines)
if settings.JWT_PRIVATE_KEY.startswith("'") and settings.JWT_PRIVATE_KEY.endswith("'"):
    settings.JWT_PRIVATE_KEY = settings.JWT_PRIVATE_KEY[1:-1].replace("\\n", "\n")
if settings.JWT_PUBLIC_KEY.startswith("'") and settings.JWT_PUBLIC_KEY.endswith("'"):
    settings.JWT_PUBLIC_KEY = settings.JWT_PUBLIC_KEY[1:-1].replace("\\n", "\n")
