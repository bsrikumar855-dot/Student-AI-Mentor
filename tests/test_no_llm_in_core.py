import os
import ast
import pytest

DETERMINISTIC_CORE_FILES = [
    "backend/risk.py",
    "backend/predict.py",
    "backend/interventions.py",
    "backend/retain.py",
    "backend/internships.py",
    "backend/ingest.py",
    "backend/store.py",
]

LLM_MODULES = {
    "openai",
    "anthropic",
    "google.generativeai",
    "google-generativeai",
    "langchain",
    "transformers",
    "cohere",
    "google",
    "vertexai",
    "backend.language",
    "language",
}

def get_imports(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=file_path)
    
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imports.append(name.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)
    return imports

@pytest.mark.parametrize("core_file", DETERMINISTIC_CORE_FILES)
def test_no_llm_imports_in_core(core_file):
    """
    Asserts that deterministic-core files do not import any LLM SDK or the language layer.
    """
    project_root = os.path.dirname(os.path.dirname(__file__))
    full_path = os.path.join(project_root, core_file)
    
    assert os.path.exists(full_path), f"File {core_file} does not exist"
    
    imported_modules = get_imports(full_path)
    for imp in imported_modules:
        # Check if the imported module matches or starts with any of the prohibited LLM modules
        for prohibited in LLM_MODULES:
            assert not imp.startswith(prohibited), (
                f"Prohibited import '{imp}' found in deterministic core file '{core_file}'"
            )
