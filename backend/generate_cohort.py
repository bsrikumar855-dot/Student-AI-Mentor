"""
Cohort Generation: Produce synthetic cohort Excel data for testing the ingestion module.
Specs:
- Intent: Produce synthetic cohort Excel data for testing the ingestion module.
- Inputs: Parameters for number of students, random seed.
- Outputs: Excel file (cohort.xlsx) containing grade logs, attendance, and activity records.
- Acceptance Criteria: Output file must be valid openpyxl/pandas spreadsheet conforming to expected input structure.
"""

def generate_synthetic_cohort(output_path: str, num_students: int = 50, seed: int = 42) -> None:
    """
    Generates synthetic student data and writes it to an Excel file.
    Quotes SPEC:
    'Produce synthetic cohort Excel data for testing the ingestion module.'
    """
    raise NotImplementedError("generate_synthetic_cohort is not implemented.")
