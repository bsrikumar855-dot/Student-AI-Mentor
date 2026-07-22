"""
Data Store Module: In-memory storage for active student states, tasks, and completion streaks.
"""

from typing import Dict, Optional, List, Any
from backend.models import StudentState, Plan

class InMemoryStore:
    """
    Manages in-memory data storage for students and study plans, and tracks an audit log.
    """
    def __init__(self) -> None:
        self._students: Dict[str, StudentState] = {}
        self._plans: Dict[str, Plan] = {}
        self.audit_log: List[Dict[str, Any]] = []

    def save_student(self, student: StudentState) -> None:
        self._students[student.student_id] = student

    def get_student(self, student_id: str) -> Optional[StudentState]:
        return self._students.get(student_id)

    def list_students(self) -> List[StudentState]:
        return list(self._students.values())

    def save_plan(self, student_id: str, plan: Plan) -> None:
        self._plans[student_id] = plan

    def get_plan(self, student_id: str) -> Optional[Plan]:
        return self._plans.get(student_id)
