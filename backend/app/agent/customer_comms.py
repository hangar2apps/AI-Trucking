"""Customer communication capability: intent routing + proactive milestones.

Extends the existing inbound auto-reply (which we reuse verbatim for status
questions) with intent classification and routing:
  - status question  -> existing auto-reply (unchanged behavior)
  - complaint        -> escalate to a human (approval queue)
  - document request -> pull the latest document for the load and send it
  - appointment      -> draft a scheduling reply and send if confident

Also sends proactive milestone emails (picked up, in transit, 2h out, delivered).
"""

from __future__ import annotations

from typing import Any

import anthropic
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent import approvals
from app.agent.actionlog import log_action
from app.agent.inbound_attachments import (
    process_inbound_attachments,
    summarize_attachment_results,
)
from app.agent.policy import decide
from app.cap_models import Document
from app.config import get_settings
from app.models import Load
from app.services.email_send import send_customer_email
from app.services.inbound_processor import process_inbound_email

_INTENTS = ["status_question", "complaint", "document_request", "appointment", "other"]

_CLASSIFY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "intent": {"type": "string", "enum": _INTENTS},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "rationale": {"type": "string"},
    },
    "required": ["intent", "confidence", "rationale"],
    "additionalProperties": False,
}

_MILESTONES = {
    "picked_up": "has been picked up and is starting its journey",
    "in_transit": "is now in transit",
    "two_hours_out": "is about 2 hours from delivery",
    "delivered": "has been delivered",
}


def classify_intent(subject: str, body: str) -> dict[str, Any]:
    """Categorize an inbound customer email into a routable intent."""
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = f"Subject: {subject}\n\n{body}".strip()
    response = client.messages.create(
        model=settings.email_model,
        max_tokens=400,
        system=(
            "You classify inbound freight-customer emails. status_question = asking "
            "where a load is / its ETA. complaint = unhappy, service failure, demand. "
            "document_request = asking for a POD/BOL/invoice/paperwork. appointment = "
            "scheduling or rescheduling a pickup/delivery time. other = anything else."
        ),
        messages=[{"role": "user", "content": message}],
        tools=[
            {
                "name": "classify",
                "description": "Classify the email intent.",
                "input_schema": _CLASSIFY_SCHEMA,
            }
        ],
        tool_choice={"type": "tool", "name": "classify"},
    )
    block = next((b for b in response.content if b.type == "tool_use"), None)
    return dict(block.input) if block else {"intent": "other", "confidence": "low", "rationale": ""}


def _latest_document(cap_db: Session, load_id: int) -> Document | None:
    return cap_db.scalar(
        select(Document)
        .where(Document.load_id == load_id)
        .order_by(Document.created_at.desc())
        .limit(1)
    )


