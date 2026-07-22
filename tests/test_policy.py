from backend.policy import get_policy


def test_default_policy_matches_current_hardcoded_values():
    """
    These defaults must exactly match the values hardcoded in interventions.py
    (5, 10, 14, 7), internships.py (0.5), and risk.py (the 5-term WEIGHTS dict and the
    7.0 divisor in activity_recency) at the time PolicyConfig was introduced.
    """
    policy = get_policy()
    assert policy.version == "v1"
    assert policy.days_since_active_threshold == 5
    assert policy.github_inactivity_threshold == 10
    assert policy.days_since_linkedin_threshold == 14
    assert policy.coding_inactivity_threshold == 7
    assert policy.internship_match_min == 0.5
    assert policy.risk_activity_divisor == 7.0
    assert policy.risk_weights == {
        "score_gap": 0.34,
        "syllabus_behind": 0.25,
        "activity_recency": 0.25,
        "trend": 0.15,
        "coding_activity": 0.01,
    }


def test_get_policy_unknown_tenant_falls_back_to_default():
    policy = get_policy("nonexistent-tenant")
    assert policy.version == "v1"
    assert policy.days_since_active_threshold == 5


def test_load_policy_file_overrides_merge_onto_default(tmp_path):
    import json
    from backend import policy as policy_module

    path = str(tmp_path / "policy.json")
    with open(path, "w") as f:
        json.dump({"acme": {"version": "v2", "days_since_active_threshold": 3}}, f)

    policy_module.load_policy_file(path)
    acme_policy = policy_module.get_policy("acme")

    assert acme_policy.version == "v2"
    assert acme_policy.days_since_active_threshold == 3
    # Unspecified fields fall back to the default's values.
    assert acme_policy.github_inactivity_threshold == 10
    assert acme_policy.internship_match_min == 0.5

    # Default tenant is unaffected.
    default_policy = policy_module.get_policy()
    assert default_policy.version == "v1"
    assert default_policy.days_since_active_threshold == 5


def test_custom_policy_shifts_recovery_plan_threshold():
    """A custom PolicyConfig passed explicitly to evaluate_interventions overrides the
    default days_since_active_threshold."""
    from backend.models import StudentState, RiskResult, RiskComponents, PolicyConfig
    from backend.interventions import evaluate_interventions

    student = StudentState(
        student_id="STU_POLICY",
        name="Policy Student",
        cgpa=7.0,
        attendance=0.8,
        subjects=[],
        exams=[],
        nearest_exam=None,
        days_since_active=2,
        days_since_commit=0,
        days_since_linkedin=0,
        goals_met_streak=0,
        topics=[],
        skills=[],
    )
    risk_state = RiskResult(
        score=10, level="Low", reasons=["Low risk"],
        components=RiskComponents(score_gap=0.0, syllabus_behind=0.0, activity_recency=0.0, trend=0.0, coding_activity=0.0),
        computed_at="2026-07-22T10:00:00Z"
    )

    # Default policy (threshold 5): day 2 should NOT trigger recovery_plan.
    default_result = evaluate_interventions(student, risk_state)
    assert "recovery_plan" not in [i.action for i in default_result]

    # Custom policy (threshold 2): day 2 SHOULD trigger recovery_plan.
    custom_policy = PolicyConfig(version="test", days_since_active_threshold=2)
    custom_result = evaluate_interventions(student, risk_state, policy=custom_policy)
    assert "recovery_plan" in [i.action for i in custom_result]


def test_custom_risk_weights_shift_dominant_reason():
    """A custom PolicyConfig.risk_weights changes which component dominates reasons[0]."""
    from backend.models import StudentState, Subject, PolicyConfig
    from backend.risk import calculate_risk

    student = StudentState(
        student_id="STU_DOMINANT",
        name="Dominant Student",
        cgpa=7.0,
        attendance=0.8,
        subjects=[Subject(name="Math", latest=30.0, trend=[])],
        exams=[],
        nearest_exam=None,
        days_since_active=1,
        days_since_commit=0,
        days_since_linkedin=0,
        goals_met_streak=0,
        topics=[],
        skills=[],
    )

    # Default weights: score_gap (0.35) dominates over activity_recency (0.22) here.
    default_res = calculate_risk(student)
    assert "Academic scores" in default_res.reasons[0]

    # Custom weights: activity_recency now dominates score_gap.
    custom_policy = PolicyConfig(
        version="test",
        risk_weights={
            "score_gap": 0.05, "syllabus_behind": 0.025,
            "activity_recency": 0.9, "trend": 0.02, "coding_activity": 0.005,
        },
    )
    custom_res = calculate_risk(student, policy=custom_policy)
    assert "inactive" in custom_res.reasons[0]
