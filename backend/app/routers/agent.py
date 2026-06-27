from fastapi import APIRouter, HTTPException

from app.agent.brain import run_agent
from app.config import get_settings
from app.schemas import AgentRunRequest, AgentRunResult

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/run", response_model=AgentRunResult)
def agent_run(req: AgentRunRequest) -> AgentRunResult:
    """Turn the A-TMS brain loose on a situation.

    dry_run=true (default) plans emails/reassignments without committing;
    dry_run=false executes them — this is the demo's hero action.
    """
    if not get_settings().anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY is not configured")
    return run_agent(req.situation, dry_run=req.dry_run)
