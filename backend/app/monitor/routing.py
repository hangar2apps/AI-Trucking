"""Route obstruction checks + alternate-route estimation (deterministic — no AI).

A load's route is sampled along the straight line from the truck to the
destination; an incident "hits" if any sample point is within `radius_mi` of its
center. An alternate route avoids the hit incidents at the cost of a detour,
trading the incident's ETA delay for extra distance.

Shapes mirror the control-center engine so the route dev can swap in real OSRM
geometry + live weather without changing this contract.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.agent.tools import _haversine_mi
from app.models import Incident

DETOUR_FACTOR = 1.18  # an alternate route is ~18% longer to go around obstructions


@dataclass
class ObstructionResult:
    hit: bool
    incidents: list[dict] = field(default_factory=list)
    eta_impact_minutes: int = 0


@dataclass
class AlternateRoute:
    distance_mi: float
    avoided_incident_ids: list[int]
    summary: str


def _sample_points(
    origin: tuple[float, float], dest: tuple[float, float], n: int = 24
) -> list[tuple[float, float]]:
    olat, olng = origin
    dlat, dlng = dest
    return [
        (olat + (dlat - olat) * i / n, olng + (dlng - olng) * i / n) for i in range(n + 1)
    ]


def check_route_obstructions(
    origin: tuple[float, float],
    dest: tuple[float, float],
    incidents: list[Incident],
) -> ObstructionResult:
    """Which active incidents lie on the route, and their total ETA impact."""
    hits: list[dict] = []
    impact = 0
    points = _sample_points(origin, dest)
    for inc in incidents:
        if not inc.active:
            continue
        if any(
            _haversine_mi(lat, lng, inc.center_lat, inc.center_lng) <= inc.radius_mi
            for lat, lng in points
        ):
            hits.append(
                {
                    "id": inc.id,
                    "kind": inc.kind.value,
                    "summary": inc.summary,
                    "severity": inc.severity,
                    "eta_impact_minutes": inc.eta_impact_minutes,
                    "center": {"lat": inc.center_lat, "lng": inc.center_lng},
                    "radius_mi": inc.radius_mi,
                }
            )
            impact += inc.eta_impact_minutes
    return ObstructionResult(hit=bool(hits), incidents=hits, eta_impact_minutes=impact)


def find_alternate_route(
    blocked: list[dict],
    direct_distance_mi: float,
) -> AlternateRoute:
    """A detour that avoids the blocked incidents — longer, but no incident delay."""
    return AlternateRoute(
        distance_mi=direct_distance_mi * DETOUR_FACTOR,
        avoided_incident_ids=[b["id"] for b in blocked],
        summary=f"Detour around {len(blocked)} obstruction(s)",
    )
