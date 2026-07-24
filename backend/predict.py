import math
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
    if d == 0:
        d = 14

    for s in student.subjects:
        if len(s.trend) >= 2:
            deltas = [s.trend[i] - s.trend[i - 1] for i in range(1, len(s.trend))]
            slope = sum(deltas) / len(deltas)
        else:
            slope = 0.0
            
        slopes.append(slope)
        
        # Diminishing-returns damping over multi-week horizons
        w = d / 7.0
        if w <= 2.0:
            w_eff = w
        else:
            w_eff = 2.0 + (w - 2.0) * 0.6
            
        raw_proj = s.latest + slope * w_eff
        
        # Asymptotic ceiling damping above 90% and floor damping below 10%
        if raw_proj > 90.0 and slope > 0:
            excess = raw_proj - 90.0
            headroom = 10.0
            damped_excess = headroom * (1.0 - math.exp(-excess / headroom))
            projected = clamp(90.0 + damped_excess, 0.0, 100.0)
        elif raw_proj < 10.0 and slope < 0:
            deficit = 10.0 - raw_proj
            floor_room = 10.0
            damped_deficit = floor_room * (1.0 - math.exp(-deficit / floor_room))
            projected = clamp(10.0 - damped_deficit, 0.0, 100.0)
        else:
            projected = clamp(raw_proj, 0.0, 100.0)

        projected_scores.append(projected)
        
        if projected < 40:
            fail_risk = "High"
        elif projected < 55:
            fail_risk = "Medium"
        else:
            fail_risk = "Low"
            
        slope_str = f"{slope:.1f}" if abs(slope - round(slope)) > 1e-6 else f"{int(round(slope))}"
        why = f"{s.name}: {s.latest:.0f}% now, {'+' if slope>=0 else ''}{slope_str}/wk -> ~{projected:.0f}% at exam"
        
        exam_forecast.append(ExamForecast(
            subject=s.name,
            projected_score=projected,
            fail_risk=fail_risk,
            why=why
        ))

    if projected_scores:
        exam_gpa_avg = sum(score / 10.0 for score in projected_scores) / len(projected_scores)
        if student.cgpa and student.cgpa > 0:
            # Reconcile raw exam GPA with student's baseline CGPA
            gpa_diff = exam_gpa_avg - student.cgpa
            if gpa_diff > 1.5:
                projected_gpa = student.cgpa + 1.5 + (gpa_diff - 1.5) * 0.3
            elif gpa_diff < -1.5:
                projected_gpa = student.cgpa - 1.5 + (gpa_diff + 1.5) * 0.3
            else:
                projected_gpa = exam_gpa_avg
        else:
            projected_gpa = exam_gpa_avg
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

