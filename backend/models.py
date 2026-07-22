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

class RiskResult(BaseModel):
    score: int
    level: Literal["Low", "Medium", "High"]
    reasons: List[str]
    components: RiskComponents
    computed_at: str

class ExamForecast(BaseModel):
    subject: str
    projected_score: float

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

class ChatRequest(BaseModel):
    student_id: str
    message: str
    history: List[Dict[str, Any]] = []
