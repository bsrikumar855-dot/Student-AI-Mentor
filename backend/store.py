"""
Data Store Module: In-memory storage for active student states, tasks, and completion streaks.
Optionally persisted to a single JSON file on disk (see dump_json/load_json).
"""

import json
import os
from typing import Dict, Optional, List, Any
from backend.models import StudentState, Plan, PlanDecisionTrace
import backend.coding as _coding_module

import json
import os
import sqlite3
from typing import Dict, Optional, List, Any
from backend.models import StudentState, Plan, PlanDecisionTrace
import backend.coding as _coding_module

class ObservableList(list):
    def __init__(self, iterable, callback):
        super().__init__(iterable)
        self.callback = callback
        
    def append(self, item):
        super().append(item)
        self.callback(self)
        
    def extend(self, other):
        super().extend(other)
        self.callback(self)
        
    def __setitem__(self, index, value):
        super().__setitem__(index, value)
        self.callback(self)
        
    def __delitem__(self, index):
        super().__delitem__(index)
        self.callback(self)
        
    def clear(self):
        super().clear()
        self.callback(self)

class InMemoryStore:
    """
    Manages SQLite data storage for students and study plans, and tracks an audit log.
    Uses properties to maintain compatibility with dict-based direct access.
    """
    def __init__(self, persist_path: Optional[str] = None) -> None:
        self.persist_path = persist_path
        self._db_path = ":memory:"
        if self.persist_path:
            if self.persist_path.endswith(".json"):
                self._db_path = self.persist_path[:-5] + ".db"
            else:
                self._db_path = self.persist_path
        
        self._conn = sqlite3.connect(self._db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()
        
        if self.persist_path and self.persist_path.endswith(".json") and os.path.exists(self.persist_path):
            self.load_json(self.persist_path)

    def _init_db(self) -> None:
        with self._conn:
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS students (
                    student_id TEXT PRIMARY KEY,
                    data TEXT
                )
            """)
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS plans (
                    student_id TEXT PRIMARY KEY,
                    data TEXT
                )
            """)
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    data TEXT
                )
            """)
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS raw_snapshots (
                    key TEXT PRIMARY KEY,
                    data TEXT
                )
            """)
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS derived_signals (
                    key TEXT PRIMARY KEY,
                    data TEXT
                )
            """)
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS decision_traces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    data TEXT
                )
            """)
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS plan_traces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT,
                    data TEXT
                )
            """)

    def reset(self) -> None:
        with self._conn:
            self._conn.execute("DELETE FROM students")
            self._conn.execute("DELETE FROM plans")
            self._conn.execute("DELETE FROM audit_log")
            self._conn.execute("DELETE FROM raw_snapshots")
            self._conn.execute("DELETE FROM derived_signals")
            self._conn.execute("DELETE FROM decision_traces")
            self._conn.execute("DELETE FROM plan_traces")

    @property
    def _students(self) -> Dict[str, StudentState]:
        cur = self._conn.cursor()
        cur.execute("SELECT student_id, data FROM students")
        return {row[0]: StudentState(**json.loads(row[1])) for row in cur.fetchall()}

    @property
    def _plans(self) -> Dict[str, Plan]:
        cur = self._conn.cursor()
        cur.execute("SELECT student_id, data FROM plans")
        return {row[0]: Plan(**json.loads(row[1])) for row in cur.fetchall()}

    @property
    def _raw_snapshots(self) -> Dict[str, Any]:
        cur = self._conn.cursor()
        cur.execute("SELECT key, data FROM raw_snapshots")
        return {row[0]: json.loads(row[1]) for row in cur.fetchall()}

    @property
    def _derived_signals(self) -> Dict[str, Any]:
        cur = self._conn.cursor()
        cur.execute("SELECT key, data FROM derived_signals")
        return {row[0]: json.loads(row[1]) for row in cur.fetchall()}

    @property
    def _decision_traces(self) -> List[Any]:
        cur = self._conn.cursor()
        cur.execute("SELECT data FROM decision_traces ORDER BY id ASC")
        return [json.loads(row[0]) for row in cur.fetchall()]

    @property
    def audit_log(self) -> List[Dict[str, Any]]:
        cur = self._conn.cursor()
        cur.execute("SELECT data FROM audit_log ORDER BY id ASC")
        items = [json.loads(row[0]) for row in cur.fetchall()]
        
        def sync(new_list):
            with self._conn:
                self._conn.execute("DELETE FROM audit_log")
                for item in new_list:
                    self._conn.execute("INSERT INTO audit_log (data) VALUES (?)", (json.dumps(item),))
                    
        return ObservableList(items, sync)

    @audit_log.setter
    def audit_log(self, value: List[Dict[str, Any]]) -> None:
        with self._conn:
            self._conn.execute("DELETE FROM audit_log")
            for item in value:
                self._conn.execute("INSERT INTO audit_log (data) VALUES (?)", (json.dumps(item),))

    @property
    def plan_traces(self) -> List[PlanDecisionTrace]:
        cur = self._conn.cursor()
        cur.execute("SELECT data FROM plan_traces ORDER BY id ASC")
        return [PlanDecisionTrace(**json.loads(row[0])) for row in cur.fetchall()]

    @plan_traces.setter
    def plan_traces(self, value: List[PlanDecisionTrace]) -> None:
        with self._conn:
            self._conn.execute("DELETE FROM plan_traces")
            for item in value:
                self._conn.execute("INSERT INTO plan_traces (student_id, data) VALUES (?, ?)", (item.student_id, item.model_dump_json()))


    def save_student(self, student: StudentState) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT OR REPLACE INTO students (student_id, data) VALUES (?, ?)",
                (student.student_id, student.model_dump_json())
            )

    def get_student(self, student_id: str) -> Optional[StudentState]:
        cur = self._conn.cursor()
        cur.execute("SELECT data FROM students WHERE student_id = ?", (student_id,))
        row = cur.fetchone()
        if row:
            return StudentState(**json.loads(row[0]))
        return None

    def list_students(self) -> List[StudentState]:
        cur = self._conn.cursor()
        cur.execute("SELECT data FROM students")
        rows = cur.fetchall()
        return [StudentState(**json.loads(row[0])) for row in rows]

    def save_plan(self, student_id: str, plan: Plan) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT OR REPLACE INTO plans (student_id, data) VALUES (?, ?)",
                (student_id, plan.model_dump_json())
            )

    def get_plan(self, student_id: str) -> Optional[Plan]:
        cur = self._conn.cursor()
        cur.execute("SELECT data FROM plans WHERE student_id = ?", (student_id,))
        row = cur.fetchone()
        if row:
            return Plan(**json.loads(row[0]))
        return None

    def save_raw(self, source: str, entity: str, payload: dict, fetched_at: str) -> None:
        key = f"{source}|{entity}|{fetched_at}"
        with self._conn:
            self._conn.execute(
                "INSERT OR REPLACE INTO raw_snapshots (key, data) VALUES (?, ?)",
                (key, json.dumps(payload))
            )

    def save_derived(self, student_id: str, signal_name: str, value: Any, source: str, fetched_at: str, confidence: float, version: str) -> None:
        key = f"{student_id}|{signal_name}"
        data = {
            "value": value,
            "source": source,
            "fetched_at": fetched_at,
            "confidence": confidence,
            "version": version
        }
        with self._conn:
            self._conn.execute(
                "INSERT OR REPLACE INTO derived_signals (key, data) VALUES (?, ?)",
                (key, json.dumps(data))
            )

    def get_derived(self, student_id: str) -> dict:
        result = {}
        prefix = f"{student_id}|"
        cur = self._conn.cursor()
        cur.execute("SELECT key, data FROM derived_signals WHERE key LIKE ?", (prefix + "%",))
        for row in cur.fetchall():
            key = row[0]
            val = json.loads(row[1])
            signal_name = key[len(prefix):]
            result[signal_name] = val
        return result

    def append_trace(self, trace: dict) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT INTO decision_traces (data) VALUES (?)",
                (json.dumps(trace),)
            )

    def add_plan_trace(self, trace: PlanDecisionTrace) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT INTO plan_traces (student_id, data) VALUES (?, ?)",
                (trace.student_id, trace.model_dump_json())
            )

    def get_plan_traces(self, student_id: str) -> List[PlanDecisionTrace]:
        cur = self._conn.cursor()
        cur.execute("SELECT data FROM plan_traces WHERE student_id = ?", (student_id,))
        rows = cur.fetchall()
        return [PlanDecisionTrace(**json.loads(row[0])) for row in rows]

    def dump_json(self, path: str) -> None:
        """
        Serializes data to a single JSON file.
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
        Rehydrates from JSON file.
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
            return
        
        with self._conn:
            self._conn.execute("DELETE FROM students")
            for sid, s in students.items():
                self._conn.execute("INSERT OR REPLACE INTO students (student_id, data) VALUES (?, ?)", (sid, s.model_dump_json()))
            
            self._conn.execute("DELETE FROM plans")
            for sid, p in plans.items():
                self._conn.execute("INSERT OR REPLACE INTO plans (student_id, data) VALUES (?, ?)", (sid, p.model_dump_json()))
                
            self._conn.execute("DELETE FROM audit_log")
            for item in audit_log:
                self._conn.execute("INSERT INTO audit_log (data) VALUES (?)", (json.dumps(item),))
                
            self._conn.execute("DELETE FROM raw_snapshots")
            for k, v in raw_snapshots.items():
                self._conn.execute("INSERT OR REPLACE INTO raw_snapshots (key, data) VALUES (?, ?)", (k, json.dumps(v)))
                
            self._conn.execute("DELETE FROM derived_signals")
            for k, v in derived_signals.items():
                self._conn.execute("INSERT OR REPLACE INTO derived_signals (key, data) VALUES (?, ?)", (k, json.dumps(v)))
                
            self._conn.execute("DELETE FROM decision_traces")
            for item in decision_traces:
                self._conn.execute("INSERT INTO decision_traces (data) VALUES (?)", (json.dumps(item),))
                
            self._conn.execute("DELETE FROM plan_traces")
            for trace in plan_traces:
                self._conn.execute("INSERT INTO plan_traces (student_id, data) VALUES (?, ?)", (trace.student_id, trace.model_dump_json()))

        try:
            coding_cache = data.get("coding_cache", {})
            if isinstance(coding_cache, dict):
                _coding_module._cache.update(coding_cache)
        except Exception:
            pass