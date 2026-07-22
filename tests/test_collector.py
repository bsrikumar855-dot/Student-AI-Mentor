from datetime import datetime, timezone
from backend.collector import run_collection
from backend.store import InMemoryStore
from backend.models import StudentState, CodingProfileSnapshot
from backend.normalize import snapshot_to_activity
from backend.platform_links import PlatformLinkStore, synthesize_consent_from_handles

def test_snapshot_to_activity():
    snap = CodingProfileSnapshot(
        handle="test", platform="codeforces", rating=1500, solved_count=100, last_active_days=3, fetched_at="2026-07-22T10:00:00Z", source="live"
    )
    sig = snapshot_to_activity(snap)
    assert sig["coding_activity"] == 3
    assert sig["coding_skill_band"] == "specialist"

def test_collector_writes_derived_and_deadletters_failure(monkeypatch):
    store = InMemoryStore()
    
    # Student with working handle
    stu1 = StudentState(
        student_id="STU1", name="A", cgpa=8.0, attendance=0.9, subjects=[], exams=[], 
        days_since_active=0, days_since_commit=0, days_since_linkedin=0, goals_met_streak=0, topics=[], skills=[], 
        coding_handles={"codeforces": "alice_cf"}
    )
    
    # Student with failing platform
    stu2 = StudentState(
        student_id="STU2", name="B", cgpa=8.0, attendance=0.9, subjects=[], exams=[], 
        days_since_active=0, days_since_commit=0, days_since_linkedin=0, goals_met_streak=0, topics=[], skills=[], 
        coding_handles={"badplatform": "fails"}
    )
    
    store.save_student(stu1)
    store.save_student(stu2)
    
    # Mock network for get_codeforces
    import urllib.request
    def _fake_urlopen(*a, **kw): raise OSError("offline")
    monkeypatch.setattr(urllib.request, "urlopen", _fake_urlopen)
    
    run_collection(store)
    
    # STU1 should have derived signals written (using seed fallback since network mocked to fail)
    derived1 = store.get_derived("STU1")
    assert "coding_activity" in derived1
    assert "coding_skill_band" in derived1
    
    # STU2 should not crash, but just have no signals and trigger a dead-letter log internally
    derived2 = store.get_derived("STU2")
    assert "coding_activity" not in derived2


def test_run_collection_skips_revoked_consent(monkeypatch):
    """When a platform_links store is passed, a revoked link is skipped entirely --
    no raw snapshot or derived signal gets written/refreshed for that platform."""
    store = InMemoryStore()
    stu = StudentState(
        student_id="STU3", name="C", cgpa=8.0, attendance=0.9, subjects=[], exams=[],
        days_since_active=0, days_since_commit=0, days_since_linkedin=0, goals_met_streak=0, topics=[], skills=[],
        coding_handles={"codeforces": "revoked_coder"}
    )
    store.save_student(stu)

    platform_links = PlatformLinkStore()
    synthesize_consent_from_handles(platform_links, stu, at=datetime(2026, 7, 1, tzinfo=timezone.utc))
    platform_links.revoke("STU3", "codeforces", datetime(2026, 7, 22, tzinfo=timezone.utc))

    import urllib.request
    def _fake_urlopen(*a, **kw): raise OSError("offline")
    monkeypatch.setattr(urllib.request, "urlopen", _fake_urlopen)

    run_collection(store, platform_links=platform_links)

    derived = store.get_derived("STU3")
    assert "coding_activity" not in derived
    assert "coding_skill_band" not in derived
