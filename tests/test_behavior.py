import pytest
from backend.models import StudentState, Plan, TopicMemory
from backend.ingest import ingest_excel
from backend.risk import calculate_risk
from backend.predict import predict_trends
from backend.interventions import evaluate_interventions
from backend.retain import apply_sm2
from backend.internships import match_internships
from backend.language import phrase_intervention_message, chat_response

@pytest.mark.skip(reason="Phase 1: Skeleton only. Behavior tests are skipped until Phase 2.")
def test_ingest_excel_behavior():
    pass

@pytest.mark.skip(reason="Phase 1: Skeleton only. Behavior tests are skipped until Phase 2.")
def test_calculate_risk_behavior():
    pass

@pytest.mark.skip(reason="Phase 1: Skeleton only. Behavior tests are skipped until Phase 2.")
def test_predict_trends_behavior():
    pass

@pytest.mark.skip(reason="Phase 1: Skeleton only. Behavior tests are skipped until Phase 2.")
def test_evaluate_interventions_behavior():
    pass

@pytest.mark.skip(reason="Phase 1: Skeleton only. Behavior tests are skipped until Phase 2.")
def test_apply_sm2_behavior():
    pass

@pytest.mark.skip(reason="Phase 1: Skeleton only. Behavior tests are skipped until Phase 2.")
def test_match_internships_behavior():
    pass

@pytest.mark.skip(reason="Phase 1: Skeleton only. Behavior tests are skipped until Phase 2.")
def test_language_phrase_fallback():
    pass
