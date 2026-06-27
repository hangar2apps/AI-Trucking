"""Process inbound emails (webhook or simulate) and auto-reply with AI."""

from __future__ import annotations

import re
from datetime import datetime
from email.utils import parseaddr
from typing import Any

from sqlalchemy.orm import Session

from app.agent.inquiry_agent import draft_inquiry_reply, infer_sender_role
from app.config import get_settings
from app.models import Event
from app.services.email_send import send_customer_email

_SUBJECT_RE = re.compile(r"^re:\s*", re.IGNORECASE)


def parse_from_header(raw: str) -> tuple[str, str]:
    """Parse 'Name <email@x.com>' into (name, email)."""
    name, addr = parseaddr(raw.strip())
    if not addr and "@" in raw:
        return "", raw.strip()
    return name.strip(), addr.strip().lower()


def _compose_message(*, subject: str, body: str) -> str:
    parts: list[str] = []
    if subject.strip():
        parts.append(f"Subject: {subject.strip()}")
    if body.strip():
        parts.append(body.strip())
    return "\n\n".join(parts) if parts else body.strip()


def _reply_subject(inbound_subject: str, drafted_subject: str) -> str:
    if inbound_subject.strip() and _SUBJECT_RE.match(inbound_subject.strip()):
        base = _SUBJECT_RE.sub("", inbound_subject.strip())
        return f"Re: {base}"
    if drafted_subject.strip().lower().startswith("re:"):
        return drafted_subject.strip()
    if inbound_subject.strip():
        return f"Re: {inbound_subject.strip()}" if not drafted_subject else drafted_subject
    return drafted_subject


def process_inbound_email(
    db: Session,
    *,
    from_email: str,
    body: str,
    subject: str = "",
    from_name: str = "",
    to_email: str = "",
    source: str = "webhook",
    auto_send: bool = True,
) -> dict[str, Any]:
    """Understand an inbound email and optionally send an AI-crafted auto-reply."""
    settings = get_settings()
    sender_name, sender_email = parse_from_header(from_email)
    if not sender_email:
        sender_email = from_email.strip().lower()
    if from_name.strip():
        sender_name = from_name.strip()

    role = infer_sender_role(db, sender_email)
    message = _compose_message(subject=subject, body=body)
    draft = draft_inquiry_reply(
        db,
        from_email=sender_email,
        role=role,
        message=message,
        sender_name=sender_name,
    )

    reply_subject = _reply_subject(subject, draft.reply_subject)
    auto_reply_sent = False
    send_message = "Auto-reply disabled (inbound_auto_reply_enabled=false)."

    should_send = auto_send and settings.inbound_auto_reply_enabled
    if should_send:
        auto_reply_sent, send_message = send_customer_email(
            to_email=draft.recipient_email,
            subject=reply_subject,
            body=draft.reply_body,
            in_reply_to=subject.strip() or None,
        )

    inbox_to = to_email.strip() or settings.ai_inbox_email or settings.from_email
    summary = (
        f"Inbound from {sender_email} — AI auto-reply {'sent' if auto_reply_sent else 'not sent'}"
    )

    event = Event(
        kind="inbound_email",
        load_id=draft.matched_load_id,
        summary=summary,
        data={
            "source": source,
            "from_email": sender_email,
            "from_name": sender_name or draft.recipient_name,
            "to_email": inbox_to,
            "subject": subject.strip(),
            "body": body.strip(),
            "inferred_role": role,
            "inferred_intent": draft.inferred_intent,
            "confidence": draft.confidence,
            "needs_clarification": draft.needs_clarification,
            "clarifying_questions": draft.clarifying_questions,
            "load_reference": draft.load_reference,
            "auto_reply_subject": reply_subject,
            "auto_reply_body": draft.reply_body,
            "auto_reply_sent": auto_reply_sent,
            "send_message": send_message,
            "internal_summary": draft.internal_summary,
            "processed_at": datetime.now().isoformat(),
        },
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "event_id": event.id,
        "from_email": sender_email,
        "from_name": sender_name or draft.recipient_name,
        "to_email": inbox_to,
        "subject": subject.strip(),
        "body": body.strip(),
        "inferred_role": role,
        "matched_load_id": draft.matched_load_id,
        "load_reference": draft.load_reference,
        "inferred_intent": draft.inferred_intent,
        "confidence": draft.confidence,
        "needs_clarification": draft.needs_clarification,
        "clarifying_questions": draft.clarifying_questions,
        "reply_subject": reply_subject,
        "reply_body": draft.reply_body,
        "internal_summary": draft.internal_summary,
        "auto_reply_sent": auto_reply_sent,
        "send_message": send_message,
        "model": settings.email_model,
    }


def parse_resend_inbound_webhook(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Extract inbound email fields from a Resend `email.received` webhook payload."""
    event_type = payload.get("type", "")
    if event_type and event_type != "email.received":
        return None

    data = payload.get("data") or payload
    raw_from = str(data.get("from") or data.get("sender") or "")
    _, from_email = parse_from_header(raw_from)
    if not from_email:
        return None

    to_list = data.get("to") or data.get("recipients") or []
    to_email = to_list[0] if isinstance(to_list, list) and to_list else str(to_list or "")

    attachments_raw = data.get("attachments") or []
    attachments: list[dict[str, Any]] = []
    if isinstance(attachments_raw, list):
        for att in attachments_raw:
            if isinstance(att, dict):
                attachments.append(att)

    return {
        "from_raw": raw_from,
        "from_email": from_email,
        "to_email": to_email,
        "subject": str(data.get("subject") or ""),
        "body": str(data.get("text") or data.get("body") or data.get("html") or ""),
        "attachments": attachments,
    }
