"""
Data Store Module: In-memory storage for active student states, tasks, and completion streaks.
Optionally persisted to a single JSON file on disk (see dump_json/load_json).
"""

import json
import os
from typing import Dict, Optional, List, Any
from backend.models import StudentState, Plan, PlanDecisionTrace
import backend.coding as _coding_module

class InMemoryStore:
    """
    Manages in-memory data storage for students and study plans, and tracks an audit log.
    """
    def __init__(self, persist_path: Optional[str] = None) -> None:
        self._students: Dict[str, StudentState] = {}
        self._plans: Dict[str, Plan] = {}
        self.audit_log: List[Dict[str, Any]] = []
        self._raw_snapshots: Dict[str, Any] = {}
        self._derived_signals: Dict[str, Any] = {}
        self._decision_traces: List[Any] = []
        self.plan_traces: List[PlanDecisionTrace] = []
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

    def save_raw(self, source: str, entity: str, payload: dict, fetched_at: str) -> None:
        key = f"{source}|{entity}|{fetched_at}"
        self._raw_snapshots[key] = payload

    def save_derived(self, student_id: str, signal_name: str, value: Any, source: str, fetched_at: str, confidence: float, version: str) -> None:
        key = f"{student_id}|{signal_name}"
        self._derived_signals[key] = {
            "value": value,
            "source": source,
            "fetched_at": fetched_at,
            "confidence": confidence,
            "version": version
        }

    def get_derived(self, student_id: str) -> dict:
        result = {}
        prefix = f"{student_id}|"
        for k, v in self._derived_signals.items():
            if k.startswith(prefix):
                signal_name = k[len(prefix):]
                result[signal_name] = v
        return result

    def append_trace(self, trace: dict) -> None:
        self._decision_traces.append(trace)

    def add_plan_trace(self, trace: PlanDecisionTrace) -> None:
        self.plan_traces.append(trace)

    def get_plan_traces(self, student_id: str) -> List[PlanDecisionTrace]:
        return [t for t in self.plan_traces if t.student_id == student_id]

    def dump_json(self, path: str) -> None:
        """
        Serializes students, plans, audit log, and the coding cache to a single JSON
        file at `path`, writing atomically (tmp file + os.replace) so a crash
        mid-write can't corrupt it.
        """
        data = {
            "students": {sid: s.model_dump(mode="json") for sid, s in self._students.items()},
            "plans": {sid: p.model_dump(mode="json") for sid, p in self._plans.items()},
            "audit_log": self.audit_log,
            "coding_cache": dict(_coding_module._cache),
            "raw_snapshots": self._raw_snapshots,
            "derived_signals": self._derived_signals,
            "decision_traces": self._decision_traces,
            "plan_traces": [t.model_dump(mode="json") for t in self.plan_traces],
        }
        tmp_path = path + ".tmp"
        with open(tmp_path, "w") as f:
            json.dump(data, f)
        os.replace(tmp_path, path)

    def load_json(self, path: str) -> None:
        """
        Rehydrates students, plans, audit log, and coding cache from `path`. A missing
        file is a no-op. A corrupt/unparseable/wrong-shape file does not raise and
        leaves any existing in-memory state untouched (load is all-or-nothing).
        """
        if not os.path.exists(path):
            return
        try:
            with open(path, "r") as f:
                data = json.load(f)
            students = {sid: StudentState(**d) for sid, d in data["students"].items()}
            plans = {sid: Plan(**d) for sid, d in data["plans"].items()}
            audit_log = data["audit_log"]
            raw_snapshots = data.get("raw_snapshots", {})
            derived_signals = data.get("derived_signals", {})
            decision_traces = data.get("decision_traces", [])
            plan_traces = [PlanDecisionTrace(**d) for d in data.get("plan_traces", [])]
        except Exception:
            # Leave existing in-memory state untouched on any failure.
            return
        self._students = students
        self._plans = plans
        self.audit_log = audit_log
        self._raw_snapshots = raw_snapshots
        self._derived_signals = derived_signals
        self._decision_traces = decision_traces
        self.plan_traces = plan_traces
        # Restore coding cache if present (missing key is not an error)
        try:
            coding_cache = data.get("coding_cache", {})
            if isinstance(coding_cache, dict):
                _coding_module._cache.update(coding_cache)
        except Exception:
            pass