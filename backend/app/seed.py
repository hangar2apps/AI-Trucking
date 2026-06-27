"""Seed a believable demo scenario.

Centerpiece is load LD-1042: a Dallas -> Houston run that is now running late,
with a backup truck (Truck 23) sitting available near the lane — the setup for
the demo climax where the AI emails the customer and reassigns the backup.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Customer, Load, LoadStatus, Truck, TruckStatus


def seed(db: Session) -> None:
    if db.scalar(select(Load).limit(1)) is not None:
        return  # already seeded

    now = datetime.now()

    customers = [
        Customer(
            name="Maria Chen",
            company="Lone Star Components",
            email="maria.chen@lonestarcomponents.example",
            phone="+1-214-555-0182",
        ),
        Customer(
            name="Derek Olsson",
            company="Gulf Coast Provisions",
            email="derek@gulfcoastprovisions.example",
            phone="+1-713-555-0144",
        ),
        Customer(
            name="Priya Raman",
            company="Bayou Medical Supply",
            email="p.raman@bayoumed.example",
        ),
    ]
    db.add_all(customers)
    db.flush()

    trucks = [
        Truck(
            name="Truck 17",
            driver_name="Sam Whitfield",
            status=TruckStatus.en_route,
            current_lat=31.55,   # mid-lane, stalled south of Dallas
            current_lng=-96.20,
            capacity_lbs=44000,
        ),
        Truck(
            name="Truck 23",
            driver_name="Lena Ortiz",
            status=TruckStatus.available,  # the backup for the demo reroute
            current_lat=31.10,
            current_lng=-95.95,
            capacity_lbs=44000,
        ),
        Truck(
            name="Truck 08",
            driver_name="Marcus Bell",
            status=TruckStatus.en_route,
            current_lat=30.27,
            current_lng=-97.74,  # Austin area
            capacity_lbs=42000,
        ),
        Truck(
            name="Truck 31",
            driver_name="Aisha Karim",
            status=TruckStatus.maintenance,
            current_lat=32.78,
            current_lng=-96.80,
            capacity_lbs=48000,
        ),
    ]
    db.add_all(trucks)
    db.flush()

    loads = [
        # The demo load: running late.
        Load(
            reference="LD-1042",
            customer_id=customers[0].id,
            assigned_truck_id=trucks[0].id,
            origin_name="Dallas, TX",
            origin_lat=32.7767,
            origin_lng=-96.7970,
            dest_name="Houston, TX",
            dest_lat=29.7604,
            dest_lng=-95.3698,
            pickup_at=now - timedelta(hours=3),
            deliver_by=now + timedelta(hours=1, minutes=30),
            eta=now + timedelta(hours=3, minutes=15),  # ~1h45 late
            status=LoadStatus.delayed,
            commodity="Electronic components",
            weight_lbs=18500,
            notes="Truck 17 lost ~2h to an I-45 closure near Corsicana.",
        ),
        Load(
            reference="LD-1043",
            customer_id=customers[1].id,
            assigned_truck_id=trucks[2].id,
            origin_name="San Antonio, TX",
            origin_lat=29.4241,
            origin_lng=-98.4936,
            dest_name="Austin, TX",
            dest_lat=30.2672,
            dest_lng=-97.7431,
            pickup_at=now - timedelta(hours=1),
            deliver_by=now + timedelta(hours=2),
            eta=now + timedelta(hours=1, minutes=20),  # on track
            status=LoadStatus.in_transit,
            commodity="Packaged foods",
            weight_lbs=26000,
        ),
        Load(
            reference="LD-1044",
            customer_id=customers[2].id,
            origin_name="Houston, TX",
            origin_lat=29.7604,
            origin_lng=-95.3698,
            dest_name="New Orleans, LA",
            dest_lat=29.9511,
            dest_lng=-90.0715,
            pickup_at=now + timedelta(hours=4),
            deliver_by=now + timedelta(hours=12),
            status=LoadStatus.pending,
            commodity="Medical supplies",
            weight_lbs=9200,
            notes="Awaiting truck assignment.",
        ),
    ]
    db.add_all(loads)
    db.commit()
