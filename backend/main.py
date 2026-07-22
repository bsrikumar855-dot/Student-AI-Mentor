from fastapi import FastAPI, HTTPException, UploadFile, status
from typing import List, Dict, Any

app = FastAPI(
    title="Polaris API",
    description="Proactive AI student mentor backend services (Phase 1 Stub)",
    version="1.0.0"
)

@app.post("/ingest", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def ingest_cohort(file: UploadFile):
    """
    Uploads an LMS Excel spreadsheet, ingests student data, and stores the cohort.
    Returns 501 Not Implemented.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="POST /ingest is not implemented."
    )

@app.get("/students", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def list_students():
    """
    Retrieves the list of students with basic info: id, name, risk status.
    Returns 501 Not Implemented.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="GET /students is not implemented."
    )

@app.get("/students/{student_id}/state", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_student_state(student_id: str):
    """
    Retrieves the complete StudentState for the specified student.
    Returns 501 Not Implemented.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="GET /students/{id}/state is not implemented."
    )

@app.get("/students/{student_id}/plan", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_student_plan(student_id: str):
    """
    Retrieves the academic risk status, active interventions, and daily targets (Plan) for a student.
    Returns 501 Not Implemented.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="GET /students/{id}/plan is not implemented."
    )

@app.post("/students/{student_id}/tasks/{task_id}/complete", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def complete_task(student_id: str, task_id: str):
    """
    Marks a specific task in the daily targets as completed.
    Returns 501 Not Implemented.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="POST /students/{id}/tasks/{tid}/complete is not implemented."
    )

@app.post("/chat", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def chat_interaction(payload: Dict[str, Any]):
    """
    Sends a chat message to the Polaris mentor agent.
    Returns 501 Not Implemented.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="POST /chat is not implemented."
    )
