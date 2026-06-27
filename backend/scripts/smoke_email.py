"""Smoke-test the thinnest AI vertical end to end.

Usage (needs ANTHROPIC_API_KEY in env or .env):
    uv run python scripts/smoke_email.py            # defaults to load LD-1042
    uv run python scripts/smoke_email.py LD-1043

Prints the drafted customer email so you can eyeball the brain before wiring
it into the dashboard.
"""

from __future__ import annotations

import sys

from sqlalchemy import select

from app.agent.email_agent import draft_status_email
from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.models import Load
from app.seed import seed


def main() -> None:
    reference = sys.argv[1] if len(sys.argv) > 1 else "LD-1042"

    if not get_settings().anthropic_api_key:
        sys.exit("ANTHROPIC_API_KEY is not set — add it to .env first.")

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
        load = db.scalar(select(Load).where(Load.reference == reference))
        if load is None:
            sys.exit(f"No load {reference!r} found.")

        print(f"Drafting email for {reference} ({load.status.value})...\n")
        draft = draft_status_email(load)

        print(f"To:      {load.customer.name} <{load.customer.email}>")
        print(f"Subject: {draft.subject}\n")
        print(draft.body)
        print("\n--- internal summary ---")
        print(draft.internal_summary)


if __name__ == "__main__":
    main()
