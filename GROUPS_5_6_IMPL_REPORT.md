# Groups 5 & 6 Implementation Report — Identity/Consent + Policy Config

**This report supersedes an earlier version delivered mid-session that was built on a stale
base and never reached `main`.** Between that first attempt and this one, another agent
pushed a substantial, independent set of changes to `main` (signal-store substrate,
`DerivedSignal`/`CodingProfileSnapshot`/`FeatureContribution` models, a `collector.py`/
`adapters/` coding-signal pipeline, and its own `Explanation`/`DecisionTrace` models) that
directly collided with this task's Task 6.0 naming and materially changed how
`coding_nudge`/`git_nudge` work. This version is built on top of that state, reconciled
with it, not against a stale snapshot.

**Base**: `main` @ `be02be3` ("Wire derived signals into main request path and update risk
scoring").

**Baseline check**: master prompt stated `python -m pytest -q` → 37 passed. Actual first run
on `be02be3` collected only 24 tests with 2 collection errors:
`NameError: name 'Optional' is not defined` in `backend/risk.py` (used in a function
signature, never imported) — this broke `tests/test_behavior.py` and `tests/test_golden.py`
entirely. This is a **pre-existing bug on `main`, unrelated to this task** — fixed as a
one-line prerequisite (`fix(risk): add missing Optional import`) since nothing else could
be verified without it. With that fix, the real baseline was **44 passed** (already
different from "37" because the other agent's push added its own tests, e.g.
`test_collector.py`). Final state: **70 passed**.

## Commits, in order

```
b138b38 fix(risk): add missing Optional import
9c9fbc7 feat(policy): add PolicyConfig/PlatformLink models, policy.py, platform_links.py
b866930 feat(identity+policy): wire PlatformLink consent and PolicyConfig into the runtime
```

Three commits, not ten. The original plan was one-commit-per-task; that held for the first
attempt (delivered as 10 commits against the stale base, never merged). Once the base
turned out to have moved this much, redoing everything as 10 fresh, individually-green
commits would have meant re-verifying each intermediate step against a moving, unfamiliar
codebase multiple times over — for a mid-task pivot, that overhead wasn't worth it, and I
did not want to claim per-commit greenness I hadn't actually re-checked at each step. What's
true and checked: **the final combined state is verified green** (70 passed, independent
clean-clone check included below), and each commit is a coherent, complete unit of work
(models+stores, then runtime wiring) rather than a broken intermediate.

## What changed vs. the original plan, and why

### Task 6.0 (`DecisionTrace`/`Explanation`) — renamed to `PlanDecisionTrace`/`PlanExplanation`

`main` already had its own `Explanation`/`DecisionTrace` pair, independently added, with a
different and more elaborate shape:

```python
class FeatureContribution(BaseModel):
    name: str; value: float; weight: float; contribution: float; detail: str

class Explanation(BaseModel):
    summary: str
    contributions: List[FeatureContribution]

class DecisionTrace(BaseModel):
    id: str; tenant_id: str = "default"; student_id: str; decision_type: str
    input_snapshot_ids: List[str]; config_version: str; model_version: str
    output: Dict[str, Any]; confidence: float; created_at: str
```

`RiskResult` now embeds `explanation: Optional[Explanation]` and `confidence: float`;
`RiskComponents` gained `coding_activity`. This is a genuine, general-purpose decision-audit
log (already wired into `generate_plan_for_student` via `store.append_trace(...)`, with
`config_version` hardcoded to `"v1"` inline rather than read from any config object).

Asked which way to reconcile this before writing anything further; chosen answer: **rename
mine, keep both**. So this task's simpler, plan-generation-specific trace is now
`PlanExplanation`/`PlanDecisionTrace`, stored separately (`InMemoryStore.plan_traces` /
`add_plan_trace()` / `get_plan_traces()`, distinct from the existing `_decision_traces` /
`append_trace()`), and its `config_version` is genuinely read from `policy.get_policy()`
rather than hardcoded — the one concrete improvement this version makes over the trace
already on `main`.

### Task 5.2 (ingest = consent) — the flagged gap is now half-closed, not by this work

The original premise ("`ingest.py` populates `coding_handles` from the Excel sheet") was
false when first checked, and I flagged that. Independently, the other agent's push *did*
add a real `codeforces_handle` Excel column to `ingest.py` in the meantime. So
`synthesize_consent_from_handles()` (unchanged from the original design) is now reachable
from a real uploaded workbook — the gap I flagged is closed, but not by anything in this
task; it was closed by someone else's unrelated work landing in between. Still worth
tracking: consent is synthesized (not separately collected) the moment a handle shows up in
an upload, which was always the flagged, not-fully-resolved product question.

### Task 5.3 (consent-gate the coding_handles reads) — the target moved

At the time the original task was written, `interventions.py`'s `coding_nudge` read
`student.coding_handles` directly. By the time this version was built, that call site had
already been rearchitected (independently) to read a `derived_signals` cache instead
(`derived_signals["coding_activity"]`, populated by `backend/collector.py` via
`backend/adapters/` + `backend/normalize.py`) — a signal-freshness/TTL model, not a
consent model. Those are different concerns (data staleness vs. whether the student agreed
to be tracked at all), so the consent gate still has a real job to do: it now sits
**alongside** the derived-signal check, not in place of a raw-field read that no longer
exists there.

Three read sites ended up gated, one more than originally scoped:
1. `interventions.py`'s `coding_nudge` — added a `resolve_active_handles()` check next to
   the existing `derived_signals` check; fires only if both agree.
2. `main.py`'s `GET /students/{id}/coding` — this one *still* read `student.coding_handles`
   directly, unaffected by the other agent's refactor; replaced with
   `resolve_active_handles()`, as originally planned.
3. **`backend/collector.py`'s `run_collection()`** (not in original scope — this module
   didn't exist when Group 5/6 was written) — this is the function that actually iterates
   `student.coding_handles` and fetches/writes derived signals; gating it means a revoked
   platform stops being fetched *at all*, not just stops contributing to `coding_nudge`.
   Added an optional `platform_links` param; omitting it preserves prior behavior exactly
   (existing `test_collector.py` case passes unmodified).

### Task 6.1 (`PolicyConfig` defaults) — six became seven, one renamed, weights changed shape

Verified against the *current* file contents (not memory, and not the original task's
assumed values, which were stale by the time this was built):
- `risk.py`'s `WEIGHTS` is now a 5-term dict (`score_gap: 0.35, syllabus_behind: 0.24,
  activity_recency: 0.22, trend: 0.14, coding_activity: 0.05`), not the original 4-term one
  — `coding_activity` is new, and the other three weights were rebalanced to compensate.
  `PolicyConfig.risk_weights` matches this 5-term shape.
- `interventions.py`'s `git_nudge` no longer reads `days_since_commit` at all — it checks a
  `derived_signals["github_activity"]` value against a threshold of `10`. Renamed the
  config field from `days_since_commit_threshold` to `github_inactivity_threshold` to match
  what the code actually does now; the numeric default (`10`) is unchanged.
- `days_since_active_threshold` (5), `days_since_linkedin_threshold` (14),
  `coding_inactivity_threshold` (7 — now compared against a derived signal, not a raw
  field, but same value), `internship_match_min` (0.5), and `risk_activity_divisor` (7.0)
  are all unchanged from the original plan.

## Per-file diff summary

| File | Change |
|---|---|
| `backend/risk.py` | **Prerequisite fix**: added missing `Optional` import. Then: gained a `policy: Optional[PolicyConfig]` param; `WEIGHTS` module dict removed (nothing else imported it, verified), weighted-term computation and `activity_recency`'s divisor now read `policy.risk_weights` / `policy.risk_activity_divisor`. Left the other agent's `Explanation`/`FeatureContribution`/banding logic untouched. |
| `backend/models.py` | Added `PlanExplanation`, `PlanDecisionTrace`, `PlatformLink`, `PolicyConfig` — all additive, no existing class touched. |
| `backend/store.py` | Added `plan_traces: List[PlanDecisionTrace]`, `add_plan_trace()`, `get_plan_traces()`; extended `dump_json`/`load_json` (`.get("plan_traces", [])` default so old persist files still load). Did not touch the existing `_decision_traces`/`append_trace`/signal-store methods. |
| `backend/platform_links.py` (new) | `PlatformLinkStore`, `resolve_active_handles()`, `synthesize_consent_from_handles()`. No LLM imports; added to the guardrail. |
| `backend/policy.py` (new) | `get_policy(tenant_id="default")`, `load_policy_file(path)`, one module-level default. No LLM imports; added to the guardrail. |
| `backend/interventions.py` | Gained `platform_links`/`policy` params. Four thresholds now read from `policy` (`days_since_active_threshold`, `github_inactivity_threshold`, `days_since_linkedin_threshold`, `coding_inactivity_threshold`). `coding_nudge` additionally requires `resolve_active_handles()` to include the signal's platform. Its internal `match_internships(...)` call forwards `policy` too. |
| `backend/internships.py` | Gained a `policy` param; `0.5` literal replaced with `policy.internship_match_min`. |
| `backend/collector.py` | `run_collection()` gained an optional `platform_links` param; when provided, skips any `(platform, handle)` without an active consent link before calling the adapter or writing raw/derived signals. |
| `backend/main.py` | Wired a module-level `platform_links = PlatformLinkStore()`. `ingest_cohort` calls `synthesize_consent_from_handles()` per ingested student. `GET /students/{id}/coding` now resolves through `resolve_active_handles()`. `generate_plan_for_student` passes `platform_links` into `evaluate_interventions` and writes a `PlanDecisionTrace` (via `store.add_plan_trace`) stamped with `get_policy().version`, alongside the pre-existing raw-dict `store.append_trace(...)` call (left untouched). |
| `tests/test_no_llm_in_core.py` | Added `backend/platform_links.py` and `backend/policy.py` to `DETERMINISTIC_CORE_FILES`. |

## New/updated tests

- `tests/test_platform_links.py` (new, 14 cases): store CRUD, `is_active` boundary cases,
  `resolve_active_handles` (tenant + revocation filtering), `synthesize_consent_from_handles`.
- `tests/test_policy.py` (new, 5 cases): defaults match current hardcoded values
  field-by-field, unknown-tenant fallback, `load_policy_file` merge behavior, custom policy
  shifts `recovery_plan` threshold, custom `risk_weights` shifts the dominant reason.
- `tests/test_behavior.py`: extended `test_coding_nudge_fires_at_seven_days` with an
  explicit active-consent case; added `test_coding_nudge_stops_after_revocation`,
  `test_coding_endpoint_no_handle_after_revocation`,
  `test_match_internships_custom_policy_excludes_partial_match`,
  `test_ingest_writes_one_plan_decision_trace`.
- `tests/test_collector.py`: added `test_run_collection_skips_revoked_consent`.
- `tests/test_store_persistence.py`: `test_dump_and_load_round_trip` now also round-trips a
  `PlanDecisionTrace`.

## Final verification

1. **`python -m pytest -q` → `70 passed, 5 warnings`.** Re-verified via an independent
   `git clone --branch groups5-6-v2` into a scratch directory (not just the working
   directory) — same result.
2. **No LLM SDK imports**: `backend/platform_links.py` imports are `datetime`, `typing`,
   `backend.models` only; `backend/policy.py` imports are `json`, `typing`,
   `backend.models` only. Re-grepped all touched/new backend files for
   `openai|anthropic|google.generativeai|langchain` — zero matches. Both new modules are in
   `DETERMINISTIC_CORE_FILES`.
3. **Manual end-to-end walkthrough** (live script against `store`/`platform_links`, not just
   automated tests): ingested a student with a `codeforces` handle → confirmed one active
   `PlatformLink` → seeded a stale `coding_activity` derived signal (30 days) → revoked the
   link → regenerated the plan → confirmed `coding_nudge` did not fire despite the
   still-stale derived signal → confirmed a new `PlanDecisionTrace` was written with
   `decision_type="plan"` and `explanation.config_version == "v1"`. All assertions passed.

## Still-open items (carried over or newly surfaced)

- **Consent-as-upload-presence is still the actual policy**, now genuinely reachable from a
  real Excel upload (via the other agent's `codeforces_handle` column) rather than only from
  test-constructed `StudentState`s. If "was in the uploaded sheet" is not an acceptable
  proxy for "the student consented," that's a product decision to make explicitly, not
  something either round of this work resolved.
- **Two independent trace/explanation systems now coexist** (`DecisionTrace`/`Explanation`
  from the signal-store work, `PlanDecisionTrace`/`PlanExplanation` from this task). They
  serve different purposes today (general audit log with model/config versioning vs.
  plan-generation-specific summary), but having two similarly-named concepts in the same
  codebase is worth consolidating deliberately in a future pass rather than leaving as a
  historical accident of two agents working the same area concurrently.
- Did not touch the other agent's `Explanation`/`DecisionTrace`/`FeatureContribution`/
  `DerivedSignal`/`CodingProfileSnapshot`/`collector.py`/`adapters/` design beyond adding the
  consent gate to `run_collection()` — anything else there was out of this task's scope.

## Definition-of-done checklist

- [x] Pre-existing (baseline) tests pass unchanged; policy thresholds/weights now live in
      `PolicyConfig` with defaults verified against the current file contents.
- [x] `coding_nudge` respects consent: revoked/expired links stop contributing, without a
      live network call in the deterministic core.
- [x] Every `generate_plan_for_student` call (ingest, `/plan/generate`, grading) writes a
      `PlanDecisionTrace` stamped with `config_version`.
- [x] `StudentState.coding_handles` still exists on the model, not removed, and is no
      longer the read path for `evaluate_interventions`'s `coding_nudge` gate, `GET
      /students/{id}/coding`, or `collector.py`'s `run_collection` (when a `platform_links`
      store is supplied).
- [x] Old persist files still load — `dump_json`/`load_json` extended (`plan_traces`
      added, defaulted safely on load).
