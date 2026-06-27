"""Human-approval queue: enqueue gated actions and execute them on approval.

Capabilities call `enqueue(...)` when policy.decide() returns "approval". A human
approves via the approvals router, which calls `execute(...)`. Execution is
payload-driven (it sends the prepared email and updates the linked record), so
this module stays decoupled from the individual capability modules.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.agent.actionlog import log_action
from app.cap_models import ApprovalItem, ApprovalStatus, Inspection, Invoice, InvoiceStatus
from app.services.email_send import send_customer_email


def enqueue(
    db: Session,
    *,
    action_type: str,
    capability: str,
    reason: str,
    payload: dict[str, Any],
    load_id: int | None = None,
    load_ref: str | None = None,
    confidence: str | None = None,
) -> ApprovalItem:
    """Stage an action for human review. Caller commits."""
    item = ApprovalItem(
        action_type=action_type,
        capability=capability,
        load_id=load_id,
        load_ref=load_ref,
        confidence=confidence,
        reason=reason,
        payload=payload,
        status=ApprovalStatus.pending,
    )
    db.add(item)
    log_action(
        db,
        capability=capability,
        action=action_type,
        result="queued_for_approval",
        load_id=load_id,
        load_ref=load_ref,
        confidence=confidence,
        summary=f"Queued for human approval: {action_type} ({reason})",
        data={"reason": reason},
    )
    return item


def _send_payload_email(payload: dict[str, Any]) -> tuple[bool, str]:
    to_email = payload.get("to_email", "")
    if not to_email:
        return False, "No email associated — marked done for manual follow-up."
    return send_customer_email(
        to_email=to_email,
        subject=payload.get("subject", ""),
        body=payload.get("body", ""),
        in_reply_to=payload.get("in_reply_to"),
    )


def _apply_side_effects(db: Session, item: ApprovalItem, sent: bool) -> None:
    """Update the record linked to an approved action after it executes."""
    payload = item.payload or {}
    if item.action_type == "send_invoice":
        invoice_id = payload.get("invoice_id")
        if invoice_id and sent:
            invoice = db.get(Invoice, invoice_id)
            if invoice is not None:
                invoice.status = InvoiceStatus.sent
    elif item.action_type == "flag_damage":
        inspection_id = payload.get("inspection_id")
        if inspection_id:
            inspection = db.get(Inspection, inspection_id)
            if inspection is not None:
                findings = dict(inspection.findings or {})
                findings["damage_flagged"] = True
                inspection.findings = findings


def execute(db: Session, item: ApprovalItem) -> dict[str, Any]:
    """Run a previously-queued action after human approval. Caller commits."""
    sent, message = _send_payload_email(item.payload or {})
    _apply_side_effects(db, item, sent)

    item.status = ApprovalStatus.approved
    item.resolved_at = datetime.now()
    item.result = {"executed": True, "email_sent": sent, "message": message}

    log_action(
        db,
        capability=item.capability,
        action=item.action_type,
        result="approved_and_executed" if sent else "approved_send_failed",
        load_id=item.load_id,
        load_ref=item.load_ref,
        confidence=item.confidence,
        summary=f"Human approved {item.action_type} for {item.load_ref or 'n/a'}",
        data={"email_sent": sent, "message": message},
    )
    return {"executed": True, "email_sent": sent, "message": message}


def reject(db: Session, item: ApprovalItem, *, note: str | None = None) -> dict[str, Any]:
    """Mark a queued action as rejected (not executed). Caller commits."""
    item.status = ApprovalStatus.rejected
    item.resolved_at = datetime.now()
    item.result = {"executed": False, "note": note}
    log_action(
        db,
        capability=item.capability,
        action=item.action_type,
        result="rejected",
        load_id=item.load_id,
        load_ref=item.load_ref,
        confidence=item.confidence,
        summary=f"Human rejected {item.action_type} for {item.load_ref or 'n/a'}",
        data={"note": note},
    )
    return {"executed": False, "rejected": True}
