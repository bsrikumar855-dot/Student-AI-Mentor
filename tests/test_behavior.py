import pytest
from backend.models import StudentState, Plan, TopicMemory
from backend.ingest import ingest_excel
from backend.risk import calculate_risk
from backend.predict import predict_trends
from backend.interventions import evaluate_interventions
from backend.retain import apply_sm2
from backend.internships import match_internships
from backend.language import phrase_intervention_message, chat_response

def test_ingest_excel_behavior():
    import io
    import pandas as pd
    
    # Create an Excel in memory
    students_df = pd.DataFrame([{
        "student_id": "STU1",
        "name": "Bob",
        "cgpa": 8.0,
        "attendance": 0.9,
        "days_since_active": 1,
        "days_since_commit": 2,
        "days_since_linkedin": 3,
        "goals_met_streak": 5,
        "skills": "python,git"
    }])
    
    scores_df = pd.DataFrame([{
        "student_id": "STU1",
        "subject": "Math",
        "test_no": 1,
        "score": 85.0
    }])
    
    exams_df = pd.DataFrame([{
        "student_id": "STU1",
        "subject": "Math",
        "date": "2026-08-01T09:00:00Z",
        "days_to_exam": 10,
        "completion": 0.7
    }])
    
    topics_df = pd.DataFrame([{
        "student_id": "STU1",
        "topic": "Calculus",
        "learned_on": "2026-07-20T10:00:00Z",
        "ef": 2.5,
        "reps": 1,
        "interval": 1,
        "next_review": "2026-07-21T10:00:00Z"
    }])
    
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine='openpyxl') as writer:
        students_df.to_excel(writer, sheet_name="students", index=False)
        scores_df.to_excel(writer, sheet_name="scores", index=False)
        exams_df.to_excel(writer, sheet_name="exams", index=False)
        topics_df.to_excel(writer, sheet_name="topics", index=False)
        
    out.seek(0)
    res = ingest_excel(out)
    assert len(res) == 1
    assert res[0].student_id == "STU1"
    assert res[0].name == "Bob"
    assert res[0].cgpa == 8.0
    assert len(res[0].subjects) == 1
    assert res[0].subjects[0].name == "Math"
    assert res[0].subjects[0].latest == 85.0
    assert len(res[0].skills) == 2
    assert "python" in res[0].skills
    assert "git" in res[0].skills


def test_calculate_risk_behavior():
    # Construct a student state
    from datetime import datetime
    from backend.models import Subject, Exam, StudentState
    student = StudentState(
        student_id="STU1",
        name="Test Student",
        cgpa=7.0,
        attendance=0.8,
        subjects=[
            Subject(name="Subj1", latest=50.0, trend=[60.0, 50.0], flag=None)
        ],
        exams=[
            Exam(subject="Subj1", date=datetime.now(), days_to_exam=5, completion=0.4)
        ],
        nearest_exam=Exam(subject="Subj1", date=datetime.now(), days_to_exam=5, completion=0.4),
        days_since_active=3,
        days_since_commit=2,
        days_since_linkedin=2,
        goals_met_streak=0,
        topics=[],
        skills=[],
        risk=None,
        predictions=None
    )
    res = calculate_risk(student)
    assert "score" in res
    assert "level" in res
    assert "dominant" in res
    assert "reason" in res
    assert "contributions" in res


def test_predict_trends_behavior():
    from datetime import datetime
    from backend.models import Subject, Exam, StudentState
    student = StudentState(
        student_id="STU1",
        name="Test Student",
        cgpa=7.5,
        attendance=0.8,
        subjects=[
            Subject(name="Subj1", latest=80.0, trend=[70.0, 80.0], flag=None)
        ],
        exams=[
            Exam(subject="Subj1", date=datetime.now(), days_to_exam=7, completion=0.5)
        ],
        nearest_exam=None,
        days_since_active=0,
        days_since_commit=0,
        days_since_linkedin=0,
        goals_met_streak=0,
        topics=[],
        skills=[],
        risk=None,
        predictions=None
    )
    res = predict_trends(student)
    assert res["projected_gpa"] == 9.0
    assert res["current_cgpa"] == 7.5
    assert res["gpa_direction"] == "up"
    assert res["subjects"][0]["direction"] == "up"
    assert res["subjects"][0]["fail_risk"] == "Low"
def test_apply_sm2_behavior():
    from datetime import datetime
    from backend.models import TopicMemory
    topic = TopicMemory(
        topic="Binary Search",
        learned_on=datetime.now(),
        ef=2.5,
        reps=0,
        interval=1,
        next_review=datetime.now()
    )
    updated = apply_sm2(topic, 4, today=datetime(2026, 7, 22, 12, 0, 0))
    assert updated.reps == 1
    assert updated.interval == 1
    assert updated.next_review == datetime(2026, 7, 23, 12, 0, 0)

def test_match_internships_behavior():
    db = [
        {"title": "Backend Intern", "company": "Co1", "required_skills": ["Python", "Django"], "min_cgpa": 7.0},
        {"title": "Frontend Intern", "company": "Co2", "required_skills": ["React"], "min_cgpa": 8.5}
    ]
    res = match_internships(["python", "django"], 7.5, db)
    assert res[0]["title"] == "Backend Intern"
    assert res[0]["status"] == "ready"
    assert res[1]["title"] == "Frontend Intern"
    assert res[1]["status"] == "not_eligible"

def test_language_phrase_fallback():
    from backend.models import StudentState, Plan, Intervention
    student = StudentState(
        student_id="STU1",
        name="Bob",
        cgpa=8.0,
        attendance=0.9,
        subjects=[],
        exams=[],
        nearest_exam=None,
        days_since_active=0,
        days_since_commit=0,
        days_since_linkedin=0,
        goals_met_streak=0,
        topics=[],
        skills=[],
        risk=None,
        predictions=None
    )
    plan = Plan(
        student_id="STU1",
        intervention_triggered="recovery_plan",
        message="",
        daily_targets=[],
        schedule=[],
        interventions=[
            Intervention(action="recovery_plan", why="inactive for 5 days", kind="academic", auto=True)
        ]
    )
    msg = phrase_intervention_message(student, plan)
    assert "inactive for 5 days" in msg


def test_evaluate_interventions_behavior():
    from datetime import datetime
    from backend.models import Subject, Exam, StudentState
    student = StudentState(
        student_id="STU1",
        name="Test Student",
        cgpa=7.5,
        attendance=0.8,
        subjects=[
            Subject(name="Subj1", latest=80.0, trend=[70.0, 80.0], flag=None)
        ],
        exams=[
            Exam(subject="Subj1", date=datetime.now(), days_to_exam=7, completion=0.5)
        ],
        nearest_exam=None,
        days_since_active=6, # should trigger recovery_plan
        days_since_commit=0,
        days_since_linkedin=0,
        goals_met_streak=0,
        topics=[],
        skills=["python"],
        risk=None,
        predictions=None
    )
    risk_state = {"level": "Low", "score": 20}
    db = [{"title": "Intern", "company": "Co1", "required_skills": ["python"], "min_cgpa": 6.0}]
    
    interventions = evaluate_interventions(student, risk_state, db)
    actions = [i.action for i in interventions]
    assert "recovery_plan" in actions
    assert "internship_match" in actions

