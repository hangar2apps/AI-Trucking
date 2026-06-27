from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Event
from app.schemas import EventOut

router = APIRouter(tags=["events"])


@router.get("/events", response_model=list[EventOut])
def list_events(
    since_id: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[Event]:
    """Action feed for the map + CS dashboard.

    Poll with `?since_id=<last seen id>` to get only new events (ascending), so
    the map can append reassignment/reroute events as they happen.
    """
    stmt = (
        select(Event)
        .where(Event.id > since_id)
        .order_by(Event.id)
        .limit(limit)
    )
    return list(db.scalars(stmt))
