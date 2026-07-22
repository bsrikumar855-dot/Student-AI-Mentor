from typing import List, Optional, Dict, Any
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
    risk: Optional[Dict[str, Any]] = None
    predictions: Optional[Dict[str, Any]] = None

class DailyTarget(BaseModel):
    id: str
    task: str
    why: str
    kind: str
    done: bool

class ScheduleSlot(BaseModel):
    slot: str
    task: str

class Intervention(BaseModel):
    action: str
    why: str
    kind: str
    auto: bool

class Plan(BaseModel):
    student_id: str
    intervention_triggered: Optional[str] = None
    message: str
    daily_targets: List[DailyTarget]
    schedule: List[ScheduleSlot]
    interventions: List[Intervention]
