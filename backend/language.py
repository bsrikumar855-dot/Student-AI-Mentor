"""
Language Layer: Rephrase risk explanations, messages, and chat interactions.
"""

import os
from typing import Optional, Tuple
from backend.models import StudentState, Plan

def phrase_intervention_message(student: StudentState, plan: Plan, api_key: Optional[str] = None) -> str:
    """
    Phrases an intervention message for the student using an LLM or templated text fallback.
    """
    key = api_key or os.environ.get("POLARIS_LLM_API_KEY")
    if key:
        try:
            # Lazy import of LLM SDK
            import google.generativeai as genai
            genai.configure(api_key=key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            
            reasons_list = [f"- {i.why}" for i in plan.interventions]
            reasons_str = "\n".join(reasons_list)
            prompt = (
                f"You are Polaris, a supportive AI student mentor. Rephrase the following academic intervention "
                f"notification into a encouraging, friendly, and actionable message for the student {student.name}.\n\n"
                f"Issues detected:\n{reasons_str}\n\n"
                f"Keep it concise, supportive, and direct."
            )
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception:
            pass # fallback to templated message

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

def chat_response(prompt: str, history: list, api_key: Optional[str] = None) -> Tuple[str, bool]:
    """
    Handles a chat prompt with an optional LLM. Returns (reply_text, used_llm).
    """
    key = api_key or os.environ.get("POLARIS_LLM_API_KEY")
    if key:
        try:
            # Lazy import of LLM SDK
            import google.generativeai as genai
            genai.configure(api_key=key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            # Simply generate text response
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip(), True
        except Exception:
            pass

    # Templated fallback path
    return f"Polaris Mentor: I received your message: '{prompt}'. As the API key is not configured, I'm responding with this templated fallback.", False

