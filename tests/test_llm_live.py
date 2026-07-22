import os
import pytest
from unittest.mock import patch, MagicMock
from backend.models import StudentState, Plan, Intervention
from backend.language import chat_response, phrase_intervention_message

@pytest.mark.skipif(not os.environ.get("GEMINI_API_KEY"), reason="no key")
def test_live_gemini_returns_text_and_sets_used_llm_true():
    # Make a real call with the key
    reply, used_llm = chat_response("Hello, what is a binary tree?", [], api_key=os.environ["GEMINI_API_KEY"])
    assert used_llm is True
    assert reply != ""
    assert len(reply.split()) <= 150

def test_degradation_when_client_raises_exception(monkeypatch):
    # Monkeypatch genai.Client to raise an exception
    # Since it is imported lazily inside language.py, we can patch 'google.genai.Client'
    # Or mock the generate_content call
    from google import genai
    
    def mock_init(*args, **kwargs):
        raise RuntimeError("API key or connection failed")
        
    monkeypatch.setattr(genai, "Client", mock_init)
    
    # Assert chat fallback triggers
    reply, used_llm = chat_response("Hello?", [], api_key="dummy_key")
    assert used_llm is False
    assert "templated fallback" in reply

def test_truncation_and_cleaning():
    from backend.language import clean_and_truncate
    
    raw = "Polaris Mentor:    Hello world.    This has extra   spaces."
    cleaned = clean_and_truncate(raw)
    assert cleaned == "Hello world. This has extra spaces."
    
    long_raw = "word " * 200
    cleaned_long = clean_and_truncate(long_raw)
    assert len(cleaned_long.split()) == 150
