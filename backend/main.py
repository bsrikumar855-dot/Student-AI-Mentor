from fastapi import FastAPI, HTTPException, UploadFile, status, APIRouter, Query, Security, Depends, Header
from fastapi.security import APIKeyHeader
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json
import os
import logging
import io
from dotenv import load_dotenv

load_dotenv()

from backend.models import (
    StudentState, Plan,
    RiskResult, PredictionResult, InternshipMatch, TopicMemory, ChatRequest,
    GradeRequest, ReviewRequest, PlanDecisionTrace, PlanExplanation
)
from backend.store import InMemoryStore
from backend.platform_links import PlatformLinkStore, synthesize_consent_from_handles, resolve_active_handles
from backend.policy import get_policy
from backend.ingest import ingest_excel
from backend.risk import calculate_risk
from backend.predict import predict_trends
from backend.interventions import evaluate_interventions
from backend.plan import build_plan
from backend.language import phrase_intervention_message, chat_response
from backend.retain import due_topics, apply_sm2
from backend.internships import match_internships
from backend.coding import get_codeforces
from backend.rate_limit import chat_limiter, ingest_limiter, api_limiter

from fastapi.middleware.cors import CORSMiddleware

# Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("drishta")

app = FastAPI(
    title="Drishta API",
    description="Proactive AI student mentor backend services",
    version="1.0.0"
)

# CORS Setup
cors_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS", "")
if cors_origins_env:
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication & RBAC Setup
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(api_key: Optional[str] = Depends(api_key_header)):
    expected_key = os.environ.get("DRISHTA_API_KEY", "drishta_secret_key")
    if not api_key or api_key != expected_key:
        logger.warning("Authentication failed or key missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return api_key

# ROLE-BASED ACCESS CONTROL (RBAC) GATING MATRIX:
# - POST /api/v1/interventions/{id}/review   : Mentor/Faculty/Admin Only (Enforced via require_role)
# - POST /api/v1/ingest                      : Mentor/Faculty/Admin Only (Enforced via require_role)
# - POST /api/v1/students/{id}/plan/generate  : Student (self) or Mentor/Faculty/Admin (Enforced via require_role + ownership)
# - POST /api/v1/students/{id}/tasks/{id}/complete: Student (self) or Mentor/Faculty/Admin (Enforced via require_role + ownership)
# - POST /api/v1/students/{id}/reviews/{topic}/grade: Student (self) or Mentor/Faculty/Admin (Enforced via require_role + ownership)
# - POST /api/v1/chat                        : Student (self) or Mentor/Faculty/Admin (Enforced via require_role + ownership)
# - POST /api/v1/demo/drift-hero             : Mentor/Faculty/Admin Only (Enforced via require_role)
# - POST /api/v1/demo/reset                  : Mentor/Faculty/Admin Only (Enforced via require_role)

def require_role(allowed_roles: List[str]):
    def role_checker(x_user_role: Optional[str] = Header(None, alias="X-User-Role")):
        if not x_user_role or not x_user_role.strip():
            logger.warning("Role access denied: Missing X-User-Role header")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Missing X-User-Role header."
            )
        role = x_user_role.strip().lower()
        allowed = [r.strip().lower() for r in allowed_roles]
        if role not in allowed:
            logger.warning(f"Role access denied: role '{role}' not in allowed roles {allowed}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{role}' is not authorized for this endpoint (requires one of {allowed_roles})."
            )
        return role
    return role_checker

