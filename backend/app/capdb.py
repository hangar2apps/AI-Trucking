"""Local SQLite store for the multi-capability agent's own data.

Fleet data (loads, trucks, customers, events) lives in the app's main database
(Supabase Postgres). The new capabilities — documents, invoices, inspections,
the approval queue, and the unified action log — are kept LOCAL on disk per the
project decision (no Supabase, filesystem-backed). This is a separate engine /
session so it never touches the main DB.
"""

from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

_DB_PATH = Path(__file__).resolve().parents[1] / "ai_assistant.db"

cap_engine = create_engine(
    f"sqlite:///{_DB_PATH}",
    connect_args={"check_same_thread": False},
    echo=False,
)
CapSessionLocal = sessionmaker(bind=cap_engine, autoflush=False, autocommit=False)


class CapBase(DeclarativeBase):
    pass


def init_cap_db() -> None:
    """Create the local capability tables if they don't exist yet."""
    import app.cap_models  # noqa: F401 — register models on CapBase

    CapBase.metadata.create_all(bind=cap_engine)


def get_cap_db() -> Generator[Session, None, None]:
    db = CapSessionLocal()
    try:
        yield db
    finally:
        db.close()
