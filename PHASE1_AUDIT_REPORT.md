# PHASE1_AUDIT_REPORT.md

## 1. Baseline
Test count: 23 passed in 1.10s.

```bash
$ PYTHONPATH=. python -m pytest -q
.......................                                                  [100%]
23 passed in 1.10s
```

## 2. Item verdicts table

| Item | Verdict | Evidence |
|---|---|---|
| 1 — `plan.py` extraction | PARTIAL | `build_plan` exists and outputs deterministic targets, schedule, and triggered intervention. But running the exact specified code throws Pydantic validation errors because `build_plan` attempts to assign invalid `kind` values ("practice", "review", "stretch") to `DailyTarget`. In `backend/models.py`, `DailyTarget.kind` does not include these values. <br/><br/>Command: `PYTHONPATH=. python /tmp/probe_item1.py`<br/>Output snippet:<br/>`pydantic_core._pydantic_core.ValidationError: 1 validation error for Intervention`<br/>`kind`<br/>`  Input should be 'academic', 'career', 'recovery' or 'wellness' [type=literal_error, input_value='practice', input_type=str]` |
| 2 — no-LLM guardrail | PASS | `test_no_llm_in_core.py` checks `DETERMINISTIC_CORE_FILES` and correctly prevents `backend.language` and other LLM modules. `backend/plan.py` is in the list. <br/><br/>Command: `pytest tests/test_no_llm_in_core.py -q`<br/>Output: `1 passed` (implicitly, as baseline is 23 passed). |
| 3 — store persistence | PASS | The `InMemoryStore` correctly round-trips data. The save is atomic via `os.replace`. Default construction doesn't require `persist_path`. <br/><br/>Command: `PYTHONPATH=. python /tmp/probe_item3.py`<br/>Output snippet:<br/>`tmp path exists: False`<br/>`Round trip student ok: True`<br/>`Round trip plan ok: True`<br/>`Round trip audit log ok: True` |
| 4 — syllabus fork | PASS | `specs/adr/0001-four-sheet-supersedes-syllabus.md` is present and Accepted. No `syllabus` sheet added to `ingest.py`. `test_ingest_excel_behavior` checks 4 sheets. <br/><br/>Command: `cat specs/adr/0001-four-sheet-supersedes-syllabus.md | grep Status`<br/>Output: `Accepted.` |
| 5 — ingest degradation | PASS | The ingest correctly handles missing sheets, missing columns, malformed nested rows, and out-of-range values by skipping and reporting them, without crashing. Endpoint `/api/v1/ingest` properly handles valid and invalid rows, reporting duplicate skipped logic on consecutive hits. <br/><br/>Command: `PYTHONPATH=. python /tmp/probe_item5.py`<br/>Output snippet:<br/>`Skipped length: 1, first: {'student_id': None, 'reason': 'students sheet missing required column: student_id'}`<br/>`Students length: 1, Skipped length: 1` |

## 3. Fallback probe results

| Probe | Pass/Fail | Actual Observed Behavior |
|---|---|---|
| Load nonexistent store path | ✓ | Returns early, store is empty (`students: 0`) |
| Load corrupt store file | ✓ | Caught exception, store initialized empty (`students: 0`) |
| Load wrong-shape store file | ✓ | Caught exception, store initialized empty (`students: 0`) |
| Missing `students` sheet | ✓ | Doesn't raise, skipped length 0 |
| Missing `student_id` column | ✓ | Doesn't raise, reports skipped `student_id: None` |
| One good, one missing `cgpa` | ✓ | Good row ingests, bad row skipped |
| Malformed nested row | ✓ | Student ingests, bad nested row dropped |
| Out-of-range student value | ✓ | Student skipped |

## 4. Defects / risks

- **Defect 1 (`backend/plan.py` Pydantic Validation Error):** `backend/plan.py` creates `DailyTarget` items assigning `kind="practice"`, `kind="review"`, and `kind="stretch"` for interventions like `weak_topic`, `revision_timetable`, and `ramp_difficulty`. However, the Pydantic model for `DailyTarget.kind` restricts `kind` to `'academic'`, `'career'`, `'recovery'`, or `'wellness'`.
  - **Proposed fix:** Update `backend/plan.py` to map these to the valid literal values (e.g., use `academic` instead of `practice`, `review`, and `stretch`), or update the `kind` literal in `backend.models` to allow these new values.
- **Defect 2 (Endpoint Path and Payload mismatch for reviews):** In the cross-cutting checks, the prompt expects a review POST to `/students/{student_id}/reviews` with `{"approved": True}`. In the codebase, it is implemented at `/api/v1/interventions/{intervention_id}/review` and expects `{"decision": "approve"}`. It does correctly return 400 when an `auto:true` intervention is reviewed.
  - **Proposed fix:** Realign the API endpoints and payloads to match the exact `Student-AI-Mentor` Phase 1 specifications (`POST /api/v1/students/{student_id}/reviews`), modifying either the tests/spec or the `main.py` router mappings and models.

## 5. Not covered by this audit

- This audit does NOT fuzz the risk/predict/retain *math* against the SPEC formulas.
- This audit does NOT test concurrent/multi-worker writes to the persisted store (single-process last-write-wins with a `.tmp` swap; no file locking).
