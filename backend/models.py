from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field

class Subject(BaseModel):
    name: str
    latest: float
    trend: List[float]
    flag: Optional[str] = None

class Exam(BaseModel):
    subject: str
    date: datetime
    days_to_exam: int
    completion: float = Field(..., ge=0.0, le=1.0)

class TopicMemory(BaseModel):
    topic: str
    learned_on: datetime
    ef: float
    reps: int
    interval: int
    next_review: datetime

class RiskComponents(BaseModel):
    score_gap: float
    syllabus_behind: float
    activity_recency: float
    trend: float
    coding_activity: float

class FeatureContribution(BaseModel):
    name: str
    value: float
    weight: float
    contribution: float
    detail: str

class Explanation(BaseModel):
    summary: str
    contributions: List[FeatureContribution]

class RiskResult(BaseModel):
    score: int
    level: Literal["Low", "Medium", "High"]
    reasons: List[str]
    components: RiskComponents
    computed_at: str
    explanation: Optional[Explanation] = None
    confidence: float = 1.0

class DerivedSignal(BaseModel):
    student_id: str
    name: str
    value: Any
    source: str
    fetched_at: str
    ttl: Optional[int] = None
    status: str
    confidence: float
    version: str

class DecisionTrace(BaseModel):
    id: str
    tenant_id: str = "default"
    student_id: str
    decision_type: str
    input_snapshot_ids: List[str]
    config_version: str
    model_version: str
    output: Dict[str, Any]
    confidence: float
    created_at: str

class CodingProfileSnapshot(BaseModel):
    handle: str
    platform: str
    rating: Optional[int] = None
    solved_count: Optional[int] = None
    last_active_days: Optional[int] = None
    fetched_at: str
    source: str

class ExamForecast(BaseModel):
    subject: str
    projected_score: float
    fail_risk: Literal["Low", "Medium", "High"]
    why: str

class PredictionResult(BaseModel):
    projected_gpa: float
    exam_trend: Literal["improving", "declining", "stable"]
    exam_forecast: List[ExamForecast]
    computed_at: str

class StudentState(BaseModel):
    student_id: str
    name: str
    cgpa: float
    attendance: float = Field(..., ge=0.0, le=1.0)
    subjects: List[Subject]
    exams: List[Exam]
    nearest_exam: Optional[Exam] = None
    days_since_active: int
    days_since_commit: int
    days_since_linkedin: int
    goals_met_streak: int
    topics: List[TopicMemory]
    skills: List[str]
    coding_handles: Dict[str, str] = {}
    risk: Optional[RiskResult] = None
    predictions: Optional[PredictionResult] = None

class DailyTarget(BaseModel):
    id: str
    task: str
    why: str
    kind: Literal["review", "practice", "academic", "career", "recovery", "stretch"]
    done: bool

class ScheduleSlot(BaseModel):
    slot: str
    task: str

class Intervention(BaseModel):
    id: str
    action: str
    why: str
    kind: Literal["academic", "career", "recovery", "wellness"]
    auto: bool
    reviewed: bool = False

class Plan(BaseModel):
    student_id: str
    intervention_triggered: Optional[str] = None
    message: str
    daily_targets: List[DailyTarget]
    schedule: List[ScheduleSlot]
    interventions: List[Intervention]
    generated_at: str

class InternshipMatch(BaseModel):
    title: str
    company: str
    match: float
    have: List[str]
    missing: List[str]
    why: str

class PlanExplanation(BaseModel):
    summary: str
    factors: List[str] = []
    config_version: Optional[str] = None

class PlanDecisionTrace(BaseModel):
    student_id: str
    decision_type: Literal["risk", "prediction", "intervention", "plan", "internship_match"]
    explanation: PlanExplanation
    computed_at: str

class PlatformLink(BaseModel):
    student_id: str
    tenant_id: str = "default"
    platform: str
    handle: str
    consent_at: datetime
    valid_from: datetime
    valid_to: Optional[datetime] = None
    revoked_at: Optional[datetime] = None

class PolicyConfig(BaseModel):
    version: str
    days_since_active_threshold: int = 5
    github_inactivity_threshold: int = 10
    days_since_linkedin_threshold: int = 14
    coding_inactivity_threshold: int = 7
    internship_match_min: float = 0.5
    risk_activity_divisor: float = 7.0
    risk_weights: Dict[str, float] = {
        "score_gap": 0.34, "syllabus_behind": 0.25,
        "activity_recency": 0.25, "trend": 0.15, "coding_activity": 0.01,
    }

class ChatRequest(BaseModel):
    student_id: str
    message: str
    history: List[Dict[str, Any]] = []

class GradeRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5)

class ReviewRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|override)$")
    note: Optional[str] = None
