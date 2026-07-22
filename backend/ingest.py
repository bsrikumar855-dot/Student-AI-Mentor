"""
Ingest Module: Extract and structure student LMS data from Excel spreadsheets into StudentState schemas.

The four sheets read below (students, scores, exams, topics) are the canonical inputs;
there is no separate `syllabus` sheet by design -- see specs/adr/0001-four-sheet-supersedes-syllabus.md.
"""

from typing import BinaryIO, List, Tuple
import pandas as pd
from datetime import datetime
from backend.models import StudentState, Subject, Exam, TopicMemory

def _required(row, col: str):
    """Returns row[col], raising ValueError if the value is missing or NaN."""
    val = row[col]
    if pd.isna(val):
        raise ValueError(f"missing required value for '{col}'")
    return val

def parse_datetime(val) -> datetime:
    if pd.isna(val):
        return datetime.now()
    if isinstance(val, str):
        return pd.to_datetime(val).to_pydatetime()
    if hasattr(val, "to_pydatetime"):
        return val.to_pydatetime()
    return val

def ingest_excel(file_content: BinaryIO) -> Tuple[List[StudentState], List[dict]]:
    """
    Parses student records from an Excel spreadsheet into a list of StudentStates.

    Degrades gracefully on malformed data instead of aborting the whole file: a bad
    students row, or a bad nested exams/topics/scores row, is skipped and reported in
    the returned `skipped` list rather than raising. Returns (students, skipped), where
    each skipped entry is `{"student_id": <str or None>, "reason": "<what failed>"}`.
    """
    xls = pd.ExcelFile(file_content)

    df_students = xls.parse("students") if "students" in xls.sheet_names else pd.DataFrame()
    df_scores = xls.parse("scores") if "scores" in xls.sheet_names else pd.DataFrame()
    df_exams = xls.parse("exams") if "exams" in xls.sheet_names else pd.DataFrame()
    df_topics = xls.parse("topics") if "topics" in xls.sheet_names else pd.DataFrame()

    student_states: List[StudentState] = []
    skipped: List[dict] = []

    if not df_students.empty and "student_id" not in df_students.columns:
        skipped.append({
            "student_id": None,
            "reason": "students sheet missing required column: student_id"
        })
        return student_states, skipped

    for _, row in df_students.iterrows():
        try:
            sid = str(row["student_id"])
        except KeyError:
            skipped.append({"student_id": None, "reason": "students row missing student_id"})
            continue

        try:
            skills_raw = row.get("skills", "")
            if pd.isna(skills_raw):
                skills = []
            elif isinstance(skills_raw, str):
                skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
            else:
                skills = [str(skills_raw).strip()]

            name = str(_required(row, "name"))
            cgpa = float(_required(row, "cgpa"))
            attendance = float(_required(row, "attendance"))
            days_since_active = int(_required(row, "days_since_active"))
            days_since_commit = int(_required(row, "days_since_commit"))
            days_since_linkedin = int(_required(row, "days_since_linkedin"))
            goals_met_streak = int(_required(row, "goals_met_streak"))
        except (KeyError, ValueError, TypeError) as e:
            skipped.append({"student_id": sid, "reason": f"malformed students row: {e}"})
            continue

        student_scores = pd.DataFrame()
        if not df_scores.empty and "student_id" in df_scores.columns:
            student_scores = df_scores[df_scores["student_id"].astype(str) == sid]

        subjects = []
        if not student_scores.empty:
            try:
                score_groups = list(student_scores.groupby("subject"))
            except (KeyError, ValueError, TypeError) as e:
                skipped.append({"student_id": sid, "reason": f"malformed scores sheet: {e}"})
                score_groups = []

            for subj_name, group in score_groups:
                try:
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
                except (KeyError, ValueError, TypeError) as e:
                    skipped.append({
                        "student_id": sid,
                        "reason": f"malformed scores row for subject '{subj_name}': {e}"
                    })
                    continue

        student_exams = []
        nearest_exam = None
        if not df_exams.empty and "student_id" in df_exams.columns:
            df_stud_exams = df_exams[df_exams["student_id"].astype(str) == sid]
            for _, ex_row in df_stud_exams.iterrows():
                try:
                    ex_date = parse_datetime(ex_row["date"])
                    exam_obj = Exam(
                        subject=str(ex_row["subject"]),
                        date=ex_date,
                        days_to_exam=int(ex_row["days_to_exam"]),
                        completion=float(ex_row["completion"])
                    )
                    student_exams.append(exam_obj)
                except (KeyError, ValueError, TypeError) as e:
                    skipped.append({"student_id": sid, "reason": f"malformed exams row: {e}"})
                    continue

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
                try:
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
                except (KeyError, ValueError, TypeError) as e:
                    skipped.append({"student_id": sid, "reason": f"malformed topics row: {e}"})
                    continue

        try:
            student_states.append(StudentState(
                student_id=sid,
                name=name,
                cgpa=cgpa,
                attendance=attendance,
                subjects=subjects,
                exams=student_exams,
                nearest_exam=nearest_exam,
                days_since_active=days_since_active,
                days_since_commit=days_since_commit,
                days_since_linkedin=days_since_linkedin,
                goals_met_streak=goals_met_streak,
                topics=topics,
                skills=skills,
                risk=None,
                predictions=None
            ))
        except Exception as e:
            skipped.append({"student_id": sid, "reason": f"failed to build student state: {e}"})
            continue

    return student_states, skipped