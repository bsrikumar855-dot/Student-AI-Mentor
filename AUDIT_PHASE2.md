# Phase 2 Decision-Logic Correctness Audit Report

## Top-Line Verdict
- **System-Check Status**: **PASS** (All imports succeeded, dependencies resolved, and mock validation successfully passed).
- **Test Baseline**: **25 Passed, 0 Skipped, 0 Failed**.
- **Verdict**: **4 of 10 logic claims CONFIRMED** (with remainder refuted due to correct existing implementations or specification alignment).

---

## Critical Findings Summary

### 1. `reasons[]` Specificity Acceptance Criterion
- **Status**: **FAILED** (Confirmed claim).
- **File & Line**: [risk.py:74-79](file:///d:/HackSprint/backend/risk.py#L74-L79)
- **Current Value**: Templates are generic boilerplate:
  - `"score_gap"`: `f"Academic scores are far below target (average gap is {score_gap*100:.1f}%)."`
  - `"syllabus_behind"`: `f"Syllabus completion is low ({student.nearest_exam.completion*100:.1f}%) for nearest exam in {student.nearest_exam.days_to_exam if student.nearest_exam else 0} days."`
- **Expected Value**: Specific subject names and numbers (e.g., citing `"Database Systems at 52%"`).
- **Severity**: **Moderate**
- **Blast Radius**: Affects risk result reasons output and assertions in risk/plan tests.
- **Reproduction**:
  `python -c "import json; from backend.models import StudentState; from backend.risk import calculate_risk; print(calculate_risk(StudentState(**json.load(open('mocks/student_state.json')))).reasons)"`
  Outputs: `['Low — Student has been inactive for 2 days.', 'Syllabus completion is low (60.0%) for nearest exam in 10 days.']`

### 2. `auto=false` trigger `flag_at_risk` Triggered Properly
- **Status**: **REFUTED** (Trigger is present in specs and works correctly).
- **File & Line**: [interventions.py:124-131](file:///d:/HackSprint/backend/interventions.py#L124-L131)
- **Current vs Expected**: The code correctly marks `flag_at_risk` with `auto=False`. Spec is also defined as `auto=false`.
- **Severity**: **Low**
- **Blast Radius**: None.

---

## Section A — System Check (Preflight)

1. **Environment**:
   - Python Version: `3.14.2`
   - Virtualenv: Present (Global Python Environment from bin directory).
   - Requirements: Resolved cleanly via `requirements.txt`.
   - Interpreter: `C:\Users\babus\AppData\Local\Python\bin\python.exe`
2. **Import Health**:
   - Success. Running `import backend.risk; import backend.interventions; import backend.internships; import backend.predict; import backend.models; import backend.main` executes cleanly with zero syntax or circular-import errors.
3. **Test Baseline**:
   - `pytest` executes and yields **25 passed in 2.02s**.
4. **Schema Validation**:
   - `jsonschema.validate` of `mocks/student_state.json` against `specs/contracts/student_state.schema.json` returns success with **no field mismatches**.
5. **Mock/Consumer Shape**:
   - Risk and predict calculations match mock fields exactly. No missing fields identified.
6. **Static Scan**:
   - Unused imports found: `Dict` and `Any` in `risk.py`, and `Dict`, `Any`, and `List` in `predict.py`.

---

## Section B — Per-Claim Logic Audit Findings

| Claim | Status | File:Line | Current vs Expected | Severity | Blast Radius |
|---|---|---|---|---|---|
| 1. `activity_recency` divisor | **REFUTED** | [risk.py:30](file:///d:/HackSprint/backend/risk.py#L30) | Code uses `/7` which aligns with `SPEC.md`. (Drishta guide says `/14`). | Low | Shift in risk scoring values if modified. |
| 2. `trend` formula | **REFUTED** | [risk.py:33-37](file:///d:/HackSprint/backend/risk.py#L33-L37) | Code computes average relative drop which matches `SPEC.md` formula. | Low | None. |
| 3. `reasons[]` specificity | **CONFIRMED** | [risk.py:74-79](file:///d:/HackSprint/backend/risk.py#L74-L79) | Generic template string vs expected specific details naming subjects. | Moderate | Downstream reason arrays in UI views and test assertions. |
| 4. `weights` location | **CONFIRMED** | [risk.py:46-51](file:///d:/HackSprint/backend/risk.py#L46-L51) | Local dictionary inside function vs expected module-level constant. | Low | Internal code clean-up only. |
| 5. `revision_timetable` auto | **REFUTED** | [interventions.py:42](file:///d:/HackSprint/backend/interventions.py#L42) | Code is `auto=True`, which correctly matches `SPEC.md`. | Low | None. |
| 6. Trend-based trigger auto | **REFUTED** | [interventions.py:53](file:///d:/HackSprint/backend/interventions.py#L53) | Code is `auto=True`, matching `SPEC.md`. | Low | None. |
| 7. `flag_at_risk` rule | **REFUTED** | [interventions.py:130](file:///d:/HackSprint/backend/interventions.py#L130) | Code has `auto=False` which matches `SPEC.md`. | Low | None. |
| 8. Trend trigger drop | **CONFIRMED** | [interventions.py:47](file:///d:/HackSprint/backend/interventions.py#L47) | Fires on single-step drop `trend[-1] < trend[-2]`. | Low | Triggering rate for subjects. |
| 9. match / risk triggers | **REFUTED** | [interventions.py:114](file:///d:/HackSprint/backend/interventions.py#L114) | Both `internship_match` and `flag_at_risk` are defined in `SPEC.md`. | Low | None. |
| 10. `match < 0.5` filter | **CONFIRMED** | [internships.py:36](file:///d:/HackSprint/backend/internships.py#L36) | Code filters out matches `< 0.5`. (Hides 0 mock vacancies from Alice since matches are 1.0 and 0.5). | Low | None. |

---

## Section C — Cross-Artifact Disagreement Table

| Concept / Field | `specs/SPEC.md` | `models.py` | `student_state.schema.json` | Actual Code | Drishta Guide |
|---|---|---|---|---|---|
| `activity_recency` divisor | `/7` | N/A | N/A | `/7` | `/14` [❌ Disagrees] |
| `trend` definition | relative mean | N/A | N/A | relative mean | fraction [❌ Disagrees] |
| `revision_timetable` auto | `true` | N/A | N/A | `True` | N/A |
| `weak_topic` auto | `true` | N/A | N/A | `True` | N/A |
| `internship` filter | `>= 0.5` | N/A | N/A | `>= 0.5` | N/A |

---

## Recommended Remediation Order
1. **Weights Refinement**: Relocate the local weights dictionary in `risk.py` to a module-level constant to follow clean coding guidelines.
2. **Explainability Reason Templates**: Expand template formatters in `risk.py` (dominant term reasons) to reference specific subject names and metrics.
