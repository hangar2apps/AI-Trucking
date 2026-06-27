"""Confidence + stakes gating for autonomous vs human-approved actions.

When agent_autonomous_mode is on (default), every action runs immediately — same
as inbound mail auto-reply. The approval queue is skipped; high-stakes actions
still get logged to the activity feed.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import get_settings

# Actions that are always high-stakes regardless of confidence.
HIGH_STAKES_ACTIONS = {
    "flag_damage",
    "respond_to_complaint",
    "escalate_to_human",
}

# Confidence rungs (reuses the high/medium/low scale the inquiry agent emits).
_CONFIDENCE_RANK = {"high": 3, "medium": 2, "low": 1}


@dataclass
class Decision:
    mode: str          # "auto" | "approval"
    reason: str

    @property
    def needs_approval(self) -> bool:
        return self.mode == "approval"


def _rank(confidence: str | None) -> int:
    return _CONFIDENCE_RANK.get((confidence or "").lower(), 1)


def decide(
    action_type: str,
    *,
    confidence: str | None = None,
    amount: float | None = None,
) -> Decision:
    """Decide whether an action runs autonomously or goes to the approval queue."""
    settings = get_settings()

    if settings.agent_autonomous_mode:
        return Decision("auto", "agent_autonomous_mode — execute immediately")

    if action_type in HIGH_STAKES_ACTIONS:
        return Decision("approval", f"'{action_type}' is always human-reviewed")

    if action_type == "send_invoice" and amount is not None:
        if amount > settings.invoice_approval_threshold:
            return Decision(
                "approval",
                f"invoice ${amount:,.2f} exceeds auto-send limit "
                f"${settings.invoice_approval_threshold:,.2f}",
            )

    if _rank(confidence) <= 1:
        return Decision("approval", f"low confidence ({confidence or 'unknown'})")

    return Decision("auto", f"high enough confidence ({confidence}) and low stakes")
