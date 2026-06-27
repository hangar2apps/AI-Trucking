"""Smoke-test the email vertical against the live database.

Usage (needs ANTHROPIC_API_KEY + DATABASE_URL in .env):
    uv run python scripts/smoke_email.py            # defaults to load LD-1042
    uv run python scripts/smoke_email.py LD-1043

Reads the load from whatever DATABASE_URL points at (Supabase) and prints the
drafted customer email. Does not create or seed — the database is the source
of truth (see sql/seed_supabase.sql).
"""

from __future__ import annotations

import sys

from sqlalchemy import select

from app.agent.email_agent import draft_status_email
from app.config import get_settings
from app.db import SessionLocal
from app.models import Load


def main() -> None:
    reference = sys.argv[1] if len(sys.argv) > 1 else "LD-1042"

    if not get_settings().anthropic_api_key:
        sys.exit("ANTHROPIC_API_KEY is not set — add it to .env first.")

    with SessionLocal() as db:
        load = db.scalar(select(Load).where(Load.reference == reference))
        if load is None:
            sys.exit(f"No load {reference!r} found — is the database seeded?")

        print(f"Drafting email for {reference} ({load.status.value})...\n")
        draft = draft_status_email(load)

        print(f"To:      {load.customer.name} <{load.customer.email}>")
        print(f"Subject: {draft.subject}\n")
        print(draft.body)
        print("\n--- internal summary ---")
        print(draft.internal_summary)


if __name__ == "__main__":
    main()
