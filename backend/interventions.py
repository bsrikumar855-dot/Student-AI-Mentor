"""
Interventions Module: Trigger specific actions (e.g., peer tutoring, faculty alerts) based on deterministic threshold violations.
"""

import json
import os
from typing import List, Dict, Any, Optional
from backend.models import StudentState, Intervention, RiskResult, PolicyConfig
from backend.retain import due_topics
from backend.internships import match_internships
from backend.platform_links import PlatformLinkStore, resolve_active_handles
from backend import policy as policy_module

def evaluate_interventions(
    student: StudentState,
    risk_state: RiskResult,
    internships_db: Optional[List[Dict[str, Any]]] = None,
    derived_signals: Optional[Dict[str, Any]] = None,
    platform_links: Optional[PlatformLinkStore] = None,
    policy: Optional[PolicyConfig] = None,
) -> List[Intervention]:
    """
    Evaluates risk and student metrics against predefined rules to trigger interventions.
    """
    if policy is None:
        policy = policy_module.get_policy()

    interventions = []
    sid = student.student_id

    # 1. recovery_plan: days_since_active >= policy.days_since_active_threshold
    if student.days_since_active >= policy.days_since_active_threshold:
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

    # 6. git_nudge: THREE-STATE check on derived GitHub signal
    if derived_signals is not None and "github_activity" in derived_signals:
        github_val = derived_signals["github_activity"].get("value", -1)
        if github_val >= policy.github_inactivity_threshold:
            interventions.append(Intervention(
                id=f"{sid}:git_nudge",
                action="git_nudge",
                why=f"No GitHub commits for {github_val} days.",
                kind="career",
                auto=True
            ))

    # 7. linkedin_nudge: days_since_linkedin >= policy.days_since_linkedin_threshold
    if student.days_since_linkedin >= policy.days_since_linkedin_threshold:
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
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to load internships database: {e}")
                internships_db = []

        else:
            internships_db = []
            
    matches = match_internships(student.skills, student.cgpa, internships_db, policy=policy)
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

    # 10. coding_nudge: coding activity >= policy.coding_inactivity_threshold, gated on
    # active consent for that platform (revoked/expired links stop contributing even if
    # the cached derived signal is still stale-but-present).
    if derived_signals is not None and "coding_activity" in derived_signals:
        coding_val = derived_signals["coding_activity"].get("value", -1)
        platform = derived_signals["coding_activity"].get("source", "unknown")
        consent_ok = platform_links is None or platform in resolve_active_handles(platform_links, sid)
        if coding_val >= policy.coding_inactivity_threshold and consent_ok:
            interventions.append(Intervention(
                id=f"{sid}:coding_nudge:{platform}",
                action="coding_nudge",
                why=f"No {platform} coding activity for {coding_val} days.",
                kind="career",
                auto=True
            ))

    return interventions
