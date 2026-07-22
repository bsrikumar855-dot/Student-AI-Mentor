from backend.models import CodingProfileSnapshot

def snapshot_to_activity(snap: CodingProfileSnapshot) -> dict:
    """
    Pure function mapping a coding snapshot to activity and skill band signals.
    """
    if snap is None:
        raise ValueError("Snapshot cannot be None")
        
    last_active = snap.last_active_days if snap.last_active_days is not None else -1
    rating = snap.rating if snap.rating is not None else 0
    
    # Simple skill bands based on rating (similar to Codeforces ranks)
    if rating >= 1600:
        band = "expert"
    elif rating >= 1400:
        band = "specialist"
    elif rating >= 1200:
        band = "pupil"
    elif rating > 0:
        band = "newbie"
    else:
        band = "unrated"
        
    return {
        "coding_activity": last_active,
        "coding_skill_band": band
    }
