from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import LoadStatus, TruckStatus


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str
    email: str
    phone: str | None = None


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    kind: str
    load_id: int | None = None
    truck_id: int | None = None
    summary: str
    data: dict | None = None


class TruckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    driver_name: str
    status: TruckStatus
    current_lat: float | None = None
    current_lng: float | None = None
    capacity_lbs: int | None = None


class LoadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    status: LoadStatus
    customer_id: int
    assigned_truck_id: int | None = None
    origin_name: str
    origin_lat: float
    origin_lng: float
    dest_name: str
    dest_lat: float
    dest_lng: float
    pickup_at: datetime
    deliver_by: datetime
    eta: datetime | None = None
    commodity: str | None = None
    weight_lbs: int | None = None
    notes: str | None = None


class LoadDetail(LoadOut):
    customer: CustomerOut
    truck: TruckOut | None = None


# --- AI agent I/O ---------------------------------------------------------


class EmailDraft(BaseModel):
    """A customer-facing status email drafted by the AI agent."""

    subject: str
    body: str
    internal_summary: str  # one-line status note for the CS dashboard


class EmailDraftResponse(BaseModel):
    load_reference: str
    to_email: str
    to_name: str
    model: str
    draft: EmailDraft


# --- Agent brain I/O ------------------------------------------------------


class AgentStep(BaseModel):
    """One entry in the brain's transcript (for the CS dashboard / demo)."""

    kind: str  # "thinking" | "text" | "tool_call" | "tool_result"
    text: str | None = None
    tool: str | None = None
    tool_input: dict | None = None
    tool_output: dict | None = None


class AgentRunRequest(BaseModel):
    situation: str
    # Default to dry_run: the brain plans reassignments/emails without committing.
    dry_run: bool = True


class AgentRunResult(BaseModel):
    final_message: str
    steps: list[AgentStep]
    iterations: int
    dry_run: bool
