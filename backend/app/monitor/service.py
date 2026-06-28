"""The autonomous monitoring loop (deterministic — no AI in the loop itself).

Each tick assesses every active load: distance → obstruction/reroute →
HOS-aware ETA. If a load will miss its window, it auto-reassigns to a capable
backup truck (decision 2) and proactively emails the customer. Delivered loads
get a delivery email. Claude is only ever touched inside `notify_customer`
(production mode); the assessment is free.

As it works it emits a **reasoning trace** (`kind="reasoning"` events, also
returned from `tick()`) so the UI can show a running log of what the AI is
thinking and doing.

Mirrors the `Simulator` background-loop pattern (`app/sim.py`).
"""

from __future__ import annotations

import asyncio
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent.tools import _haversine_mi, _log_event, _reassign_load
from app.clock import utcnow
from app.config import get_settings
from app.db import SessionLocal
from app.models import Incident, Load, LoadStatus, Truck
from app.monitor.dispatch import find_backup_truck
from app.monitor.hos import hos_aware_eta
from app.monitor.notify import notify_customer
from app.monitor.routing import check_route_obstructions, find_alternate_route

ACTIVE = [LoadStatus.assigned, LoadStatus.in_transit, LoadStatus.delayed]


def _fmt_eta(dt: datetime) -> str:
    return dt.strftime("%b %d, %I:%M %p UTC")


@dataclass
class Assessment:
    distance_mi: float
    eta: datetime
    eta_hours: float
    rerouted: bool
    reason: str
    reset_needed: bool
    drive_rem: float
    duty_rem: float
    storm: str | None


