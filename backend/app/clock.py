"""Single source of 'now' for the app.

All DB timestamps are naive-UTC (the Supabase seed uses `now()::timestamp`, which
is UTC). Mixing `datetime.now()` (local) with those corrupts lateness math, so
everything that compares against stored times must use `utcnow()`.
"""

from __future__ import annotations

from datetime import datetime, timezone


def utcnow() -> datetime:
    """Current time as a naive UTC datetime (matches stored timestamps)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
