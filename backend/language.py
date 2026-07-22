"""
Language Layer: Rephrase risk explanations, messages, and chat interactions using the unified google-genai SDK or templates.
"""

import os
import re
import logging
from typing import Optional, Tuple
from backend.models import StudentState, Plan

logger = logging.getLogger(__name__)

def clean_and_truncate(text: str) -> str:
    """
    Cleans whitespaces, strips leading role labels, and truncates text to max 150 words.
    """
    if not text:
        return ""
    # Collapse multiple whitespaces/newlines to single space
    text = " ".join(text.split())
    # Remove leading role labels case-insensitively
    text = re.sub(r'^(polaris|polaris mentor|ai mentor|mentor|assistant)\s*:\s*', '', text, flags=re.IGNORECASE)
    # Truncate to 150 words
    words = text.split()
    if len(words) > 150:
        text = " ".join(words[:150])
    return text.strip()

def phrase_intervention_message(student: StudentState, plan: Plan, api_key: Optional[str] = None) -> Tuple[str, bool]:
    """
    Phrases an intervention message for the student using the unified GenAI SDK or templated fallback.
    Returns: (message_text, used_llm)
    """
    key = api_key or os.getenv("GEMINI_API_KEY")
    
    if key:
        try:
            # Lazy import to keep deterministic core clean of LLM SDK imports
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=key)
            model_name = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
            
            reasons_str = "\n".join([f"- {i.why}" for i in plan.interventions])
            prompt = (
                f"You are Polaris, a supportive AI student mentor writing a message to {student.name}. "
                f"Status: {student.risk.level if student.risk else 'Stable'}. "
                f"Gaps identified:\n{reasons_str}\n"
                "Write a warm, brief message advising them of these gaps and encouraging next actions. "
                "Do not start your output with role labels."
            )
            
            resp = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    max_output_tokens=400,
                    system_instruction="Politely mentor the student about academic gaps. Max 150 words. No role labels."
                )
            )
            if resp and resp.text:
                cleaned = clean_and_truncate(resp.text)
                if cleaned:
                    return cleaned, True
        except Exception as e:
            logger.error(f"Error in phrase_intervention_message LLM execution: {str(e)}")

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
        
    return msg, False

def chat_response(prompt: str, history: list, api_key: Optional[str] = None) -> Tuple[str, bool]:
    """
    Handles a chat prompt with the unified GenAI SDK or templated fallback.
    Returns: (reply_text, used_llm)
    """
    key = api_key or os.getenv("GEMINI_API_KEY")
    
    if key:
        try:
            # Lazy import to keep core decision logic free of LLM imports
            from google import genai
            from google.genai import types
            
            # Basic prompt injection check
            lower_prompt = prompt.lower()
            if any(term in lower_prompt for term in ["ignore", "override", "system instruction", "system prompt"]):
                return "Polaris: I'm here to support your study goals. Let's keep our conversation focused on academic mentorship.", True
                
            client = genai.Client(api_key=key)
            model_name = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
            
            resp = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    max_output_tokens=400,
                    system_instruction="You are Polaris, a friendly AI student mentor. Keep advice brief, safe, under 150 words. No role labels."
                )
            )
            if resp and resp.text:
                cleaned = clean_and_truncate(resp.text)
                if cleaned:
                    return cleaned, True
        except Exception as e:
            logger.error(f"Error in chat_response LLM execution: {str(e)}")

    # Templated fallback path
    return f"Polaris Mentor: I received your message: '{prompt}'. As the API key is not configured, I'm responding with this templated fallback.", False
