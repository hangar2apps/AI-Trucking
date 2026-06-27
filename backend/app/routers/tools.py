from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent.tools import execute_tool
from app.db import get_db
from app.schemas import ComputeEtaRequest, WeatherRouteRequest

router = APIRouter(prefix="/tools", tags=["tools"])


@router.post("/check-weather-route")
def check_weather_route(req: WeatherRouteRequest, db: Session = Depends(get_db)) -> dict:
    """Route/weather check (stub until routing service is wired)."""
    return execute_tool(db, "check_weather_route", req.model_dump(), dry_run=True)


@router.post("/compute-eta")
def compute_eta(req: ComputeEtaRequest, db: Session = Depends(get_db)) -> dict:
    """Estimate arrival time for a truck driving to a destination."""
    return execute_tool(db, "compute_eta", req.model_dump(), dry_run=True)
