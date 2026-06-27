"""Image inspection capability: inspect freight photos at pickup / delivery.

Uses Claude vision to detect visible damage, read seal numbers, and write a
condition report. On delivery it compares against the most recent pickup
inspection for the same load. Detected damage is high-stakes, so it is queued
for human approval; on approval the dispatcher + claims team are emailed.

Fleet data (Load) is read from the main DB; inspections/approvals are written to
the local capability store.
"""

from __future__ import annotations

import re
from typing import Any

import anthropic
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent import approvals
from app.agent.actionlog import log_action
from app.agent.policy import decide
from app.agent.vision import build_file_block
from app.cap_models import Inspection, InspectionPhase
from app.config import get_settings
from app.models import Load
from app.services.email_send import send_customer_email

_LOAD_REF = re.compile(r"\bLD-\d+\b", re.IGNORECASE)

_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "damage_detected": {"type": "boolean"},
        "damage_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string"},
                    "severity": {"type": "string", "enum": ["minor", "moderate", "severe"]},
                    "description": {"type": "string"},
                },
                "required": ["type", "severity", "description"],
                "additionalProperties": False,
            },
        },
        "seal_number": {"type": ["string", "null"]},
        "seal_intact": {"type": ["boolean", "null"]},
        "condition_report": {"type": "string"},
        "comparison_notes": {"type": ["string", "null"]},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
    },
    "required": ["damage_detected", "condition_report", "confidence"],
    "additionalProperties": False,
}

_SYSTEM = """\
You are the freight-inspection vision unit of an AI operations agent. You examine \
photos of cargo, trailers, and seals. Report only damage you can actually see \
(dents, tears, crushed boxes, water damage, broken pallets). Read seal numbers \
exactly. When pickup photos are provided alongside delivery photos, compare the \
condition and note any new damage. Be precise; if unsure, lower your confidence."""


def match_load(main_db: Session, hint: str | None) -> Load | None:
    if not hint:
        return None
    match = _LOAD_REF.search(str(hint))
    ref = match.group(0).upper() if match else str(hint).strip().upper()
    return main_db.scalar(select(Load).where(Load.reference == ref))


def _latest_pickup(cap_db: Session, load_id: int) -> Inspection | None:
    return cap_db.scalar(
        select(Inspection)
        .where(Inspection.load_id == load_id, Inspection.phase == InspectionPhase.pickup)
        .order_by(Inspection.created_at.desc())
        .limit(1)
    )


def analyze(
    files: list[tuple[str, str]],
    *,
    phase: InspectionPhase,
    pickup_files: list[tuple[str, str]] | None = None,
) -> dict[str, Any]:
    """Run Claude vision over the photos. files = [(relative_path, media_type)]."""
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    content: list[dict[str, Any]] = [
        {
            "type": "text",
            "text": (
                f"These are {phase.value} photos for a freight load. Inspect for "
                "damage, read any seal number, and write a condition report."
            ),
        }
    ]
    content.extend(build_file_block(path, mt) for path, mt in files)

    if pickup_files:
        content.append(
            {"type": "text", "text": "For comparison, here are the earlier PICKUP photos:"}
        )
        content.extend(build_file_block(path, mt) for path, mt in pickup_files)

    response = client.messages.create(
        model=settings.email_model,
        max_tokens=1500,
        system=_SYSTEM,
        messages=[{"role": "user", "content": content}],
        tools=[
            {
                "name": "inspection_result",
                "description": "Structured freight inspection result.",
                "input_schema": _SCHEMA,
            }
        ],
        tool_choice={"type": "tool", "name": "inspection_result"},
    )
    block = next((b for b in response.content if b.type == "tool_use"), None)
    return dict(block.input) if block else {}


def _alert_body(load: Load | None, inspection: Inspection, findings: dict[str, Any]) -> tuple[str, str]:
    ref = load.reference if load else "unmatched load"
    items = findings.get("damage_items") or []
    item_lines = "\n".join(
        f"  - [{i.get('severity', '?')}] {i.get('type', 'damage')}: {i.get('description', '')}"
        for i in items
    ) or "  - (see condition report)"
    photos = "\n".join(f"  - {p}" for p in (inspection.file_paths or []))
    subject = f"DAMAGE ALERT — Load {ref} ({inspection.phase.value} inspection)"
    body = (
        f"Automated freight inspection flagged visible damage on {ref}.\n\n"
        f"Damage:\n{item_lines}\n\n"
        f"Condition report:\n{findings.get('condition_report', '')}\n\n"
        f"Seal: {findings.get('seal_number') or 'n/a'} "
        f"(intact: {findings.get('seal_intact')})\n\n"
        f"Attached photos:\n{photos}\n\n"
        f"Routed to dispatch and the claims team for review."
    )
    return subject, body


