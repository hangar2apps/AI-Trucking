"""Local capability tables (documents, invoices, inspections, approvals, log).

These live in the separate local SQLite store (see app/capdb.py). load_id /
document_id are plain integers that reference the main DB's loads (and the local
documents) by id — no cross-database foreign keys.
"""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.capdb import CapBase


class DocumentType(str, enum.Enum):
    pod = "pod"
    bol = "bol"
    rate_con = "rate_con"
    other = "other"


class DocumentStatus(str, enum.Enum):
    matched = "matched"
    mismatch = "mismatch"
    missing_info = "missing_info"
    unmatched = "unmatched"


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    queued_for_approval = "queued_for_approval"
    sent = "sent"


class InspectionPhase(str, enum.Enum):
    pickup = "pickup"
    delivery = "delivery"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Document(CapBase):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    load_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    doc_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), default=DocumentType.other)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    original_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    extracted_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    match_status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), default=DocumentStatus.unmatched
    )
    flags: Mapped[list | None] = mapped_column(JSON, nullable=True)


class Invoice(CapBase):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    load_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    document_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    number: Mapped[str] = mapped_column(String(40))
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    line_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus), default=InvoiceStatus.draft)


class Inspection(CapBase):
    __tablename__ = "inspections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    load_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    phase: Mapped[InspectionPhase] = mapped_column(
        Enum(InspectionPhase), default=InspectionPhase.delivery
    )
    file_paths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    findings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    seal_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    condition_report: Mapped[str | None] = mapped_column(Text, nullable=True)
    damage_detected: Mapped[bool] = mapped_column(Boolean, default=False)


class ApprovalItem(CapBase):
    __tablename__ = "approval_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    action_type: Mapped[str] = mapped_column(String(60))
    capability: Mapped[str] = mapped_column(String(40))
    load_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    load_ref: Mapped[str | None] = mapped_column(String(40), nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(20), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.pending)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AgentAction(CapBase):
    __tablename__ = "agent_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    capability: Mapped[str] = mapped_column(String(40))
    action: Mapped[str] = mapped_column(String(80))
    load_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    load_ref: Mapped[str | None] = mapped_column(String(40), nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(20), nullable=True)
    result: Mapped[str | None] = mapped_column(String(40), nullable=True)
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
