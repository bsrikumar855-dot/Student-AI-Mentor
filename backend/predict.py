"""
Prediction Module: Project GPA trends and exam readiness based on historical scores and completion progress.
"""

from typing import Dict, Any, List
from backend.models import StudentState

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(val, max_val))

def predict_trends(student: StudentState) -> Dict[str, Any]:
    """
    Predicts GPA and exam trends for the student.
    Formula:
      slope = (trend[-1] - trend[0]) / (len - 1)
      projected_exam = clamp(latest + slope * (days_to_exam / 7), 0, 100)
      projected_gpa = mean(projected_exam / 10) over subjects
      fail_risk = High (<40) / Medium (<55) / Low (>=55)
    """
    subjects_output = []
    projected_exams = []
    
    # Map exams by subject name for easy lookup
    exam_map = {e.subject: e for e in student.exams}
    
    for s in student.subjects:
        # Find days_to_exam
        exam = exam_map.get(s.name)
        days_to_exam = exam.days_to_exam if exam else 7
        
        # Calculate slope
        if len(s.trend) >= 2:
            slope = (s.trend[-1] - s.trend[0]) / (len(s.trend) - 1)
        else:
            slope = 0.0
            
        projected = clamp(s.latest + slope * (days_to_exam / 7.0), 0.0, 100.0)
        projected_exams.append(projected)
        
        if slope > 0:
            direction = "up"
        elif slope < 0:
            direction = "down"
        else:
            direction = "stable"
            
        if projected < 40:
            fail_risk = "High"
        elif projected < 55:
            fail_risk = "Medium"
        else:
            fail_risk = "Low"
            
        why = f"Based on score trend of {s.trend} and latest score of {s.latest} over {days_to_exam} days to exam."
        
        subjects_output.append({
            "subject": s.name,
            "current": s.latest,
            "projected": projected,
            "direction": direction,
            "fail_risk": fail_risk,
            "why": why
        })
        
    if projected_exams:
        projected_gpa = sum(pe / 10.0 for pe in projected_exams) / len(projected_exams)
    else:
        projected_gpa = student.cgpa
        
    if projected_gpa > student.cgpa:
        gpa_direction = "up"
    elif projected_gpa < student.cgpa:
        gpa_direction = "down"
    else:
        gpa_direction = "stable"
        
    return {
        "projected_gpa": round(projected_gpa, 2),
        "current_cgpa": student.cgpa,
        "gpa_direction": gpa_direction,
        "subjects": subjects_output
    }
