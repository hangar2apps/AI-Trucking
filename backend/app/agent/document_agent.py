"""Document capability: read PODs/BOLs/rate cons, match to a load, invoice.

Flow: extract fields with Claude (native PDF/image) -> match to a Load by
reference -> flag mismatches/missing -> persist a Document. For a matched POD,
auto-generate an Invoice and either email it (high confidence, under the
auto-send limit) or queue it for human approval.

Fleet data (Load/Customer) is read from the main DB session; the capability's
own rows (Document/Invoice) are written to the local capability store.
"""

from __future__ import annotations

import re
from math import asin, cos, radians, sin, sqrt
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent import approvals
from app.agent.actionlog import log_action
from app.agent.policy import decide
from app.agent.vision import build_file_block, extract_structured
from app.cap_models import Document, DocumentStatus, DocumentType, Invoice, InvoiceStatus
from app.config import get_settings
from app.models import Load
from app.services.email_send import send_customer_email

_LOAD_REF = re.compile(r"\bLD-\d+\b", re.IGNORECASE)
_RATE_PER_MILE = 2.75
_MIN_LINEHAUL = 350.0

_EXTRACT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "doc_type": {"type": "string", "enum": ["pod", "bol", "rate_con", "other"]},
        "load_number": {"type": ["string", "null"]},
        "shipper": {"type": ["string", "null"]},
        "receiver": {"type": ["string", "null"]},
        "delivery_date": {"type": ["string", "null"]},
        "weight_lbs": {"type": ["number", "null"]},
        "piece_count": {"type": ["integer", "null"]},
        "signature_present": {"type": "boolean"},
        "signed_by": {"type": ["string", "null"]},
        "rate_amount": {"type": ["number", "null"]},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "notes": {"type": ["string", "null"]},
    },
    "required": ["doc_type", "signature_present", "confidence"],
    "additionalProperties": False,
}

_SYSTEM = """\
You are the document-processing unit of an AI freight operations agent. You read \
freight paperwork (proof of delivery, bill of lading, rate confirmation) and \
extract the key fields exactly as written. Do not invent values: if a field is \
not present or not legible, return null. Set confidence to 'low' if the document \
is hard to read or ambiguous."""


