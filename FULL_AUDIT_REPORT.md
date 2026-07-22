# Full Repo State Audit -- Polaris (`Student-AI-Mentor`)

**Audited ref**: `main` @ `9b3536e` (merge of PR #4, "Add ADR 0002: keep intervention auto flags as specced, reject guide flip" -- the tip of main at audit time, itself stacked on PR #3's D1 fix and PR #1's Phase 1 work).
**Method**: Clean detached-HEAD `git worktree` checkout of `origin/main` at `/tmp/audit-main`, isolated from any working branch. All findings backed by commands actually run (probe scripts under `/tmp/audit-main/probe_*.py`, untracked, never committed). `backend/` was not modified -- confirmed via `git status --short` on the worktree before and after probing (only the untracked probe scripts appear).

## 0. Baseline

```
cd /tmp/audit-main && PYTHONPATH=. python -m pytest -q
```
```
........................                                                 [100%]
24 passed in 1.94s
```

**This is 24, not the 23 this prompt expected.** Per the "stop and report" instruction: this is explained, not a red flag. The prior audit's 23-baseline was recorded before PR #3 (the D1 fix, merged after that audit) added one new regression test (`test_load_json_bad_file_preserves_existing_data`). 23 -> 24 is exactly +1, matching that one addition. Verified by listing the test file's functions (Section Part C below) -- no other count drift. Proceeding with the full audit on this corrected baseline. Re-run at the end of the audit also shows `24 passed` -- probing did not mutate repo state.

## 1. Status table (Parts A-E)

| Part | Verdict | Evidence (command + key output) |
|---|---|---|
| **A1** `plan.py` shape/purity | PASS | `inspect.signature(build_plan)` -> `(student: StudentState, risk: RiskResult, interventions: List[Intervention]) -> Plan`. `get_highest_priority_action` present. `plan.py` imports: `['typing', 'datetime', 'backend.models']` -- no LLM/`backend.language`. `build_plan(...).message == ''` -> `True`. |
| **A2** guardrail covers `plan.py` | PASS | `grep "backend/plan.py" tests/test_no_llm_in_core.py` -> present in `DETERMINISTIC_CORE_FILES`. `pytest tests/test_no_llm_in_core.py -v` -> `test_no_llm_imports_in_core[backend/plan.py] PASSED`. |
| **A3** `store.py` persistence | PASS | `dump_json`/`load_json`/`persist_path` present (`grep` confirms all 4 signatures/attrs). `InMemoryStore()` with no args constructs fine, `persist_path=None`. Atomic write (`tmp_path = path + ".tmp"` then `os.replace`) confirmed by source inspection. |
| **A4** `ingest_excel` degradation | PASS | `inspect.signature(ingest_excel)` -> `(file_content: BinaryIO) -> Tuple[List[StudentState], List[dict]]`. `main.py` confirmed to unpack `students, ingest_skipped = ingest_excel(...)` and merge with `duplicate_skipped` into one `skipped` list. |
| **A5** thin orchestrator | PASS | `generate_plan_for_student` body inspected directly: `calculate_risk` -> `student.risk=` -> `predict_trends` -> `student.predictions=` -> `evaluate_interventions(student, risk_state)` -> `build_plan(student, risk_state, active_interventions)` -> `plan.message = phrase_intervention_message(...)`. Unchanged from prior audit. |
| **B** ADR 0001 consistency | PASS | `ingest.py` reads exactly `students`/`scores`/`exams`/`topics` (`grep xls.parse`); only mention of "syllabus" in `ingest.py` is the docstring pointer to the ADR; `test_ingest_excel_behavior` still builds exactly those four sheets. |
| **B** ADR 0002 consistency | PASS | `interventions.py`: every intervention `auto=True` except `flag_at_risk` (`auto=False`) -- confirmed by grep across all 9 triggers. Probe (`probe_adr0002.py`, 8/8 checks): `get_highest_priority_action` ignores `auto=False`-only lists; live-ingested High-risk student's plan shows `revision_timetable`/`weak_topic` both `auto=True`, `flag_at_risk` `auto=False`; reviewing the `auto=True` intervention -> `400`; reviewing `flag_at_risk` -> `200`. |
| **C** D1 status | **FIXED** | See Section 3 below -- full detail and probe output. |
| **D** `risk.py` vs SPEC Section 2 | PASS | `probe_risk.py`, 12/12 checks. Hand-computed `score_gap`, `syllabus_behind`, `activity_recency` (confirms `/7` divisor, not the Drishta guide's `/14`), `trend`, final `score = round(sum(weight*term)*100)` all match to float precision. Level cutoffs verified at exact boundaries: score 25->Low, 60->Medium, 75->High. `reasons` non-empty and dominant-term-correct for Medium/High. |
| **D** `predict.py` vs SPEC Section 3 | **PARTIAL** | `probe_predict.py`, 12/14 checks pass; 2 fail. Slope, clamp(0,100), `projected_gpa` rounding, `exam_trend` +/-0.5 cutoffs, cgpa-fallback-when-no-subjects: all match SPEC exactly. Two real findings -- see Section 4. |
| **D** `retain.py` (SM-2) vs SPEC Section 4 | PASS | `probe_retain.py`, 68/68 checks (after fixing one bad assertion in my own probe, not the code -- see note in Section 4). Every quality value (0,2,3,4,5) across 4 consecutive reps, the 1.3 EF floor, exact rep-milestone intervals (1->1, 2->6, 3->round(interval*ef)), `next_review` arithmetic, input-immutability, `recall_estimate` formula, and `due_topics`' overdue-OR-low-recall filter + weakest-first sort all match SPEC exactly. |
| **D** `internships.py` vs SPEC Section 5 | PASS | `probe_internships.py`, 13/13 checks. Match ratio, CGPA-gate exclusion (not shown with a low score), `match>=0.5` filter, desc sort, `match==1.0` "ready" `why` text, exact-boundary CGPA inclusion, all confirmed. |
| **D** `interventions.py` vs SPEC Section 6 | PASS | `probe_interventions.py`, 22/22 checks. All 9 triggers tested at the exact just-below/just-at boundary (`days_since_active` 4/5, exam `days_to_exam` 7/8 and `completion` 0.49/0.5, `goals_met_streak` 6/7, `days_since_commit` 9/10, `days_since_linkedin` 13/14, risk level Low/Medium/High for `flag_at_risk`, `internship_match` on match<1.0 vs ==1.0). `kind` mapping spot-checked. |
| **E** cross-cutting runtime | PASS | `probe_crosscutting_final.py`, 12/12 checks: all 5 student-scoped GETs 404 on unknown id; `/chat` -> `used_llm:false` with non-empty templated reply; a live-ingested student's plan `message` is non-empty (language layer, not core, filled it); both `mocks/*.json` validate against `specs/contracts/*.schema.json`. |

## 2. Open items

- **D1: FIXED** (see Section 3) -- no longer an open item.
- **predict.py contract gap** (new finding, this audit): `ExamForecast` is missing SPEC Section 3's documented `fail_risk` and `why` fields. Open -- not previously flagged because no prior audit checked math/output-contract completeness for `predict.py`. See Section 4 for detail and proposed fix.
- **predict.py `d` fallback semantics**: SPEC's `d = nearest_exam.days_to_exam or 14` vs code's `d = ... if student.nearest_exam else 14` diverge only when `days_to_exam == 0` (exam literally today). Low severity, edge case, but a real behavioral difference from the literal SPEC text. See Section 4.
- Everything else audited in Parts A-E is closed/consistent -- no other open items surfaced.

## 3. D1 detail

`backend/store.py::load_json`, current `except` branch:
```python
except Exception:
    # Leave existing in-memory state untouched on any failure.
    return
```
This **returns without mutating** `self._students`/`self._plans`/`self.audit_log` -- the bug (unconditional reset to empty) is gone.

Probe (`probe_d1.py`):
```
[PASS] known student present before load_json
[PASS] known student survives load_json(corrupt) student_id='KNOWN1' ...
[PASS] known student survives load_json(wrongshape) student_id='KNOWN1' ...

D1 STATUS: FIXED (existing in-memory data survives corrupt/wrong-shape load_json calls)
```
A store pre-populated with `KNOWN1` was subjected first to `load_json(corrupt.json)` (invalid JSON), then `load_json({"students":{}})` (valid JSON, missing `plans`/`audit_log` keys). `KNOWN1` survived both calls unchanged. The regression test added by the fix, `test_load_json_bad_file_preserves_existing_data`, is present in `tests/test_store_persistence.py` on current `main`.

**D1: FIXED.**

## 4. Math findings

Per-module verdict already in the table above. Detail on every module, plus the two `predict.py` discrepancies:

**`risk.py`**: matches SPEC Section 2 exactly. Every weight (0.35/0.25/0.25/0.15), every divisor (`/60` for score_gap, `/7` for both `syllabus_behind`'s day-weighting and `activity_recency`), the `round(...*100)` scoring, and the `<33`/`<66`/`>=66` level cutoffs were hand-computed against a mixed fixture and matched to float precision, then independently re-confirmed at three exact score boundaries (25/Low, 60/Medium, 75/High). **No discrepancy.**

**`predict.py`**: core math (slope, `clamp(0,100)`, `projected_gpa = round(mean(projected/10),2)`, `exam_trend` at the +/-0.5 mean-slope cutoffs, cgpa fallback when a student has no subjects) all matched hand-computed values exactly. Two real discrepancies found:

1. **`d` fallback semantics** (low severity). SPEC: `d = nearest_exam.days_to_exam or 14`. Code: `d = student.nearest_exam.days_to_exam if student.nearest_exam else 14` (`backend/predict.py`, the `d = ...` line). These differ only when a `nearest_exam` exists **and** `days_to_exam == 0`: SPEC's `or` treats `0` as falsy and falls back to `14`; the code's ternary only checks `nearest_exam is not None`, so it uses `0` directly. Probed: with `days_to_exam=0`, a subject with slope=10 gives `projected_score=50.0` (code's actual behavior, using `d=0`) vs `70.0` (what SPEC's literal `or 14` text would produce). **Input**: exam `days_to_exam=0`, subject `latest=50, trend=[40,50]` (slope=10). **SPEC-derived expected** (`d=14` via `or` fallback): `50 + 10*(14/7) = 70.0`. **Actual**: `50 + 10*(0/7) = 50.0`. Whether this is "wrong" depends on intent -- an exam happening today arguably *should* use `d=0` (no time left to study), which is arguably more correct than SPEC's literal `or` producing a 14-day projection for an exam that's already here. Flagging as a spec-vs-code text divergence, not asserting which is "right," since the SPEC prose itself is ambiguous about whether `d=0` was meant to trigger the fallback.
   - **Proposed fix (described, not applied)**: if the intent is SPEC's literal `or`-semantics, change to `d = student.nearest_exam.days_to_exam if (student.nearest_exam and student.nearest_exam.days_to_exam) else 14`. If the intent is "use real days-to-exam whenever an exam exists, including 0," the code is already correct and SPEC's prose should be corrected instead (`d = nearest_exam.days_to_exam if nearest_exam else 14`, dropping the `or`). Either way, this is a one-line SPEC-or-code reconciliation, not a functional bug in the sense of "gives a wrong answer" -- it's an underspecified edge case.

2. **`ExamForecast` missing `fail_risk` and `why` fields** (contract-completeness gap, moderate severity). SPEC Section 3's stated output is `exam_forecast: [{subject, projected_score, fail_risk, why}]`. The actual model (`backend/models.py::ExamForecast`) has only `{subject, projected_score}`:
   ```python
   class ExamForecast(BaseModel):
       subject: str
       projected_score: float
   ```
   Confirmed via `ExamForecast.model_fields.keys()` -> `{'projected_score', 'subject'}`. No `fail_risk`, no `why`. This means the per-exam fail-risk banding (`High <40 / Medium <55 / Low >=55`) and the human-readable `why` string SPEC documents (`"{subj}: {latest:.0f}% now, ... -> ~{projected_score:.0f}% at exam"`) are **not computed or exposed anywhere** -- `predict.py` never builds them. This is invisible to the test suite (`test_predict_trends_behavior` only checks `projected_gpa`, `exam_trend`, `exam_forecast[0].projected_score`) and invisible to contract tests (there's no `specs/contracts/*.schema.json` for `PredictionResult`, only for `StudentState` and `Plan`). Predates Phase 1 -- `predict.py`/`models.py::ExamForecast` were not touched by any of the five Phase 1 items, so this is pre-existing, not a regression.
   - **Proposed fix (described, not applied)**: add `fail_risk: Literal["Low","Medium","High"]` and `why: str` to `ExamForecast` in `models.py`; in `predict.py`'s per-subject loop, compute `fail_risk` from `projected_score` (`<40` High / `<55` Medium / `>=55` Low, per SPEC) and format `why` per the documented template, then pass both into the `ExamForecast(...)` constructor alongside `subject`/`projected_score`. This is additive (new required-with-default-or-computed fields), so it would need `test_predict_trends_behavior` extended (not broken) to assert on them, and -- if a `PredictionResult`/`ExamForecast` JSON-schema contract is ever added under `specs/contracts/`, matching that too.

**`retain.py` (SM-2)**: matches SPEC Section 4 exactly across every quality value (0, 2, 3, 4, 5) run through 4 consecutive review steps each (interval progression, EF update, `next_review` date arithmetic), the exact `reps==1->interval=1`, `reps==2->interval=6`, `reps>=3->round(prev_interval*ef)` milestones, the `1.3` EF floor (verified both "already at floor, stays at floor" and "reset path also correctly resets `reps=0,interval=1` regardless of prior `reps`"), input immutability (`apply_sm2` never mutates the passed-in `TopicMemory`), the `recall_estimate = exp(-days/(max(interval,1)*1.4))` formula, and `due_topics`' overdue-OR-low-recall inclusion filter with weakest-recall-first sort and the exact three-key (`topic, next_review, reps, why` -- four, not three) output shape. **One self-correction worth noting**: my first pass at the `due_topics` sort-order probe had a wrong assertion (I assumed a topic named "LowRecall" would have numerically lower recall than one named "Overdue" purely by name -- it didn't; "Overdue"'s much longer `learned_on` gap combined with a short `interval` gave it the actually-lower recall value). Caught by hand-computing both recall values independently (`6.25e-7` vs `0.0047`) before concluding -- the code's sort order was correct all along; the bug was in my first probe draft, fixed before reporting. **No discrepancy in the code.**

**`internships.py`**: matches SPEC Section 5 exactly -- skill-overlap ratio (`len(have)/len(required)`, rounded to 2dp), CGPA-gate exclusion (a student below `min_cgpa` never appears in results at all, not with a depressed score), the `match>=0.5` filter (tested at the exact 0.5 boundary -- included), descending sort by match, and `match==1.0` producing the "meets all N skills" `why` text. One implementation liberality worth noting, not a defect: the code accepts either `requires` or `required_skills` as the DB's skill-list key (SPEC doesn't specify a key name), and treats an internship with an empty skill requirement list as `match=1.0` (SPEC doesn't address this edge case either way). **No discrepancy** against anything SPEC actually specifies.

**`interventions.py`**: matches SPEC Section 6 exactly at every one of the 9 documented boundaries, tested both just-below (not triggered) and just-at (triggered): `recovery_plan` (`days_since_active` 4/5), `revision_timetable` (`days_to_exam` 7/8 **and** `completion` 0.49/0.5 -- both the day-count and the completion-threshold edges independently confirmed), `weak_topic` (strict `<` on `trend[-1]` vs `trend[-2]`, flat/improving trends correctly excluded), `ramp_difficulty` (`goals_met_streak` 6/7), `git_nudge` (`days_since_commit` 9/10), `linkedin_nudge` (`days_since_linkedin` 13/14), `flag_at_risk` (Low/Medium excluded, High triggers), `internship_match` (only fires on an actual `match==1.0`, not partial matches). **No discrepancy.**

## 5. Defects / risks (with described, not applied, fixes)

1. **`ExamForecast` missing `fail_risk`/`why`** (Section 4, item 2) -- moderate severity, pre-existing (not Phase 1's doing), invisible to current tests/contracts. Fix described above.
2. **`predict.py`'s `d` fallback edge case at `days_to_exam==0`** (Section 4, item 1) -- low severity, genuinely ambiguous intent in the SPEC prose itself. Fix options described above; recommend resolving via a short ADR (SPEC-text fix or code fix, whichever the team intends) rather than a silent code change, following this repo's established ADR pattern for exactly this kind of spec/code reconciliation.

No other defects found in this pass. Every deterministic-core formula that was previously unverified (all of Part D) checked out against SPEC to the precision hand-computation allows, with the two `predict.py` findings above being the only exceptions across five modules and ~140 individual probe assertions.

## 6. Not covered by this audit

- **Concurrency / multi-worker writes to the persisted store.** `dump_json`'s atomicity (`tmp` + `os.replace`) protects a single process's write from a torn read, but nothing coordinates multiple concurrent writers (no file locking). Not tested here -- same gap noted in the prior Phase 1 audit, still open, still just a risk note rather than an active bug since the current deployment is single-process.
- **Load/performance testing.** No large-workbook ingest timing, no concurrent-request load testing of any endpoint.
- **Frontend.** This audit is backend-only; the `frontend/` directory was not touched or reviewed.
- **`language.py`'s real-LLM-key code path.** Only the no-key templated-fallback path was exercised (`used_llm:false`); behavior with an actual API key configured is unverified.
- **Rounding/floating-point edge cases beyond what was probed.** The math checks used hand-picked fixtures chosen to be hand-computable and to hit exact documented boundaries; this is not exhaustive fuzzing across the full input space (e.g., no property-based testing of `risk.py`'s weighted sum for arbitrary float inputs, no exhaustive SM-2 qualityxreps grid beyond the 5 quality values x 4-step chains tested).
- **`/students` list endpoint's sort/filter/pagination params, `/tasks/{id}/complete` streak logic, `internships.py`'s endpoint wiring (`GET /students/{id}/internships`) beyond the module-level function tested directly.** These predate Phase 1, were not part of any of the five Phase 1 items or the two ADRs, and were not in this audit's Part A-E scope as written -- not re-verified here.
- **The two other open branches on origin** (`claude/polaris-phase-1-fixes-shlu74`, `fix/store-load-json-d1`, `audit-report-phase-1-...`) are stale now that their PRs are merged into `main`; not evaluated for cleanup as it's outside an "audit main" scope.

## Appendix: probe scripts (for reproducibility)

All under `/tmp/audit-main/` (git worktree of `origin/main`, detached HEAD at `9b3536e`), untracked, never committed:
- `probe_adr0002.py` -- ADR 0002 code consistency (8 checks)
- `probe_d1.py` -- D1 status probe (3 checks)
- `probe_risk.py` -- `risk.py` vs SPEC Section 2 (12 checks)
- `probe_predict.py` -- `predict.py` vs SPEC Section 3 (14 checks, 2 discrepancies documented)
- `probe_retain.py` -- `retain.py` SM-2 vs SPEC Section 4 (68 checks)
- `probe_internships.py` -- `internships.py` vs SPEC Section 5 (13 checks)
- `probe_interventions.py` -- `interventions.py` vs SPEC Section 6 (22 checks)
- `probe_crosscutting_final.py` -- 404s, chat fallback, message-non-empty, contract tests (12 checks)

Total: **152/154 probe assertions PASS** (the 2 non-passes are the documented `predict.py` findings, not probe errors), plus **24/24** pytest before and after probing (worktree `git status --short` confirms zero tracked-file changes throughout).