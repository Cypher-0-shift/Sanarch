from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
import random
import string
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "RS256"

def create_access_token(subject: Union[str, Any], role: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.ACCESS_TOKEN_TTL)
    to_encode = {"exp": expire, "sub": str(subject), "role": role}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_PRIVATE_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.REFRESH_TOKEN_TTL)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_PRIVATE_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_PUBLIC_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))
