from fastapi import FastAPI, HTTPException, UploadFile, status, APIRouter, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json
import os

from backend.models import (
    StudentState, Plan,
    RiskResult, PredictionResult, InternshipMatch, TopicMemory, ChatRequest,
    GradeRequest, ReviewRequest
)
from backend.store import InMemoryStore
from backend.ingest import ingest_excel
from backend.risk import calculate_risk
from backend.predict import predict_trends
from backend.interventions import evaluate_interventions
from backend.plan import build_plan
from backend.language import phrase_intervention_message, chat_response
from backend.retain import due_topics, apply_sm2
from backend.internships import match_internships
from backend.coding import get_codeforces

app = FastAPI(
    title="Drishta API",
    description="Proactive AI student mentor backend services",
    version="1.0.0"
)

router = APIRouter(prefix="/api/v1")
store = InMemoryStore(persist_path=os.environ.get("POLARIS_PERSIST_PATH"))



def generate_plan_for_student(student: StudentState) -> Plan:
    derived_signals = store.get_derived(student.student_id)
    
    risk_state = calculate_risk(student, derived_signals)
    student.risk = risk_state
    student.predictions = predict_trends(student)

    active_interventions = evaluate_interventions(
        student, risk_state, derived_signals=derived_signals
    )
    plan = build_plan(student, risk_state, active_interventions)
    plan.message = phrase_intervention_message(student, plan)
    
    # Write DecisionTrace
    trace_id = f"trace_{student.student_id}_{int(datetime.now(timezone.utc).timestamp())}"
    store.append_trace({
        "id": trace_id,
        "tenant_id": "default",
        "student_id": student.student_id,
        "decision_type": "plan_generation",
        "input_snapshot_ids": [],
        "config_version": "v1",
        "model_version": "v1",
        "output": plan.model_dump(mode="json"),
        "confidence": 1.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return plan

@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_cohort(file: UploadFile):
    try:
        students, ingest_skipped = ingest_excel(file.file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Excel file: {str(e)}"
        )

    ingested_ids = []
    duplicate_skipped = []

    for student in students:
        # Check idempotency on student_id
        if store.get_student(student.student_id) is not None:
            duplicate_skipped.append(student.student_id)
            continue

        plan = generate_plan_for_student(student)
        store.save_student(student)
        store.save_plan(student.student_id, plan)
        ingested_ids.append(student.student_id)

    return {
        "ingested": len(ingested_ids),
        "student_ids": ingested_ids,
        "skipped": ingest_skipped + [
            {"student_id": sid, "reason": "duplicate: already ingested"}
            for sid in duplicate_skipped
        ]
    }

@router.get("/students")
async def list_students(
    band: Optional[str] = Query(None, regex="^(Low|Medium|High)$"),
    sort: Optional[str] = Query(None, regex="^(risk_desc)$"),
    limit: Optional[int] = Query(None, ge=1),
    offset: Optional[int] = Query(0, ge=0)
):
    students = store.list_students()
    result = []
    
    for s in students:
        if s.risk:
            # Filter by band
            if band and s.risk.level != band:
                continue
            
            result.append({
                "student_id": s.student_id,
                "name": s.name,
                "risk": {
                    "level": s.risk.level,
                    "score": s.risk.score,
                    "reasons": s.risk.reasons
                }
            })
            
    # Sort
    if sort == "risk_desc":
        result.sort(key=lambda x: x["risk"]["score"], reverse=True)
        
    # Offset & limit
    if offset:
        result = result[offset:]
    if limit:
        result = result[:limit]
        
    return result

@router.get("/students/{student_id}/state")
async def get_student_state(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student

@router.get("/students/{student_id}/plan")
async def get_student_plan(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    plan = store.get_plan(student_id)
    if not plan:
        raise HTTPException(status_code=409, detail="Plan not found for student.")
    return plan

@router.post("/students/{student_id}/plan/generate")
async def generate_student_plan(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    plan = generate_plan_for_student(student)
    store.save_student(student)
    store.save_plan(student_id, plan)
    
    # Audit log entry
    store.audit_log.append({
        "action": "plan_generate",
        "student_id": student_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return plan

@router.get("/students/{student_id}/predictions")
async def get_student_predictions(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student.predictions

@router.get("/students/{student_id}/internships")
async def get_student_internships(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
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

@router.get("/students/{student_id}/coding")
async def get_student_coding(student_id: str):
    """Return a Codeforces coding profile for the student.
    Falls back to seed/cached data when offline — never 500.
    """
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    cf_handle = (student.coding_handles or {}).get("codeforces")
    if not cf_handle:
        return {"codeforces": None, "note": "No Codeforces handle registered for this student."}

    profile = get_codeforces(cf_handle)
    return {"codeforces": profile}

@router.get("/students/{student_id}/reviews")
async def get_student_reviews(student_id: str, due: Optional[str] = Query(None, regex="^(today|all)$")):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    all_due = due_topics(student)
    
    if due == "today":
        today_dt = datetime.now()
        # Filter down by next review <= today
        # Note: retain.due_topics output dictionary has 'next_review' key as datetime
        filtered = [t for t in all_due if t["next_review"].replace(tzinfo=None) <= today_dt.replace(tzinfo=None)]
        return filtered
        
    return all_due

@router.post("/students/{student_id}/reviews/{topic}/grade")
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
    
    for idx, t in enumerate(student.topics):
        if t.topic.lower() == topic.lower():
            student.topics[idx] = updated_topic
            break
            
    plan = generate_plan_for_student(student)
    store.save_student(student)
    store.save_plan(student_id, plan)
    
    return updated_topic

@router.post("/students/{student_id}/tasks/{task_id}/complete")
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
    return {
        "student_id": student_id,
        "task_id": task_id,
        "done": any(t.done for t in plan.daily_targets if t.id == task_id),
        "goals_met_streak": student.goals_met_streak
    }

@router.post("/interventions/{intervention_id}/review")
async def review_intervention(intervention_id: str, payload: ReviewRequest):
    parts = intervention_id.split(":")
    if len(parts) < 2:
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
        
    # Validate auto: false intervention review constraint
    if found_inter.auto:
        raise HTTPException(status_code=400, detail="Only human-in-the-loop (auto: false) interventions can be reviewed.")
        
    found_inter.reviewed = True
    
    store.save_plan(student_id, plan)
    
    store.audit_log.append({
        "action": "intervention_review",
        "intervention_id": intervention_id,
        "decision": payload.decision,
        "note": payload.note,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "intervention_id": intervention_id,
        "status": "reviewed",
        "reviewed_by": "faculty",
        "at": datetime.now(timezone.utc).isoformat()
    }

@router.post("/chat")
async def chat_endpoint(payload: ChatRequest):
    reply, used_llm = chat_response(payload.message, payload.history)
    return {"reply": reply, "used_llm": used_llm}


app.include_router(router)