def process_customer_email(
    main_db: Session,
    cap_db: Session,
    *,
    from_email: str,
    body: str,
    subject: str = "",
    from_name: str = "",
    to_email: str = "",
    source: str = "webhook",
    attachments: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Classify an inbound email and route it to the right handler."""
    settings = get_settings()
    sender_name, sender_email = _parse_sender(from_email, from_name)

    # Attachments first: PDF → document agent, images → inspection agent.
    attachment_results: list[dict[str, Any]] = []
    if attachments:
        attachment_results = process_inbound_attachments(
            main_db,
            cap_db,
            attachments=attachments,
            subject=subject,
            body=body,
        )

    attachment_summary = summarize_attachment_results(attachment_results)
    text_for_intent = body.strip() or attachment_summary

    classification = classify_intent(subject, text_for_intent)
    intent = classification.get("intent", "other")
    confidence = classification.get("confidence", "low")

    # Attachment-only mail: acknowledge processing without a separate intent pass.
    if attachment_results and not body.strip():
        ack_body = (
            f"Hello,\n\n{attachment_summary}\n\n"
            f"If anything looks off, reply to this email and we'll take another look.\n\n"
            f"The {settings.company_name} Team"
        )
        reply_subject = f"Re: {subject}".strip() if subject.strip() else "Attachment processed"
        drafted = process_inbound_email(
            main_db,
            from_email=from_email,
            from_name=from_name,
            body=attachment_summary,
            subject=subject,
            to_email=to_email,
            source=source,
            auto_send=False,
        )
        sent, message = send_customer_email(
            to_email=sender_email,
            subject=reply_subject,
            body=ack_body,
            in_reply_to=subject or None,
        )
        log_action(
            cap_db,
            capability="comms",
            action="attachment_ack",
            result="sent" if sent else "send_failed",
            load_id=drafted.get("matched_load_id"),
            load_ref=drafted.get("load_reference"),
            confidence=confidence,
            summary=f"Auto-processed {len(attachment_results)} attachment(s) from {sender_email}",
            data={"attachment_results": attachment_results, "message": message},
        )
        cap_db.commit()
        drafted["routed_intent"] = "attachment"
        drafted["routing"] = "attachment_processed"
        drafted["reply_subject"] = reply_subject
        drafted["reply_body"] = ack_body
        drafted["auto_reply_sent"] = sent
        drafted["send_message"] = message
        drafted["attachment_results"] = attachment_results
        return drafted

    # Status / other: identical to the existing autonomous auto-reply flow.
    if intent in ("status_question", "other"):
        result = process_inbound_email(
            main_db,
            from_email=from_email,
            from_name=from_name,
            body=_body_with_attachment_summary(body, attachment_summary),
            subject=subject,
            to_email=to_email,
            source=source,
            auto_send=True,
        )
        result["routed_intent"] = intent
        result["routing"] = "auto_reply"
        result["attachment_results"] = attachment_results
        _log_routing(cap_db, intent, confidence, result, "auto_reply")
        return result

    # For the rest, reuse the inbound pipeline to draft + log WITHOUT sending,
    # then apply intent-specific routing.
    drafted = process_inbound_email(
        main_db,
        from_email=from_email,
        from_name=from_name,
        body=_body_with_attachment_summary(body, attachment_summary),
        subject=subject,
        to_email=to_email,
        source=source,
        auto_send=False,
    )
    drafted["routed_intent"] = intent
    drafted["attachment_results"] = attachment_results

    load_id = drafted.get("matched_load_id")
    load_ref = drafted.get("load_reference")
    reply_subject = drafted.get("reply_subject") or f"Re: {subject}".strip()

    if intent == "complaint":
        decision = decide("respond_to_complaint", confidence=confidence)
        payload = {
            "to_email": sender_email,
            "subject": reply_subject,
            "body": drafted.get("reply_body", ""),
            "in_reply_to": subject or None,
        }
        if decision.needs_approval:
            item = approvals.enqueue(
                cap_db,
                action_type="respond_to_complaint",
                capability="comms",
                reason=decision.reason,
                payload=payload,
                load_id=load_id,
                load_ref=load_ref,
                confidence=confidence,
            )
            cap_db.commit()
            drafted["routing"] = "escalated_to_human"
            drafted["approval_item_id"] = item.id
            return drafted

        sent, message = send_customer_email(**payload)
        log_action(
            cap_db,
            capability="comms",
            action="respond_to_complaint",
            result="sent" if sent else "send_failed",
            load_id=load_id,
            load_ref=load_ref,
            confidence=confidence,
            summary=f"Auto-replied to complaint from {sender_email}",
            data={"message": message},
        )
        cap_db.commit()
        drafted["routing"] = "complaint_auto_reply"
        drafted["auto_reply_sent"] = sent
        drafted["send_message"] = message
        return drafted

    if intent == "document_request":
        outcome = _handle_document_request(
            cap_db, from_email=from_email, load_id=load_id, load_ref=load_ref,
            subject=reply_subject, confidence=confidence, fallback=drafted,
        )
        cap_db.commit()
        return {**drafted, **outcome}

    if intent == "appointment":
        sent, message = send_customer_email(
            to_email=from_email,
            subject=reply_subject,
            body=drafted.get("reply_body", ""),
            in_reply_to=subject or None,
        )
        log_action(
            cap_db,
            capability="comms",
            action="appointment_reply",
            result="sent" if sent else "send_failed",
            load_id=load_id,
            load_ref=load_ref,
            confidence=confidence,
            summary=f"Appointment reply to {from_email}",
            data={"message": message},
        )
        cap_db.commit()
        drafted["routing"] = "appointment_reply_sent"
        drafted["send_message"] = message
        drafted["auto_reply_sent"] = sent
        return drafted

    cap_db.commit()
    return drafted


def _log_routing(
    cap_db: Session, intent: str, confidence: str, result: dict[str, Any], routing: str
) -> None:
    log_action(
        cap_db,
        capability="comms",
        action=f"route_{intent}",
        result=routing,
        load_id=result.get("matched_load_id"),
        load_ref=result.get("load_reference"),
        confidence=confidence,
        summary=f"Inbound email routed as {intent} -> {routing}",
        data={"from_email": result.get("from_email")},
    )
    cap_db.commit()


def _handle_document_request(
    cap_db: Session,
    *,
    from_email: str,
    load_id: int | None,
    load_ref: str | None,
    subject: str,
    confidence: str,
    fallback: dict[str, Any],
) -> dict[str, Any]:
    settings = get_settings()
    document = _latest_document(cap_db, load_id) if load_id else None
    if document is None:
        # Nothing on file — fall back to the standard auto-reply we drafted.
        sent, message = send_customer_email(
            to_email=from_email,
            subject=subject,
            body=fallback.get("reply_body", "")
            or f"We don't have documents on file yet for {load_ref or 'your load'}.",
        )
        log_action(
            cap_db,
            capability="comms",
            action="document_request",
            result="no_document_on_file",
            load_id=load_id,
            load_ref=load_ref,
            confidence=confidence,
            summary=f"Document request from {from_email} — none on file",
            data={"message": message},
        )
        return {"routing": "document_not_found", "auto_reply_sent": sent, "send_message": message}

    fields = document.extracted_fields or {}
    body = (
        f"Hello,\n\nAs requested, here are the document details on file for "
        f"{load_ref or 'your load'}:\n\n"
        f"  Document: {document.doc_type.value.upper()} (#{document.id})\n"
        f"  Shipper: {fields.get('shipper') or 'n/a'}\n"
        f"  Receiver: {fields.get('receiver') or 'n/a'}\n"
        f"  Delivery date: {fields.get('delivery_date') or 'n/a'}\n"
        f"  Signed by: {fields.get('signed_by') or 'n/a'}\n"
        f"  Weight: {fields.get('weight_lbs') or 'n/a'} lbs\n"
        f"  Pieces: {fields.get('piece_count') or 'n/a'}\n\n"
        f"The {settings.company_name} Team"
    )
    sent, message = send_customer_email(to_email=from_email, subject=subject, body=body)
    log_action(
        cap_db,
        capability="comms",
        action="document_request",
        result="sent" if sent else "send_failed",
        load_id=load_id,
        load_ref=load_ref,
        confidence=confidence,
        summary=f"Sent {document.doc_type.value.upper()} details to {from_email}",
        data={"document_id": document.id, "message": message},
    )
    return {"routing": "document_sent", "auto_reply_sent": sent, "send_message": message}


def send_milestone_email(
    main_db: Session, cap_db: Session, *, load_id: int, milestone: str
) -> dict[str, Any]:
    """Send a proactive milestone update to the load's customer."""
    settings = get_settings()
    load = main_db.get(Load, load_id)
    if load is None:
        return {"error": f"load {load_id} not found"}
    if milestone not in _MILESTONES:
        return {"error": f"unknown milestone {milestone!r}"}

    phrase = _MILESTONES[milestone]
    subject = f"Update on Load {load.reference} — {milestone.replace('_', ' ')}"
    body = (
        f"Hello {load.customer.name},\n\n"
        f"Your shipment {load.reference} ({load.origin_name} to {load.dest_name}) {phrase}.\n\n"
        f"We'll keep you posted at each step.\n\nThe {settings.company_name} Team"
    )
    sent, message = send_customer_email(to_email=load.customer.email, subject=subject, body=body)
    log_action(
        cap_db,
        capability="comms",
        action="milestone_email",
        result="sent" if sent else "send_failed",
        load_id=load.id,
        load_ref=load.reference,
        confidence="high",
        summary=f"Milestone '{milestone}' email to {load.customer.name}",
        data={"milestone": milestone, "message": message},
    )
    cap_db.commit()
    return {
        "load_reference": load.reference,
        "milestone": milestone,
        "email_sent": sent,
        "send_message": message,
    }


def _parse_sender(from_email: str, from_name: str) -> tuple[str, str]:
    from app.services.inbound_processor import parse_from_header

    name, addr = parse_from_header(from_email)
    if not addr and "@" in from_email:
        addr = from_email.strip().lower()
    if from_name.strip():
        name = from_name.strip()
    return name, (addr or from_email.strip().lower())


def _body_with_attachment_summary(body: str, summary: str) -> str:
    if not summary.strip():
        return body
    if not body.strip():
        return summary
    return f"{body.strip()}\n\n{summary}"
