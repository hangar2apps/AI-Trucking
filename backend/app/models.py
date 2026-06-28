from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TruckStatus(str, enum.Enum):
    available = "available"
    en_route = "en_route"
    maintenance = "maintenance"
    offline = "offline"


class LoadStatus(str, enum.Enum):
    pending = "pending"        # created, not yet assigned to a truck
    assigned = "assigned"      # truck assigned, not yet moving
    in_transit = "in_transit"  # on the road
    delayed = "delayed"        # running behind schedule
    delivered = "delivered"
    cancelled = "cancelled"


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    company: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)

    loads: Mapped[list[Load]] = relationship(back_populates="customer")


class Truck(Base):
    __tablename__ = "trucks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    driver_name: Mapped[str] = mapped_column(String(120))
    status: Mapped[TruckStatus] = mapped_column(
        Enum(TruckStatus), default=TruckStatus.available
    )
    current_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    capacity_lbs: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # DOT hours-of-service, depleted by the sim as the truck drives.
    hos_drive_remaining: Mapped[float] = mapped_column(Float, default=11.0)  # of 11h limit
    hos_duty_remaining: Mapped[float] = mapped_column(Float, default=14.0)   # of 14h window
    hos_since_break: Mapped[float] = mapped_column(Float, default=0.0)       # driving h since 30m break

    loads: Mapped[list[Load]] = relationship(back_populates="truck")


class Load(Base):
    __tablename__ = "loads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reference: Mapped[str] = mapped_column(String(40), unique=True, index=True)

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    customer: Mapped[Customer] = relationship(back_populates="loads")

    assigned_truck_id: Mapped[int | None] = mapped_column(
        ForeignKey("trucks.id"), nullable=True
    )
    truck: Mapped[Truck | None] = relationship(back_populates="loads")

    origin_name: Mapped[str] = mapped_column(String(160))
    origin_lat: Mapped[float] = mapped_column(Float)
    origin_lng: Mapped[float] = mapped_column(Float)

    dest_name: Mapped[str] = mapped_column(String(160))
    dest_lat: Mapped[float] = mapped_column(Float)
    dest_lng: Mapped[float] = mapped_column(Float)

    pickup_at: Mapped[datetime] = mapped_column(DateTime)
    deliver_by: Mapped[datetime] = mapped_column(DateTime)
    eta: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    status: Mapped[LoadStatus] = mapped_column(
        Enum(LoadStatus), default=LoadStatus.pending
    )
    commodity: Mapped[str | None] = mapped_column(String(120), nullable=True)
    weight_lbs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Notification debounce — so the monitor emails once per state, not per tick.
    delay_notified: Mapped[bool] = mapped_column(default=False)
    delivered_notified: Mapped[bool] = mapped_column(default=False)


class Event(Base):
    """An action the system took, for the map + CS dashboard to poll.

    The reroute animation keys off `kind == "reassignment"`; the CS activity
    log reads `summary`. `data` carries the structured payload (truck ids,
    destination, message id).
    """

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    kind: Mapped[str] = mapped_column(String(40))  # reassignment | email_sent | ...
    load_id: Mapped[int | None] = mapped_column(ForeignKey("loads.id"), nullable=True)
    truck_id: Mapped[int | None] = mapped_column(ForeignKey("trucks.id"), nullable=True)
    summary: Mapped[str] = mapped_column(Text)
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    company_size: Mapped[str] = mapped_column(String(40))
    industry: Mapped[str] = mapped_column(String(80))
    fleet_size: Mapped[str] = mapped_column(String(40))
    features: Mapped[list] = mapped_column(JSON, default=list)
    pain_point: Mapped[str] = mapped_column(Text)
    current_tools: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timeline: Mapped[str] = mapped_column(String(40))
    role: Mapped[str] = mapped_column(String(40))
    consent: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IncidentKind(str, enum.Enum):
    weather = "weather"
    accident = "accident"
    disaster = "disaster"


class Incident(Base):
    """A route obstruction (weather/accident/natural disaster) the monitor checks.

    A load's route 'hits' an incident when its path passes within `radius_mi` of
    the center; `eta_impact_minutes` is the delay added if not rerouted around it.
    Shape mirrors the control-center engine so the route dev can feed real data.
    """

    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[IncidentKind] = mapped_column(Enum(IncidentKind))
    summary: Mapped[str] = mapped_column(String(255))
    center_lat: Mapped[float] = mapped_column(Float)
    center_lng: Mapped[float] = mapped_column(Float)
    radius_mi: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(20))  # watch | warning | severe
    eta_impact_minutes: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

