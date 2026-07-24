"""
Cohort Generation: Produce synthetic cohort Excel data for testing the ingestion module.
"""

import os
import pandas as pd
from datetime import datetime, timedelta

def generate_synthetic_cohort(output_path: str, num_students: int = 100, seed: int = 42) -> None:
    """
    Generates synthetic student data including hero (Aisha), STU001-STU100, and demo test students,
    writing a complete cohort Excel file across all 4 sheets (students, scores, exams, topics).
    """
    import random
    random.seed(seed)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    first_names = ["Aisha", "Rohan", "Priya", "Arjun", "Fatima", "Vikram", "Ananya", "Kabir", "Neha", "Dev",
                   "Siddharth", "Meera", "Aarav", "Ishani", "Rishi", "Tanvi", "Aditya", "Diya", "Karan", "Sanya"]
    last_names = ["Sharma", "Mehta", "Nair", "Khan", "Patel", "Verma", "Gupta", "Joshi", "Chopra", "Reddy",
                  "Singh", "Iyer", "Rao", "Das", "Deshmukh", "Bhat", "Kulkarni", "Sen", "Roy", "Malhotra"]
    skill_pools = [
        "python,git,sql", "python,django,fastapi", "java,spring,sql", "c++,dsa,git",
        "javascript,react,node", "python,machine-learning,sql", "html,css,javascript",
        "python,pandas,numpy", "c++,algorithms,system-design", "java,kotlin,android"
    ]
    subjects_pool = ["Python", "DSA", "DBMS", "Web Development"]

    students = []
    scores = []
    exams = []
    topics = []

    # Helper to add a student with full data across all sheets
    def add_student_record(sid, name, cgpa, attendance, active_days, commit_days, linkedin_days, streak, skills, cf_handle=None, risk_level="medium"):
        rec = {
            "student_id": sid,
            "name": name,
            "cgpa": round(cgpa, 2),
            "attendance": round(attendance, 2),
            "days_since_active": active_days,
            "days_since_commit": commit_days,
            "days_since_linkedin": linkedin_days,
            "goals_met_streak": streak,
            "skills": skills,
        }
        if cf_handle:
            rec["codeforces_handle"] = cf_handle
        students.append(rec)

        # Scores
        for subj in subjects_pool:
            if risk_level == "high":
                s1 = round(random.uniform(55, 70), 1)
                s2 = round(s1 - random.uniform(8, 15), 1)
                s3 = round(s2 - random.uniform(5, 12), 1)
            elif risk_level == "medium":
                s1 = round(random.uniform(70, 82), 1)
                s2 = round(s1 + random.uniform(-5, 5), 1)
                s3 = round(s2 + random.uniform(-4, 6), 1)
            else:  # low risk
                s1 = round(random.uniform(82, 92), 1)
                s2 = round(random.uniform(85, 96), 1)
                s3 = round(random.uniform(88, 99), 1)
            
            scores.append({"student_id": sid, "subject": subj, "test_no": 1, "score": s1})
            scores.append({"student_id": sid, "subject": subj, "test_no": 2, "score": s2})
            scores.append({"student_id": sid, "subject": subj, "test_no": 3, "score": max(0.0, s3)})

        # Exams
        days_ahead = random.randint(3, 25)
        comp = 0.15 if risk_level == "high" else (0.50 if risk_level == "medium" else 0.85)
        exams.append({
            "student_id": sid,
            "subject": random.choice(subjects_pool),
            "date": (datetime.now() + timedelta(days=days_ahead)).isoformat(),
            "days_to_exam": days_ahead,
            "completion": comp
        })

        # Topics
        topics.append({
            "student_id": sid,
            "topic": random.choice(["Sorting", "Trees", "Graphs", "Recursion", "Dynamic Programming", "SQL Join"]),
            "learned_on": (datetime.now() - timedelta(days=random.randint(5, 20))).isoformat(),
            "ef": round(random.uniform(2.1, 2.8), 2),
            "reps": random.randint(1, 4),
            "interval": random.randint(1, 7),
            "next_review": (datetime.now() + timedelta(days=random.randint(-2, 5))).isoformat()
        })

    # 1. Hero Student Aisha (STU001 and STU_HERO)
    # STU001: low risk demo hero
    add_student_record("STU001", "Aisha Sharma", 8.9, 0.92, 1, 2, 3, 4, "python,git,sql", "aisha_cf", "low")

    # STU_HERO: exact benchmark Medium risk Aisha for risk transition test
    students.append({
        "student_id": "STU_HERO",
        "name": "Aisha",
        "cgpa": 7.8,
        "attendance": 0.85,
        "days_since_active": 5,
        "days_since_commit": 11,
        "days_since_linkedin": 20,
        "goals_met_streak": 0,
        "skills": "python,git,sql",
        "codeforces_handle": "aisha_cf",
    })
    scores.append({"student_id": "STU_HERO", "subject": "Python", "test_no": 1, "score": 80.0})
    scores.append({"student_id": "STU_HERO", "subject": "Python", "test_no": 2, "score": 88.0})
    scores.append({"student_id": "STU_HERO", "subject": "Python", "test_no": 3, "score": 91.0})
    scores.append({"student_id": "STU_HERO", "subject": "DSA", "test_no": 1, "score": 78.0})
    scores.append({"student_id": "STU_HERO", "subject": "DSA", "test_no": 2, "score": 65.0})
    scores.append({"student_id": "STU_HERO", "subject": "DSA", "test_no": 3, "score": 42.0})
    exams.append({
        "student_id": "STU_HERO",
        "subject": "DSA",
        "date": (datetime.now() + timedelta(days=12)).isoformat(),
        "days_to_exam": 12,
        "completion": 0.45
    })
    topics.append({
        "student_id": "STU_HERO",
        "topic": "Graphs",
        "learned_on": (datetime.now() - timedelta(days=10)).isoformat(),
        "ef": 2.5,
        "reps": 1,
        "interval": 1,
        "next_review": (datetime.now() - timedelta(days=5)).isoformat()
    })

    # 2. Add STU_0008 explicit alias so STU_0008 query directly succeeds
    add_student_record("STU_0008", "Student 0008", 8.4, 0.88, 2, 3, 5, 3, "python,sql", "stu0008_cf", "low")

    # 3. Generate remaining 99 students (STU002 to STU100)
    for i in range(2, num_students + 1):
        sid = f"STU{i:03d}"  # STU002, STU003, ..., STU100
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        name = f"{fname} {lname}"

        # Assign risk profile distribution: ~20% High, ~40% Medium, ~40% Low
        r_val = random.random()
        if r_val < 0.20:
            risk = "high"
            cgpa = random.uniform(5.2, 6.5)
            att = random.uniform(0.55, 0.74)
            act = random.randint(6, 14)
            cmt = random.randint(10, 21)
            lnk = random.randint(12, 30)
            strk = 0
        elif r_val < 0.60:
            risk = "medium"
            cgpa = random.uniform(6.6, 7.9)
            att = random.uniform(0.75, 0.87)
            act = random.randint(2, 6)
            cmt = random.randint(4, 10)
            lnk = random.randint(5, 15)
            strk = random.randint(1, 3)
        else:
            risk = "low"
            cgpa = random.uniform(8.0, 9.8)
            att = random.uniform(0.88, 0.98)
            act = random.randint(0, 2)
            cmt = random.randint(0, 3)
            lnk = random.randint(0, 7)
            strk = random.randint(4, 10)

        skills = random.choice(skill_pools)
        cf_h = f"{fname.lower()}_{i}_cf" if i % 3 == 0 else None
        add_student_record(sid, name, cgpa, att, act, cmt, lnk, strk, skills, cf_h, risk)

    df_students = pd.DataFrame(students)
    df_scores = pd.DataFrame(scores)
    df_exams = pd.DataFrame(exams)
    df_topics = pd.DataFrame(topics)

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        df_students.to_excel(writer, sheet_name="students", index=False)
        df_scores.to_excel(writer, sheet_name="scores", index=False)
        df_exams.to_excel(writer, sheet_name="exams", index=False)
        df_topics.to_excel(writer, sheet_name="topics", index=False)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(__file__))
    output = os.path.join(base_dir, "backend", "data", "cohort.xlsx")
    generate_synthetic_cohort(output, num_students=100)
    print(f"Generated complete synthetic cohort with 100 students at {output}")

