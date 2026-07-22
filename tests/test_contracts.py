import os
import json
import jsonschema
import pytest

@pytest.fixture
def student_state_schema():
    schema_path = os.path.join(os.path.dirname(__file__), "../specs/contracts/student_state.schema.json")
    with open(schema_path, "r") as f:
        return json.load(f)

@pytest.fixture
def student_state_mock():
    mock_path = os.path.join(os.path.dirname(__file__), "../mocks/student_state.json")
    with open(mock_path, "r") as f:
        return json.load(f)

@pytest.fixture
def plan_schema():
    schema_path = os.path.join(os.path.dirname(__file__), "../specs/contracts/plan.schema.json")
    with open(schema_path, "r") as f:
        return json.load(f)

@pytest.fixture
def plan_mock():
    mock_path = os.path.join(os.path.dirname(__file__), "../mocks/plan.json")
    with open(mock_path, "r") as f:
        return json.load(f)

def test_student_state_contract(student_state_mock, student_state_schema):
    """
    Validates that the mock student state matches the JSON Schema contract.
    """
    # Using draft-07 validator or default
    jsonschema.validate(instance=student_state_mock, schema=student_state_schema)

def test_plan_contract(plan_mock, plan_schema):
    """
    Validates that the mock plan matches the JSON Schema contract.
    """
    jsonschema.validate(instance=plan_mock, schema=plan_schema)
