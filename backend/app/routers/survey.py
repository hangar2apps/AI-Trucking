from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Lead
from app.schemas import SurveySubmit, SurveySubmitResponse
from app.services.email_send import send_survey_response_email

router = APIRouter(prefix="/survey", tags=["survey"])


@router.post("/submit", response_model=SurveySubmitResponse)
def submit_survey(payload: SurveySubmit, db: Session = Depends(get_db)) -> SurveySubmitResponse:
    lead = Lead(
        email=payload.email.strip(),
        phone=payload.phone.strip() or None,
        company_size=payload.company_size,
        industry=payload.industry,
        fleet_size=payload.fleet_size,
        features=payload.features,
        pain_point=payload.pain_point,
        current_tools=payload.current_tools.strip() or None,
        timeline=payload.timeline,
        role=payload.role,
        consent=payload.consent,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    email_sent, message = send_survey_response_email(payload=payload)

    return SurveySubmitResponse(
        ok=True,
        email_sent=email_sent,
        message=message,
        lead_id=lead.id,
    )
