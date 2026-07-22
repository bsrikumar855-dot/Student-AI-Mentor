# Polaris Project Specification (Phase 2 Refined)

Polaris is a proactive AI student mentor designed to ingest LMS data, score academic risk, plan daily study schedules, track progress, and intervene when a student drifts. It runs a deterministic decision core with a separate natural language layer.

---

## Non-Negotiable Architecture Principles

1. **Deterministic Core**: All logic in the decision files (`risk.py`, `predict.py`, `interventions.py`, `retain.py`, `internships.py`, `ingest.py`, `store.py`) must be written in plain Python, using standard algorithms and rules, with **ZERO LLM SDK imports**. The system must run completely with LLMs turned off.
2. **Language Layer isolation**: The `language.py` module is the **ONLY** file allowed to call an LLM SDK. It must gracefully degrade to templated text when no API key is present.
3. **Spec-Driven**: We define inputs, outputs, intents, and acceptance criteria before implementation.

---

## Module Specifications

### 1. Ingest Module (`ingest.py`)
- **Intent**: Extract and structure student LMS data from Excel spreadsheets into `StudentState` schemas.
- **Inputs**: Excel file (`cohort.xlsx` or uploaded file stream).
- **Outputs**: List of `StudentState` objects.
- **Workbook Sheets**:
  - `students(student_id,name,cgpa,attendance,days_since_active,days_since_commit,days_since_linkedin,goals_met_streak,skills[comma-sep])`
  - `scores(student_id,subject,test_no,score)` (long format)
  - `exams(student_id,subject,date,days_to_exam,completion)`
  - `topics(student_id,topic,learned_on,ef,reps,interval,next_review)`

### 2. Risk Scoring Module (`risk.py`)
- **Formula**:
  - `TARGET = 60`
  - `score_gap = mean over subjects of max(0, (TARGET - latest) / TARGET)`
  - `syllabus_behind = nearest_exam ? (1 - completion) * min(7 / max(days_to_exam, 1), 1) : 0`
  - `activity_recency = min(days_since_active / 7, 1)`
  - `trend = mean over subjects (len >= 2, trend[0] > 0) of max(0, (trend[0] - trend[-1]) / trend[0])`
  - `WEIGHTS = score_gap: 0.35, syllabus_behind: 0.25, activity_recency: 0.25, trend: 0.15`
  - `score = round(sum(weight * term) * 100)`
  - `level = Low (<33) / Medium (<66) / High (>=66)`
  - `dominant = name of term with the highest weight * term value`
  - `reasons[0] = "{level} — {human detail for the dominant term, citing real data}"`
  - Add secondary reasons for any other term whose contribution is within 20% of dominant.
- **Output**: `RiskResult` containing `{score, level, reasons, components: {score_gap, syllabus_behind, activity_recency, trend}, computed_at}`

### 3. Prediction Module (`predict.py`)
- **Formula**:
  - `slope = (trend[-1] - trend[0]) / (len - 1)` (if len >= 2, else 0)
  - `d = nearest_exam.days_to_exam or 14`
  - `projected_score = clamp(latest + slope * (d / 7), 0, 100)`
  - `fail_risk = High (<40) / Medium (<55) / Low (>=55)`
  - `why = "{subj}: {latest:.0f}% now, {'+' if slope>=0 else ''}{slope:.0f}/wk -> ~{projected_score:.0f}% at exam"`
  - `projected_gpa = round(mean(projected_score / 10), 2)` (10-point scale)
  - `exam_trend = improving (mean_slope > +0.5) / declining (<-0.5) / stable`
- **Output**: `PredictionResult` containing `{projected_gpa, exam_trend, exam_forecast: [{subject, projected_score, fail_risk, why}], computed_at}`

### 4. Spaced Repetition Module (`retain.py`)
- **SM-2 Algorithm**:
  - `if quality < 3: reps = 0, interval = 1`
  - `else: reps += 1; interval = 1 if reps == 1 else 6 if reps == 2 else round(interval * ef)`
  - `ef = max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))`
  - `next_review = today + interval days`
- **Recall Estimate**:
  - `recall = exp(-days_since_learned / (max(interval, 1) * 1.4))`
- **Due Topics**:
  - Find topics where `next_review <= today OR recall < 0.6`, sorted weakest-recall first.
  - Cites recall% and days since learned.

### 5. Internships Module (`internships.py`)
- **Fit Scoring**: Match student skills and readiness against curated internship vacancies. Fit is calculated based on skill overlap and satisfying the minimum CGPA requirement (10-point scale).
- **Match Output**: `InternshipMatch` containing `{title, company, match, have, missing, why}`
- Sorted by match desc, filtered match >= 0.5. A role is "ready" when match == 1.0.

### 6. Interventions Module (`interventions.py`)
Trigger specific actions based on deterministic threshold violations. Each Intervention kind must map to one of: `{"academic", "career", "recovery", "wellness"}`.
- `recovery_plan`: `days_since_active >= 5`, kind: `recovery`, auto: `true`
- `revision_timetable`: `nearest_exam.days_to_exam <= 7` and `completion < 0.5`, kind: `academic`, auto: `true`
- `weak_topic`: any subject `trend[-1] < trend[-2]`, kind: `academic`, auto: `true`
- `revision_mission`: for each `retain.due_topics(state)`, kind: `academic`, auto: `true`
- `ramp_difficulty`: `goals_met_streak >= 7`, kind: `academic`, auto: `true`
- `git_nudge`: `days_since_commit >= 10`, kind: `career`, auto: `true`
- `linkedin_nudge`: `days_since_linkedin >= 14`, kind: `career`, auto: `true`
- `internship_match`: internships matching any "ready" status (match == 1.0), kind: `career`, auto: `true`
- `flag_at_risk`: `risk.level == 'High'`, kind: `academic`, auto: `false`

### 7. Language Layer (`language.py`)
Isolated LLM SDK calling + python fallback template when API key is missing.
