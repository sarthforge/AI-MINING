from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


if not settings.supabase_db_url:
    engine = None
    SessionLocal = None
else:
    engine = create_engine(settings.supabase_db_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("SUPABASE_DB_URL is not set")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
