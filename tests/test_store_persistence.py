import json
import os
from datetime import datetime
from backend.store import InMemoryStore
from backend.models import (
    StudentState, Plan, DailyTarget, ScheduleSlot, Intervention,
    PlanDecisionTrace, PlanExplanation,
)


def make_student() -> StudentState:
    return StudentState(
        student_id="STU1",
        name="Bob",
        cgpa=8.0,
        attendance=0.9,
        subjects=[],
        exams=[],
        nearest_exam=None,
        days_since_active=1,
        days_since_commit=2,
        days_since_linkedin=3,
        goals_met_streak=5,
        topics=[],
        skills=["python"],
        risk=None,
        predictions=None
    )


def make_plan() -> Plan:
    return Plan(
        student_id="STU1",
        intervention_triggered="recovery_plan",
        message="Get back on track.",
        daily_targets=[
            DailyTarget(id="T_1", task="Log in to LMS", why="inactive", kind="recovery", done=False)
        ],
        schedule=[ScheduleSlot(slot="09:00 - 10:30", task="Core Study Session")],
        interventions=[
            Intervention(id="STU1:recovery_plan:active", action="recovery_plan", why="inactive", kind="recovery", auto=True)
        ],
        generated_at="2026-07-22T10:00:00+00:00"
    )


def make_plan_trace() -> PlanDecisionTrace:
    return PlanDecisionTrace(
        student_id="STU1",
        decision_type="plan",
        explanation=PlanExplanation(summary="1 interventions, risk=Low", factors=["Low risk"], config_version="v1"),
        computed_at="2026-07-22T10:00:00+00:00",
    )


def test_dump_and_load_round_trip(tmp_path):
    path = str(tmp_path / "store.json")

    store = InMemoryStore()
    student = make_student()
    plan = make_plan()
    plan_trace = make_plan_trace()
    store.save_student(student)
    store.save_plan(student.student_id, plan)
    store.audit_log.append({"action": "plan_generate", "student_id": "STU1", "timestamp": "2026-07-22T10:00:00+00:00"})
    store.add_plan_trace(plan_trace)

    store.dump_json(path)
    assert os.path.exists(path)

    loaded = InMemoryStore()
    loaded.load_json(path)

    assert loaded.get_student("STU1") == student
    assert loaded.get_plan("STU1") == plan
    assert loaded.audit_log == store.audit_log
    assert loaded.get_plan_traces("STU1") == [plan_trace]


def test_load_json_missing_path_is_noop(tmp_path):
    path = str(tmp_path / "does_not_exist.json")
    store = InMemoryStore()
    store.load_json(path)
    assert store.list_students() == []
    assert store._plans == {}
    assert store.audit_log == []


def test_load_json_corrupt_file_is_noop_when_store_empty(tmp_path):
    path = str(tmp_path / "corrupt.json")
    with open(path, "w") as f:
        f.write("{not valid json::")

    store = InMemoryStore()
    store.load_json(path)
    assert store.list_students() == []
    assert store._plans == {}
    assert store.audit_log == []


def test_load_json_bad_file_preserves_existing_data(tmp_path):
    student = make_student()
    plan = make_plan()
    audit_entry = {"action": "plan_generate", "student_id": "STU1", "timestamp": "2026-07-22T10:00:00+00:00"}

    corrupt_path = str(tmp_path / "corrupt.json")
    with open(corrupt_path, "w") as f:
        f.write("{not valid json::")

    store = InMemoryStore()
    store.save_student(student)
    store.save_plan(student.student_id, plan)
    store.audit_log.append(audit_entry)

    store.load_json(corrupt_path)
    assert store.get_student("STU1") == student
    assert store.get_plan("STU1") == plan
    assert store.audit_log == [audit_entry]

    wrong_shape_path = str(tmp_path / "wrongshape.json")
    with open(wrong_shape_path, "w") as f:
        json.dump({"students": {}}, f)  # valid JSON, but missing "plans"/"audit_log"

    store.load_json(wrong_shape_path)
    assert store.get_student("STU1") == student
    assert store.get_plan("STU1") == plan
    assert store.audit_log == [audit_entry]


def test_persist_path_loads_on_construction(tmp_path):
    path = str(tmp_path / "store.json")
    seed_store = InMemoryStore()
    student = make_student()
    seed_store.save_student(student)
    seed_store.dump_json(path)

    store = InMemoryStore(persist_path=path)
    assert store.get_student("STU1") == student


def test_default_construction_unchanged():
    store = InMemoryStore()
    assert store.persist_path is None
    assert store.list_students() == []

def test_signal_store_persistence(tmp_path):
    path = str(tmp_path / "signal_store.json")

    store = InMemoryStore()
    
    # Add raw snapshot
    store.save_raw("codeforces", "alice", {"rating": 1500}, "2026-07-22T10:00:00Z")
    
    # Add derived signal
    store.save_derived("STU1", "coding_activity", True, "codeforces", "2026-07-22T10:00:00Z", 0.95, "v1")
    
    # Add decision trace
    trace = {"action": "coding_nudge", "reason": "inactive > 7 days"}
    store.append_trace(trace)
    
    store.dump_json(path)
    assert os.path.exists(path)
    
    loaded = InMemoryStore()
    loaded.load_json(path)
    
    assert loaded._raw_snapshots["codeforces|alice|2026-07-22T10:00:00Z"] == {"rating": 1500}
    
    derived = loaded.get_derived("STU1")
    assert "coding_activity" in derived
    assert derived["coding_activity"]["value"] is True
    assert derived["coding_activity"]["source"] == "codeforces"
    
    assert loaded._decision_traces == [trace]


def test_dump_json_refuses_to_overwrite_sqlite_db(tmp_path):
    db_path = str(tmp_path / "test_store.db")
    store = InMemoryStore(persist_path=db_path)
    student = make_student()
    store.save_student(student)

    # Calling dump_json with the SQLite DB path must NOT overwrite the .db file with JSON
    store.dump_json(db_path)

    # Check header of db_path: must still be valid SQLite header (starts with b'SQLite format 3')
    with open(db_path, "rb") as f:
        header = f.read(16)
    assert header.startswith(b"SQLite format 3")

    # A separate .json file should have been written instead
    assert os.path.exists(db_path + ".json")


def test_store_auto_recovers_from_corrupted_db_file(tmp_path):
    db_path = str(tmp_path / "corrupt_store.db")
    # Simulate a corrupted DB file (overwritten with JSON text)
    with open(db_path, "w") as f:
        f.write('{"students": {"corrupt": "data"}}')

    # Constructing InMemoryStore on this corrupted file should auto-recover fresh DB without raising DatabaseError
    store = InMemoryStore(persist_path=db_path)
    student = make_student()
    store.save_student(student)

    assert store.get_student("STU1") == student
    with open(db_path, "rb") as f:
        header = f.read(16)
    assert header.startswith(b"SQLite format 3")
