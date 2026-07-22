# Polaris Project Specification

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
- **Outputs**: Dictionary/Pydantic representation of `StudentState`.
- **Acceptance Criteria**: Properly parses tables, handles missing columns gracefully, converts dates to ISO format, and validates structure.

### 2. Risk Scoring Module (`risk.py`)
- **Intent**: Compute a deterministic risk score using weighted factors like attendance, grade trends, and activity.
- **Inputs**: `StudentState`.
- **Outputs**: `RiskState` object containing risk score (0-100), level (Low, Medium, High), and list of triggering factors.
- **Acceptance Criteria**: Repeatable mathematical scoring with zero external calls. Score increases as attendance drops or grade trend becomes negative.

### 3. Prediction Module (`predict.py`)
- **Intent**: Project GPA trends and exam readiness based on historical scores and completion progress.
- **Inputs**: `StudentState`.
- **Outputs**: Projected GPA and exam completion trends.
- **Acceptance Criteria**: Calculates projected grade trends using regression or simple moving averages.

### 4. Interventions Module (`interventions.py`)
- **Intent**: Trigger specific actions (e.g., peer tutoring, faculty alerts) based on deterministic threshold violations.
- **Inputs**: `StudentState`, current risk evaluation.
- **Outputs**: List of active/triggered interventions.
- **Acceptance Criteria**: Evaluates rules (e.g., risk > 70 triggers immediate faculty intervention; attendance < 75% triggers alert).

### 5. Spaced Repetition Module (`retain.py`)
- **Intent**: Run SM-2 spacing algorithm to calculate next review times for student learning topics.
- **Inputs**: `TopicMemory` state, student response quality (0-5).
- **Outputs**: Updated `TopicMemory` state.
- **Acceptance Criteria**: Correctly computes new ease factor, repetition count, and interval according to SM-2 formula.

### 6. Internships Module (`internships.py`)
- **Intent**: Match student skills and readiness against curated internship vacancies.
- **Inputs**: Student skills list, CGPA, `internships.json` data.
- **Outputs**: Sorted list of matching internship positions with a calculated fit score.
- **Acceptance Criteria**: Deterministic scoring based on matching skills and meeting minimum CGPA requirements.

### 7. Language Layer (`language.py`)
- **Intent**: Rephrase risk explanations, messages, and chat interactions.
- **Inputs**: `StudentState`, `Plan`, prompt text.
- **Outputs**: Formatted/personalized string message.
- **Acceptance Criteria**: Uses LLM SDK when configured with keys; degrades to a deterministic template fallback when keys are absent.

### 8. Data Store Module (`store.py`)
- **Intent**: In-memory storage for active student states, tasks, and completion streaks.
- **Inputs**: CRUD operations on student states.
- **Outputs**: Retrieved student records and plans.
- **Acceptance Criteria**: Fast retrieval, optional persistence via JSON dump.

### 9. Cohort Generation (`generate_cohort.py`)
- **Intent**: Produce synthetic cohort Excel data for testing the ingestion module.
- **Inputs**: Parameters for number of students, random seed.
- **Outputs**: Excel file (`cohort.xlsx`) containing grade logs, attendance, and activity records.
- **Acceptance Criteria**: Output file must be valid openpyxl/pandas spreadsheet conforming to expected input structure.
