from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Incident, IncidentKind
from app.monitor.service import monitor
from app.schemas import IncidentCreate, IncidentOut

router = APIRouter(tags=["monitor"])


# --- the autonomous monitor loop ------------------------------------------


@router.post("/monitor/tick")
def monitor_tick() -> dict:
    """Run one assessment pass over every load (manual control for demos)."""
    return monitor.tick()


@router.post("/monitor/start")
async def monitor_start() -> dict:
    """Start the background loop (auto-assesses every monitor_interval_seconds)."""
    monitor.start()
    return monitor.status()


@router.post("/monitor/stop")
async def monitor_stop() -> dict:
    await monitor.stop()
    return monitor.status()


@router.get("/monitor/status")
def monitor_status() -> dict:
    return monitor.status()


# --- incidents (obstructions the monitor checks; injectable for demos) -----


@router.get("/incidents", response_model=list[IncidentOut])
def list_incidents(active_only: bool = False, db: Session = Depends(get_db)) -> list[Incident]:
    stmt = select(Incident).order_by(Incident.id)
    if active_only:
        stmt = stmt.where(Incident.active.is_(True))
    return list(db.scalars(stmt))


@router.post("/incidents", response_model=IncidentOut)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> Incident:
    """Inject an obstruction (weather/accident/disaster) onto the map."""
    try:
        kind = IncidentKind(payload.kind)
    except ValueError as exc:
        raise HTTPException(422, f"invalid kind {payload.kind!r}") from exc
    incident = Incident(
        kind=kind,
        summary=payload.summary,
        center_lat=payload.center_lat,
        center_lng=payload.center_lng,
        radius_mi=payload.radius_mi,
        severity=payload.severity,
        eta_impact_minutes=payload.eta_impact_minutes,
        active=True,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.post("/incidents/{incident_id}/clear", response_model=IncidentOut)
def clear_incident(incident_id: int, db: Session = Depends(get_db)) -> Incident:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(404, "incident not found")
    incident.active = False
    db.commit()
    db.refresh(incident)
    return incident
