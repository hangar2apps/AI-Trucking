"""Tools the A-TMS brain (Opus 4.8) can call.

Each tool has a JSON schema Claude sees and a Python implementation that runs
against the database. Read tools are side-effect free; `reassign_load` and
`send_customer_email` mutate state and honor `dry_run` (plan, don't commit).

`check_weather_route` and `get_driver_hours` are STUBS owned by the route dev /
a future HOS source — they return plausible placeholders so the loop is
complete today and get swapped for real engines without changing this contract.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from math import asin, cos, radians, sin, sqrt
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.capdb import CapSessionLocal
from app.cap_models import Document, Inspection
from app.config import get_settings
from app.models import Event, Load, LoadStatus, Truck, TruckStatus


def _log_event(
    db: Session,
    kind: str,
    summary: str,
    *,
    load_id: int | None = None,
    truck_id: int | None = None,
    data: dict | None = None,
) -> None:
    """Record an action for the map + CS dashboard to poll. Caller commits."""
    db.add(Event(kind=kind, summary=summary, load_id=load_id, truck_id=truck_id, data=data))

# --- serializers ----------------------------------------------------------


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def load_dict(load: Load) -> dict[str, Any]:
    late = (
        load.eta is not None
        and load.eta > load.deliver_by
        and load.status not in (LoadStatus.delivered, LoadStatus.cancelled)
    )
    return {
        "id": load.id,
        "reference": load.reference,
        "status": load.status.value,
        "customer": load.customer.name,
        "customer_company": load.customer.company,
        "origin": {"name": load.origin_name, "lat": load.origin_lat, "lng": load.origin_lng},
        "destination": {"name": load.dest_name, "lat": load.dest_lat, "lng": load.dest_lng},
        "deliver_by": _iso(load.deliver_by),
        "eta": _iso(load.eta),
        "is_late": late,
        "minutes_late": (
            int((load.eta - load.deliver_by).total_seconds() // 60)
            if late and load.eta
            else 0
        ),
        "assigned_truck_id": load.assigned_truck_id,
        "commodity": load.commodity,
        "weight_lbs": load.weight_lbs,
        "notes": load.notes,
    }


def truck_dict(truck: Truck) -> dict[str, Any]:
    return {
        "id": truck.id,
        "name": truck.name,
        "driver": truck.driver_name,
        "status": truck.status.value,
        "location": {"lat": truck.current_lat, "lng": truck.current_lng},
        "capacity_lbs": truck.capacity_lbs,
    }


def _haversine_mi(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 3958.8  # earth radius, miles
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


# --- tool schemas (what Claude sees) --------------------------------------

TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "name": "get_loads",
        "description": "List shipments. Use late_only=true to find loads whose ETA is past the promised delivery window.",
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": [s.value for s in LoadStatus],
                    "description": "Filter by load status.",
                },
                "late_only": {"type": "boolean", "description": "Only loads running past their delivery window."},
            },
        },
    },
    {
        "name": "get_trucks",
        "description": "List fleet trucks with status, live location, and capacity. Use available_only=true to find trucks free to take a load.",
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": [s.value for s in TruckStatus],
                    "description": "Filter by truck status.",
                },
                "available_only": {"type": "boolean", "description": "Only trucks with status 'available'."},
            },
        },
    },
    {
        "name": "compute_eta",
        "description": "Estimate arrival time for a truck driving to a destination (great-circle distance at highway speed).",
        "input_schema": {
            "type": "object",
            "properties": {
                "truck_id": {"type": "integer"},
                "dest_lat": {"type": "number"},
                "dest_lng": {"type": "number"},
            },
            "required": ["truck_id", "dest_lat", "dest_lng"],
        },
    },
    {
        "name": "check_weather_route",
        "description": "Check road/weather conditions and incidents along a route. (Route engine — owned by the routing service.)",
        "input_schema": {
            "type": "object",
            "properties": {
                "origin_lat": {"type": "number"},
                "origin_lng": {"type": "number"},
                "dest_lat": {"type": "number"},
                "dest_lng": {"type": "number"},
            },
            "required": ["origin_lat", "origin_lng", "dest_lat", "dest_lng"],
        },
    },
    {
        "name": "get_driver_hours",
        "description": "Remaining hours-of-service for a truck's driver before a mandatory rest break.",
        "input_schema": {
            "type": "object",
            "properties": {"truck_id": {"type": "integer"}},
            "required": ["truck_id"],
        },
    },
    {
        "name": "reassign_load",
        "description": "Reassign a load to a different truck. Frees the old truck, puts the new one en route. A real operational change.",
        "input_schema": {
            "type": "object",
            "properties": {
                "load_id": {"type": "integer"},
                "new_truck_id": {"type": "integer"},
            },
            "required": ["load_id", "new_truck_id"],
        },
    },
    {
        "name": "send_customer_email",
        "description": "Send a status email to the customer on a load. Compose an honest, specific subject and body.",
        "input_schema": {
            "type": "object",
            "properties": {
                "load_id": {"type": "integer"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["load_id", "subject", "body"],
        },
    },
    {
        "name": "get_load_documents",
        "description": "List processed documents (POD/BOL/rate con) for a load, with match status and extracted fields.",
        "input_schema": {
            "type": "object",
            "properties": {"load_id": {"type": "integer"}},
            "required": ["load_id"],
        },
    },
    {
        "name": "get_load_inspections",
        "description": "List freight photo inspections for a load, with damage findings, seal numbers, and condition reports.",
        "input_schema": {
            "type": "object",
            "properties": {"load_id": {"type": "integer"}},
            "required": ["load_id"],
        },
    },
    {
        "name": "generate_invoice",
        "description": "Generate and send an invoice for a load from its matched POD. Invoices over the auto-send limit are queued for human approval automatically.",
        "input_schema": {
            "type": "object",
            "properties": {"load_id": {"type": "integer"}},
            "required": ["load_id"],
        },
    },
    {
        "name": "send_milestone_email",
        "description": "Send a proactive milestone update to the customer (picked_up, in_transit, two_hours_out, delivered).",
        "input_schema": {
            "type": "object",
            "properties": {
                "load_id": {"type": "integer"},
                "milestone": {
                    "type": "string",
                    "enum": ["picked_up", "in_transit", "two_hours_out", "delivered"],
                },
            },
            "required": ["load_id", "milestone"],
        },
    },
    {
        "name": "escalate_to_human",
        "description": "Queue a high-stakes or low-confidence situation for human review instead of acting alone.",
        "input_schema": {
            "type": "object",
            "properties": {
                "load_id": {"type": "integer"},
                "reason": {"type": "string"},
            },
            "required": ["reason"],
        },
    },
]


# --- implementations ------------------------------------------------------


def _get_loads(db: Session, status: str | None = None, late_only: bool = False) -> dict:
    stmt = select(Load)
    if status:
        stmt = stmt.where(Load.status == LoadStatus(status))
    loads = [load_dict(load) for load in db.scalars(stmt.order_by(Load.deliver_by))]
    if late_only:
        loads = [load for load in loads if load["is_late"]]
    return {"loads": loads, "count": len(loads)}


def _get_trucks(db: Session, status: str | None = None, available_only: bool = False) -> dict:
    stmt = select(Truck)
    if available_only:
        stmt = stmt.where(Truck.status == TruckStatus.available)
    elif status:
        stmt = stmt.where(Truck.status == TruckStatus(status))
    trucks = [truck_dict(truck) for truck in db.scalars(stmt.order_by(Truck.id))]
    return {"trucks": trucks, "count": len(trucks)}


def _compute_eta(db: Session, truck_id: int, dest_lat: float, dest_lng: float) -> dict:
    truck = db.get(Truck, truck_id)
    if truck is None or truck.current_lat is None:
        return {"error": "truck not found or has no known location"}
    miles = _haversine_mi(truck.current_lat, truck.current_lng, dest_lat, dest_lng)
    hours = miles / 50.0  # avg highway speed incl. stops
    eta = datetime.now() + timedelta(hours=hours)
    return {"distance_mi": round(miles, 1), "drive_hours": round(hours, 2), "eta": eta.isoformat()}


def _check_weather_route(
    db: Session,
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    **_extra: float,
) -> dict:
    """Route/weather check — stub until routing service is wired."""
    delayed = db.scalar(select(Load).where(Load.status == LoadStatus.delayed).limit(1))
    if delayed:
        return {
            "status": "severe",
            "incidents": [
                {
                    "type": "weather",
                    "label": "Storm band crossing I-45 corridor",
                    "severity": "severe",
                    "eta_impact_minutes": 47,
                    "affected_route": f"{delayed.origin_name} → {delayed.dest_name}",
                }
            ],
            "note": "Weather stub active — replace with route engine when ready.",
        }
    return {"status": "clear", "incidents": [], "note": "No active weather incidents."}


def _get_driver_hours(db: Session, truck_id: int) -> dict:
    # STUB — no HOS source yet. Plausible placeholder.
    return {"truck_id": truck_id, "remaining_hours": 7.5, "note": "stub: HOS source not yet connected"}


def _reassign_load(db: Session, load_id: int, new_truck_id: int, dry_run: bool) -> dict:
    load = db.get(Load, load_id)
    new_truck = db.get(Truck, new_truck_id)
    if load is None:
        return {"error": f"load {load_id} not found"}
    if new_truck is None:
        return {"error": f"truck {new_truck_id} not found"}
    if new_truck.status != TruckStatus.available:
        return {"error": f"{new_truck.name} is {new_truck.status.value}, not available"}

    old_truck_id = load.assigned_truck_id
    plan = {
        "load": load.reference,
        "from_truck_id": old_truck_id,
        "to_truck_id": new_truck_id,
        "to_truck": new_truck.name,
    }
    if dry_run:
        return {"dry_run": True, "would_reassign": plan}

    if old_truck_id is not None:
        old = db.get(Truck, old_truck_id)
        if old is not None:
            old.status = TruckStatus.available
    new_truck.status = TruckStatus.en_route
    load.assigned_truck_id = new_truck_id
    load.status = LoadStatus.in_transit
    _log_event(
        db,
        "reassignment",
        f"Reassigned {load.reference} from truck {old_truck_id} to {new_truck.name}",
        load_id=load.id,
        truck_id=new_truck_id,
        data={
            "load_ref": load.reference,
            "from_truck_id": old_truck_id,
            "to_truck_id": new_truck_id,
            "to_truck": new_truck.name,
            "destination": {"lat": load.dest_lat, "lng": load.dest_lng},
        },
    )
    db.commit()
    return {"reassigned": True, **plan}


def _send_customer_email(db: Session, load_id: int, subject: str, body: str, dry_run: bool) -> dict:
    load = db.get(Load, load_id)
    if load is None:
        return {"error": f"load {load_id} not found"}

    settings = get_settings()
    # Demo override: seed customer addresses are fake, so route to a real inbox.
    recipient = settings.demo_email_to or load.customer.email
    record = {
        "to": recipient,
        "intended_to": load.customer.email,
        "to_name": load.customer.name,
        "load": load.reference,
        "subject": subject,
    }
    if dry_run:
        return {"dry_run": True, "would_send": record}
    if not settings.resend_api_key:
        return {"sent": False, "note": "no RESEND_API_KEY configured; recorded only", **record}

    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.resend_from,
                "to": [recipient],
                "subject": subject,
                "text": body,
            },
            timeout=20.0,
        )
    except httpx.HTTPError as exc:
        return {"sent": False, "error": f"request failed: {exc}", **record}

    if resp.status_code >= 400:
        return {"sent": False, "error": f"resend {resp.status_code}: {resp.text}", **record}

    message_id = resp.json().get("id")
    _log_event(
        db,
        "email_sent",
        f"Emailed {load.customer.name} about {load.reference}",
        load_id=load.id,
        data={"to": recipient, "subject": subject, "message_id": message_id},
    )
    db.commit()
    return {"sent": True, "id": message_id, **record}


def _get_load_documents(db: Session, load_id: int) -> dict:
    with CapSessionLocal() as cap_db:
        docs = cap_db.scalars(
            select(Document).where(Document.load_id == load_id).order_by(Document.created_at.desc())
        )
        return {
            "documents": [
                {
                    "id": d.id,
                    "doc_type": d.doc_type.value,
                    "match_status": d.match_status.value,
                    "flags": d.flags or [],
                    "fields": d.extracted_fields or {},
                }
                for d in docs
            ]
        }


def _get_load_inspections(db: Session, load_id: int) -> dict:
    with CapSessionLocal() as cap_db:
        inspections = cap_db.scalars(
            select(Inspection)
            .where(Inspection.load_id == load_id)
            .order_by(Inspection.created_at.desc())
        )
        return {
            "inspections": [
                {
                    "id": i.id,
                    "phase": i.phase.value,
                    "damage_detected": i.damage_detected,
                    "seal_number": i.seal_number,
                    "condition_report": i.condition_report,
                }
                for i in inspections
            ]
        }


def _generate_invoice(db: Session, load_id: int, dry_run: bool) -> dict:
    from app.agent import document_agent  # lazy import to avoid import cycles

    with CapSessionLocal() as cap_db:
        return document_agent.invoice_for_load(db, cap_db, load_id, dry_run=dry_run)


def _send_milestone_email(db: Session, load_id: int, milestone: str, dry_run: bool) -> dict:
    from app.agent import customer_comms  # lazy import to avoid import cycles

    if dry_run:
        load = db.get(Load, load_id)
        if load is None:
            return {"error": f"load {load_id} not found"}
        return {"dry_run": True, "would_send_milestone": milestone, "to": load.customer.email}
    with CapSessionLocal() as cap_db:
        return customer_comms.send_milestone_email(db, cap_db, load_id=load_id, milestone=milestone)


def _escalate_to_human(db: Session, reason: str, dry_run: bool, load_id: int | None = None) -> dict:
    from app.agent import approvals  # lazy import to avoid import cycles

    load = db.get(Load, load_id) if load_id else None
    if dry_run:
        return {"dry_run": True, "would_escalate": reason, "load_id": load_id}
    with CapSessionLocal() as cap_db:
        item = approvals.enqueue(
            cap_db,
            action_type="escalate_to_human",
            capability="brain",
            reason=reason,
            payload={"note": reason},
            load_id=load_id,
            load_ref=load.reference if load else None,
            confidence="low",
        )
        cap_db.commit()
        return {"escalated": True, "approval_item_id": item.id, "reason": reason}


def execute_tool(db: Session, name: str, tool_input: dict, dry_run: bool = True) -> dict:
    """Dispatch a tool call to its implementation. Returns a JSON-safe dict."""
    if name == "get_loads":
        return _get_loads(db, **tool_input)
    if name == "get_trucks":
        return _get_trucks(db, **tool_input)
    if name == "compute_eta":
        return _compute_eta(db, **tool_input)
    if name == "check_weather_route":
        return _check_weather_route(db, **tool_input)
    if name == "get_driver_hours":
        return _get_driver_hours(db, **tool_input)
    if name == "reassign_load":
        return _reassign_load(db, dry_run=dry_run, **tool_input)
    if name == "send_customer_email":
        return _send_customer_email(db, dry_run=dry_run, **tool_input)
    if name == "get_load_documents":
        return _get_load_documents(db, **tool_input)
    if name == "get_load_inspections":
        return _get_load_inspections(db, **tool_input)
    if name == "generate_invoice":
        return _generate_invoice(db, dry_run=dry_run, **tool_input)
    if name == "send_milestone_email":
        return _send_milestone_email(db, dry_run=dry_run, **tool_input)
    if name == "escalate_to_human":
        return _escalate_to_human(db, dry_run=dry_run, **tool_input)
    return {"error": f"unknown tool {name!r}"}
