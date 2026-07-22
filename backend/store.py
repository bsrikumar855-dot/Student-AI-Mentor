"""
Data Store Module: In-memory storage for active student states, tasks, and completion streaks.
Optionally persisted to a single JSON file on disk (see dump_json/load_json).
"""

import json
import os
from typing import Dict, Optional, List, Any
from backend.models import StudentState, Plan

class InMemoryStore:
    """
    Manages in-memory data storage for students and study plans, and tracks an audit log.
    """
    def __init__(self, persist_path: Optional[str] = None) -> None:
        self._students: Dict[str, StudentState] = {}
        self._plans: Dict[str, Plan] = {}
        self.audit_log: List[Dict[str, Any]] = []
        self.persist_path = persist_path
        if self.persist_path and os.path.exists(self.persist_path):
            self.load_json(self.persist_path)

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

    def dump_json(self, path: str) -> None:
        """
        Serializes students, plans, and the audit log to a single JSON file at `path`,
        writing atomically (tmp file + os.replace) so a crash mid-write can't corrupt it.
        """
        data = {
            "students": {sid: s.model_dump(mode="json") for sid, s in self._students.items()},
            "plans": {sid: p.model_dump(mode="json") for sid, p in self._plans.items()},
            "audit_log": self.audit_log,
        }
        tmp_path = path + ".tmp"
        with open(tmp_path, "w") as f:
            json.dump(data, f)
        os.replace(tmp_path, path)

    def load_json(self, path: str) -> None:
        """
        Rehydrates students, plans, and the audit log from `path`. A missing file is a
        no-op; a corrupt/unparseable file leaves the store empty rather than raising.
        """
        if not os.path.exists(path):
            return
        try:
            with open(path, "r") as f:
                data = json.load(f)
            students = {sid: StudentState(**d) for sid, d in data["students"].items()}
            plans = {sid: Plan(**d) for sid, d in data["plans"].items()}
            audit_log = data["audit_log"]
        except Exception:
            self._students = {}
            self._plans = {}
            self.audit_log = []
            return
        self._students = students
        self._plans = plans
        self.audit_log = audit_log