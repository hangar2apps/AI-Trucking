"""Central capability router — one agent, many capabilities.

Receives a typed event (late_load_detected, document_received, email_received,
photo_uploaded) and dispatches it to the right capability. Capabilities may
return `next_events`, which the router processes in sequence so capabilities
chain together (e.g. photo -> inspection -> POD -> invoice -> email).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from app.agent import customer_comms, document_agent, image_agent
from app.agent.brain import run_agent

EVENT_TYPES = (
    "late_load_detected",
    "document_received",
    "email_received",
    "photo_uploaded",
)


@dataclass
class AgentEvent:
    type: str
    payload: dict[str, Any] = field(default_factory=dict)


def _coerce(event: Any) -> AgentEvent:
    if isinstance(event, AgentEvent):
        return event
    if isinstance(event, dict):
        return AgentEvent(type=event.get("type", ""), payload=event.get("payload", {}) or {})
    raise ValueError(f"cannot coerce {event!r} to AgentEvent")


def _handle(main_db: Session, cap_db: Session, event: AgentEvent) -> dict[str, Any]:
    """Dispatch a single event to its capability. Returns the capability result."""
    p = event.payload

    if event.type == "late_load_detected":
        situation = p.get("situation") or (
            f"Load {p.get('load_reference', '')} may miss its delivery window. "
            "Investigate and handle it."
        )
        result = run_agent(situation, dry_run=bool(p.get("dry_run", False)))
        return {"capability": "brain", "result": result.model_dump()}

    if event.type == "document_received":
        return {
            "capability": "document",
            "result": document_agent.process_document(
                main_db,
                cap_db,
                file_path=p["file_path"],
                media_type=p["media_type"],
                original_name=p.get("original_name"),
                doc_type_hint=p.get("doc_type_hint"),
                load_hint=p.get("load_hint"),
            ),
        }

    if event.type == "email_received":
        return {
            "capability": "comms",
            "result": customer_comms.process_customer_email(
                main_db,
                cap_db,
                from_email=p["from_email"],
                body=p.get("body", ""),
                subject=p.get("subject", ""),
                from_name=p.get("from_name", ""),
                to_email=p.get("to_email", ""),
                source=p.get("source", "router"),
            ),
        }

    if event.type == "photo_uploaded":
        return {
            "capability": "image",
            "result": image_agent.process_inspection(
                main_db,
                cap_db,
                file_paths=[tuple(f) for f in p["file_paths"]],
                phase=p.get("phase", "delivery"),
                load_hint=p.get("load_hint"),
            ),
        }

    return {"capability": "unknown", "result": {"error": f"unknown event type {event.type!r}"}}


def route_event(main_db: Session, cap_db: Session, event: Any, *, max_chain: int = 6) -> dict[str, Any]:
    """Route an event (and any follow-up events it triggers) through capabilities."""
    queue: list[AgentEvent] = [_coerce(event)]
    processed: list[dict[str, Any]] = []

    while queue and len(processed) < max_chain:
        current = queue.pop(0)
        outcome = _handle(main_db, cap_db, current)
        processed.append({"type": current.type, **outcome})

        # Chaining: explicit follow-ups from the payload, plus any the capability emits.
        follow_ups = list(current.payload.get("then", []) or [])
        follow_ups.extend(outcome.get("result", {}).get("next_events", []) or [])
        for nxt in follow_ups:
            queue.append(_coerce(nxt))

    return {
        "events_processed": len(processed),
        "results": processed,
    }
