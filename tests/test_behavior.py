import json
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
    students, skipped = ingest_excel(out)
    assert len(students) == 1
    assert students[0].student_id == "STU1"
    assert students[0].name == "Bob"
    assert students[0].cgpa == 8.0
    assert len(students[0].subjects) == 1
    assert students[0].subjects[0].name == "Math"
    assert students[0].subjects[0].latest == 85.0
    assert len(students[0].skills) == 2
    assert "python" in students[0].skills
    assert "git" in students[0].skills
    assert skipped == []


def test_ingest_excel_skips_malformed_row():
    import io
    import pandas as pd

    # STU1 is missing cgpa; STU2 is well-formed and should still be ingested.
    students_df = pd.DataFrame([
        {
            "student_id": "STU1",
            "name": "Bob",
            "cgpa": None,
            "attendance": 0.9,
            "days_since_active": 1,
            "days_since_commit": 2,
            "days_since_linkedin": 3,
            "goals_met_streak": 5,
            "skills": "python,git"
        },
        {
            "student_id": "STU2",
            "name": "Alice",
            "cgpa": 9.0,
            "attendance": 0.95,
            "days_since_active": 0,
            "days_since_commit": 0,
            "days_since_linkedin": 0,
            "goals_met_streak": 2,
            "skills": "java"
        }
    ])

    out = io.BytesIO()
    with pd.ExcelWriter(out, engine='openpyxl') as writer:
        students_df.to_excel(writer, sheet_name="students", index=False)

    out.seek(0)
    students, skipped = ingest_excel(out)

    assert [s.student_id for s in students] == ["STU2"]
    assert len(skipped) == 1
    assert skipped[0]["student_id"] == "STU1"
    assert "reason" in skipped[0] and skipped[0]["reason"]


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
    assert res.score is not None
    assert res.level == "Medium"
    assert len(res.reasons) >= 1
    assert res.components.score_gap is not None

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
        nearest_exam=Exam(subject="Subj1", date=datetime.now(), days_to_exam=7, completion=0.5),
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
    assert res.projected_gpa == 9.0
    assert res.exam_trend == "improving"
    assert res.exam_forecast[0].projected_score == 90.0
    assert res.exam_forecast[0].fail_risk == "Low"
    assert "Subj1" in res.exam_forecast[0].why
    assert "80%" in res.exam_forecast[0].why  # latest score
    assert "90%" in res.exam_forecast[0].why  # projected score


def test_predict_trends_d_fallback_at_zero():
    """When days_to_exam==0, SPEC's `or 14` semantics should fall back to d=14."""
    from datetime import datetime
    from backend.models import Subject, Exam, StudentState
    student = StudentState(
        student_id="STU1",
        name="Test Student",
        cgpa=7.5,
        attendance=0.8,
        subjects=[
            Subject(name="Subj1", latest=50.0, trend=[40.0, 50.0], flag=None)
        ],
        exams=[
            Exam(subject="Subj1", date=datetime.now(), days_to_exam=0, completion=0.5)
        ],
        nearest_exam=Exam(subject="Subj1", date=datetime.now(), days_to_exam=0, completion=0.5),
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
    # slope = (50 - 40) / 1 = 10, d = 14 (fallback), projected = 50 + 10*(14/7) = 70.0
    assert res.exam_forecast[0].projected_score == 70.0
    assert res.exam_forecast[0].fail_risk == "Low"


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
    assert res[0].title == "Backend Intern"
    assert res[0].match == 1.0
    assert "meets all" in res[0].why

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
            Intervention(id="STU1:recovery_plan:active", action="recovery_plan", why="inactive for 5 days", kind="recovery", auto=True)
        ],
        generated_at="2026-07-22T10:00:00Z"
    )
    msg = phrase_intervention_message(student, plan)
    assert "inactive for 5 days" in msg


def test_evaluate_interventions_behavior():
    from datetime import datetime
    from backend.models import Subject, Exam, StudentState, RiskResult, RiskComponents
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
    risk_state = RiskResult(
        score=20,
        level="Low",
        reasons=["Low risk"],
        components=RiskComponents(score_gap=0.0, syllabus_behind=0.0, activity_recency=0.0, trend=0.0, coding_activity=0.0),
        computed_at="2026-07-22T10:00:00Z"
    )
    db = [{"title": "Intern", "company": "Co1", "required_skills": ["python"], "min_cgpa": 6.0}]
    
    interventions = evaluate_interventions(student, risk_state, db)
    actions = [i.action for i in interventions]
    assert "recovery_plan" in actions
    assert "internship_match" in actions

