"""Customer notifications for the monitor.

Test mode (`ai_test_mode=True`): templated emails — **zero Anthropic cost**.
Production: Claude (Sonnet 4.6) drafts the email.

Either way delivery goes through the existing `_send_customer_email` path
(Resend + `demo_email_to` routing + `email_sent` event logging).
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.agent.email_agent import draft_status_email
from app.agent.tools import _send_customer_email
from app.config import get_settings
from app.models import Load


def _template(load: Load, kind: str, ctx: dict) -> tuple[str, str]:
    company = get_settings().company_name
    name = load.customer.name
    lane = f"{load.origin_name} → {load.dest_name}"
    eta = ctx.get("eta_str", "shortly")

    if kind == "delivered":
        return (
            f"Delivered: {load.reference} arrived in {load.dest_name}",
            f"Hi {name},\n\nGood news — your shipment {load.reference} ({lane}) "
            f"has been delivered. Thank you for trusting {company}.\n\nThe {company} Team",
        )
    if kind == "recovered":
        truck = ctx.get("truck", "another truck")
        return (
            f"On track: {load.reference} will still arrive on time",
            f"Hi {name},\n\nA quick heads-up on your shipment {load.reference} "
            f"({lane}). The original truck hit a delay, so we moved your load to "
            f"{truck} to protect your delivery window. Updated arrival: {eta}.\n\n"
            f"We'll keep you posted.\nThe {company} Team",
        )
    # delay
    reason = ctx.get("reason", "conditions on the route")
    return (
        f"Delay update: {load.reference} running behind",
        f"Hi {name},\n\nWe want to give you an honest heads-up that your shipment "
        f"{load.reference} ({lane}) is running behind its delivery window due to "
        f"{reason}. Updated estimated arrival: {eta}. We're actively working to "
        f"recover the time and will keep you posted.\n\nThe {company} Team",
    )


def notify_customer(db: Session, load: Load, kind: str, ctx: dict) -> dict:
    """Send a customer email for `kind` ∈ {delay, recovered, delivered}."""
    if get_settings().ai_test_mode:
        subject, body = _template(load, kind, ctx)
    else:
        draft = draft_status_email(load)  # Claude Sonnet 4.6
        subject, body = draft.subject, draft.body
    return _send_customer_email(db, load.id, subject, body, dry_run=False)
