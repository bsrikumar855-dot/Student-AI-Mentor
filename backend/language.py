"""
Language Layer: Rephrase risk explanations, messages, and chat interactions.
Specs:
- Intent: Rephrase risk explanations, messages, and chat interactions.
- Inputs: StudentState, Plan, prompt text.
- Outputs: Formatted/personalized string message.
- Acceptance Criteria: Uses LLM SDK when configured with keys; degrades to a deterministic template fallback when keys are absent.
"""

from typing import Optional
from backend.models import StudentState, Plan

def phrase_intervention_message(student: StudentState, plan: Plan, api_key: Optional[str] = None) -> str:
    """
    Phrases an intervention message for the student using an LLM or templated text fallback.
    Quotes SPEC:
    'Uses LLM SDK when configured with keys; degrades to a deterministic template fallback when keys are absent.'
    """
    raise NotImplementedError("phrase_intervention_message is not implemented.")

def chat_response(prompt: str, history: list, api_key: Optional[str] = None) -> str:
    """
    Handles a chat prompt with an optional LLM.
    Quotes SPEC:
    'Uses LLM SDK when configured with keys; degrades to a deterministic template fallback when keys are absent.'
    """
    raise NotImplementedError("chat_response is not implemented.")
