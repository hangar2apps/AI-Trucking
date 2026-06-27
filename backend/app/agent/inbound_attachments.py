"""Route inbound email attachments to document or image capabilities.

When a customer or driver emails a PDF/POD/BOL, the document agent runs. When they
email photos, the image inspection agent runs — same as the upload endpoints, but
triggered automatically from the mail pipeline.
"""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy.orm import Session

from app.agent import document_agent, image_agent
from app.agent import storage

_LOAD_REF = re.compile(r"\bLD-\d+\b", re.IGNORECASE)

_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp", ".gif"}
# PNG/JPEG attached to mail could be a scanned POD (document) or a freight photo.
# Heuristic: filename hints (pod, bol, invoice, rate) → document; else image.


def load_hint_from_text(*, subject: str, body: str) -> str | None:
    match = _LOAD_REF.search(f"{subject}\n{body}")
    return match.group(0).upper() if match else None


def inspection_phase_from_text(*, subject: str, body: str) -> str:
    text = f"{subject} {body}".lower()
    if "pickup" in text or "picked up" in text or "at origin" in text:
        return "pickup"
    return "delivery"


def _decode_attachment(att: dict[str, Any]) -> tuple[str, str, bytes]:
    """Return (filename, media_type, raw bytes) from a webhook or simulate payload."""
    name = str(att.get("filename") or att.get("name") or att.get("original_name") or "attachment")
    media_type = str(
        att.get("content_type") or att.get("media_type") or storage.guess_media_type(name)
    )
    raw_b64 = att.get("content") or att.get("file_base64") or att.get("data") or ""
    if not raw_b64:
        raise ValueError(f"attachment {name!r} has no content")
    if isinstance(raw_b64, str) and raw_b64.strip().startswith("data:"):
        raw_b64 = raw_b64.split(",", 1)[1]
    import base64

    raw = base64.b64decode(str(raw_b64), validate=True)
    return name, media_type, raw


def _looks_like_document(name: str, media_type: str) -> bool:
    lower = name.lower()
    if media_type == "application/pdf" or lower.endswith(".pdf"):
        return True
    doc_words = ("pod", "bol", "bill of lading", "rate", "invoice", "confirmation", "lading")
    return any(w in lower for w in doc_words)


def _classify_attachment(name: str, media_type: str) -> str:
    """Return 'document' or 'photo'."""
    if storage.is_image(media_type) and not _looks_like_document(name, media_type):
        return "photo"
    if _looks_like_document(name, media_type):
        return "document"
    if storage.is_image(media_type):
        return "photo"
    return "document"


def process_inbound_attachments(
    main_db: Session,
    cap_db: Session,
    *,
    attachments: list[dict[str, Any]],
    subject: str = "",
    body: str = "",
) -> list[dict[str, Any]]:
    """Persist attachments and run the matching capability for each."""
    if not attachments:
        return []

    load_hint = load_hint_from_text(subject=subject, body=body)
    phase = inspection_phase_from_text(subject=subject, body=body)
    results: list[dict[str, Any]] = []
    photo_files: list[tuple[str, str]] = []

    for att in attachments:
        try:
            name, media_type, raw = _decode_attachment(att)
        except (ValueError, Exception) as exc:
            results.append({"error": str(exc), "filename": att.get("filename")})
            continue

        kind = _classify_attachment(name, media_type)
        if kind == "document":
            path = storage.save_bytes("documents", raw, original_name=name)
            outcome = document_agent.process_document(
                main_db,
                cap_db,
                file_path=path,
                media_type=media_type,
                original_name=name,
                load_hint=load_hint,
            )
            results.append({"type": "document", "filename": name, "result": outcome})
        else:
            path = storage.save_bytes("photos", raw, original_name=name)
            photo_files.append((path, media_type))

    if photo_files:
        outcome = image_agent.process_inspection(
            main_db,
            cap_db,
            file_paths=photo_files,
            phase=phase,
            load_hint=load_hint,
        )
        results.append(
            {
                "type": "inspection",
                "filenames": [a.get("filename") or a.get("name") for a in attachments],
                "result": outcome,
            }
        )

    return results


def summarize_attachment_results(results: list[dict[str, Any]]) -> str:
    """Plain-text summary for an auto-reply after attachment processing."""
    if not results:
        return ""
    lines: list[str] = ["We received your attachment(s) and processed them automatically:\n"]
    for item in results:
        if item.get("error"):
            lines.append(f"- {item.get('filename', 'file')}: could not process ({item['error']})")
            continue
        if item.get("type") == "document":
            r = item.get("result") or {}
            ref = r.get("load_reference") or "unmatched"
            status = r.get("match_status", "processed")
            inv = r.get("invoice")
            line = f"- Document {item.get('filename')}: matched to {ref} ({status})"
            if inv and isinstance(inv, dict):
                line += f"; invoice {inv.get('number')} ${inv.get('amount', 0):,.2f}"
            lines.append(line)
        elif item.get("type") == "inspection":
            r = item.get("result") or {}
            ref = r.get("load_reference") or "unmatched"
            damage = "damage detected" if r.get("damage_detected") else "no damage seen"
            lines.append(f"- Photo inspection ({ref}): {damage}")
    return "\n".join(lines)
