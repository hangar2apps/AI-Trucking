"""DOT hours-of-service aware ETA (deterministic — no AI).

Core property-carrying-driver rules modeled:
- 11-hour driving limit per shift
- 14-hour on-duty window per shift
- 30-minute break required after 8 cumulative hours of driving
- 10-hour off-duty reset restores the shift

(The 60/70-hour 7/8-day cycle is intentionally not modeled.)
"""

from __future__ import annotations

from dataclasses import dataclass

DRIVE_LIMIT = 11.0    # hours of driving per shift
DUTY_WINDOW = 14.0    # on-duty window per shift
BREAK_AFTER = 8.0     # driving hours before a 30-min break is required
BREAK_HOURS = 0.5
RESET_HOURS = 10.0


@dataclass
class HosResult:
    elapsed_hours: float  # wall-clock to finish the drive, incl. breaks/resets
    reset_needed: bool    # did the driver need a 10h reset to finish?
    break_count: int
    reset_count: int


def hos_aware_eta(
    distance_mi: float,
    speed_mph: float,
    drive_remaining: float,
    duty_remaining: float,
    since_break: float,
) -> HosResult:
    """Wall-clock hours to drive `distance_mi`, inserting required HOS stops."""
    remaining = max(0.0, distance_mi / speed_mph)
    elapsed = 0.0
    d_rem, w_rem, sb = drive_remaining, duty_remaining, since_break
    breaks = resets = 0
    reset_needed = False

    guard = 0
    while remaining > 1e-6 and guard < 200:
        guard += 1

        # Out of driving hours or duty window → mandatory 10-hour reset.
        if d_rem <= 1e-6 or w_rem <= 1e-6:
            elapsed += RESET_HOURS
            d_rem, w_rem, sb = DRIVE_LIMIT, DUTY_WINDOW, 0.0
            resets += 1
            reset_needed = True
            continue

        # Driven 8h since last break → mandatory 30-minute break (counts against
        # the 14h window, which does not pause for breaks).
        until_break = BREAK_AFTER - sb
        if until_break <= 1e-6:
            elapsed += BREAK_HOURS
            w_rem -= BREAK_HOURS
            sb = 0.0
            breaks += 1
            continue

        drivable = min(remaining, until_break, d_rem, w_rem)
        elapsed += drivable
        remaining -= drivable
        d_rem -= drivable
        w_rem -= drivable
        sb += drivable

    return HosResult(
        elapsed_hours=elapsed,
        reset_needed=reset_needed,
        break_count=breaks,
        reset_count=resets,
    )
