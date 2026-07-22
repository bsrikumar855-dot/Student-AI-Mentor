"""
Cohort Generation: Produce synthetic cohort Excel data for testing the ingestion module.
"""

import os
import pandas as pd
from datetime import datetime, timedelta

def generate_synthetic_cohort(output_path: str, num_students: int = 20, seed: int = 42) -> None:
    """
    Generates synthetic student data including 1 hero (Aisha) and writes to an Excel file.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 1. Students sheet
    students = []
    
    # Hero: Aisha (Baseline Medium risk ~34.6)
    students.append({
        "student_id": "STU_HERO",
        "name": "Aisha",
        "cgpa": 7.8,
        "attendance": 0.85,
        "days_since_active": 5,
        "days_since_commit": 11,
        "days_since_linkedin": 20,
        "goals_met_streak": 0,
        "skills": "python,git,sql"
    })
    
    # Generate 20 students with explicit bands
    # STU1001-STU1004: High Risk (>= 45)
    # STU1005-STU1009: Medium Risk (25-45)
    # STU1010-STU1020: Low Risk (< 25)
    for i in range(1, num_students + 1):
        sid = f"STU{1000+i}"
        name = f"Student {i}"
        
        if i <= 4:
            # High Risk
            cgpa = 6.1
            attendance = 0.72
            days_since_active = 8
            days_since_commit = 12
            days_since_linkedin = 15
            goals_met_streak = 0
            skills = "python"
        elif i <= 9:
            # Medium Risk
            cgpa = 7.2
            attendance = 0.82
            days_since_active = 4
            days_since_commit = 5
            days_since_linkedin = 8
            goals_met_streak = 2
            skills = "python,git"
        else:
            # Low Risk
            cgpa = 8.8
            attendance = 0.95
            days_since_active = 0
            days_since_commit = 0
            days_since_linkedin = 0
            goals_met_streak = 5
            skills = "python,git,sql"
            
        students.append({
            "student_id": sid,
            "name": name,
            "cgpa": cgpa,
            "attendance": attendance,
            "days_since_active": days_since_active,
            "days_since_commit": days_since_commit,
            "days_since_linkedin": days_since_linkedin,
            "goals_met_streak": goals_met_streak,
            "skills": skills
        })
        
    df_students = pd.DataFrame(students)
    
    # 2. Scores sheet
    scores = []
    # Hero scores
    scores.append({"student_id": "STU_HERO", "subject": "Python", "test_no": 1, "score": 80.0})
    scores.append({"student_id": "STU_HERO", "subject": "Python", "test_no": 2, "score": 88.0})
    scores.append({"student_id": "STU_HERO", "subject": "Python", "test_no": 3, "score": 91.0})
    
    scores.append({"student_id": "STU_HERO", "subject": "DSA", "test_no": 1, "score": 78.0})
    scores.append({"student_id": "STU_HERO", "subject": "DSA", "test_no": 2, "score": 65.0})
    scores.append({"student_id": "STU_HERO", "subject": "DSA", "test_no": 3, "score": 42.0})
    
    # Other students scores
    for i in range(1, num_students + 1):
        sid = f"STU{1000+i}"
        if i <= 4:
            # High Risk scores: very low, declining
            scores.append({"student_id": sid, "subject": "Python", "test_no": 1, "score": 65.0})
            scores.append({"student_id": sid, "subject": "Python", "test_no": 2, "score": 48.0})
            scores.append({"student_id": sid, "subject": "Python", "test_no": 3, "score": 30.0})
            
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 1, "score": 70.0})
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 2, "score": 50.0})
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 3, "score": 35.0})
        elif i <= 9:
            # Medium Risk scores: some decline
            scores.append({"student_id": sid, "subject": "Python", "test_no": 1, "score": 75.0})
            scores.append({"student_id": sid, "subject": "Python", "test_no": 2, "score": 70.0})
            scores.append({"student_id": sid, "subject": "Python", "test_no": 3, "score": 55.0})
            
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 1, "score": 72.0})
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 2, "score": 75.0})
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 3, "score": 70.0})
        else:
            # Low Risk scores: high, steady
            scores.append({"student_id": sid, "subject": "Python", "test_no": 1, "score": 85.0})
            scores.append({"student_id": sid, "subject": "Python", "test_no": 2, "score": 88.0})
            scores.append({"student_id": sid, "subject": "Python", "test_no": 3, "score": 90.0})
            
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 1, "score": 82.0})
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 2, "score": 85.0})
            scores.append({"student_id": sid, "subject": "DSA", "test_no": 3, "score": 88.0})
            
    df_scores = pd.DataFrame(scores)
    
    # 3. Exams sheet
    exams = []
    # Hero exams
    exams.append({
        "student_id": "STU_HERO",
        "subject": "DSA",
        "date": (datetime.now() + timedelta(days=12)).isoformat(),
        "days_to_exam": 12,
        "completion": 0.45
    })
    
    # Other students exams
    for i in range(1, num_students + 1):
        sid = f"STU{1000+i}"
        if i <= 4:
            # High Risk exams: close by, low completion
            exams.append({
                "student_id": sid,
                "subject": "DSA",
                "date": (datetime.now() + timedelta(days=5)).isoformat(),
                "days_to_exam": 5,
                "completion": 0.2
            })
        elif i <= 9:
            exams.append({
                "student_id": sid,
                "subject": "DSA",
                "date": (datetime.now() + timedelta(days=10)).isoformat(),
                "days_to_exam": 10,
                "completion": 0.45
            })
        else:
            exams.append({
                "student_id": sid,
                "subject": "DSA",
                "date": (datetime.now() + timedelta(days=20)).isoformat(),
                "days_to_exam": 20,
                "completion": 0.85
            })
    df_exams = pd.DataFrame(exams)
    
    # 4. Topics sheet
    topics = []
    # Hero topics
    topics.append({
        "student_id": "STU_HERO",
        "topic": "Graphs",
        "learned_on": (datetime.now() - timedelta(days=10)).isoformat(),
        "ef": 2.5,
        "reps": 1,
        "interval": 1,
        "next_review": (datetime.now() - timedelta(days=5)).isoformat()
    })
    
    # Other students topics
    for i in range(1, num_students + 1):
        sid = f"STU{1000+i}"
        topics.append({
            "student_id": sid,
            "topic": "Sorting" if i % 2 == 0 else "Trees",
            "learned_on": (datetime.now() - timedelta(days=5)).isoformat(),
            "ef": 2.5,
            "reps": 1,
            "interval": 2,
            "next_review": (datetime.now() + timedelta(days=2)).isoformat()
        })
    df_topics = pd.DataFrame(topics)
    
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        df_students.to_excel(writer, sheet_name="students", index=False)
        df_scores.to_excel(writer, sheet_name="scores", index=False)
        df_exams.to_excel(writer, sheet_name="exams", index=False)
        df_topics.to_excel(writer, sheet_name="topics", index=False)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(__file__))
    output = os.path.join(base_dir, "backend", "data", "cohort.xlsx")
    generate_synthetic_cohort(output)
    print(f"Generated cohort data at {output}")