def _haversine_mi(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 3958.8
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


def extract_fields(relative_path: str, media_type: str) -> dict[str, Any]:
    """Run Claude over the file and return extracted fields (best-effort)."""
    block = build_file_block(relative_path, media_type)
    return extract_structured(
        system=_SYSTEM,
        instruction=(
            "Extract the freight document fields. Identify the document type and "
            "pull load number, shipper, receiver, delivery date, weight, piece "
            "count, and whether it is signed."
        ),
        file_blocks=[block],
        tool_name="document_fields",
        tool_schema=_EXTRACT_SCHEMA,
    )


def match_load(main_db: Session, fields: dict[str, Any], hint: str | None = None) -> Load | None:
    """Match extracted fields (or a caller hint) to a Load by reference."""
    for value in (hint, fields.get("load_number")):
        if not value:
            continue
        match = _LOAD_REF.search(str(value))
        ref = match.group(0).upper() if match else str(value).strip().upper()
        load = main_db.scalar(select(Load).where(Load.reference == ref))
        if load is not None:
            return load
    return None


def compute_flags(fields: dict[str, Any], load: Load | None) -> list[str]:
    """Return human-readable mismatch / missing-field flags."""
    flags: list[str] = []
    if not fields.get("load_number"):
        flags.append("No load number found on document.")
    if not fields.get("signature_present"):
        flags.append("No signature detected.")
    if fields.get("weight_lbs") is None:
        flags.append("Weight not found.")
    if fields.get("piece_count") is None:
        flags.append("Piece count not found.")

    if load is not None:
        doc_weight = fields.get("weight_lbs")
        if doc_weight and load.weight_lbs and abs(doc_weight - load.weight_lbs) > max(
            50, 0.05 * load.weight_lbs
        ):
            flags.append(
                f"Weight mismatch: document {doc_weight} lbs vs load {load.weight_lbs} lbs."
            )
    return flags


def _classify_status(fields: dict[str, Any], load: Load | None, flags: list[str]) -> DocumentStatus:
    if load is None:
        return DocumentStatus.unmatched
    if any("mismatch" in f.lower() for f in flags):
        return DocumentStatus.mismatch
    missing = any(("not found" in f.lower() or "no " in f.lower()) for f in flags)
    return DocumentStatus.missing_info if missing else DocumentStatus.matched


def _invoice_amount(load: Load, fields: dict[str, Any]) -> tuple[float, list[dict[str, Any]]]:
    """Derive an invoice amount + line items from the rate con or the lane."""
    rate = fields.get("rate_amount")
    if rate:
        linehaul = float(rate)
        items = [{"description": "Linehaul (per rate confirmation)", "amount": linehaul}]
    else:
        miles = _haversine_mi(load.origin_lat, load.origin_lng, load.dest_lat, load.dest_lng)
        linehaul = max(_MIN_LINEHAUL, round(miles * _RATE_PER_MILE, 2))
        items = [
            {
                "description": f"Linehaul {load.origin_name} -> {load.dest_name} "
                f"({miles:.0f} mi @ ${_RATE_PER_MILE}/mi)",
                "amount": linehaul,
            }
        ]
    fuel = round(linehaul * 0.18, 2)
    items.append({"description": "Fuel surcharge (18%)", "amount": fuel})
    return round(linehaul + fuel, 2), items


def generate_invoice(cap_db: Session, load: Load, document: Document) -> Invoice:
    """Create a draft Invoice for a matched POD in the local store. Caller commits."""
    amount, line_items = _invoice_amount(load, document.extracted_fields or {})
    invoice = Invoice(
        load_id=load.id,
        document_id=document.id,
        number=f"INV-{load.reference.replace('LD-', '')}-{document.id}",
        amount=amount,
        line_items=line_items,
        status=InvoiceStatus.draft,
    )
    cap_db.add(invoice)
    cap_db.flush()
    return invoice


def _invoice_email_body(load: Load, invoice: Invoice) -> tuple[str, str]:
    lines = "\n".join(
        f"  - {item['description']}: ${item['amount']:,.2f}"
        for item in (invoice.line_items or [])
    )
    subject = f"Invoice {invoice.number} — Load {load.reference}"
    body = (
        f"Hello {load.customer.name},\n\n"
        f"Please find the invoice for load {load.reference} "
        f"({load.origin_name} to {load.dest_name}), delivered per the attached POD.\n\n"
        f"Invoice {invoice.number}\n{lines}\n"
        f"  Total due: ${invoice.amount:,.2f}\n\n"
        f"Thank you for your business.\n\nThe {get_settings().company_name} Team"
    )
    return subject, body


def _latest_matched_pod(cap_db: Session, load_id: int) -> Document | None:
    return cap_db.scalar(
        select(Document)
        .where(
            Document.load_id == load_id,
            Document.doc_type == DocumentType.pod,
            Document.match_status == DocumentStatus.matched,
        )
        .order_by(Document.created_at.desc())
        .limit(1)
    )


def invoice_for_load(
    main_db: Session, cap_db: Session, load_id: int, *, dry_run: bool = False
) -> dict[str, Any]:
    """Generate (and send/queue) an invoice for a load from its matched POD."""
    load = main_db.get(Load, load_id)
    if load is None:
        return {"error": f"load {load_id} not found"}
    document = _latest_matched_pod(cap_db, load_id)
    if document is None:
        return {"error": f"no matched POD on file for load {load.reference}"}

    if dry_run:
        amount, items = _invoice_amount(load, document.extracted_fields or {})
        return {"dry_run": True, "would_invoice": {"amount": amount, "line_items": items}}

    confidence = (document.extracted_fields or {}).get("confidence", "medium")
    outcome = _invoice_and_send(cap_db, load, document, confidence)
    cap_db.commit()
    return outcome


def process_document(
    main_db: Session,
    cap_db: Session,
    *,
    file_path: str,
    media_type: str,
    original_name: str | None = None,
    doc_type_hint: str | None = None,
    load_hint: str | None = None,
) -> dict[str, Any]:
    """End-to-end: extract -> match -> persist -> (POD) invoice -> send/queue."""
    fields = extract_fields(file_path, media_type)
    load = match_load(main_db, fields, hint=load_hint)
    flags = compute_flags(fields, load)
    status = _classify_status(fields, load, flags)

    raw_type = (doc_type_hint or fields.get("doc_type") or "other").lower()
    try:
        doc_type = DocumentType(raw_type)
    except ValueError:
        doc_type = DocumentType.other

    document = Document(
        load_id=load.id if load else None,
        doc_type=doc_type,
        file_path=file_path,
        original_name=original_name,
        extracted_fields=fields,
        match_status=status,
        flags=flags,
    )
    cap_db.add(document)
    cap_db.flush()

    confidence = fields.get("confidence", "medium")
    log_action(
        cap_db,
        capability="document",
        action="process_document",
        result=status.value,
        load_id=load.id if load else None,
        load_ref=load.reference if load else None,
        confidence=confidence,
        summary=(
            f"Processed {doc_type.value.upper()} -> "
            f"{load.reference if load else 'no match'} ({status.value})"
        ),
        data={"flags": flags, "fields": fields, "document_id": document.id},
    )

    result: dict[str, Any] = {
        "document_id": document.id,
        "doc_type": doc_type.value,
        "match_status": status.value,
        "load_id": load.id if load else None,
        "load_reference": load.reference if load else None,
        "fields": fields,
        "flags": flags,
        "invoice": None,
    }

    if doc_type == DocumentType.pod and load is not None and status == DocumentStatus.matched:
        result.update(_invoice_and_send(cap_db, load, document, confidence))

    cap_db.commit()
    return result


def _invoice_and_send(
    cap_db: Session, load: Load, document: Document, confidence: str
) -> dict[str, Any]:
    invoice = generate_invoice(cap_db, load, document)
    subject, body = _invoice_email_body(load, invoice)
    decision = decide("send_invoice", confidence=confidence, amount=invoice.amount)

    payload = {
        "to_email": load.customer.email,
        "subject": subject,
        "body": body,
        "invoice_id": invoice.id,
    }

    if decision.needs_approval:
        invoice.status = InvoiceStatus.queued_for_approval
        item = approvals.enqueue(
            cap_db,
            action_type="send_invoice",
            capability="document",
            reason=decision.reason,
            payload=payload,
            load_id=load.id,
            load_ref=load.reference,
            confidence=confidence,
        )
        return {
            "invoice": {
                "id": invoice.id,
                "number": invoice.number,
                "amount": invoice.amount,
                "status": invoice.status.value,
                "approval_item_id": item.id,
            }
        }

    sent, message = send_customer_email(to_email=load.customer.email, subject=subject, body=body)
    if sent:
        invoice.status = InvoiceStatus.sent
    log_action(
        cap_db,
        capability="document",
        action="send_invoice",
        result="sent" if sent else "send_failed",
        load_id=load.id,
        load_ref=load.reference,
        confidence=confidence,
        summary=f"Invoice {invoice.number} (${invoice.amount:,.2f}) emailed to {load.customer.name}",
        data={"message": message, "invoice_id": invoice.id},
    )
    return {
        "invoice": {
            "id": invoice.id,
            "number": invoice.number,
            "amount": invoice.amount,
            "status": invoice.status.value,
            "email_sent": sent,
            "send_message": message,
        }
    }
