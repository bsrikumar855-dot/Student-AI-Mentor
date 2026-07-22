"""
Risk Scoring Module: Compute a deterministic risk score using weighted factors like attendance, grade trends, and activity.
"""

from typing import Dict, Any
from backend.models import StudentState

def calculate_risk(student: StudentState) -> Dict[str, Any]:
    """
    Computes a risk score and risk level for a student.
    Formula:
      TARGET = 60
      score_gap = mean over subjects of max(0, (TARGET - latest) / TARGET)
      syllabus_behind = nearest_exam ? (1 - completion) * min(7 / max(days_to_exam, 1), 1) : 0
      activity_recency = min(days_since_active / 7, 1)
      trend = mean over subjects (len>=2, trend[0]>0) of max(0, (trend[0] - trend[-1]) / trend[0])
      WEIGHTS = score_gap .35, syllabus_behind .25, activity_recency .25, trend .15
      score01 = Σ weight*term ; score = round(score01*100)
      level = Low (<33) / Medium (<66) / High (>=66)
      dominant = argmax(weight*term)
      reason = "{level} — {human detail for the dominant term, citing real data}"
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

    # Weighted terms
    contributions = {
        "score_gap": score_gap,
        "syllabus_behind": syllabus_behind,
        "activity_recency": activity_recency,
        "trend": trend
    }
    
    weights = {
        "score_gap": 0.35,
        "syllabus_behind": 0.25,
        "activity_recency": 0.25,
        "trend": 0.15
    }

    weighted_terms = {term: weights[term] * val for term, val in contributions.items()}
    score01 = sum(weighted_terms.values())
    score = round(score01 * 100)

    if score < 33:
        level = "Low"
    elif score < 66:
        level = "Medium"
    else:
        level = "High"

    # Find dominant term
    dominant = max(weighted_terms, key=lambda k: weighted_terms[k])

    # Human readable detail for dominant term
    details = {
        "score_gap": f"Academic scores are far below target (average gap is {score_gap*100:.1f}%).",
        "syllabus_behind": f"Syllabus completion is low ({student.nearest_exam.completion*100:.1f}%) for nearest exam in {student.nearest_exam.days_to_exam if student.nearest_exam else 0} days." if student.nearest_exam else "Syllabus completion is low.",
        "activity_recency": f"Student has been inactive for {student.days_since_active} days.",
        "trend": f"There is a severe downward trend in grades (average drop of {trend*100:.1f}%)."
    }

    reason = f"{level} — {details[dominant]}"

    return {
        "score": score,
        "level": level,
        "dominant": dominant,
        "reason": reason,
        "contributions": contributions
    }