def process_inspection(
    main_db: Session,
    cap_db: Session,
    *,
    file_paths: list[tuple[str, str]],
    phase: str = "delivery",
    load_hint: str | None = None,
) -> dict[str, Any]:
    """Inspect photos, persist the result, and on damage queue a claims alert."""
    try:
        phase_enum = InspectionPhase(phase.lower())
    except ValueError:
        phase_enum = InspectionPhase.delivery

    load = match_load(main_db, load_hint)

    pickup_files: list[tuple[str, str]] | None = None
    if phase_enum == InspectionPhase.delivery and load is not None:
        prior = _latest_pickup(cap_db, load.id)
        if prior and prior.findings:
            stored = prior.findings.get("_media")
            if stored:
                pickup_files = [tuple(f) for f in stored]

    findings = analyze(file_paths, phase=phase_enum, pickup_files=pickup_files)

    findings_to_store = dict(findings)
    findings_to_store["_media"] = [list(f) for f in file_paths]

    inspection = Inspection(
        load_id=load.id if load else None,
        phase=phase_enum,
        file_paths=[p for p, _ in file_paths],
        findings=findings_to_store,
        seal_number=findings.get("seal_number"),
        condition_report=findings.get("condition_report"),
        damage_detected=bool(findings.get("damage_detected")),
    )
    cap_db.add(inspection)
    cap_db.flush()

    confidence = findings.get("confidence", "medium")
    log_action(
        cap_db,
        capability="image",
        action="inspect_photos",
        result="damage" if inspection.damage_detected else "clean",
        load_id=load.id if load else None,
        load_ref=load.reference if load else None,
        confidence=confidence,
        summary=(
            f"{phase_enum.value.title()} inspection of {load.reference if load else 'unmatched'}"
            f" — {'DAMAGE' if inspection.damage_detected else 'clean'}"
        ),
        data={"findings": findings, "inspection_id": inspection.id},
    )

    result: dict[str, Any] = {
        "inspection_id": inspection.id,
        "phase": phase_enum.value,
        "load_id": load.id if load else None,
        "load_reference": load.reference if load else None,
        "damage_detected": inspection.damage_detected,
        "seal_number": inspection.seal_number,
        "condition_report": inspection.condition_report,
        "findings": findings,
        "approval_item_id": None,
    }

    if inspection.damage_detected:
        settings = get_settings()
        subject, body = _alert_body(load, inspection, findings)
        decision = decide("flag_damage", confidence=confidence)
        payload = {
            "to_email": settings.dispatcher_email,
            "subject": subject,
            "body": body,
            "inspection_id": inspection.id,
        }

        if decision.needs_approval:
            item = approvals.enqueue(
                cap_db,
                action_type="flag_damage",
                capability="image",
                reason=decision.reason,
                payload=payload,
                load_id=load.id if load else None,
                load_ref=load.reference if load else None,
                confidence=confidence,
            )
            result["approval_item_id"] = item.id
        else:
            sent, message = send_customer_email(
                to_email=settings.dispatcher_email,
                subject=subject,
                body=body,
            )
            if settings.claims_email and settings.claims_email != settings.dispatcher_email:
                send_customer_email(
                    to_email=settings.claims_email,
                    subject=subject,
                    body=body,
                )
            findings_update = dict(inspection.findings or {})
            findings_update["damage_flagged"] = True
            inspection.findings = findings_update
            log_action(
                cap_db,
                capability="image",
                action="flag_damage",
                result="sent" if sent else "send_failed",
                load_id=load.id if load else None,
                load_ref=load.reference if load else None,
                confidence=confidence,
                summary=f"Damage alert emailed for {load.reference if load else 'unmatched'}",
                data={"message": message, "inspection_id": inspection.id},
            )
            result["damage_alert_sent"] = sent
            result["send_message"] = message

    cap_db.commit()
    return result
