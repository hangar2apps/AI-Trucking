"""Human-approval queue API: list pending items, approve (execute), or reject."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent import approvals
from app.capdb import get_cap_db
from app.cap_models import ApprovalItem, ApprovalStatus

router = APIRouter(prefix="/approvals", tags=["approvals"])


class ApprovalOut(BaseModel):
    id: int
    created_at: datetime
    resolved_at: datetime | None
    action_type: str
    capability: str
    load_id: int | None
    load_ref: str | None
    confidence: str | None
    reason: str | None
    payload: dict | None
    status: str
    result: dict | None


class RejectRequest(BaseModel):
    note: str | None = None


def _to_out(item: ApprovalItem) -> ApprovalOut:
    return ApprovalOut(
        id=item.id,
        created_at=item.created_at,
        resolved_at=item.resolved_at,
        action_type=item.action_type,
        capability=item.capability,
        load_id=item.load_id,
        load_ref=item.load_ref,
        confidence=item.confidence,
        reason=item.reason,
        payload=item.payload,
        status=item.status.value,
        result=item.result,
    )


@router.get("", response_model=list[ApprovalOut])
def list_approvals(
    status: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_cap_db),
) -> list[ApprovalOut]:
    """List approval items, newest first (optionally filter by status)."""
    stmt = select(ApprovalItem).order_by(ApprovalItem.created_at.desc()).limit(min(limit, 200))
    if status:
        try:
            stmt = stmt.where(ApprovalItem.status == ApprovalStatus(status))
        except ValueError as exc:
            raise HTTPException(400, f"invalid status {status!r}") from exc
    return [_to_out(item) for item in db.scalars(stmt)]


@router.post("/{item_id}/approve", response_model=ApprovalOut)
def approve(item_id: int, db: Session = Depends(get_cap_db)) -> ApprovalOut:
    """Approve a pending action — executes it (e.g. sends the prepared email)."""
    item = db.get(ApprovalItem, item_id)
    if item is None:
        raise HTTPException(404, "approval item not found")
    if item.status != ApprovalStatus.pending:
        raise HTTPException(409, f"item already {item.status.value}")
    approvals.execute(db, item)
    db.commit()
    db.refresh(item)
    return _to_out(item)


@router.post("/{item_id}/reject", response_model=ApprovalOut)
def reject(item_id: int, req: RejectRequest, db: Session = Depends(get_cap_db)) -> ApprovalOut:
    """Reject a pending action — it will not be executed."""
    item = db.get(ApprovalItem, item_id)
    if item is None:
        raise HTTPException(404, "approval item not found")
    if item.status != ApprovalStatus.pending:
        raise HTTPException(409, f"item already {item.status.value}")
    approvals.reject(db, item, note=req.note)
    db.commit()
    db.refresh(item)
    return _to_out(item)
