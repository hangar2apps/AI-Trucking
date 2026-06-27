"""Reply to inbound customer / driver inquiries with grounded fleet context.

Matches the sender's email (and optional load hints in the message) to active
loads, then uses Claude to infer intent — even when the message is vague —
and draft a clear, professional reply.
"""

from __future__ import annotations

import re
from typing import Literal

import anthropic
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.agent.email_agent import build_load_context
from app.config import get_settings
from app.models import Load, Truck

settings = get_settings()

_LOAD_REF = re.compile(r"\bLD-\d+\b", re.IGNORECASE)


def driver_demo_email(driver_name: str) -> str:
    parts = driver_name.lower().split()
    if len(parts) < 2:
        return f"{parts[0]}@drivers.aurorafreight.example"
    return f"{parts[0]}.{parts[-1]}@drivers.aurorafreight.example"


def _load_ref_from_message(message: str) -> str | None:
    match = _LOAD_REF.search(message)
    return match.group(0).upper() if match else None


def infer_sender_role(db: Session, from_email: str) -> Literal["customer", "driver"]:
    """Detect whether the sender is a known customer or driver by email."""
    email = from_email.strip().lower()
    loads = _fetch_loads(db)
    if any(load.customer.email.lower() == email for load in loads):
        return "customer"
    trucks = list(db.scalars(select(Truck)))
    if any(driver_demo_email(t.driver_name) == email for t in trucks):
        return "driver"
    return "customer"


def _fetch_loads(db: Session) -> list[Load]:
    return list(
        db.scalars(
            select(Load)
            .options(joinedload(Load.customer), joinedload(Load.truck))
            .order_by(Load.deliver_by)
        )
    )


def resolve_loads_for_inquiry(
    db: Session,
    *,
    from_email: str,
    role: Literal["customer", "driver"],
    message: str,
) -> tuple[list[Load], str | None]:
    """Return candidate loads and an optional match note for the model."""
    email = from_email.strip().lower()
    loads = _fetch_loads(db)
    hinted_ref = _load_ref_from_message(message)

    if role == "customer":
        matched = [load for load in loads if load.customer.email.lower() == email]
        note = f"Sender is a known customer on {len(matched)} load(s)."
    else:
        trucks = list(db.scalars(select(Truck)))
        truck_ids = {
            t.id
            for t in trucks
            if driver_demo_email(t.driver_name) == email
        }
        matched = [load for load in loads if load.assigned_truck_id in truck_ids]
        note = f"Sender matches driver email for {len(matched)} assigned load(s)."

    if hinted_ref:
        ref_matches = [load for load in loads if load.reference.upper() == hinted_ref]
        if ref_matches:
            matched = ref_matches if not matched else [load for load in matched if load in ref_matches] or ref_matches
            note = (note or "") + f" Message mentions {hinted_ref}."

    if not matched and hinted_ref:
        matched = [load for load in loads if load.reference.upper() == hinted_ref]
        note = f"No email match; using load reference {hinted_ref} from message."

    if not matched:
        note = "No load matched by email or reference — reply may ask for clarification."

    return matched, note


class InquiryReplyDraft:
    __slots__ = (
        "matched_load_id",
        "load_reference",
        "recipient_name",
        "recipient_email",
        "recipient_role",
        "inferred_intent",
        "confidence",
        "needs_clarification",
        "clarifying_questions",
        "reply_subject",
        "reply_body",
        "internal_summary",
    )

    def __init__(self, **kwargs: object) -> None:
        for key in self.__slots__:
            setattr(self, key, kwargs.get(key))


_INQUIRY_REPLY_SCHEMA = {
    "type": "object",
    "properties": {
        "matched_load_reference": {"type": ["string", "null"]},
        "inferred_intent": {"type": "string"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "needs_clarification": {"type": "boolean"},
        "clarifying_questions": {"type": "array", "items": {"type": "string"}},
        "reply_subject": {"type": "string"},
        "reply_body": {"type": "string"},
        "internal_summary": {"type": "string"},
    },
    "required": [
        "inferred_intent",
        "confidence",
        "needs_clarification",
        "clarifying_questions",
        "reply_subject",
        "reply_body",
        "internal_summary",
    ],
    "additionalProperties": False,
}


def draft_inquiry_reply(
    db: Session,
    *,
    from_email: str,
    role: Literal["customer", "driver"],
    message: str,
    sender_name: str = "",
) -> InquiryReplyDraft:
    loads, match_note = resolve_loads_for_inquiry(
        db, from_email=from_email, role=role, message=message
    )

    fleet_context = "\n\n---\n\n".join(build_load_context(load) for load in loads[:5]) or "No loads matched."

    role_label = "customer (shipper)" if role == "customer" else "driver (assigned truck operator)"
    sender_line = sender_name.strip() or from_email.strip()

    system = f"""\
You are the AI operations assistant for {settings.company_name}. You read inbound \
messages from customers and drivers, infer what they need even when the wording is \
vague or incomplete, and draft a helpful reply email.

Rules:
- Ground every claim in the fleet data provided. Do not invent ETAs, truck names, or statuses.
- If the message is unclear, set needs_clarification=true and ask 1–2 specific questions \
while still providing whatever status you CAN confirm from the data.
- Write warmly and professionally. Sign off as "The {settings.company_name} Team".
- reply_body is the email the recipient receives; internal_summary is for dispatch only.
- Pick matched_load_reference from the load list when confident; otherwise null."""

    user_content = f"""\
Inbound message
---------------
From: {sender_line} <{from_email.strip()}>
Role: {role_label}
Message:
{message.strip()}

Matching note: {match_note}

Fleet data (candidate loads):
{fleet_context}

Draft a reply email to {from_email.strip()}."""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=settings.email_model,
        max_tokens=1400,
        system=system,
        messages=[{"role": "user", "content": user_content}],
        tools=[
            {
                "name": "inquiry_reply",
                "description": "Structured inquiry reply",
                "input_schema": _INQUIRY_REPLY_SCHEMA,
            }
        ],
        tool_choice={"type": "tool", "name": "inquiry_reply"},
    )

    block = next(b for b in response.content if b.type == "tool_use")
    parsed = block.input

    chosen_load: Load | None = None
    ref = parsed.get("matched_load_reference")
    if ref:
        chosen_load = next((load for load in loads if load.reference.upper() == str(ref).upper()), None)
        if chosen_load is None:
            chosen_load = next(
                (load for load in _fetch_loads(db) if load.reference.upper() == str(ref).upper()),
                None,
            )
    if chosen_load is None and len(loads) == 1:
        chosen_load = loads[0]

    recipient_name = sender_name.strip() or (
        chosen_load.customer.name if role == "customer" and chosen_load else sender_line.split("@")[0]
    )
    if role == "driver" and chosen_load and chosen_load.truck:
        recipient_name = chosen_load.truck.driver_name

    return InquiryReplyDraft(
        matched_load_id=chosen_load.id if chosen_load else None,
        load_reference=chosen_load.reference if chosen_load else None,
        recipient_name=recipient_name,
        recipient_email=from_email.strip(),
        recipient_role=role,
        inferred_intent=parsed["inferred_intent"],
        confidence=parsed["confidence"],
        needs_clarification=parsed["needs_clarification"],
        clarifying_questions=parsed.get("clarifying_questions") or [],
        reply_subject=parsed["reply_subject"],
        reply_body=parsed["reply_body"],
        internal_summary=parsed["internal_summary"],
    )
