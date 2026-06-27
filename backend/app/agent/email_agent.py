"""The thinnest AI vertical: read a load, draft a customer status email.

This is the de-risked core of the brain. It uses Claude Sonnet 4.6 with
structured outputs so the result is a validated EmailDraft (no parsing).
Everything else (reasoning over fleet state, tool use, reassignment) grows
outward from here.
"""

from __future__ import annotations

from datetime import datetime

import anthropic

from app.config import get_settings
from app.models import Load, LoadStatus
from app.schemas import EmailDraft

settings = get_settings()

_SYSTEM_TEMPLATE = """\
You are the customer-service voice of {company}, a trucking company run end to \
end by AI. You write brief, warm, professional status emails to shippers about \
their freight.

Rules:
- Be concrete: reference the load number, origin, destination, and the relevant \
time (ETA or delivery window).
- If the shipment is delayed, lead with a clear, honest heads-up, give the new \
expected time, and state what {company} is doing about it. Never over-apologize \
or make promises you can't ground in the data provided.
- If on track, keep it short and reassuring.
- Sign off as "The {company} Team". Do not invent phone numbers, links, or names \
not given to you.
- The internal_summary is a one-line note for our own CS dashboard, not for the \
customer."""


def _schedule_status(load: Load) -> str:
    """A grounded, human-readable read on whether the load is on time."""
    if load.status == LoadStatus.delivered:
        return "Delivered."
    if load.eta is None:
        return "No ETA computed yet."
    delta = load.eta - load.deliver_by
    minutes = int(delta.total_seconds() // 60)
    if minutes <= 0:
        return f"On track — ETA is {-minutes} min inside the delivery window."
    if minutes < 60:
        return f"Running late — ETA is {minutes} min past the delivery window."
    hours = minutes / 60
    return f"Running late — ETA is about {hours:.1f} h past the delivery window."


def _fmt(dt: datetime | None) -> str:
    return dt.strftime("%a %b %d, %I:%M %p") if dt else "unknown"


def build_load_context(load: Load) -> str:
    """Render the facts the model is allowed to use into a compact block."""
    truck = load.truck
    truck_line = (
        f"{truck.name} (driver {truck.driver_name}, status {truck.status.value})"
        if truck
        else "not yet assigned"
    )
    return f"""\
Load: {load.reference}
Customer: {load.customer.name} at {load.customer.company}
Status: {load.status.value}
Origin: {load.origin_name}
Destination: {load.dest_name}
Commodity: {load.commodity or 'n/a'} ({load.weight_lbs or '?'} lbs)
Picked up / scheduled: {_fmt(load.pickup_at)}
Promised delivery by: {_fmt(load.deliver_by)}
Current ETA: {_fmt(load.eta)}
Assigned truck: {truck_line}
Schedule read: {_schedule_status(load)}
Internal notes: {load.notes or 'none'}"""


def draft_status_email(load: Load) -> EmailDraft:
    """Ask Claude to draft a status email for one load. Returns a validated draft."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    response = client.messages.parse(
        model=settings.email_model,
        max_tokens=1200,
        system=_SYSTEM_TEMPLATE.format(company=settings.company_name),
        messages=[
            {
                "role": "user",
                "content": (
                    "Draft a status email to this customer based only on the "
                    f"facts below.\n\n{build_load_context(load)}"
                ),
            }
        ],
        output_format=EmailDraft,
    )
    return response.parsed_output
