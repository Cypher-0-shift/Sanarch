from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"), 
    echo=False, 
    future=True
)

# Async session factory
async_session_factory = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get a database session.
    """
    async with async_session_factory() as session:
        yield session
