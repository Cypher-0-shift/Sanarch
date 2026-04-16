import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def set_otp(phone: str, otp: str):
    # Store OTP with TTL
    await redis_client.setex(f"otp:{phone}", settings.OTP_TTL, otp)

async def get_otp(phone: str) -> str:
    return await redis_client.get(f"otp:{phone}")

async def delete_otp(phone: str):
    await redis_client.delete(f"otp:{phone}")

async def blacklist_token(jti: str, ttl: int):
    await redis_client.setex(f"blacklist:{jti}", ttl, "true")

async def is_token_blacklisted(jti: str) -> bool:
    return await redis_client.exists(f"blacklist:{jti}") > 0
