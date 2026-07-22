"""
Language Layer: Rephrase risk explanations, messages, and chat interactions.
"""

from typing import Optional
from backend.models import StudentState, Plan

def phrase_intervention_message(student: StudentState, plan: Plan, api_key: Optional[str] = None) -> str:
    """
    Phrases an intervention message for the student using an LLM or templated text fallback.
    """
    if api_key:
        # TODO Phase 3
        # Lazy import of LLM SDK goes here
        pass

    # Templated fallback path
    if plan.interventions:
        reasons_list = [f"- {i.why}" for i in plan.interventions]
        reasons_str = "\n".join(reasons_list)
        msg = (
            f"Hi {student.name}, this is Polaris. We've detected some areas that need attention:\n"
            f"{reasons_str}\n"
            f"Let's work together to address these and keep you on track!"
        )
    else:
        msg = f"Hi {student.name}, this is Polaris. Your academic track looks stable! Keep up the great work."
        
    return msg

def chat_response(prompt: str, history: list, api_key: Optional[str] = None) -> str:
    """
    Handles a chat prompt with an optional LLM.
    """
    if api_key:
        # TODO Phase 3
        # Lazy import of LLM SDK goes here
        pass

    # Templated fallback path
    return f"Polaris Mentor: I received your message: '{prompt}'. As the API key is not configured, I'm responding with this templated fallback."
