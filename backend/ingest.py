"""
Ingest Module: Extract and structure student LMS data from Excel spreadsheets into StudentState schemas.
"""

from typing import BinaryIO, List
import pandas as pd
from datetime import datetime
from backend.models import StudentState, Subject, Exam, TopicMemory

def parse_datetime(val) -> datetime:
    if pd.isna(val):
        return datetime.now()
    if isinstance(val, str):
        return pd.to_datetime(val).to_pydatetime()
    if hasattr(val, "to_pydatetime"):
        return val.to_pydatetime()
    return val

def ingest_excel(file_content: BinaryIO) -> List[StudentState]:
    """
    Parses student records from Excel spreadsheet and converts them to list of StudentStates.
    """
    xls = pd.ExcelFile(file_content)
    
    df_students = xls.parse("students") if "students" in xls.sheet_names else pd.DataFrame()
    df_scores = xls.parse("scores") if "scores" in xls.sheet_names else pd.DataFrame()
    df_exams = xls.parse("exams") if "exams" in xls.sheet_names else pd.DataFrame()
    df_topics = xls.parse("topics") if "topics" in xls.sheet_names else pd.DataFrame()
    
    student_states = []
    
    for _, row in df_students.iterrows():
        sid = str(row["student_id"])
        
        skills_raw = row.get("skills", "")
        if pd.isna(skills_raw):
            skills = []
        elif isinstance(skills_raw, str):
            skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
        else:
            skills = [str(skills_raw).strip()]
            
        student_scores = pd.DataFrame()
        if not df_scores.empty and "student_id" in df_scores.columns:
            student_scores = df_scores[df_scores["student_id"].astype(str) == sid]
            
        subjects = []
        if not student_scores.empty:
            for subj_name, group in student_scores.groupby("subject"):
                sorted_group = group.sort_values(by="test_no")
                trend = [float(val) for val in sorted_group["score"].tolist()]
                latest = trend[-1] if trend else 0.0
                
                flag = None
                if len(trend) >= 2 and trend[-1] < trend[-2]:
                    flag = "Warning: Downward Trend"
                    
                subjects.append(Subject(
                    name=str(subj_name),
                    latest=latest,
                    trend=trend,
                    flag=flag
                ))
                
        student_exams = []
        nearest_exam = None
        if not df_exams.empty and "student_id" in df_exams.columns:
            df_stud_exams = df_exams[df_exams["student_id"].astype(str) == sid]
            for _, ex_row in df_stud_exams.iterrows():
                ex_date = parse_datetime(ex_row["date"])
                exam_obj = Exam(
                    subject=str(ex_row["subject"]),
                    date=ex_date,
                    days_to_exam=int(ex_row["days_to_exam"]),
                    completion=float(ex_row["completion"])
                )
                student_exams.append(exam_obj)
                
            if student_exams:
                valid_exams = [e for e in student_exams if e.days_to_exam >= 0]
                if valid_exams:
                    nearest_exam = min(valid_exams, key=lambda e: e.days_to_exam)
                else:
                    nearest_exam = min(student_exams, key=lambda e: abs(e.days_to_exam))
                    
        topics = []
        if not df_topics.empty and "student_id" in df_topics.columns:
            df_stud_topics = df_topics[df_topics["student_id"].astype(str) == sid]
            for _, t_row in df_stud_topics.iterrows():
                learned_on = parse_datetime(t_row["learned_on"])
                next_review = parse_datetime(t_row["next_review"])
                topics.append(TopicMemory(
                    topic=str(t_row["topic"]),
                    learned_on=learned_on,
                    ef=float(t_row["ef"]),
                    reps=int(t_row["reps"]),
                    interval=int(t_row["interval"]),
                    next_review=next_review
                ))
                
        student_states.append(StudentState(
            student_id=sid,
            name=str(row["name"]),
            cgpa=float(row["cgpa"]),
            attendance=float(row["attendance"]),
            subjects=subjects,
            exams=student_exams,
            nearest_exam=nearest_exam,
            days_since_active=int(row["days_since_active"]),
            days_since_commit=int(row["days_since_commit"]),
            days_since_linkedin=int(row["days_since_linkedin"]),
            goals_met_streak=int(row["goals_met_streak"]),
            topics=topics,
            skills=skills,
            risk=None,
            predictions=None
        ))
        
    return student_states