class Monitor:
    def __init__(self) -> None:
        self.running = False
        self.tick_count = 0
        self._task: asyncio.Task | None = None
        self._lock = threading.Lock()

    @property
    def interval(self) -> float:
        return get_settings().monitor_interval_seconds

    def status(self) -> dict:
        return {
            "running": self.running,
            "tick_count": self.tick_count,
            "interval_seconds": self.interval,
            "test_mode": get_settings().ai_test_mode,
        }

    def tick(self) -> dict:
        with self._lock, SessionLocal() as db:
            return self._tick(db)

    # --- assessment (pure) -------------------------------------------------

    def _assess(self, load: Load, truck: Truck, incidents: list[Incident]) -> Assessment:
        speed = get_settings().driving_speed_mph
        origin = (truck.current_lat, truck.current_lng)
        dest = (load.dest_lat, load.dest_lng)
        dist = _haversine_mi(*origin, *dest)
        obs = check_route_obstructions(origin, dest, incidents)

        direct = hos_aware_eta(
            dist, speed, truck.hos_drive_remaining, truck.hos_duty_remaining, truck.hos_since_break
        )
        best_h = direct.elapsed_hours + obs.eta_impact_minutes / 60.0
        rerouted = False
        if obs.hit:
            alt = find_alternate_route(obs.incidents, dist)
            ar = hos_aware_eta(
                alt.distance_mi, speed, truck.hos_drive_remaining,
                truck.hos_duty_remaining, truck.hos_since_break,
            )
            if ar.elapsed_hours < best_h:
                best_h, rerouted = ar.elapsed_hours, True

        storm = obs.incidents[0]["summary"] if obs.hit else None
        reason = (
            storm if storm
            else "the driver's remaining legal hours" if direct.reset_needed
            else "conditions on the route"
        )
        return Assessment(
            distance_mi=dist,
            eta=utcnow() + timedelta(hours=best_h),
            eta_hours=best_h,
            rerouted=rerouted,
            reason=reason,
            reset_needed=direct.reset_needed,
            drive_rem=truck.hos_drive_remaining,
            duty_rem=truck.hos_duty_remaining,
            storm=storm,
        )

    # --- one pass over the fleet -------------------------------------------

    def _tick(self, db: Session) -> dict:
        self.tick_count += 1
        incidents = list(db.scalars(select(Incident).where(Incident.active.is_(True))))
        actions: list[dict] = []
        reasoning: list[dict] = []

        def emit(level: str, text: str, load: Load | None = None) -> None:
            reasoning.append({"level": level, "text": text})
            _log_event(
                db, "reasoning", text,
                load_id=load.id if load else None,
                data={"level": level},
            )

        loads = db.scalars(select(Load).where(Load.status.in_(ACTIVE))).all()
        active = [
            load_obj for load_obj in loads
            if load_obj.truck is not None and load_obj.truck.current_lat is not None
        ]
        emit("scan", f"Monitoring {len(active)} active load(s) for delivery risk")

        for load in active:
            truck = load.truck
            a = self._assess(load, truck, incidents)
            load.eta = a.eta

            emit("check", f"Assessing {load.reference}: {load.origin_name} → {load.dest_name}", load)
            emit(
                "info",
                f"{a.distance_mi:.0f} mi to go on {truck.name}; "
                f"driver has {a.drive_rem:.1f}h driving / {a.duty_rem:.1f}h on-duty left",
                load,
            )
            if a.storm:
                emit("alert", f"Obstruction on route: {a.storm}", load)
            if a.reset_needed:
                emit("alert", "Driver would exceed legal hours — a 10-hour reset is required", load)
            if a.rerouted:
                emit("info", "Rerouting around the obstruction to recover time", load)

            if a.eta <= load.deliver_by:
                emit("success", f"{load.reference} on track — ETA {_fmt_eta(a.eta)}", load)
                if load.status == LoadStatus.delayed:
                    load.status = LoadStatus.in_transit
                continue

            emit(
                "alert",
                f"{load.reference} will MISS its window — predicted ETA {_fmt_eta(a.eta)} "
                f"vs deliver-by {_fmt_eta(load.deliver_by)}",
                load,
            )

            # LATE → try to auto-reassign to a backup that can make it legally.
            emit("decision", "Searching the fleet for a backup truck that can make it on time", load)
            backup = find_backup_truck(db, load, get_settings().driving_speed_mph)
            reassigned = False
            if backup is not None and backup.id != load.assigned_truck_id:
                emit(
                    "decision",
                    f"{backup.name} ({backup.driver_name}) is available with fresh hours — selecting it",
                    load,
                )
                emit("action", f"Reassigning {load.reference}: {truck.name} → {backup.name}", load)
                res = _reassign_load(db, load.id, backup.id, dry_run=False)
                reassigned = bool(res.get("reassigned"))

            if reassigned:
                db.refresh(load)
                a = self._assess(load, load.truck, incidents)
                load.eta = a.eta
            else:
                emit("alert", "No backup truck can legally make the window", load)
                load.status = LoadStatus.delayed

            if not load.delay_notified:
                emit("action", f"Emailing {load.customer.name} an updated ETA", load)
                ctx = {
                    "eta_str": _fmt_eta(load.eta),
                    "truck": backup.name if reassigned else None,
                    "reason": a.reason,
                }
                _log_event(
                    db, "delay_detected",
                    f"{load.reference} at risk → "
                    + (f"reassigned to {backup.name}" if reassigned else "delayed"),
                    load_id=load.id,
                    data={"eta": load.eta.isoformat(), "reassigned": reassigned, "reason": a.reason},
                )
                notify_customer(db, load, "recovered" if reassigned else "delay", ctx)
                load.delay_notified = True
                if reassigned:
                    emit("success", f"{load.reference} recovered — back on schedule, customer notified", load)
                actions.append({"load": load.reference, "reassigned": reassigned, "notified": True})

        # Delivered loads that haven't had a delivery email yet.
        for load in db.scalars(
            select(Load).where(
                Load.status == LoadStatus.delivered, Load.delivered_notified.is_(False)
            )
        ):
            emit("action", f"{load.reference} delivered — emailing {load.customer.name} confirmation", load)
            notify_customer(db, load, "delivered", {})
            load.delivered_notified = True
            actions.append({"load": load.reference, "delivered_email": True})

        db.commit()
        return {
            "tick": self.tick_count,
            "test_mode": get_settings().ai_test_mode,
            "actions": actions,
            "reasoning": reasoning,
        }

    # --- background loop ---------------------------------------------------

    async def _loop(self) -> None:
        while self.running:
            await asyncio.sleep(self.interval)
            if not self.running:
                break
            try:
                await asyncio.to_thread(self.tick)
            except Exception as exc:  # never let one bad tick kill the loop
                print(f"[monitor] tick error: {exc}")

    def start(self) -> None:
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


monitor = Monitor()
