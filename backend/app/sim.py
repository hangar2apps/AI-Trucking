"""Fleet simulation: move trucks along their routes so the map shows live motion.

Rules per tick:
- A truck whose active load is `in_transit` advances toward the load's
  destination; on arrival the load is delivered and the truck freed (logs a
  `delivered` event), and its ETA is recomputed from remaining distance.
- A truck whose load is `delayed` is **stalled in the incident** — it doesn't
  move and keeps its (late) ETA. This is why Truck 17 stays late until the AI
  reassigns LD-1042; the new truck is `in_transit` and races to Houston.

Drive it manually via POST /sim/tick, or run the background loop (POST
/sim/start). Movement is decoupled from the agent — motion vs. decisions.
"""

from __future__ import annotations

import asyncio
import threading
from datetime import timedelta
from math import asin, cos, radians, sin, sqrt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.clock import utcnow
from app.config import get_settings
from app.db import SessionLocal
from app.models import Event, Load, LoadStatus, Truck, TruckStatus

settings = get_settings()


def _haversine_mi(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 3958.8
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


class Simulator:
    def __init__(self) -> None:
        self.running = False
        self.tick_count = 0
        self._task: asyncio.Task | None = None
        self._lock = threading.Lock()  # serialize ticks (manual + background)

    @property
    def interval(self) -> float:
        return settings.sim_interval_seconds

    @property
    def step_miles(self) -> float:
        return settings.sim_speed_mph * settings.sim_minutes_per_tick / 60.0

    def status(self) -> dict:
        return {
            "running": self.running,
            "tick_count": self.tick_count,
            "interval_seconds": self.interval,
            "minutes_per_tick": settings.sim_minutes_per_tick,
            "step_miles": round(self.step_miles, 2),
        }

    def tick(self) -> dict:
        """Advance the world one step. Opens its own session; thread-safe."""
        with self._lock, SessionLocal() as db:
            return self._tick(db)

    def _tick(self, db: Session) -> dict:
        self.tick_count += 1
        moved: list[dict] = []
        delivered: list[str] = []
        step = self.step_miles

        trucks = db.scalars(
            select(Truck).where(Truck.status == TruckStatus.en_route)
        ).all()
        for truck in trucks:
            load = db.scalar(
                select(Load).where(
                    Load.assigned_truck_id == truck.id,
                    Load.status.in_([LoadStatus.in_transit, LoadStatus.delayed]),
                )
            )
            if load is None or truck.current_lat is None:
                continue
            if load.status == LoadStatus.delayed:
                continue  # stalled in the incident — stays late until reassigned

            remaining = _haversine_mi(
                truck.current_lat, truck.current_lng, load.dest_lat, load.dest_lng
            )
            if remaining <= step:
                truck.current_lat, truck.current_lng = load.dest_lat, load.dest_lng
                load.status = LoadStatus.delivered
                load.eta = utcnow()
                truck.status = TruckStatus.available
                db.add(
                    Event(
                        kind="delivered",
                        summary=f"{load.reference} delivered to {load.dest_name} by {truck.name}",
                        load_id=load.id,
                        truck_id=truck.id,
                        data={"load_ref": load.reference, "truck": truck.name},
                    )
                )
                delivered.append(load.reference)
            else:
                frac = step / remaining
                truck.current_lat += (load.dest_lat - truck.current_lat) * frac
                truck.current_lng += (load.dest_lng - truck.current_lng) * frac
                hours = (remaining - step) / settings.sim_speed_mph
                load.eta = utcnow() + timedelta(hours=hours)
                # Burn the driver's legal hours as the truck drives.
                driven = settings.sim_minutes_per_tick / 60.0
                truck.hos_drive_remaining = max(0.0, truck.hos_drive_remaining - driven)
                truck.hos_duty_remaining = max(0.0, truck.hos_duty_remaining - driven)
                truck.hos_since_break += driven
                moved.append(
                    {
                        "truck": truck.name,
                        "load": load.reference,
                        "lat": round(truck.current_lat, 4),
                        "lng": round(truck.current_lng, 4),
                    }
                )

        db.commit()
        return {"tick": self.tick_count, "moved": moved, "delivered": delivered}

    # --- background loop ---------------------------------------------------

    async def _loop(self) -> None:
        while self.running:
            await asyncio.sleep(self.interval)
            if not self.running:
                break
            try:
                await asyncio.to_thread(self.tick)
            except Exception as exc:  # never let one bad tick kill the loop
                print(f"[sim] tick error: {exc}")

    def start(self) -> None:
        """Start the background loop. Must be called from the event loop thread."""
        if self.running:
            return
        self.running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self.running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None


simulator = Simulator()
