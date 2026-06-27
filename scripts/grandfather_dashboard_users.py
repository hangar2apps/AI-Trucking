"""One-time: enable dashboard access for Supabase users who existed before the provisioning gate.

New sign-ups after this runs still get operations_available = false from handle_new_user().
Run once: uv run python scripts/grandfather_dashboard_users.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))


def normalize_db_url(url: str) -> str:
    if url.startswith("postgresql+psycopg://"):
        return "postgresql://" + url.removeprefix("postgresql+psycopg://")
    return url


def main() -> int:
    from app.config import get_settings

    url = normalize_db_url(get_settings().database_url)
    if not url.startswith("postgresql"):
        print("SKIP: DATABASE_URL is not Postgres.")
        return 0

    sql = """
    insert into public.profiles (id, full_name, operations_available)
    select
      u.id,
      coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
      true
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null;

    update public.profiles
    set operations_available = true, updated_at = now()
    where operations_available = false;
    """

    with psycopg.connect(url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            print(f"Profiles updated: {cur.rowcount} (last statement)")

    print("PASS: existing Supabase auth users can access Dashboard / Intelligence.")
    print("NOTE: New sign-ups still start on /app/welcome until you enable them in SQL.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
