"""
Plan Assembly Module: Assemble a Plan (daily targets, schedule, triggered intervention) from
a student's risk result and active interventions. Deterministic core -- no LLM or language-layer
imports. The `message` field is left empty here; the language layer fills it at the endpoint.
"""

from typing import List, Optional
from datetime import datetime, timezone
from backend.models import StudentState, Plan, DailyTarget, ScheduleSlot, Intervention, RiskResult

def get_highest_priority_action(interventions: List[Intervention]) -> Optional[str]:
    priority = [
        "revision_timetable",
        "recovery_plan",
        "weak_topic",
        "revision_mission",
        "ramp_difficulty",
        "git_nudge",
        "linkedin_nudge",
        "internship_match"
    ]
    auto_actions = [i.action for i in interventions if i.auto]
    for p in priority:
        if p in auto_actions:
            return p
    return None

def build_plan(
    student: StudentState,
    risk: RiskResult,
    interventions: List[Intervention],
) -> Plan:
    """
    Assembles and returns a Plan for the given student from the already-computed risk
    result and active interventions. Does not compute risk, predictions, or interventions
    itself, and does not set `message`.
    """
    daily_targets = []
    if not interventions:
        daily_targets.append(DailyTarget(
            id="T_GEN",
            task="Complete today's general study plan",
            why="Maintain academic momentum.",
            kind="academic",
            done=False
        ))
    else:
        for idx, inter in enumerate(interventions):
            task_desc = f"Address {inter.action}"

            if inter.action == "recovery_plan":
                task_desc = "Log in to LMS and check active assignments"
                kind = "recovery"
            elif inter.action == "revision_timetable":
                task_desc = f"Complete practice problems for nearest exam in {student.nearest_exam.subject if student.nearest_exam else ''}"
                kind = "review"
            elif inter.action == "weak_topic":
                task_desc = "Review lecture slides for weaker grade subjects"
                kind = "practice"
            elif inter.action == "revision_mission":
                task_desc = f"Complete spaced repetition review card"
                kind = "review"
            elif inter.action == "ramp_difficulty":
                task_desc = "Solve advanced textbook challenge problems"
                kind = "stretch"
            elif inter.action == "git_nudge":
                task_desc = "Commit and push current codebase updates to GitHub"
                kind = "career"
            elif inter.action == "linkedin_nudge":
                task_desc = "Post or interact on LinkedIn to build career network"
                kind = "career"
            elif inter.action == "internship_match":
                task_desc = "Review job posting and submit resume application"
                kind = "career"
            else:
                kind = "academic"

            daily_targets.append(DailyTarget(
                id=f"T_{idx+1}",
                task=task_desc,
                why=inter.why,
                kind=kind,
                done=False
            ))

    schedule = [
        ScheduleSlot(slot="09:00 - 10:30", task="Core Study Session"),
        ScheduleSlot(slot="14:00 - 15:30", task="Active Practice & Revision")
    ]

    intervention_triggered = get_highest_priority_action(interventions)

    return Plan(
        student_id=student.student_id,
        intervention_triggered=intervention_triggered,
        message="",
        daily_targets=daily_targets,
        schedule=schedule,
        interventions=interventions,
        generated_at=datetime.now(timezone.utc).isoformat()
    )