"""
Interventions Module: Trigger specific actions (e.g., peer tutoring, faculty alerts) based on deterministic threshold violations.
"""

import json
import os
from typing import List, Dict, Any, Optional
from backend.models import StudentState, Intervention, RiskResult
from backend.retain import due_topics
from backend.internships import match_internships

def evaluate_interventions(
    student: StudentState,
    risk_state: RiskResult,
    internships_db: Optional[List[Dict[str, Any]]] = None,
    coding_profile: Optional[Dict[str, Any]] = None,
) -> List[Intervention]:
    """
    Evaluates risk and student metrics against predefined rules to trigger interventions.
    """
    interventions = []
    sid = student.student_id

    # 1. recovery_plan: days_since_active >= 5
    if student.days_since_active >= 5:
        interventions.append(Intervention(
            id=f"{sid}:recovery_plan",
            action="recovery_plan",
            why=f"Student has been inactive for {student.days_since_active} days.",
            kind="recovery",
            auto=True
        ))

    # 2. revision_timetable: nearest_exam.days_to_exam <= 7 and completion < 0.5
    if student.nearest_exam:
        ne = student.nearest_exam
        if ne.days_to_exam <= 7 and ne.completion < 0.5:
            interventions.append(Intervention(
                id=f"{sid}:revision_timetable",
                action="revision_timetable",
                why=f"Nearest exam '{ne.subject}' is in {ne.days_to_exam} days, but syllabus completion is only {ne.completion*100:.0f}%.",
                kind="academic",
                auto=True
            ))

    # 3. weak_topic: any subject trend[-1] < trend[-2]
    for s in student.subjects:
        if len(s.trend) >= 2 and s.trend[-1] < s.trend[-2]:
            interventions.append(Intervention(
                id=f"{sid}:weak_topic",
                action="weak_topic",
                why=f"Recent downward grade trend in '{s.name}' ({s.trend[-2]} -> {s.latest}).",
                kind="academic",
                auto=True
            ))

    # 4. revision_mission: for each retain.due_topics(state)
    due = due_topics(student)
    for topic_due in due:
        interventions.append(Intervention(
            id=f"{sid}:revision_mission",
            action="revision_mission",
            why=topic_due["why"],
            kind="academic",
            auto=True
        ))

    # 5. ramp_difficulty: goals_met_streak >= 7
    if student.goals_met_streak >= 7:
        interventions.append(Intervention(
            id=f"{sid}:ramp_difficulty",
            action="ramp_difficulty",
            why=f"Student is on a {student.goals_met_streak}-day goal completion streak.",
            kind="academic",
            auto=True
        ))

    # 6. git_nudge: days_since_commit >= 10
    if student.days_since_commit >= 10:
        interventions.append(Intervention(
            id=f"{sid}:git_nudge",
            action="git_nudge",
            why=f"No GitHub commits for {student.days_since_commit} days.",
            kind="career",
            auto=True
        ))

    # 7. linkedin_nudge: days_since_linkedin >= 14
    if student.days_since_linkedin >= 14:
        interventions.append(Intervention(
            id=f"{sid}:linkedin_nudge",
            action="linkedin_nudge",
            why=f"No LinkedIn activity for {student.days_since_linkedin} days.",
            kind="career",
            auto=True
        ))

    # 8. internship_match: internships has any match==1.0
    if internships_db is None:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "backend", "data", "internships.json")
        if not os.path.exists(db_path):
            db_path = os.path.join(base_dir, "data", "internships.json")
        if os.path.exists(db_path):
            try:
                with open(db_path, "r") as f:
                    internships_db = json.load(f)
            except Exception:
                internships_db = []
        else:
            internships_db = []
            
    matches = match_internships(student.skills, student.cgpa, internships_db)
    ready_matches = [m for m in matches if m.match == 1.0]
    for m in ready_matches:
        interventions.append(Intervention(
            id=f"{sid}:internship_match",
            action="internship_match",
            why=f"Eligible and ready for internship: {m.title} at {m.company}.",
            kind="career",
            auto=True
        ))

    # 9. flag_at_risk: risk_state level is High
    if risk_state.level == "High":
        interventions.append(Intervention(
            id=f"{sid}:flag_at_risk",
            action="flag_at_risk",
            why=f"Overall risk level is High ({risk_state.score}/100).",
            kind="academic",
            auto=False
        ))

    # 10. coding_nudge: coding last_active_days >= 7
    # coding_profile is a dict {handle -> {last_active_days, ...}} passed in by the caller.
    # If absent, nudge is skipped (no live fetch inside the deterministic core).
    if coding_profile is not None:
        coding_handles = getattr(student, "coding_handles", {}) or {}
        for platform, handle in coding_handles.items():
            prof = coding_profile.get(handle)
            if prof is not None:
                last_active = prof.get("last_active_days", -1)
                if isinstance(last_active, int) and last_active >= 7:
                    interventions.append(Intervention(
                        id=f"{sid}:coding_nudge:{platform}",
                        action="coding_nudge",
                        why=f"No {platform} coding activity for {last_active} days (handle: {handle}).",
                        kind="career",
                        auto=True
                    ))

    return interventions