def verify_student_ownership(
    target_student_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Verifies student ownership for student-callable endpoints.
    Mentors, faculty, and admins can access any student's data.
    Students are restricted to modifying their own student_id matching X-User-Id header.
    """
    role = (x_user_role or "").strip().lower()
    if role in ("mentor", "faculty", "admin"):
        return
    if role == "student":
        caller_id = (x_user_id or "").strip()
        if not caller_id:
            logger.warning(f"Student ownership violation: Missing X-User-Id header for student target '{target_student_id}'")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Student requests must provide X-User-Id header for ownership verification."
            )
        if caller_id != target_student_id:
            logger.warning(f"Student ownership violation: caller '{caller_id}' attempted to access '{target_student_id}'")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Students are only permitted to access their own data."
            )

def check_demo_allowed():
    if not os.environ.get("ALLOW_DEMO_ENDPOINTS", "true").lower() == "true":
        logger.warning("Access to demo endpoint denied (disabled in env)")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo endpoints are disabled in this environment."
        )

# Router configuration with global API Key authentication and general API rate limiting
router = APIRouter(prefix="/api/v1", dependencies=[Depends(verify_api_key), Depends(api_limiter)])
store = InMemoryStore(persist_path=os.environ.get("POLARIS_PERSIST_PATH"))
platform_links = PlatformLinkStore()


def get_or_calculate_student_risk(student: StudentState) -> RiskResult:
    """
    Refactored shared helper function to compute deterministic risk score and explanation.
    Guarantees strict parity across /state, /risk, chat context, and feedback loops.
    """
    derived_signals = store.get_derived(student.student_id)
    risk_state = calculate_risk(student, derived_signals)
    student.risk = risk_state
    return risk_state


def generate_plan_for_student(student: StudentState) -> Plan:
    derived_signals = store.get_derived(student.student_id)

    risk_state = get_or_calculate_student_risk(student)
    student.predictions = predict_trends(student)

    active_interventions = evaluate_interventions(
        student, risk_state, derived_signals=derived_signals, platform_links=platform_links
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

    store.add_plan_trace(PlanDecisionTrace(
        student_id=student.student_id,
        decision_type="plan",
        explanation=PlanExplanation(
            summary=f"{len(active_interventions)} interventions, risk={risk_state.level}",
            factors=list(risk_state.reasons),
            config_version=get_policy().version,
        ),
        computed_at=datetime.now(timezone.utc).isoformat(),
    ))

    return plan

@router.post("/ingest", status_code=status.HTTP_201_CREATED, dependencies=[Depends(ingest_limiter), Depends(require_role(["mentor", "faculty", "admin"]))])
async def ingest_cohort(file: UploadFile):
    # Enforce size limit (max 10MB)
    content_length = file.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:
        logger.warning(f"File size exceeded content-length check: {content_length} bytes")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10MB."
        )
    
    max_size = 10 * 1024 * 1024
    size = 0
    content = bytearray()
    while True:
        chunk = await file.read(65536)
        if not chunk:
            break
        size += len(chunk)
        if size > max_size:
            logger.warning(f"File size exceeded chunk-reading check: {size} bytes")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large. Maximum size is 10MB."
            )
        content.extend(chunk)

    try:
        students, ingest_skipped = ingest_excel(io.BytesIO(content))
    except Exception as e:
        logger.exception("Failed to parse Excel file during ingestion")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Excel file: {str(e)}"
        )

    ingested_ids = []
    duplicate_skipped = []

    for student in students:
        if store.get_student(student.student_id) is not None:
            duplicate_skipped.append(student.student_id)
            continue

        synthesize_consent_from_handles(platform_links, student)
        plan = generate_plan_for_student(student)
        store.save_student(student)
        store.save_plan(student.student_id, plan)
        ingested_ids.append(student.student_id)

    logger.info(f"Ingested {len(ingested_ids)} students successfully")
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
    band: Optional[str] = Query(None, pattern="^(Low|Medium|High)$"),
    sort: Optional[str] = Query(None, pattern="^(risk_desc)$"),
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
    get_or_calculate_student_risk(student)
    return student

@router.get("/students/{student_id}/risk")
async def get_student_risk(student_id: str):
    """
    Return standalone risk score and detailed explanation for a student.
    Uses the exact same underlying get_or_calculate_student_risk logic as /state.
    """
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    risk = get_or_calculate_student_risk(student)
    store.save_student(student)
    return {
        "student_id": student.student_id,
        "score": risk.score,
        "level": risk.level,
        "reasons": risk.reasons,
        "components": risk.components,
        "computed_at": risk.computed_at,
        "explanation": risk.explanation
    }

@router.get("/students/{student_id}/plan")
async def get_student_plan(student_id: str):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    plan = store.get_plan(student_id)
    if not plan:
        raise HTTPException(status_code=409, detail="Plan not found for student.")
    return plan

@router.post("/students/{student_id}/plan/generate", dependencies=[Depends(require_role(["student", "mentor", "faculty", "admin"]))])
async def generate_student_plan(
    student_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    verify_student_ownership(student_id, x_user_role, x_user_id)
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
            logger.exception("Failed to load internships json file")
            
    return match_internships(student.skills, student.cgpa, internships_db)

@router.get("/students/{student_id}/coding")
async def get_student_coding(student_id: str):
    """Return a Codeforces coding profile for the student.
    Falls back to seed/cached data when offline — never 500.
    """
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    cf_handle = resolve_active_handles(platform_links, student_id).get("codeforces")
    if not cf_handle:
        return {"codeforces": None, "note": "No Codeforces handle registered for this student."}

    profile = get_codeforces(cf_handle)
    return {"codeforces": profile}

@router.get("/students/{student_id}/reviews")
async def get_student_reviews(student_id: str, due: Optional[str] = Query(None, pattern="^(today|all)$")):
    student = store.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    all_due = due_topics(student)
    
    if due == "today":
        today_dt = datetime.now()
        filtered = [t for t in all_due if t["next_review"].replace(tzinfo=None) <= today_dt.replace(tzinfo=None)]
        return filtered
        
    return all_due

@router.post("/students/{student_id}/reviews/{topic}/grade", dependencies=[Depends(require_role(["student", "mentor", "faculty", "admin"]))])
async def grade_topic_review(
    student_id: str,
    topic: str,
    payload: GradeRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    verify_student_ownership(student_id, x_user_role, x_user_id)
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

@router.post("/students/{student_id}/tasks/{task_id}/complete", dependencies=[Depends(require_role(["student", "mentor", "faculty", "admin"]))])
async def complete_student_task(
    student_id: str,
    task_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Marks a study task as complete/incomplete.
    FEEDBACK LOOP: Completing a task updates activity recency (days_since_active = 0)
    and triggers automatic risk score recalculation and trend re-prediction.
    """
    verify_student_ownership(student_id, x_user_role, x_user_id)
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

    # Plan -> task -> re-score feedback loop:
    student.days_since_active = 0
    updated_risk = get_or_calculate_student_risk(student)
    student.predictions = predict_trends(student)
        
    store.save_student(student)
    store.save_plan(student_id, plan)
    return {
        "student_id": student_id,
        "task_id": task_id,
        "done": any(t.done for t in plan.daily_targets if t.id == task_id),
        "goals_met_streak": student.goals_met_streak,
        "risk_score": updated_risk.score,
        "risk_level": updated_risk.level
    }

@router.post("/interventions/{intervention_id}/review", dependencies=[Depends(require_role(["mentor", "faculty", "admin"]))])
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

@router.post("/chat", dependencies=[Depends(chat_limiter), Depends(require_role(["student", "mentor", "faculty", "admin"]))])
async def chat_endpoint(
    payload: ChatRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    verify_student_ownership(payload.student_id, x_user_role, x_user_id)
    student = store.get_student(payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    plan = store.get_plan(payload.student_id)
    get_or_calculate_student_risk(student)

    # Context passed into chat: student state (name, risk level/score/reasons), nearest exam, active daily targets & interventions
    reply, used_llm = chat_response(payload.message, payload.history, student=student, plan=plan)
    return {"reply": reply, "used_llm": used_llm}

@router.post("/demo/drift-hero", dependencies=[Depends(require_role(["mentor", "faculty", "admin"]))])
async def demo_drift_hero():
    check_demo_allowed()
    student = store.get_student("STU_HERO")
    if not student:
        raise HTTPException(status_code=404, detail="Student STU_HERO not found.")
    
    student.days_since_active = 8
    if student.nearest_exam:
        student.nearest_exam.days_to_exam = 5
        student.nearest_exam.completion = 0.45
    if student.exams:
        student.exams[0].days_to_exam = 5
        
    from backend.collector import run_collection
    run_collection(store)
    
    plan = generate_plan_for_student(student)
    store.save_student(student)
    store.save_plan("STU_HERO", plan)
    if getattr(store, "persist_path", None) and store.persist_path.endswith(".json"):
        store.dump_json(store.persist_path)
    return {"success": True}

@router.post("/demo/reset", dependencies=[Depends(require_role(["mentor", "faculty", "admin"]))])
async def demo_reset():
    check_demo_allowed()
    # Reset store
    store.reset()
    
    cohort_path = os.path.join(os.path.dirname(__file__), "data", "cohort.xlsx")
    if not os.path.exists(cohort_path):
        cohort_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "data", "cohort.xlsx")
        
    with open(cohort_path, "rb") as f:
        from backend.ingest import ingest_excel
        students, _ = ingest_excel(f)
        
    for student in students:
        store.save_student(student)
        
    from backend.collector import run_collection
    run_collection(store)
    
    for student in students:
        plan = generate_plan_for_student(student)
        store.save_plan(student.student_id, plan)
        
    if getattr(store, "persist_path", None) and store.persist_path.endswith(".json"):
        store.dump_json(store.persist_path)
    return {"success": True}

@router.get("/interventions")
async def list_interventions():
    result = []
    for student in store.list_students():
        derived_signals = store.get_derived(student.student_id)
        risk_state = student.risk
        if not risk_state:
            risk_state = calculate_risk(student, derived_signals)
            student.risk = risk_state
            
        active_interventions = evaluate_interventions(
            student, risk_state, derived_signals=derived_signals
        )
        plan = store.get_plan(student.student_id)
        for intervention in active_interventions:
            status = "pending" if not intervention.auto else "auto_sent"
            approved = False
            if plan:
                for plan_inter in plan.interventions:
                    if plan_inter.id == intervention.id:
                        approved = plan_inter.reviewed
                        break
            result.append({
                "id": intervention.id,
                "student_id": student.student_id,
                "student_name": student.name,
                "action": intervention.action,
                "why": intervention.why,
                "kind": intervention.kind,
                "auto": intervention.auto,
                "status": status,
                "approved": approved
            })
    return result

@app.on_event("startup")
async def startup_event():
    if not store.list_students():
        cohort_path = os.path.join(os.path.dirname(__file__), "data", "cohort.xlsx")
        if not os.path.exists(cohort_path):
            cohort_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "data", "cohort.xlsx")
        if os.path.exists(cohort_path):
            try:
                with open(cohort_path, "rb") as f:
                    students, _ = ingest_excel(f)
                for student in students:
                    store.save_student(student)
                
                from backend.collector import run_collection
                run_collection(store)
                
                for student in students:
                    plan = generate_plan_for_student(student)
                    store.save_plan(student.student_id, plan)
                
                if getattr(store, "persist_path", None):
                    store.dump_json(store.persist_path)
            except Exception as e:
                logger.warning(f"Failed to auto-ingest cohort: {e}")

app.include_router(router)
