"""Seed a believable demo scenario.

Centerpiece is load LD-1042: a Dallas -> Houston run that is now running late,
with a backup truck (Truck 23) sitting available near the lane — the setup for
the demo climax where the AI emails the customer and reassigns the backup.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.clock import utcnow

from app.models import (
    Customer,
    Event,
    Incident,
    IncidentKind,
    Lead,
    Load,
    LoadStatus,
    Truck,
    TruckStatus,
)


def seed(db: Session) -> None:
    if db.scalar(select(Load).limit(1)) is not None:
        return  # already seeded
    _seed_fleet(db, utcnow())
    _seed_leads(db)
    db.commit()


def reset_demo(db: Session) -> None:
    """Force-reset operational demo data (trucks/loads/incidents/events) with
    fresh now()-relative timestamps. Leaves marketing ``leads`` untouched."""
    for model in (Event, Load, Incident, Truck, Customer):
        db.execute(delete(model))
    db.commit()
    _seed_fleet(db, utcnow())
    db.commit()


def _seed_fleet(db: Session, now: datetime) -> None:
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
        Customer(
            name="Lin Zhao",
            company="WestCoast Components",
            email="lin@westcoastcomponents.example",
            phone="+1-323-555-0110",
        ),
        Customer(
            name="Omar Haddad",
            company="Great Lakes Freight Co",
            email="omar@greatlakesfreight.example",
            phone="+1-312-555-0190",
        ),
        Customer(
            name="Rachel Green",
            company="Sunbelt Foods",
            email="rachel@sunbeltfoods.example",
            phone="+1-404-555-0173",
        ),
        Customer(
            name="Tom Becker",
            company="Northeast Retail Group",
            email="tom@northeastretail.example",
            phone="+1-617-555-0162",
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
            hos_drive_remaining=1.5,  # nearly out of legal hours
            hos_duty_remaining=2.0,
            hos_since_break=7.5,
        ),
        Truck(
            name="Truck 23",
            driver_name="Lena Ortiz",
            status=TruckStatus.available,  # the backup for the demo reroute
            current_lat=31.40,   # staged beside Truck 17, north of the storm, for the handoff
            current_lng=-96.05,
            capacity_lbs=44000,
            hos_drive_remaining=11.0,  # fresh
            hos_duty_remaining=14.0,
            hos_since_break=0.0,
        ),
        Truck(
            name="Truck 08",
            driver_name="Marcus Bell",
            status=TruckStatus.en_route,
            current_lat=29.90,
            current_lng=-98.10,  # mid-lane San Antonio -> Austin
            capacity_lbs=42000,
            hos_drive_remaining=8.0,
            hos_duty_remaining=11.0,
            hos_since_break=2.0,
        ),
        Truck(
            name="Truck 31",
            driver_name="Aisha Karim",
            status=TruckStatus.maintenance,
            current_lat=32.78,
            current_lng=-96.80,
            capacity_lbs=48000,
        ),
        # National background fleet (all comfortably within hours for their lanes)
        Truck(
            name="Truck 12",
            driver_name="Diego Morales",
            status=TruckStatus.en_route,  # LA -> Phoenix
            current_lat=34.0522,
            current_lng=-118.2437,
            capacity_lbs=45000,
        ),
        Truck(
            name="Truck 14",
            driver_name="Ana Petrov",
            status=TruckStatus.en_route,  # Seattle -> Portland
            current_lat=47.6062,
            current_lng=-122.3321,
            capacity_lbs=43000,
        ),
        Truck(
            name="Truck 19",
            driver_name="Kevin Wu",
            status=TruckStatus.en_route,  # Chicago -> Detroit
            current_lat=41.8781,
            current_lng=-87.6298,
            capacity_lbs=46000,
        ),
        Truck(
            name="Truck 22",
            driver_name="Brianna Scott",
            status=TruckStatus.en_route,  # Atlanta -> Charlotte
            current_lat=33.7490,
            current_lng=-84.3880,
            capacity_lbs=44000,
        ),
        Truck(
            name="Truck 27",
            driver_name="Luis Ramos",
            status=TruckStatus.en_route,  # Denver -> Salt Lake City
            current_lat=39.7392,
            current_lng=-104.9903,
            capacity_lbs=47000,
        ),
        Truck(
            name="Truck 33",
            driver_name="Hannah Cohen",
            status=TruckStatus.en_route,  # New York -> Boston
            current_lat=40.7128,
            current_lng=-74.0060,
            capacity_lbs=42000,
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
            deliver_by=now + timedelta(hours=6),
            eta=now + timedelta(hours=12),  # Truck 17 needs a 10h reset → badly late
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
        # National background fleet — all comfortably on-time (no obstructions on their lanes)
        Load(
            reference="LD-1050",
            customer_id=customers[3].id,
            assigned_truck_id=trucks[4].id,
            origin_name="Los Angeles, CA",
            origin_lat=34.0522,
            origin_lng=-118.2437,
            dest_name="Phoenix, AZ",
            dest_lat=33.4484,
            dest_lng=-112.0740,
            pickup_at=now - timedelta(hours=2),
            deliver_by=now + timedelta(hours=11),
            eta=now + timedelta(hours=7),
            status=LoadStatus.in_transit,
            commodity="Auto parts",
            weight_lbs=31000,
        ),
        Load(
            reference="LD-1051",
            customer_id=customers[3].id,
            assigned_truck_id=trucks[5].id,
            origin_name="Seattle, WA",
            origin_lat=47.6062,
            origin_lng=-122.3321,
            dest_name="Portland, OR",
            dest_lat=45.5152,
            dest_lng=-122.6784,
            pickup_at=now - timedelta(hours=1),
            deliver_by=now + timedelta(hours=7),
            eta=now + timedelta(hours=3),
            status=LoadStatus.in_transit,
            commodity="Lumber",
            weight_lbs=39000,
        ),
        Load(
            reference="LD-1052",
            customer_id=customers[4].id,
            assigned_truck_id=trucks[6].id,
            origin_name="Chicago, IL",
            origin_lat=41.8781,
            origin_lng=-87.6298,
            dest_name="Detroit, MI",
            dest_lat=42.3314,
            dest_lng=-83.0458,
            pickup_at=now - timedelta(hours=2),
            deliver_by=now + timedelta(hours=9),
            eta=now + timedelta(hours=5),
            status=LoadStatus.in_transit,
            commodity="Steel coils",
            weight_lbs=44000,
        ),
        Load(
            reference="LD-1053",
            customer_id=customers[5].id,
            assigned_truck_id=trucks[7].id,
            origin_name="Atlanta, GA",
            origin_lat=33.7490,
            origin_lng=-84.3880,
            dest_name="Charlotte, NC",
            dest_lat=35.2271,
            dest_lng=-80.8431,
            pickup_at=now - timedelta(hours=1),
            deliver_by=now + timedelta(hours=8),
            eta=now + timedelta(hours=4),
            status=LoadStatus.in_transit,
            commodity="Produce",
            weight_lbs=28000,
        ),
        Load(
            reference="LD-1054",
            customer_id=customers[3].id,
            assigned_truck_id=trucks[8].id,
            origin_name="Denver, CO",
            origin_lat=39.7392,
            origin_lng=-104.9903,
            dest_name="Salt Lake City, UT",
            dest_lat=40.7608,
            dest_lng=-111.8910,
            pickup_at=now - timedelta(hours=3),
            deliver_by=now + timedelta(hours=14),
            eta=now + timedelta(hours=10),
            status=LoadStatus.in_transit,
            commodity="Industrial equipment",
            weight_lbs=41000,
        ),
        Load(
            reference="LD-1055",
            customer_id=customers[6].id,
            assigned_truck_id=trucks[9].id,
            origin_name="New York, NY",
            origin_lat=40.7128,
            origin_lng=-74.0060,
            dest_name="Boston, MA",
            dest_lat=42.3601,
            dest_lng=-71.0589,
            pickup_at=now - timedelta(hours=1),
            deliver_by=now + timedelta(hours=7),
            eta=now + timedelta(hours=4),
            status=LoadStatus.in_transit,
            commodity="Retail goods",
            weight_lbs=22000,
        ),
        # Backlog awaiting assignment
        Load(
            reference="LD-1056",
            customer_id=customers[4].id,
            origin_name="Kansas City, MO",
            origin_lat=39.0997,
            origin_lng=-94.5786,
            dest_name="St. Louis, MO",
            dest_lat=38.6270,
            dest_lng=-90.1994,
            pickup_at=now + timedelta(hours=3),
            deliver_by=now + timedelta(hours=12),
            status=LoadStatus.pending,
            commodity="Beverages",
            weight_lbs=30000,
            notes="Awaiting truck assignment.",
        ),
        Load(
            reference="LD-1057",
            customer_id=customers[5].id,
            origin_name="Phoenix, AZ",
            origin_lat=33.4484,
            origin_lng=-112.0740,
            dest_name="Las Vegas, NV",
            dest_lat=36.1699,
            dest_lng=-115.1398,
            pickup_at=now + timedelta(hours=5),
            deliver_by=now + timedelta(hours=15),
            status=LoadStatus.pending,
            commodity="Appliances",
            weight_lbs=26000,
            notes="Awaiting truck assignment.",
        ),
        Load(
            reference="LD-1058",
            customer_id=customers[6].id,
            origin_name="Nashville, TN",
            origin_lat=36.1627,
            origin_lng=-86.7816,
            dest_name="Memphis, TN",
            dest_lat=35.1495,
            dest_lng=-90.0490,
            pickup_at=now + timedelta(hours=2),
            deliver_by=now + timedelta(hours=11),
            status=LoadStatus.pending,
            commodity="Textiles",
            weight_lbs=19000,
            notes="Awaiting truck assignment.",
        ),
        Load(
            reference="LD-1059",
            customer_id=customers[3].id,
            origin_name="Miami, FL",
            origin_lat=25.7617,
            origin_lng=-80.1918,
            dest_name="Orlando, FL",
            dest_lat=28.5383,
            dest_lng=-81.3792,
            pickup_at=now + timedelta(hours=6),
            deliver_by=now + timedelta(hours=20),
            status=LoadStatus.pending,
            commodity="Paper products",
            weight_lbs=24000,
            notes="Awaiting truck assignment.",
        ),
    ]
    db.add_all(loads)

    incidents = [
        Incident(
            kind=IncidentKind.weather,
            summary="Severe storm band on I-45 near Huntsville",
            center_lat=30.72,
            center_lng=-95.55,
            radius_mi=35.0,
            severity="severe",
            eta_impact_minutes=75,
            active=True,
        ),
        Incident(
            kind=IncidentKind.disaster,
            summary="Wildfire near Redding, CA",
            center_lat=40.5865,
            center_lng=-122.3917,
            radius_mi=45.0,
            severity="severe",
            eta_impact_minutes=120,
            active=True,
        ),
        Incident(
            kind=IncidentKind.weather,
            summary="Blizzard warning across central Minnesota",
            center_lat=45.50,
            center_lng=-94.50,
            radius_mi=70.0,
            severity="severe",
            eta_impact_minutes=90,
            active=True,
        ),
        Incident(
            kind=IncidentKind.weather,
            summary="Hurricane approaching SE Florida coast",
            center_lat=26.20,
            center_lng=-79.50,
            radius_mi=80.0,
            severity="severe",
            eta_impact_minutes=150,
            active=True,
        ),
        Incident(
            kind=IncidentKind.accident,
            summary="Multi-vehicle pileup on I-80, Pennsylvania",
            center_lat=41.05,
            center_lng=-77.55,
            radius_mi=28.0,
            severity="warning",
            eta_impact_minutes=45,
            active=True,
        ),
    ]
    db.add_all(incidents)


def _seed_leads(db: Session) -> None:
    leads = [
        Lead(
            email="ops@swifthaul.example",
            phone="+1-312-555-0148",
            company_size="11-50",
            industry="transportation",
            fleet_size="26-100",
            features=["gps", "eld", "routing"],
            pain_point="No live ETA visibility; dispatch is all manual phone calls.",
            current_tools="Spreadsheets + Samsara",
            timeline="1-3",
            role="ops",
        ),
        Lead(
            email="m.adetona@buildwell.example",
            company_size="51-200",
            industry="construction",
            fleet_size="6-25",
            features=["gps", "maintenance"],
            pain_point="Equipment downtime and missed maintenance windows.",
            timeline="6+",
            role="fleet",
        ),
        Lead(
            email="dana@coldchainfoods.example",
            phone="+1-503-555-0199",
            company_size="201+",
            industry="food",
            fleet_size="100+",
            features=["gps", "dash-cams", "routing", "eld"],
            pain_point="Cold-chain compliance and proving on-time delivery to retailers.",
            current_tools="Legacy TMS (in-house)",
            timeline="now",
            role="owner",
        ),
    ]
    db.add_all(leads)
