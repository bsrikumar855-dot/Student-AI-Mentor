"""
Internships Module: Match student skills and readiness against curated internship vacancies.
"""

from typing import List, Dict, Any

def match_internships(skills: List[str], cgpa: float, internships_db: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Computes a match score and filters internship vacancies based on student skill overlap and CGPA criteria.
    If CGPA >= min_cgpa:
      If student has all required_skills, status is 'ready'.
      If student has some required_skills, status is 'eligible'.
      Otherwise status is 'needs_skills'.
    If CGPA < min_cgpa, status is 'not_eligible'.
    """
    matches = []
    student_skills_set = {s.lower() for s in skills}
    
    for item in internships_db:
        min_cgpa = item.get("min_cgpa", 0.0)
        req_skills = item.get("required_skills", [])
        req_skills_lower = [s.lower() for s in req_skills]
        
        if cgpa < min_cgpa:
            status = "not_eligible"
            fit_score = 0.0
            why = f"CGPA {cgpa} is below the minimum required CGPA of {min_cgpa}."
        else:
            if not req_skills:
                overlap = 1.0
            else:
                matched_count = sum(1 for s in req_skills_lower if s in student_skills_set)
                overlap = matched_count / len(req_skills)
            
            fit_score = round(overlap * 100.0, 1)
            
            if overlap == 1.0:
                status = "ready"
                why = "Student meets CGPA and possesses all required skills."
            elif overlap > 0.0:
                status = "eligible"
                why = f"Student meets CGPA and possesses {int(overlap * len(req_skills))}/{len(req_skills)} required skills."
            else:
                status = "needs_skills"
                why = "Student meets CGPA but lacks all required skills."
                
        matches.append({
            "title": item.get("title"),
            "company": item.get("company"),
            "fit_score": fit_score,
            "status": status,
            "why": why
        })
        
    # Sort by fit_score descending
    matches.sort(key=lambda x: x["fit_score"], reverse=True)
    return matches
