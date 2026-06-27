"""Event intake for the multi-capability agent.

Thin HTTP surface that accepts the four event kinds (or files that become
events) and hands them to the central capability router. Files are saved to the
local filesystem first; only the path travels through the agent.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agent import customer_comms, storage
from app.agent.router import EVENT_TYPES, route_event
from app.capdb import get_cap_db
from app.config import get_settings
from app.db import get_db

router = APIRouter(prefix="/intake", tags=["intake"])


def _require_key() -> None:
    if not get_settings().anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY is not configured")


class EventRequest(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


@router.post("/event")
def ingest_event(
    req: EventRequest,
    db: Session = Depends(get_db),
    cap_db: Session = Depends(get_cap_db),
) -> dict[str, Any]:
    """Generic event intake — routes any supported event through the agent."""
    _require_key()
    if req.type not in EVENT_TYPES:
        raise HTTPException(400, f"unknown event type; expected one of {EVENT_TYPES}")
    return route_event(db, cap_db, req)


class DocumentRequest(BaseModel):
    file_base64: str = Field(min_length=8)
    original_name: str = ""
    media_type: str = ""
    doc_type_hint: str | None = None
    load_hint: str | None = None


@router.post("/document")
def ingest_document(
    req: DocumentRequest,
    db: Session = Depends(get_db),
    cap_db: Session = Depends(get_cap_db),
) -> dict[str, Any]:
    """Upload a document (base64), store it, and process it through the agent."""
    _require_key()
    try:
        path = storage.save_base64("documents", req.file_base64, original_name=req.original_name or None)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    media_type = req.media_type or storage.guess_media_type(req.original_name)
    return route_event(
        db,
        cap_db,
        {
            "type": "document_received",
            "payload": {
                "file_path": path,
                "media_type": media_type,
                "original_name": req.original_name or None,
                "doc_type_hint": req.doc_type_hint,
                "load_hint": req.load_hint,
            },
        },
    )


class PhotoFile(BaseModel):
    file_base64: str = Field(min_length=8)
    name: str = ""
    media_type: str = ""


class PhotoRequest(BaseModel):
    photos: list[PhotoFile] = Field(min_length=1)
    phase: Literal["pickup", "delivery"] = "delivery"
    load_hint: str | None = None


@router.post("/photo")
def ingest_photo(
    req: PhotoRequest,
    db: Session = Depends(get_db),
    cap_db: Session = Depends(get_cap_db),
) -> dict[str, Any]:
    """Upload pickup/delivery photos (base64), store them, and run inspection."""
    _require_key()
    file_paths: list[list[str]] = []
    for photo in req.photos:
        try:
            path = storage.save_base64("photos", photo.file_base64, original_name=photo.name or None)
        except ValueError as exc:
            raise HTTPException(400, str(exc)) from exc
        media_type = photo.media_type or storage.guess_media_type(photo.name, fallback="image/jpeg")
        file_paths.append([path, media_type])
    return route_event(
        db,
        cap_db,
        {
            "type": "photo_uploaded",
            "payload": {
                "file_paths": file_paths,
                "phase": req.phase,
                "load_hint": req.load_hint,
            },
        },
    )


class MilestoneRequest(BaseModel):
    load_id: int
    milestone: Literal["picked_up", "in_transit", "two_hours_out", "delivered"]


@router.post("/milestone")
def send_milestone(
    req: MilestoneRequest,
    db: Session = Depends(get_db),
    cap_db: Session = Depends(get_cap_db),
) -> dict[str, Any]:
    """Send a proactive milestone email for a load."""
    _require_key()
    return customer_comms.send_milestone_email(
        db, cap_db, load_id=req.load_id, milestone=req.milestone
    )