def test_risk_golden_file_behavior():
    import json
    from backend.models import StudentState
    from backend.risk import calculate_risk
    
    with open("mocks/student_state.json", "r") as f:
        data = json.load(f)
        
    student = StudentState(**data)
    res = calculate_risk(student)

    # Per SPEC Section 2: score = round(score01 * 100) (int), bands Low<33/Medium<66/High>=66
    assert res.score == 18
    assert res.level == "Low"
    assert res.components.score_gap == pytest.approx(0.06666, abs=1e-4)
    assert res.components.syllabus_behind == pytest.approx(0.28, abs=1e-2)
    assert res.components.activity_recency == pytest.approx(0.2857, abs=1e-4)
    assert res.components.trend == pytest.approx(0.1285, abs=1e-4)
    assert "Low — Student has been inactive for 2 days." in res.reasons

    # Assert new explanation field validates and components sum roughly to the score
    assert res.explanation is not None
    assert len(res.explanation.contributions) == 5
    total_contribution = sum(c.contribution for c in res.explanation.contributions)
    assert round(total_contribution * 100) == res.score

def test_hand_reasoned_golden_students():
    from backend.models import StudentState, Subject, Exam, TopicMemory
    from datetime import datetime, timezone
    from backend.predict import predict_trends
    from backend.retain import apply_sm2

    # 1. GPA projection:
    # student cgpa=7.5, Python latest=80.0, trend=[70.0, 80.0], days_to_exam=7
    # slope = (80-70)/1 = 10, d = 7, projected = 80 + 10*(7/7) = 90.0
    # projected_gpa = round(90.0/10, 2) = 9.00
    pred_stu = StudentState(
        student_id="STU1", name="Test Student", cgpa=7.5, attendance=0.8,
        subjects=[Subject(name="Python", latest=80.0, trend=[70.0, 80.0])],
        exams=[Exam(subject="Python", date=datetime.now(), days_to_exam=7, completion=0.5)],
        nearest_exam=Exam(subject="Python", date=datetime.now(), days_to_exam=7, completion=0.5),
        days_since_active=0, days_since_commit=0, days_since_linkedin=0, goals_met_streak=0, topics=[], skills=[]
    )
    res_pred = predict_trends(pred_stu)
    assert res_pred.projected_gpa == 9.0
    assert res_pred.exam_forecast[0].projected_score == 90.0

    # 5. SM-2 Spacing logic
    # quality=4 review -> EF=2.5, reps=0, interval=1 -> reps=1, interval=1
    # next reps=2 review (quality=4) -> interval=6
    t = TopicMemory(topic="Math", learned_on=datetime.now(), ef=2.5, reps=1, interval=1, next_review=datetime.now())
    res_t = apply_sm2(t, 4, today=datetime(2026, 7, 22, 12, 0, 0))
    assert res_t.reps == 2
    assert res_t.interval == 6

def test_timezone_aware_recall_estimate():
    from backend.models import TopicMemory
    from backend.retain import recall_estimate
    from datetime import datetime, timezone
    
    # learned_on is tz-aware UTC
    t = TopicMemory(
        topic="Math",
        learned_on=datetime(2026, 7, 20, 10, 0, 0, tzinfo=timezone.utc),
        ef=2.5,
        reps=1,
        interval=1,
        next_review=datetime(2026, 7, 21, 10, 0, 0, tzinfo=timezone.utc)
    )
    
    # today is tz-naive or tz-aware, shouldn't crash
    today = datetime(2026, 7, 22, 12, 0, 0)
    recall = recall_estimate(t, today)
    assert recall > 0.0

