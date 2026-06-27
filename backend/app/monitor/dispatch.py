"""Find a backup truck that can legally make a delivery on time (deterministic)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent.tools import _haversine_mi
from app.clock import utcnow
from app.models import Load, Truck, TruckStatus
from app.monitor.hos import hos_aware_eta


def find_backup_truck(db: Session, load: Load, speed_mph: float) -> Truck | None:
    """Nearest available truck with capacity + legal hours to beat deliver_by.

    Returns None if no available truck can make the delivery window legally.
    """
    hours_to_deadline = (load.deliver_by - utcnow()).total_seconds() / 3600.0
    candidates = db.scalars(
        select(Truck).where(Truck.status == TruckStatus.available)
    ).all()

    best: Truck | None = None
    best_dist = float("inf")
    for truck in candidates:
        if truck.current_lat is None or truck.current_lng is None:
            continue
        if load.weight_lbs and truck.capacity_lbs and truck.capacity_lbs < load.weight_lbs:
            continue
        dist = _haversine_mi(
            truck.current_lat, truck.current_lng, load.dest_lat, load.dest_lng
        )
        hos = hos_aware_eta(
            dist,
            speed_mph,
            truck.hos_drive_remaining,
            truck.hos_duty_remaining,
            truck.hos_since_break,
        )
        if hos.elapsed_hours <= hours_to_deadline and dist < best_dist:
            best, best_dist = truck, dist
    return best
