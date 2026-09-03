import os
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend_api"))
from models.orm import Base

load_dotenv()

logger = logging.getLogger("landsafe.database")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./landsafe_ner.db")
is_sqlite = DATABASE_URL.startswith("sqlite")

try:
    if is_sqlite:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=False
        )
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=False
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("Connected successfully to PostgreSQL/PostGIS database.")
except Exception as e:
    logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to local SQLite: landsafe_ner.db")
    DATABASE_URL = "sqlite:///./landsafe_ner.db"
    is_sqlite = True
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """Dependency for getting DB session in FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_using_sqlite() -> bool:
    return is_sqlite
