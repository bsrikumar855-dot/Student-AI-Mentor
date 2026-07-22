"""
Risk Scoring Module: Compute a deterministic risk score using weighted factors like attendance, grade trends, and activity.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from backend.models import StudentState, RiskResult, RiskComponents

def calculate_risk(student: StudentState) -> RiskResult:
    """
    Computes a risk score and risk level for a student.
    """
    TARGET = 60.0
    
    # 1. score_gap
    if student.subjects:
        score_gap = sum(max(0.0, (TARGET - s.latest) / TARGET) for s in student.subjects) / len(student.subjects)
    else:
        score_gap = 0.0

    # 2. syllabus_behind
    if student.nearest_exam:
        ne = student.nearest_exam
        days = max(ne.days_to_exam, 1)
        syllabus_behind = (1.0 - ne.completion) * min(7.0 / days, 1.0)
    else:
        syllabus_behind = 0.0

    # 3. activity_recency
    activity_recency = min(student.days_since_active / 7.0, 1.0)

    # 4. trend
    trend_terms = []
    for s in student.subjects:
        if len(s.trend) >= 2 and s.trend[0] > 0:
            trend_terms.append(max(0.0, (s.trend[0] - s.trend[-1]) / s.trend[0]))
    trend = sum(trend_terms) / len(trend_terms) if trend_terms else 0.0

    components = RiskComponents(
        score_gap=score_gap,
        syllabus_behind=syllabus_behind,
        activity_recency=activity_recency,
        trend=trend
    )
    
    weights = {
        "score_gap": 0.35,
        "syllabus_behind": 0.25,
        "activity_recency": 0.25,
        "trend": 0.15
    }

    weighted_terms = {
        "score_gap": weights["score_gap"] * score_gap,
        "syllabus_behind": weights["syllabus_behind"] * syllabus_behind,
        "activity_recency": weights["activity_recency"] * activity_recency,
        "trend": weights["trend"] * trend
    }
    
    score01 = sum(weighted_terms.values())
    score = round(score01 * 100, 1)

    if score < 33:
        level = "Low"
    elif score < 66:
        level = "Medium"
    else:
        level = "High"

    # Find dominant term
    dominant = max(weighted_terms, key=lambda k: weighted_terms[k])
    dominant_val = weighted_terms[dominant]

    # Find worst subject for score_gap
    worst_subject = min(student.subjects, key=lambda s: s.latest) if student.subjects else None
    worst_subject_str = f"{worst_subject.name} at {worst_subject.latest:.1f}%" if worst_subject else "None"

    # Find worst trend
    worst_trend_subj = None
    max_drop = -1.0
    for s in student.subjects:
        if len(s.trend) >= 2 and s.trend[0] > 0:
            drop = (s.trend[0] - s.trend[-1]) / s.trend[0]
            if drop > max_drop:
                max_drop = drop
                worst_trend_subj = s
    worst_trend_str = f"drop in {worst_trend_subj.name} of {max_drop*100:.1f}%" if worst_trend_subj else "no drop"

    details = {
        "score_gap": f"Academic scores are far below target ({worst_subject_str}).",
        "syllabus_behind": f"Syllabus completion is low ({student.nearest_exam.completion*100:.1f}%) for nearest exam in {student.nearest_exam.subject}." if student.nearest_exam else "Syllabus completion is low.",
        "activity_recency": f"Student has been inactive for {student.days_since_active} days.",
        "trend": f"There is a downward trend in grades ({worst_trend_str})."
    }

    reasons = [f"{level} — {details[dominant]}"]

    # Add secondary reasons (contribution within 20% of dominant)
    if dominant_val > 0.0:
        for term, val in weighted_terms.items():
            if term != dominant and val >= 0.8 * dominant_val:
                reasons.append(details[term])

    computed_at = datetime.now(timezone.utc).isoformat()

    return RiskResult(
        score=score,
        level=level,
        reasons=reasons,
        components=components,
        computed_at=computed_at
    )
