from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Customer, Truck
from app.schemas import CustomerOut, TruckOut

router = APIRouter(tags=["fleet"])


@router.get("/trucks", response_model=list[TruckOut])
def list_trucks(db: Session = Depends(get_db)) -> list[Truck]:
    return list(db.scalars(select(Truck).order_by(Truck.id)))


@router.get("/customers", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db)) -> list[Customer]:
    return list(db.scalars(select(Customer).order_by(Customer.id)))
