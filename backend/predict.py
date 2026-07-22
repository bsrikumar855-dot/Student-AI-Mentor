"""
Prediction Module: Project GPA trends and exam readiness based on historical scores and completion progress.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from backend.models import StudentState, PredictionResult, ExamForecast

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(val, max_val))

def predict_trends(student: StudentState) -> PredictionResult:
    """
    Predicts GPA and exam trends for the student.
    """
    exam_forecast = []
    projected_scores = []
    slopes = []

    exam_map = {e.subject: e for e in student.exams}
    d = student.nearest_exam.days_to_exam if student.nearest_exam else 14

    for s in student.subjects:
        if len(s.trend) >= 2:
            slope = (s.trend[-1] - s.trend[0]) / (len(s.trend) - 1)
        else:
            slope = 0.0
            
        slopes.append(slope)
        projected = clamp(s.latest + slope * (d / 7.0), 0.0, 100.0)
        projected_scores.append(projected)
        
        exam_forecast.append(ExamForecast(
            subject=s.name,
            projected_score=projected
        ))

    if projected_scores:
        projected_gpa = sum(score / 10.0 for score in projected_scores) / len(projected_scores)
    else:
        projected_gpa = student.cgpa
        
    mean_slope = sum(slopes) / len(slopes) if slopes else 0.0
    if mean_slope > 0.5:
        exam_trend = "improving"
    elif mean_slope < -0.5:
        exam_trend = "declining"
    else:
        exam_trend = "stable"

    computed_at = datetime.now(timezone.utc).isoformat()

    return PredictionResult(
        projected_gpa=round(projected_gpa, 2),
        exam_trend=exam_trend,
        exam_forecast=exam_forecast,
        computed_at=computed_at
    )
