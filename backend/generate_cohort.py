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
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 1. Students sheet
    students = []
    
    # Hero: Aisha
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
    
    # Other 20 students
    for i in range(1, num_students + 1):
        students.append({
            "student_id": f"STU{1000+i}",
            "name": f"Student {i}",
            "cgpa": round(6.0 + (i * 0.15) % 3.8, 2),
            "attendance": round(0.7 + (i * 0.02) % 0.28, 2),
            "days_since_active": i % 6,
            "days_since_commit": i % 12,
            "days_since_linkedin": i % 18,
            "goals_met_streak": i % 8,
            "skills": "python,git" if i % 2 == 0 else "sql,java"
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
        scores.append({"student_id": sid, "subject": "Python", "test_no": 1, "score": 70.0 + i % 20})
        scores.append({"student_id": sid, "subject": "Python", "test_no": 2, "score": 72.0 + i % 22})
        scores.append({"student_id": sid, "subject": "DSA", "test_no": 1, "score": 60.0 + i % 25})
        scores.append({"student_id": sid, "subject": "DSA", "test_no": 2, "score": 65.0 + i % 28})
        
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
        exams.append({
            "student_id": sid,
            "subject": "Python" if i % 2 == 0 else "DSA",
            "date": (datetime.now() + timedelta(days=15)).isoformat(),
            "days_to_exam": 15,
            "completion": 0.6
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
    
    # Write to Excel
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
