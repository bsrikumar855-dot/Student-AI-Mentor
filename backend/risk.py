"""
Risk Scoring Module: Compute a deterministic risk score using weighted factors like attendance, grade trends, and activity.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.models import StudentState, RiskResult, RiskComponents, PolicyConfig
from backend import policy as policy_module

# SPEC Section 2: fixed target for risk scoring. Weights and the activity_recency
# divisor now live in PolicyConfig (see backend/policy.py).
# Banding: High if score>=45, Medium if score>=25, else Low.
TARGET = 60.0

def calculate_risk(
    student: StudentState,
    derived_signals: Optional[Dict[str, Any]] = None,
    policy: Optional[PolicyConfig] = None,
) -> RiskResult:
    """
    Computes a risk score and risk level for a student.
    """
    if policy is None:
        policy = policy_module.get_policy()

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
    activity_recency = min(student.days_since_active / policy.risk_activity_divisor, 1.0)

    # 4. trend
    trend_terms = []
    for s in student.subjects:
        if len(s.trend) >= 2 and s.trend[0] > 0:
            trend_terms.append(max(0.0, (s.trend[0] - s.trend[-1]) / s.trend[0]))
    trend = sum(trend_terms) / len(trend_terms) if trend_terms else 0.0
    
    # 5. coding_activity
    coding_activity = 0.0
    coding_val = -1
    if derived_signals and "coding_activity" in derived_signals:
        coding_val = derived_signals["coding_activity"].get("value", -1)
        if coding_val >= 0:
            coding_activity = min(coding_val / 7.0, 1.0)

    components = RiskComponents(
        score_gap=score_gap,
        syllabus_behind=syllabus_behind,
        activity_recency=activity_recency,
        trend=trend,
        coding_activity=coding_activity
    )

    weighted_terms = {
        "score_gap": policy.risk_weights["score_gap"] * score_gap,
        "syllabus_behind": policy.risk_weights["syllabus_behind"] * syllabus_behind,
        "activity_recency": policy.risk_weights["activity_recency"] * activity_recency,
        "trend": policy.risk_weights["trend"] * trend,
        "coding_activity": policy.risk_weights["coding_activity"] * coding_activity,
    }

    score01 = sum(weighted_terms.values())
    score = round(score01 * 100)

    if score >= 45:
        level = "High"
    elif score >= 25:
        level = "Medium"
    else:
        level = "Low"

    from backend.models import FeatureContribution, Explanation
    
    # Build human-readable detail strings that cite real subject data (SPEC: "citing real data")
    below_target = [s.name for s in student.subjects if s.latest < TARGET]
    declining = [s.name for s in student.subjects if len(s.trend) >= 2 and s.trend[0] > 0 and s.trend[-1] < s.trend[0]]

    details = {
        "score_gap": (
            f"Academic scores below target in {', '.join(below_target)} (average gap {score_gap*100:.1f}%)."
            if below_target
            else f"Academic scores are near target (average gap {score_gap*100:.1f}%)."
        ),
        "syllabus_behind": (
            f"Syllabus completion is low ({student.nearest_exam.completion*100:.1f}%) for "
            f"{student.nearest_exam.subject} exam in {student.nearest_exam.days_to_exam} days."
            if student.nearest_exam
            else "Syllabus completion is low."
        ),
        "activity_recency": f"Student has been inactive for {student.days_since_active} days.",
        "trend": (
            f"Downward trend in {', '.join(declining)} (average drop {trend*100:.1f}%)."
            if declining
            else f"Slight downward grade trend (average drop {trend*100:.1f}%)."
        ),
        "coding_activity": (
            f"No coding activity for {coding_val} days."
            if coding_val >= 0 else "No known coding profile or activity."
        )
    }
    
    # Build FeatureContribution objects
    contributions = []
    for term, weight in policy.risk_weights.items():
        val = {
            "score_gap": score_gap,
            "syllabus_behind": syllabus_behind,
            "activity_recency": activity_recency,
            "trend": trend,
            "coding_activity": coding_activity,
        }[term]
        
        contributions.append(FeatureContribution(
            name=term,
            value=val,
            weight=weight,
            contribution=weighted_terms[term],
            detail=details[term]
        ))
        
    explanation = Explanation(
        summary=f"Risk level is {level} with a score of {score}.",
        contributions=contributions
    )

    # Derive reasons FROM the explanation
    if not contributions:
        dominant_contrib = None
    else:
        dominant_contrib = max(contributions, key=lambda c: c.contribution)

    if dominant_contrib:
        reasons = [f"{level} — {dominant_contrib.detail}"]
        dominant_val = dominant_contrib.contribution
        if dominant_val > 0.0:
            for c in contributions:
                if c.name != dominant_contrib.name and c.contribution >= 0.8 * dominant_val:
                    reasons.append(c.detail)
    else:
        reasons = []

    computed_at = datetime.now(timezone.utc).isoformat()

    return RiskResult(
        score=score,
        level=level,
        reasons=reasons,
        components=components,
        computed_at=computed_at,
        explanation=explanation,
        confidence=1.0
    )