def test_cohort_realism_and_transition():
    import json
    import pandas as pd
    from backend.ingest import ingest_excel
    from backend.risk import calculate_risk
    from backend.interventions import evaluate_interventions
    
    # Read generated cohort
    with open("backend/data/cohort.xlsx", "rb") as f:
        students, skipped = ingest_excel(f)
        
    # Count bands
    high_count = 0
    med_count = 0
    low_count = 0
    aisha = None
    
    for s in students:
        # Pass mock derived signals for Aisha (since she has a seeded coding profile in demo)
        derived = {"coding_activity": {"value": 5, "source": "codeforces"}} if s.student_id == "STU_HERO" else None
        res = calculate_risk(s, derived_signals=derived)
        s.risk = res
        if s.student_id == "STU_HERO":
            aisha = s
        if res.level == "High":
            high_count += 1
        elif res.level == "Medium":
            med_count += 1
        else:
            low_count += 1
            
    # Verify spread requirements (per SPEC banding: High>=45, Medium>=25, else Low)
    assert high_count >= 3
    assert med_count >= 4
    assert low_count >= 1
    assert aisha is not None
    assert aisha.risk.level == "Medium"
    
    # Aisha Medium -> High Transition: natural drift only
    # (inactive 8 days + exam in 5 days; DSA completion stays at 0.45, DSA scores unchanged)
    aisha.days_since_active = 8
    aisha.nearest_exam.days_to_exam = 5
    aisha.nearest_exam.completion = 0.45
    aisha.exams[0].days_to_exam = 5
    
    aisha_derived = {"coding_activity": {"value": 5, "source": "codeforces"}}
    new_risk = calculate_risk(aisha, derived_signals=aisha_derived)
    assert new_risk.level == "High"
    
    interventions = evaluate_interventions(aisha, new_risk, derived_signals=aisha_derived)
    actions = [i.action for i in interventions]
    assert "revision_timetable" in actions
    assert "flag_at_risk" in actions

def test_chat_response_fallback():
    reply, used_llm = chat_response("Hello Drishta", [], api_key=None)
    assert not used_llm
    assert "Drishta Mentor: I received your message: 'Hello Drishta'." in reply

def test_chat_response_exception_safety(monkeypatch):
    # Monkeypatch the LLM client to raise so no real network call is made.
    # Verifies that used_llm is False and we get the templated fallback.
    import google.generativeai as genai

    class _RaisingModel:
        def __init__(self, *a, **kw):
            pass
        def generate_content(self, *a, **kw):
            raise RuntimeError("simulated LLM failure")

    monkeypatch.setattr(genai, "GenerativeModel", _RaisingModel)
    monkeypatch.setattr(genai, "configure", lambda **kw: None)

    reply, used_llm = chat_response("Hello Drishta", [], api_key="FAKE_KEY_TRIGGERS_LLM_PATH")
    assert not used_llm
    assert "Drishta Mentor: I received your message: 'Hello Drishta'." in reply



# ── Phase 6: Coding Progress Adapter Tests ────────────────────────────────────

def test_codeforces_live_path(monkeypatch):
    """Live-path: parses a mocked Codeforces API response correctly."""
    import urllib.request
    import io
    import time
    from backend import coding

    # Clear module cache so previous test runs don't interfere
    coding._cache.clear()

    fake_now = 1_700_000_000  # fixed epoch for determinism
    last_online = fake_now - (3 * 86400)  # 3 days ago

    user_info_payload = json.dumps({
        "status": "OK",
        "result": [{
            "handle": "test_user",
            "rating": 1400,
            "maxRating": 1500,
            "rank": "specialist",
            "lastOnlineTimeSeconds": last_online,
        }]
    }).encode()

    user_status_payload = json.dumps({
        "status": "OK",
        "result": [
            {"verdict": "OK", "problem": {"contestId": 1, "index": "A"}},
            {"verdict": "OK", "problem": {"contestId": 1, "index": "B"}},
            {"verdict": "WRONG_ANSWER", "problem": {"contestId": 2, "index": "A"}},
            # Duplicate OK — should count only once
            {"verdict": "OK", "problem": {"contestId": 1, "index": "A"}},
        ]
    }).encode()

    call_count = {"n": 0}

    class _FakeResponse:
        def __init__(self, data):
            self._data = data
        def read(self):
            return self._data
        def __enter__(self):
            return self
        def __exit__(self, *a):
            pass

    def _fake_urlopen(url, timeout=4):
        call_count["n"] += 1
        if "user.info" in url:
            return _FakeResponse(user_info_payload)
        return _FakeResponse(user_status_payload)

    monkeypatch.setattr(urllib.request, "urlopen", _fake_urlopen)
    monkeypatch.setattr(time, "time", lambda: fake_now)

    result = coding.get_codeforces("test_user")

    assert result["source"] == "live"
    assert result["handle"] == "test_user"
    assert result["rating"] == 1400
    assert result["max_rating"] == 1500
    assert result["rank"] == "specialist"
    assert result["solved_count"] == 2   # A+B, deduplicated
    assert result["last_active_days"] == 3


