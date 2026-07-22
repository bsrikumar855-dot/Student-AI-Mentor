# ADR 0003: Align `predict.py` d-fallback to SPEC's `or 14` semantics

**Status**: Accepted
**Date**: 2026-07-22

## Context

SPEC Section 3 defines:

```
d = nearest_exam.days_to_exam or 14
```

Python's `or` operator treats `0` as falsy, so `0 or 14` evaluates to `14`. The implementation at audit time used:

```python
d = student.nearest_exam.days_to_exam if student.nearest_exam else 14
```

This ternary only checks whether `nearest_exam` exists, not whether `days_to_exam` is zero. When an exam exists with `days_to_exam == 0` (exam is today), the code used `d=0` — producing `projected_score = latest` (no slope contribution) — while the SPEC's literal `or` text would fall back to `d=14`, giving a 2-week projection.

The full audit (Section 4, item 1) flagged this as a spec-vs-code text divergence.

## Decision

Align the code to the SPEC's literal `or 14` semantics. The rationale:

1. **SPEC is the source of truth** for this deterministic-core module (Non-Negotiable Architecture Principle #3).
2. A 2-week projection for "exam day" is the more conservative/useful fallback — returning exactly `latest` (a zero-projection-window snapshot) is less actionable for the student's plan.
3. The `days_to_exam == 0` case is an edge scenario that occurs only if the LMS hasn't yet removed a past/current-day exam from the data.

Changed to:

```python
d = (student.nearest_exam.days_to_exam if student.nearest_exam else 0) or 14
```

This faithfully reproduces the SPEC's `or` behavior: when `nearest_exam` is `None` **or** its `days_to_exam` is `0`, `d` falls back to `14`.

## Consequences

- `predict_trends` now produces a non-trivial projection even on exam day (`d=14` instead of `d=0`).
- A new test (`test_predict_trends_d_fallback_at_zero`) guards this exact boundary.
- No API contract breakage — the output shape of `PredictionResult` is unchanged.
