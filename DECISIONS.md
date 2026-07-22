# Decisions Registry — Polaris

This document tracks all high-level design decisions, architectural alignments, and resolution of spec-vs-code discrepancies.

## 1. Data Store Load Resilience (D1)
- **Problem**: Any load error in `InMemoryStore.load_json` would silently wipe existing in-memory state.
- **Decision**: Implemented all-or-nothing transactional semantics. If loading fails due to malformed schema or invalid JSON, return immediately without overwriting `_students`, `_plans`, or `audit_log`.

## 2. Auto-Intervention Flags (ADR 0002)
- **Problem**: Discrepancies existed regarding which intervention rules execute automatically vs human-in-the-loop.
- **Decision**: Retained the specification's default layout: all 9 interventions trigger with `auto=True` except `flag_at_risk`, which is marked `auto=False`. Human faculty members approve/override `auto=False` records.

## 3. Ingest Workbook Sheets (ADR 0001)
- **Problem**: Ambiguity between a separate "syllabus" sheet and the 4 canonical sheets.
- **Decision**: Ingest reads exclusively from the 4-sheet model: `students`, `scores`, `exams`, and `topics`. 

## 4. Exam Forecast Contract completion (PR #6)
- **Problem**: `ExamForecast` model was missing `fail_risk` and `why` fields documented in SPEC Section 3.
- **Decision**: Added `fail_risk: Literal["Low", "Medium", "High"]` and `why: str` to `ExamForecast` class structure, matching schema, mocks, and tests.

## 5. Days-to-Exam Fallback (PR #6 / ADR 0003)
- **Problem**: SPEC states `d = nearest_exam.days_to_exam or 14`, but the ternary in `predict.py` checked if nearest_exam existed, using `0` when nearest_exam existed.
- **Decision**: Aligned to literal SPEC `or 14` semantics. When days_to_exam is 0, the value falls back to `14`.

## 6. reasons[] Subject Naming Specificity (Remediation v2)
- **Problem**: Risk reason strings were generic, not citing which subjects triggered the risk.
- **Decision**: Refactored `risk.py` reasons calculation to build human-readable detail strings citing specific subjects by name.

## 7. GradeRequest/ReviewRequest Location (Remediation v2)
- **Problem**: FastAPI request classes were declared in the routing layer `main.py`.
- **Decision**: Moved `GradeRequest` and `ReviewRequest` to `backend/models.py` alongside other domain entities for cleaner architecture layers.

## 8. Language Layer LLM Integration (Remediation v2)
- **Problem**: `language.py` stubs did not implement actual LLM SDK logic or safety fallbacks.
- **Decision**: Wired `google.generativeai` with lazy imports. Handled failover to templated text fallbacks on any network/credentials failure, and returned `used_llm` status dynamically.
