"""Demo control endpoints — let visitors reset the shared scenario."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.seed import reset_demo

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/reset")
def reset(db: Session = Depends(get_db)) -> dict:
    """Reset operational demo data (trucks/loads/incidents/events) to a fresh
    now()-relative scenario so the reroute can be replayed. Marketing leads are
    left untouched."""
    reset_demo(db)
    return {"status": "ok", "message": "Demo data reset."}
