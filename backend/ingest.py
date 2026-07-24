"""
Ingest Module: Extract and structure student LMS data from Excel spreadsheets into StudentState schemas.

The four sheets read below (students, scores, exams, topics) are the canonical inputs;
there is no separate `syllabus` sheet by design -- see specs/adr/0001-four-sheet-supersedes-syllabus.md.
"""

from typing import BinaryIO, List, Tuple
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


def _parse_field(row, col: str, field_type: str, sheet_name: str, excel_row: int, student_id: str = None, example: str = None):
    """
    Parses a field from an Excel row, validating existence and performing type conversion.
    Raises ValueError with human-friendly, Excel-indexed details if missing or malformed.
    
    field_type options: 'number', 'integer', 'string', 'date'
    """
    sid_part = f" for {student_id}" if student_id else ""
    
    if col not in row or pd.isna(row[col]) or (isinstance(row[col], str) and not row[col].strip()):
        type_desc = "a number" if field_type in ("number", "integer") else ("a valid date" if field_type == "date" else "a text string")
        ex_desc = f" (e.g. {example})" if example is not None else ""
        raise ValueError(
            f"malformed {sheet_name} row{sid_part} (Excel row {excel_row}): column '{col}' is empty, expected {type_desc}{ex_desc}"
        )

    val = row[col]

    if field_type == "number":
        try:
            return float(val)
        except (ValueError, TypeError):
            val_str = str(val).strip()
            ex_desc = f" (e.g. {example})" if example is not None else ""
            raise ValueError(
                f"malformed {sheet_name} row{sid_part} (Excel row {excel_row}): column '{col}' contains '{val_str}', expected a number{ex_desc}"
            )

    elif field_type == "integer":
        try:
            f_val = float(val)
            res = int(f_val)
            return res
        except (ValueError, TypeError):
            val_str = str(val).strip()
            ex_desc = f" (e.g. {example})" if example is not None else ""
            raise ValueError(
                f"malformed {sheet_name} row{sid_part} (Excel row {excel_row}): column '{col}' contains '{val_str}', expected a number{ex_desc}"
            )

    elif field_type == "date":
        try:
            return parse_datetime(val)
        except Exception:
            val_str = str(val).strip()
            ex_desc = f" (e.g. {example})" if example is not None else ""
            raise ValueError(
                f"malformed {sheet_name} row{sid_part} (Excel row {excel_row}): column '{col}' contains '{val_str}', expected a valid date{ex_desc}"
            )

    elif field_type == "string":
        res = str(val).strip()
        if not res:
            ex_desc = f" (e.g. {example})" if example is not None else ""
            raise ValueError(
                f"malformed {sheet_name} row{sid_part} (Excel row {excel_row}): column '{col}' is empty, expected a text string{ex_desc}"
            )
        return res

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

    for idx, row in df_students.iterrows():
        excel_row = int(idx) + 2

        if "student_id" not in row or pd.isna(row["student_id"]) or not str(row["student_id"]).strip():
            skipped.append({
                "student_id": None,
                "reason": f"malformed students row (Excel row {excel_row}): column 'student_id' is empty, expected a student ID"
            })
            continue

        sid = str(row["student_id"]).strip()

        try:
            name = _parse_field(row, "name", "string", "students", excel_row, sid, example="Aisha Khan")
            cgpa = _parse_field(row, "cgpa", "number", "students", excel_row, sid, example="8.5")
            attendance = _parse_field(row, "attendance", "number", "students", excel_row, sid, example="0.90")
            days_since_active = _parse_field(row, "days_since_active", "integer", "students", excel_row, sid, example="1")
            days_since_commit = _parse_field(row, "days_since_commit", "integer", "students", excel_row, sid, example="0")
            days_since_linkedin = _parse_field(row, "days_since_linkedin", "integer", "students", excel_row, sid, example="3")
            goals_met_streak = _parse_field(row, "goals_met_streak", "integer", "students", excel_row, sid, example="5")

            skills_raw = row.get("skills", "")
            if pd.isna(skills_raw):
                skills = []
            elif isinstance(skills_raw, str):
                skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
            else:
                skills = [str(skills_raw).strip()]

            # Optional codeforces_handle column -> coding_handles dict
            cf_handle_raw = row.get("codeforces_handle", None)
            if cf_handle_raw is not None and not pd.isna(cf_handle_raw) and str(cf_handle_raw).strip():
                coding_handles = {"codeforces": str(cf_handle_raw).strip()}
            else:
                coding_handles = {}

        except ValueError as e:
            skipped.append({"student_id": sid, "reason": str(e)})
            continue

        student_scores = pd.DataFrame()
        if not df_scores.empty and "student_id" in df_scores.columns:
            student_scores = df_scores[df_scores["student_id"].astype(str) == sid]

        subjects = []
        if not student_scores.empty:
            score_groups = []
            try:
                score_groups = list(student_scores.groupby("subject"))
            except Exception as e:
                skipped.append({"student_id": sid, "reason": f"malformed scores sheet for {sid}: {e}"})

            for subj_name, group in score_groups:
                try:
                    if "test_no" in group.columns:
                        sorted_group = group.sort_values(by="test_no")
                    else:
                        sorted_group = group

                    trend = []
                    for s_idx, s_row in sorted_group.iterrows():
                        s_excel_row = int(s_idx) + 2
                        score_val = _parse_field(s_row, "score", "number", "scores", s_excel_row, sid, example="85.0")
                        trend.append(score_val)

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
                except ValueError as e:
                    skipped.append({
                        "student_id": sid,
                        "reason": str(e)
                    })
                    continue

        student_exams = []
        nearest_exam = None
        if not df_exams.empty and "student_id" in df_exams.columns:
            df_stud_exams = df_exams[df_exams["student_id"].astype(str) == sid]
            for ex_idx, ex_row in df_stud_exams.iterrows():
                ex_excel_row = int(ex_idx) + 2
                try:
                    subject = _parse_field(ex_row, "subject", "string", "exams", ex_excel_row, sid, example="DSA")
                    ex_date = _parse_field(ex_row, "date", "date", "exams", ex_excel_row, sid, example="2026-08-01")
                    days_to_exam = _parse_field(ex_row, "days_to_exam", "integer", "exams", ex_excel_row, sid, example="18")
                    completion = _parse_field(ex_row, "completion", "number", "exams", ex_excel_row, sid, example="0.45")

                    exam_obj = Exam(
                        subject=subject,
                        date=ex_date,
                        days_to_exam=days_to_exam,
                        completion=completion
                    )
                    student_exams.append(exam_obj)
                except ValueError as e:
                    skipped.append({"student_id": sid, "reason": str(e)})
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
            for t_idx, t_row in df_stud_topics.iterrows():
                t_excel_row = int(t_idx) + 2
                try:
                    topic_name = _parse_field(t_row, "topic", "string", "topics", t_excel_row, sid, example="Sorting")
                    learned_on = _parse_field(t_row, "learned_on", "date", "topics", t_excel_row, sid, example="2026-07-01")
                    ef = _parse_field(t_row, "ef", "number", "topics", t_excel_row, sid, example="2.5")
                    reps = _parse_field(t_row, "reps", "integer", "topics", t_excel_row, sid, example="0")
                    interval = _parse_field(t_row, "interval", "integer", "topics", t_excel_row, sid, example="1")
                    next_review = _parse_field(t_row, "next_review", "date", "topics", t_excel_row, sid, example="2026-07-15")

                    topics.append(TopicMemory(
                        topic=topic_name,
                        learned_on=learned_on,
                        ef=ef,
                        reps=reps,
                        interval=interval,
                        next_review=next_review
                    ))
                except ValueError as e:
                    skipped.append({"student_id": sid, "reason": str(e)})
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
                coding_handles=coding_handles,
                risk=None,
                predictions=None
            ))
        except Exception as e:
            skipped.append({"student_id": sid, "reason": f"failed to build student state: {e}"})
            continue

    return student_states, skipped