"""Apply supabase/schema.sql to the Postgres database from backend DATABASE_URL."""

from __future__ import annotations

import sys
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "supabase" / "schema.sql"


def normalize_db_url(url: str) -> str:
    if url.startswith("postgresql+psycopg://"):
        return "postgresql://" + url.removeprefix("postgresql+psycopg://")
    return url


def main() -> int:
    sys.path.insert(0, str(ROOT / "backend"))
    from app.config import get_settings

    settings = get_settings()
    url = normalize_db_url(settings.database_url)
    if not url.startswith("postgresql"):
        print("SKIP: DATABASE_URL is not Postgres — run schema.sql manually in Supabase SQL Editor.")
        return 0

    if not SCHEMA_PATH.exists():
        print(f"FAIL: missing {SCHEMA_PATH}")
        return 1

    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    print(f"Applying {SCHEMA_PATH.name} via DATABASE_URL ...")

    with psycopg.connect(url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)

    print("PASS: schema applied")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
