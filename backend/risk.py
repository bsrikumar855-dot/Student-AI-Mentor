"""
Risk Scoring Module: Compute a deterministic risk score using weighted factors like attendance, grade trends, and activity.
Specs:
- Intent: Compute a deterministic risk score using weighted factors like attendance, grade trends, and activity.
- Inputs: StudentState.
- Outputs: RiskState object containing risk score (0-100), level (Low, Medium, High), and list of triggering factors.
- Acceptance Criteria: Repeatable mathematical scoring with zero external calls. Score increases as attendance drops or grade trend becomes negative.
"""

from typing import Dict, Any
from backend.models import StudentState

def calculate_risk(student: StudentState) -> Dict[str, Any]:
    """
    Computes a risk score and risk level for a student.
    Quotes SPEC:
    'Compute a deterministic risk score using weighted factors like attendance, grade trends, and activity.'
    """
    raise NotImplementedError("calculate_risk is not implemented.")
