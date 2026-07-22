from fastapi import FastAPI, HTTPException, UploadFile, status, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from backend.models import StudentState, Plan, DailyTarget, ScheduleSlot, Intervention
from backend.store import InMemoryStore
from backend.ingest import ingest_excel
from backend.risk import calculate_risk
from backend.predict import predict_trends
from backend.interventions import evaluate_interventions
from backend.language import phrase_intervention_message, chat_response

app = FastAPI(
    title="Polaris API",
    description="Proactive AI student mentor backend services",
    version="1.0.0"
)

# Global in-memory store instance
store = InMemoryStore()

class ChatRequest(BaseModel):
    message: str
    student_id: str

def generate_plan_for_student(student: StudentState) -> Plan:
    # 1. Compute risk
    risk_state = calculate_risk(student)
    student.risk = risk_state
    
    # 2. Compute predictions
    preds = predict_trends(student)
    student.predictions = preds
    
    # 3. Evaluate interventions
    active_interventions = evaluate_interventions(student, risk_state)
    
    # 4. Generate daily targets based on active interventions
    daily_targets = []
    
    # If no interventions, add a general study goal
    if not active_interventions:
        daily_targets.append(DailyTarget(
            id="T_GEN",
            task="Complete today's general study plan",
            why="Maintain academic momentum.",
            kind="general",
            done=False
        ))
    else:
        for idx, inter in enumerate(active_interventions):
            task_desc = f"Address {inter.action}"
            kind = inter.kind
            
            if inter.action == "recovery_plan":
                task_desc = "Log in to LMS and check active assignments"
            elif inter.action == "revision_timetable":
                task_desc = f"Complete practice problems for nearest exam in {student.nearest_exam.subject if student.nearest_exam else ''}"
            elif inter.action == "weak_topic":
                task_desc = "Review lecture slides for weaker grade subjects"
            elif inter.action == "revision_mission":
                task_desc = f"Complete spaced repetition review card"
            elif inter.action == "ramp_difficulty":
                task_desc = "Solve advanced textbook challenge problems"
            elif inter.action == "git_nudge":
                task_desc = "Commit and push current codebase updates to GitHub"
            elif inter.action == "linkedin_nudge":
                task_desc = "Post or interact on LinkedIn to build career network"
            elif inter.action == "internship_match":
                task_desc = "Review job posting and submit resume application"
                
            daily_targets.append(DailyTarget(
                id=f"T_{idx+1}",
                task=task_desc,
                why=inter.why,
                kind=kind,
                done=False
            ))
            
    # 5. Build schedule
    schedule = [
        ScheduleSlot(slot="09:00 - 10:30", task="Core Study Session"),
        ScheduleSlot(slot="14:00 - 15:30", task="Active Practice & Revision")
    ]
    
    # 6. Determine primary intervention triggered
    intervention_triggered = active_interventions[0].action if active_interventions else None
    
    # 7. Build plan object
    plan = Plan(
        student_id=student.student_id,
        intervention_triggered=intervention_triggered,
        message="",
        daily_targets=daily_targets,
        schedule=schedule,
        interventions=active_interventions
    )
    
    # Generate rephrased warm message
    plan.message = phrase_intervention_message(student, plan)
    return plan


@app.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_cohort(file: UploadFile):
    """
    Uploads an LMS Excel spreadsheet, ingests student data, computes risk/predictions,
    generates their daily plans, and stores everything.
    """
    try:
        students = ingest_excel(file.file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Excel file: {str(e)}"
        )
        
    for student in students:
        # Generate plan and populate risk/predictions
        plan = generate_plan_for_student(student)
        
        # Save to store
        store.save_student(student)
        store.save_plan(student.student_id, plan)
        
    return {"message": f"Successfully ingested {len(students)} students."}

@app.get("/students")
async def list_students():
    """
    Retrieves the list of students with basic info: id, name, risk status.
    """
    students = store.list_students()
    result = []
    for s in students:
        result.append({
            "student_id": s.student_id,
            "name": s.name,
            "risk": s.risk
        })
    return result

@app.get("/students/{student_id}/state")
async def get_student_state(student_id: str):
    """
    Retrieves the complete StudentState for the specified student.
    """
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found."
        )
    return student

@app.get("/students/{student_id}/plan")
async def get_student_plan(student_id: str):
    """
    Retrieves the academic risk status, active interventions, and daily targets (Plan) for a student.
    """
    plan = store.get_plan(student_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan for student {student_id} not found."
        )
    return plan

@app.post("/students/{student_id}/tasks/{task_id}/complete")
async def complete_task(student_id: str, task_id: str):
    """
    Toggles a specific task in the daily targets as completed, and increments streak if all daily tasks are done.
    """
    student = store.get_student(student_id)
    plan = store.get_plan(student_id)
    if not student or not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student or Plan not found."
        )
        
    task_found = False
    for target in plan.daily_targets:
        if target.id == task_id:
            target.done = not target.done
            task_found = True
            break
            
    if not task_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found in daily targets."
        )
        
    # If all tasks are completed, increment streak
    if plan.daily_targets and all(t.done for t in plan.daily_targets):
        student.goals_met_streak += 1
    
    # Save back
    store.save_student(student)
    store.save_plan(student_id, plan)
    
    return plan

@app.post("/chat")
async def chat_interaction(payload: ChatRequest):
    """
    Sends a chat message to the Polaris mentor agent.
    """
    reply = chat_response(payload.message, [])
    return {"reply": reply}
