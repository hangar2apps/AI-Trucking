from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent import customer_comms
from app.agent.inquiry_agent import draft_inquiry_reply, infer_sender_role
from app.capdb import get_cap_db
from app.config import get_settings
from app.db import get_db
from app.models import Event
from app.services.email_send import send_customer_email
from app.services.inbound_processor import parse_resend_inbound_webhook

router = APIRouter(prefix="/assistant", tags=["assistant"])

_MANUAL_DISABLED = (
    "Manual email endpoints are disabled. All mail is handled automatically "
    "via POST /assistant/inbound/webhook."
)


def _require_manual_email_allowed() -> None:
    if not get_settings().allow_manual_email:
        raise HTTPException(403, _MANUAL_DISABLED)


class InquiryRequest(BaseModel):
    from_email: str = Field(min_length=3)
    role: Literal["customer", "driver"] | None = None
    message: str = Field(min_length=3)
    sender_name: str = ""
    subject: str = ""


class InquiryReplyResponse(BaseModel):
    matched_load_id: int | None
    load_reference: str | None
    recipient_name: str
    recipient_email: str
    recipient_role: str
    inferred_intent: str
    confidence: str
    needs_clarification: bool
    clarifying_questions: list[str]
    reply_subject: str
    reply_body: str
    internal_summary: str
    model: str


class InquirySendResponse(InquiryReplyResponse):
    email_sent: bool
    send_message: str


class InboundSimulateRequest(BaseModel):
    from_email: str = Field(min_length=3)
    body: str = ""
    subject: str = ""
    sender_name: str = ""
    to_email: str = ""
    attachments: list[dict[str, Any]] = Field(default_factory=list)


class InboundProcessResponse(BaseModel):
    event_id: int
    from_email: str
    from_name: str
    to_email: str
    subject: str
    body: str
    inferred_role: str
    matched_load_id: int | None
    load_reference: str | None
    inferred_intent: str
    confidence: str
    needs_clarification: bool
    clarifying_questions: list[str]
    reply_subject: str
    reply_body: str
    internal_summary: str
    auto_reply_sent: bool
    send_message: str
    model: str
    routed_intent: str | None = None
    routing: str | None = None
    attachment_results: list[dict[str, Any]] | None = None


class InboxItem(BaseModel):
    id: int
    created_at: datetime
    load_id: int | None
    from_email: str
    from_name: str
    subject: str
    body_preview: str
    load_reference: str | None
    inferred_intent: str | None
    inferred_role: str | None
    auto_reply_sent: bool | None
    send_message: str | None
    reply_subject: str | None
    reply_body: str | None


class InboxResponse(BaseModel):
    items: list[InboxItem]
    ai_inbox_email: str
    auto_reply_enabled: bool
    manual_email_allowed: bool


def _to_response(draft: object, model: str) -> InquiryReplyResponse:
    return InquiryReplyResponse(
        matched_load_id=draft.matched_load_id,
        load_reference=draft.load_reference,
        recipient_name=draft.recipient_name,
        recipient_email=draft.recipient_email,
        recipient_role=draft.recipient_role,
        inferred_intent=draft.inferred_intent,
        confidence=draft.confidence,
        needs_clarification=draft.needs_clarification,
        clarifying_questions=list(draft.clarifying_questions),
        reply_subject=draft.reply_subject,
        reply_body=draft.reply_body,
        internal_summary=draft.internal_summary,
        model=model,
    )


def _resolve_role(db: Session, req: InquiryRequest) -> Literal["customer", "driver"]:
    if req.role:
        return req.role
    return infer_sender_role(db, req.from_email)


@router.post("/inquiry", response_model=InquiryReplyResponse)
def respond_to_inquiry(req: InquiryRequest, db: Session = Depends(get_db)) -> InquiryReplyResponse:
    """Preview-only inquiry reply (disabled when manual email is off)."""
    _require_manual_email_allowed()
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY is not configured")

    role = _resolve_role(db, req)
    message = req.message.strip()
    if req.subject.strip():
        message = f"Subject: {req.subject.strip()}\n\n{message}"

    draft = draft_inquiry_reply(
        db,
        from_email=req.from_email,
        role=role,
        message=message,
        sender_name=req.sender_name,
    )
    return _to_response(draft, settings.email_model)


