from backend.coding import get_codeforces
from backend.models import CodingProfileSnapshot
from datetime import datetime, timezone

def fetch_codeforces_profile(handle: str) -> CodingProfileSnapshot:
    """
    Wraps existing coding.get_codeforces and returns a CodingProfileSnapshot.
    Graceful degradation is handled natively by get_codeforces.
    """
    profile_dict = get_codeforces(handle)
    return CodingProfileSnapshot(
        handle=profile_dict.get("handle", handle),
        platform="codeforces",
        rating=profile_dict.get("rating"),
        solved_count=profile_dict.get("solved_count"),
        last_active_days=profile_dict.get("last_active_days"),
        fetched_at=datetime.now(timezone.utc).isoformat(),
        source=profile_dict.get("source", "unknown")
    )
