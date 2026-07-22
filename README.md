# Polaris — Proactive AI Student Mentor

Polaris is a proactive student mentoring system that scores academic risk, schedules study plans, tracks spaced repetition review cards, matches students with internships, and handles student-faculty intervention alerts. 

It is designed with a **deterministic core** running standard Python logic (zero LLM dependencies), coupled with an isolated **natural language layer** that phrases student outreach and handles agent chat.

## Tech Stack
- **Backend**: FastAPI, Uvicorn, Pydantic v2
- **Data & Math**: Pandas, OpenPyXL, JSONSchema
- **Testing**: PyTest

## Phase 1 Verification

To verify the skeleton setup:

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Tests**:
   ```bash
   python -m pytest
   ```
   *Expected output: 9 passed (contracts + LLM checks), 7 skipped (behavior stubs).*

3. **Start the API Server**:
   ```bash
   uvicorn backend.main:app --reload
   ```
   *Note: Every API endpoint returns HTTP 501 Not Implemented in this skeleton phase.*

---

## 3-Person Team Split Plan (Phase 2)

To parallelize development during the hackathon, the work can be split among three members:

### 1. Developer A: Ingestion & Data Store (`ingest.py`, `store.py`, `generate_cohort.py`)
- **Focus**: Data loading, generation, and persistence.
- **Tasks**:
  - Implement synthetic data generation (`generate_cohort.py`) that exports realistic grades, attendance, and activity.
  - Implement ingestion parser (`ingest.py`) to parse Excel spreadsheet data into Pydantic models.
  - Set up in-memory CRUD operations and JSON persistence in `store.py`.

### 2. Developer B: Algorithmic Core (`risk.py`, `predict.py`, `retain.py`, `internships.py`)
- **Focus**: Deterministic rules engines, predictions, and spaced repetition.
- **Tasks**:
  - Implement math-based risk scores using weighted attributes (grades trend, attendance, streak).
  - Implement moving average/linear projection for GPAs.
  - Implement SM-2 algorithm for card reviews.
  - Implement skill & grade matching logic for internship recommendations.

### 3. Developer C: LLM, API, and Frontend Integration (`language.py`, `main.py`, Frontend React)
- **Focus**: Natural language generation, API implementation, and UI.
- **Tasks**:
  - Implement isolated LLM calling in `language.py` with custom prompt formatting, including dynamic text-based template degradation if API keys are missing.
  - Connect FastAPI endpoints in `main.py` to the store and decision components.
  - Build React components for the Student view and the Faculty At-Risk dashboard.
