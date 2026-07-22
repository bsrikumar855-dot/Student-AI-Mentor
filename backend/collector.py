import sys
import logging
from datetime import datetime, timezone
from backend.store import InMemoryStore
from backend.adapters import get_adapter
from backend.normalize import snapshot_to_activity
from backend.ingest import ingest_excel
import os

logger = logging.getLogger(__name__)

def run_collection(store: InMemoryStore) -> None:
    """
    Iterate over students with coding_handles, call adapter, save_raw,
    then save_derived the normalized signals.
    Failures go to a dead-letter list, never crashing the run.
    """
    dead_letters = []
    fetched_at = datetime.now(timezone.utc).isoformat()
    
    for student in store.list_students():
        if not student.coding_handles:
            continue
            
        for platform, handle in student.coding_handles.items():
            try:
                adapter = get_adapter(platform)
                snap = adapter(handle)
                
                # Save raw snapshot
                store.save_raw(
                    source=platform,
                    entity=handle,
                    payload=snap.model_dump(mode="json"),
                    fetched_at=fetched_at
                )
                
                # Normalize and save derived signals
                signals = snapshot_to_activity(snap)
                
                # We save two derived signals
                store.save_derived(
                    student_id=student.student_id,
                    signal_name="coding_activity",
                    value=signals["coding_activity"],
                    source=platform,
                    fetched_at=fetched_at,
                    confidence=1.0,
                    version="v1"
                )
                
                store.save_derived(
                    student_id=student.student_id,
                    signal_name="coding_skill_band",
                    value=signals["coding_skill_band"],
                    source=platform,
                    fetched_at=fetched_at,
                    confidence=1.0,
                    version="v1"
                )
                
            except Exception as e:
                logger.error(f"Failed to process {platform} handle {handle} for student {student.student_id}: {e}")
                dead_letters.append({
                    "student_id": student.student_id,
                    "platform": platform,
                    "handle": handle,
                    "error": str(e)
                })
                
    if dead_letters:
        logger.warning(f"Collection completed with {len(dead_letters)} dead letters.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    store = InMemoryStore()
    
    # Load demo cohort offline for test run
    cohort_path = os.path.join(os.path.dirname(__file__), "data", "cohort.xlsx")
    with open(cohort_path, "rb") as f:
        students, _ = ingest_excel(f)
        
    for s in students:
        store.save_student(s)
        
    run_collection(store)
    print("Derived signals populated:")
    for s in students:
        if s.coding_handles:
            derived = store.get_derived(s.student_id)
            print(f"{s.student_id}: {derived}")
