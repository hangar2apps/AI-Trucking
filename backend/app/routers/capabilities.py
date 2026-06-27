"""Read endpoints for the assistant UI: documents, inspections, action log."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.capdb import get_cap_db
from app.cap_models import AgentAction, Document, Inspection, Invoice

router = APIRouter(tags=["capabilities"])


class DocumentOut(BaseModel):
    id: int
    created_at: datetime
    load_id: int | None
    doc_type: str
    original_name: str | None
    match_status: str
    extracted_fields: dict | None
    flags: list | None


class InvoiceOut(BaseModel):
    id: int
    created_at: datetime
    load_id: int | None
    document_id: int | None
    number: str
    amount: float
    line_items: list | None
    status: str


class InspectionOut(BaseModel):
    id: int
    created_at: datetime
    load_id: int | None
    phase: str
    file_paths: list | None
    seal_number: str | None
    condition_report: str | None
    damage_detected: bool
    findings: dict | None


class AgentActionOut(BaseModel):
    id: int
    created_at: datetime
    capability: str
    action: str
    load_id: int | None
    load_ref: str | None
    confidence: str | None
    result: str | None
    data: dict | None


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(limit: int = 50, db: Session = Depends(get_cap_db)) -> list[Document]:
    stmt = select(Document).order_by(Document.created_at.desc()).limit(min(limit, 200))
    return list(db.scalars(stmt))


@router.get("/invoices", response_model=list[InvoiceOut])
def list_invoices(limit: int = 50, db: Session = Depends(get_cap_db)) -> list[Invoice]:
    stmt = select(Invoice).order_by(Invoice.created_at.desc()).limit(min(limit, 200))
    return list(db.scalars(stmt))


@router.get("/inspections", response_model=list[InspectionOut])
def list_inspections(limit: int = 50, db: Session = Depends(get_cap_db)) -> list[Inspection]:
    stmt = select(Inspection).order_by(Inspection.created_at.desc()).limit(min(limit, 200))
    return list(db.scalars(stmt))


@router.get("/agent/actions", response_model=list[AgentActionOut])
def list_agent_actions(limit: int = 100, db: Session = Depends(get_cap_db)) -> list[AgentAction]:
    stmt = select(AgentAction).order_by(AgentAction.created_at.desc()).limit(min(limit, 300))
    return list(db.scalars(stmt))