@router.post("/inquiry/send", response_model=InquirySendResponse)
def send_inquiry_reply(req: InquiryRequest, db: Session = Depends(get_db)) -> InquirySendResponse:
    """Manual inquiry send (disabled — use inbound webhook for autonomous replies)."""
    _require_manual_email_allowed()
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY is not configured")

    role = _resolve_role(db, req)
    message = req.message.strip()
    if req.subject.strip():
        message = f"Subject: {req.subject.strip()}\n\n{message}"

    draft = draft_inquiry_reply(
        db,
        from_email=req.from_email,
        role=role,
        message=message,
        sender_name=req.sender_name,
    )
    email_sent, send_message = send_customer_email(
        to_email=draft.recipient_email,
        subject=draft.reply_subject,
        body=draft.reply_body,
        in_reply_to=req.subject.strip() or None,
    )
    base = _to_response(draft, settings.email_model)
    return InquirySendResponse(
        **base.model_dump(),
        email_sent=email_sent,
        send_message=send_message,
    )


@router.post("/inbound/webhook", response_model=InboundProcessResponse)
async def inbound_email_webhook(
    request: Request,
    db: Session = Depends(get_db),
    cap_db: Session = Depends(get_cap_db),
) -> InboundProcessResponse:
    """Resend inbound webhook — auto-understand and auto-reply to received emails."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY is not configured")

    try:
        payload: dict[str, Any] = await request.json()
    except Exception as exc:
        raise HTTPException(400, f"Invalid JSON payload: {exc}") from exc

    parsed = parse_resend_inbound_webhook(payload)
    if not parsed:
        raise HTTPException(400, "Unsupported webhook event (expected email.received)")

    result = customer_comms.process_customer_email(
        db,
        cap_db,
        from_email=parsed["from_raw"] or parsed["from_email"],
        body=parsed["body"],
        subject=parsed["subject"],
        to_email=parsed["to_email"],
        source="webhook",
        attachments=parsed.get("attachments") or [],
    )
    return InboundProcessResponse(**result)


@router.post("/inbound/simulate", response_model=InboundProcessResponse)
def simulate_inbound_email(
    req: InboundSimulateRequest,
    db: Session = Depends(get_db),
    cap_db: Session = Depends(get_cap_db),
) -> InboundProcessResponse:
    """Simulate an inbound email (demo / testing) and auto-reply."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY is not configured")

    if not req.body.strip() and not req.attachments:
        raise HTTPException(400, "Provide body text and/or attachments")

    result = customer_comms.process_customer_email(
        db,
        cap_db,
        from_email=req.from_email,
        from_name=req.sender_name,
        body=req.body,
        subject=req.subject,
        to_email=req.to_email,
        source="simulate",
        attachments=req.attachments,
    )
    return InboundProcessResponse(**result)


@router.get("/inbox", response_model=InboxResponse)
def get_inbox(db: Session = Depends(get_db), limit: int = 40) -> InboxResponse:
    """Recent inbound emails processed by the AI auto-reply pipeline."""
    settings = get_settings()
    events = list(
        db.scalars(
            select(Event)
            .where(Event.kind == "inbound_email")
            .order_by(Event.created_at.desc())
            .limit(min(limit, 100))
        )
    )

    items: list[InboxItem] = []
    for event in events:
        data = event.data or {}
        body = str(data.get("body") or "")
        items.append(
            InboxItem(
                id=event.id,
                created_at=event.created_at,
                load_id=event.load_id,
                from_email=str(data.get("from_email") or ""),
                from_name=str(data.get("from_name") or ""),
                subject=str(data.get("subject") or ""),
                body_preview=body[:240] + ("…" if len(body) > 240 else ""),
                load_reference=data.get("load_reference"),
                inferred_intent=data.get("inferred_intent"),
                inferred_role=data.get("inferred_role"),
                auto_reply_sent=data.get("auto_reply_sent"),
                send_message=data.get("send_message"),
                reply_subject=data.get("auto_reply_subject"),
                reply_body=data.get("auto_reply_body"),
            )
        )

    return InboxResponse(
        items=items,
        ai_inbox_email=settings.ai_inbox_email or settings.from_email,
        auto_reply_enabled=settings.inbound_auto_reply_enabled,
        manual_email_allowed=settings.allow_manual_email,
    )
