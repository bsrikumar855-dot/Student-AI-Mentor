"""
Ingest Module: Extract and structure student LMS data from Excel spreadsheets into StudentState schemas.
Specs:
- Intent: Extract and structure student LMS data from Excel spreadsheets into StudentState schemas.
- Inputs: Excel file (cohort.xlsx or uploaded file stream).
- Outputs: Dictionary/Pydantic representation of StudentState.
- Acceptance Criteria: Properly parses tables, handles missing columns gracefully, converts dates to ISO format, and validates structure.
"""

from typing import BinaryIO, List
from backend.models import StudentState

def ingest_excel(file_content: BinaryIO) -> List[StudentState]:
    """
    Parses student records from Excel spreadsheet and converts them to list of StudentStates.
    Quotes SPEC:
    'Extract and structure student LMS data from Excel spreadsheets into StudentState schemas.'
    """
    raise NotImplementedError("ingest_excel is not implemented.")
