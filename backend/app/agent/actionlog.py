"""Unified action logging across every agent capability.

Writes an `AgentAction` row to the local capability store — the structured,
queryable log the Activity page reads. Caller owns the commit; this only stages
the row. (The existing /events feed on the main DB is left untouched.)
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.cap_models import AgentAction


def log_action(
    cap_db: Session,
    *,
    capability: str,
    action: str,
    result: str = "ok",
    load_id: int | None = None,
    load_ref: str | None = None,
    confidence: str | None = None,
    summary: str | None = None,
    data: dict[str, Any] | None = None,
) -> AgentAction:
    """Record one capability action in the local action log. Returns the row."""
    payload = dict(data or {})
    if summary:
        payload.setdefault("summary", summary)
    entry = AgentAction(
        capability=capability,
        action=action,
        result=result,
        load_id=load_id,
        load_ref=load_ref,
        confidence=confidence,
        data=payload or None,
    )
    cap_db.add(entry)
    return entry
