from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent.email_agent import draft_status_email
from app.config import get_settings
from app.db import get_db
from app.models import Load
from app.schemas import EmailDraftResponse, LoadDetail, LoadOut

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("", response_model=list[LoadOut])
def list_loads(db: Session = Depends(get_db)) -> list[Load]:
    return list(db.scalars(select(Load).order_by(Load.deliver_by)))


@router.get("/{load_id}", response_model=LoadDetail)
def get_load(load_id: int, db: Session = Depends(get_db)) -> Load:
    load = db.get(Load, load_id)
    if load is None:
        raise HTTPException(404, "Load not found")
    return load


@router.post("/{load_id}/draft-email", response_model=EmailDraftResponse)
def draft_email(load_id: int, db: Session = Depends(get_db)) -> EmailDraftResponse:
    """The thinnest AI vertical: read a load -> draft a status email."""
    load = db.get(Load, load_id)
    if load is None:
        raise HTTPException(404, "Load not found")

    if not get_settings().anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY is not configured")

    draft = draft_status_email(load)
    return EmailDraftResponse(
        load_reference=load.reference,
        to_email=load.customer.email,
        to_name=load.customer.name,
        model=get_settings().email_model,
        draft=draft,
    )