def test_codeforces_failure_path_returns_seed(monkeypatch):
    """Failure-path: network error returns seed/cached; source != 'live'; never raises."""
    import urllib.request
    from backend import coding

    coding._cache.clear()

    def _raise(*a, **kw):
        raise OSError("network unreachable")

    monkeypatch.setattr(urllib.request, "urlopen", _raise)

    result = coding.get_codeforces("aisha_cf")  # has a seed entry

    assert result["source"] != "live"
    assert result["handle"] == "aisha_cf"
    assert "rating" in result
    assert "solved_count" in result


def test_codeforces_failure_returns_cached_before_seed(monkeypatch):
    """After a successful live fetch, a subsequent failure returns 'cached' not 'seed'."""
    import urllib.request
    import time
    from backend import coding

    coding._cache.clear()

    last_online = 1_700_000_000 - (2 * 86400)
    live_payload = json.dumps({
        "status": "OK",
        "result": [{"handle": "cached_user", "rating": 999, "maxRating": 1000,
                     "rank": "pupil", "lastOnlineTimeSeconds": last_online}]
    }).encode()
    solved_payload = json.dumps({"status": "OK", "result": []}).encode()

    class _FakeResp:
        def __init__(self, d):
            self._d = d
        def read(self): return self._d
        def __enter__(self): return self
        def __exit__(self, *a): pass

    monkeypatch.setattr(time, "time", lambda: 1_700_000_000)
    monkeypatch.setattr(urllib.request, "urlopen",
                        lambda url, timeout=4: _FakeResp(live_payload if "user.info" in url else solved_payload))

    first = coding.get_codeforces("cached_user")
    assert first["source"] == "live"

    # Now break the network
    monkeypatch.setattr(urllib.request, "urlopen", lambda *a, **kw: (_ for _ in ()).throw(OSError("gone")))

    second = coding.get_codeforces("cached_user")
    assert second["source"] == "cached"
    assert second["rating"] == 999


def test_coding_nudge_fires_at_seven_days(monkeypatch):
    """coding_nudge intervention fires when coding last_active_days >= 7."""
    import urllib.request
    from datetime import datetime
    from backend.models import Subject, Exam, StudentState, RiskResult, RiskComponents
    from backend.interventions import evaluate_interventions

    student = StudentState(
        student_id="STU_TEST",
        name="Coding Student",
        cgpa=7.0,
        attendance=0.8,
        subjects=[Subject(name="Math", latest=70.0, trend=[70.0, 70.0])],
        exams=[],
        nearest_exam=None,
        days_since_active=1,
        days_since_commit=1,
        days_since_linkedin=1,
        goals_met_streak=0,
        topics=[],
        skills=["python"],
        coding_handles={"codeforces": "lazy_coder"},
    )
    risk_state = RiskResult(
        score=10,
        level="Low",
        reasons=["Low risk"],
        components=RiskComponents(score_gap=0.0, syllabus_behind=0.0,
                                  activity_recency=0.0, trend=0.0, coding_activity=0.0),
        computed_at="2026-07-22T10:00:00Z"
    )

    # Exactly 7 days inactive → should fire
    derived = {"coding_activity": {"value": 7, "source": "codeforces"}}
    interventions = evaluate_interventions(student, risk_state, derived_signals=derived)
    actions = [i.action for i in interventions]
    assert "coding_nudge" in actions

    # 6 days inactive → should NOT fire
    derived_short = {"coding_activity": {"value": 6, "source": "codeforces"}}
    interventions2 = evaluate_interventions(student, risk_state, derived_signals=derived_short)
    actions2 = [i.action for i in interventions2]
    assert "coding_nudge" not in actions2

    # No derived_signals provided → should NOT fire
    interventions3 = evaluate_interventions(student, risk_state, derived_signals=None)
    actions3 = [i.action for i in interventions3]
    assert "coding_nudge" not in actions3
