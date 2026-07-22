from fastapi import FastAPI, HTTPException, UploadFile, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from backend.models import (
    StudentState, Plan, DailyTarget, ScheduleSlot, Intervention, 
    RiskResult, PredictionResult, InternshipMatch, TopicMemory
)
from backend.store import InMemoryStore
from backend.ingest import ingest_excel
from backend.risk import calculate_risk
from backend.predict import predict_trends
from backend.interventions import evaluate_interventions
from backend.language import phrase_intervention_message, chat_response
from backend.retain import due_topics, apply_sm2
from backend.internships import match_internships

app = FastAPI(
    title="Polaris API",
    description="Proactive AI student mentor backend services",
    version="1.0.0"
)

# Global in-memory store
store = InMemoryStore()

class ChatRequest(BaseModel):
    message: str
    student_id: str

class GradeRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5)

class ReviewRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|dismiss)$")

def get_highest_priority_action(interventions: List[Intervention]) -> Optional[str]:
    # Priority order: revision_timetable > recovery_plan > weak_topic > revision_mission > ramp_difficulty > career nudges
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

def generate_plan_for_student(student: StudentState) -> Plan:
    # 1. Recalculate risk & predictions
    risk_state = calculate_risk(student)
    student.risk = risk_state
    
    preds = predict_trends(student)
    student.predictions = preds
    
    # 2. Evaluate interventions
    active_interventions = evaluate_interventions(student, risk_state)
    
    # 3. Build Daily Targets based on active interventions
    daily_targets = []
    
    # Kind mapping rules:
    # revision_timetable -> review, weak_topic -> practice, recovery_plan -> recovery,
    # ramp_difficulty -> stretch, git/linkedin/internship -> career, generic/other -> academic
    if not active_interventions:
        daily_targets.append(DailyTarget(
            id="T_GEN",
            task="Complete today's general study plan",
            why="Maintain academic momentum.",
            kind="academic",
            done=False
        ))
    else:
        for idx, inter in enumerate(active_interventions):
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
    
    intervention_triggered = get_highest_priority_action(active_interventions)
    
    plan = Plan(
        student_id=student.student_id,
        intervention_triggered=intervention_triggered,
        message="",
        daily_targets=daily_targets,
        schedule=schedule,
        interventions=active_interventions,
        generated_at=datetime.now(timezone.utc).isoformat()
    )
    plan.message = phrase_intervention_message(student, plan)
    return plan


@app.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_cohort(file: UploadFile):
    try:
        students = ingest_excel(file.file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Excel file: {str(e)}"
        )
        
    for student in students:
        plan = generate_plan_for_student(student)
        store.save_student(student)
        store.save_plan(student.student_id, plan)
        
    return {"message": f"Successfully ingested {len(students)} students."}

@app.get("/students")
async def list_students():
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
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student

@app.get("/students/{student_id}/plan")
async def get_student_plan(student_id: str):
    plan = store.get_plan(student_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    return plan

@app.post("/students/{student_id}/plan/generate")
async def generate_student_plan(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    plan = generate_plan_for_student(student)
    store.save_student(student)
    store.save_plan(student_id, plan)
    return plan

@app.get("/students/{student_id}/predictions")
async def get_student_predictions(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student.predictions

@app.get("/students/{student_id}/internships")
async def get_student_internships(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    # Load internships db
    base_dir = os.path.dirname(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "backend", "data", "internships.json")
    if not os.path.exists(db_path):
        db_path = os.path.join(base_dir, "data", "internships.json")
    internships_db = []
    if os.path.exists(db_path):
        try:
            with open(db_path, "r") as f:
                internships_db = json.load(f)
        except Exception:
            pass
            
    return match_internships(student.skills, student.cgpa, internships_db)

@app.get("/students/{student_id}/reviews")
async def get_student_reviews(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return due_topics(student)

@app.post("/students/{student_id}/reviews/{topic}/grade")
async def grade_topic_review(student_id: str, topic: str, payload: GradeRequest):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    target_topic = None
    for t in student.topics:
        if t.topic.lower() == topic.lower():
            target_topic = t
            break
            
    if not target_topic:
        raise HTTPException(status_code=404, detail=f"Topic '{topic}' not found.")
        
    updated_topic = apply_sm2(target_topic, payload.quality)
    
    # Update topic in list
    for idx, t in enumerate(student.topics):
        if t.topic.lower() == topic.lower():
            student.topics[idx] = updated_topic
            break
            
    # Regenerate plan & save
    plan = generate_plan_for_student(student)
    store.save_student(student)
    store.save_plan(student_id, plan)
    
    return {"message": "Grade applied successfully.", "topic": updated_topic}

@app.post("/students/{student_id}/tasks/{task_id}/complete")
async def complete_student_task(student_id: str, task_id: str):
    student = store.get_student(student_id)
    plan = store.get_plan(student_id)
    if not student or not plan:
        raise HTTPException(status_code=404, detail="Student or Plan not found.")
        
    task_found = False
    for target in plan.daily_targets:
        if target.id == task_id:
            target.done = not target.done
            task_found = True
            break
            
    if not task_found:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    if plan.daily_targets and all(t.done for t in plan.daily_targets):
        student.goals_met_streak += 1
        
    store.save_student(student)
    store.save_plan(student_id, plan)
    return plan

@app.post("/interventions/{intervention_id}/review")
async def review_intervention(intervention_id: str, payload: ReviewRequest):
    # Find student ID by splitting prefix before first colon
    parts = intervention_id.split(":")
    if not parts:
        raise HTTPException(status_code=400, detail="Invalid intervention ID format.")
    student_id = parts[0]
    
    plan = store.get_plan(student_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found for student.")
        
    found_inter = None
    for inter in plan.interventions:
        if inter.id == intervention_id:
            found_inter = inter
            break
            
    if not found_inter:
        raise HTTPException(status_code=404, detail="Intervention not found in student plan.")
        
    if payload.decision == "approve":
        found_inter.reviewed = True
    elif payload.decision == "dismiss":
        # Simply mark reviewed as True or remove
        found_inter.reviewed = True
        
    store.save_plan(student_id, plan)
    return {"message": "Intervention reviewed successfully.", "intervention": found_inter}

@app.post("/chat")
async def chat_endpoint(payload: ChatRequest):
    reply = chat_response(payload.message, [])
    return {"reply": reply}
