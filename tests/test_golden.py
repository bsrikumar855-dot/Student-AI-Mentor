import pytest
from datetime import datetime
from backend.models import StudentState, Subject, Exam
from backend.main import generate_plan_for_student

def test_generate_plan_golden_pipeline():
    # Construct a deterministic student state
    student = StudentState(
        student_id="GOLDEN_STU",
        name="Golden Student",
        cgpa=7.0,
        attendance=0.8,
        subjects=[
            Subject(name="Math", latest=50.0, trend=[60.0, 50.0], flag=None),
            Subject(name="Physics", latest=70.0, trend=[70.0], flag=None)
        ],
        exams=[
            Exam(subject="Math", date=datetime(2026, 8, 1, 9, 0), days_to_exam=5, completion=0.4)
        ],
        nearest_exam=Exam(subject="Math", date=datetime(2026, 8, 1, 9, 0), days_to_exam=5, completion=0.4),
        days_since_active=6,       # triggers recovery_plan
        days_since_commit=12,      # triggers git_nudge
        days_since_linkedin=2,
        goals_met_streak=8,        # triggers ramp_difficulty
        topics=[],
        skills=[],
        risk=None,
        predictions=None
    )
    from backend.main import store
    store.save_derived(
        student_id="GOLDEN_STU",
        signal_name="github_activity",
        value=12,
        source="github",
        fetched_at="2026-07-22T10:00:00Z",
        confidence=1.0,
        version="v1"
    )

    plan = generate_plan_for_student(student)

    # Assert plan structure
    assert plan.student_id == "GOLDEN_STU"
    assert plan.message != ""
    assert len(plan.daily_targets) > 0
    assert len(plan.schedule) == 2

    # Assert specific triggered interventions
    triggered_actions = {i.action for i in plan.interventions}
    assert "recovery_plan" in triggered_actions
    assert "git_nudge" in triggered_actions
    assert "ramp_difficulty" in triggered_actions

    # Assert deterministic outputs match expected values
    assert student.risk is not None
    assert student.risk.level == "Medium"
    assert student.risk.score == 39

    assert student.predictions is not None
    assert student.predictions.exam_trend == "declining"  # Math has slope -10, Physics has slope 0 -> mean slope = -5
