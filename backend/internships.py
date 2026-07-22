"""
Internships Module: Match student skills and readiness against curated internship vacancies.
"""

from typing import List, Dict, Any, Optional
from backend.models import InternshipMatch, PolicyConfig
from backend import policy as policy_module

def match_internships(
    skills: List[str],
    cgpa: float,
    internships_db: List[Dict[str, Any]],
    policy: Optional[PolicyConfig] = None,
) -> List[InternshipMatch]:
    """
    Computes matches based on skill overlap and filters by match score >= policy.internship_match_min
    and meeting CGPA requirement.
    """
    if policy is None:
        policy = policy_module.get_policy()

    matches = []
    student_skills_set = {s.lower() for s in skills}
    
    for item in internships_db:
        # Get required skills (accept 'requires' or 'required_skills')
        req = item.get("requires") or item.get("required_skills") or []
        if isinstance(req, str):
            req = [s.strip() for s in req.split(",") if s.strip()]
            
        req_set = {s.lower() for s in req}
        have_skills = list(req_set.intersection(student_skills_set))
        missing_skills = list(req_set.difference(student_skills_set))
        
        min_cgpa = item.get("min_cgpa", 0.0)
        
        # Check CGPA eligibility
        if cgpa < min_cgpa:
            continue
            
        if not req:
            match_score = 1.0
        else:
            match_score = round(len(have_skills) / len(req), 2)
            
        if match_score < policy.internship_match_min:
            continue
            
        # Reconstruct standard skill capitalization from item
        have_list = [s for s in req if s.lower() in student_skills_set]
        missing_list = [s for s in req if s.lower() not in student_skills_set]
        
        if match_score == 1.0:
            why = f"meets all {len(req)} skills"
        else:
            why = f"{len(missing_list)} gap(s): {', '.join(missing_list)}"
            
        matches.append(InternshipMatch(
            title=item.get("title", ""),
            company=item.get("company", ""),
            match=match_score,
            have=have_list,
            missing=missing_list,
            why=why
        ))
        
    # Sort by match desc
    matches.sort(key=lambda x: x.match, reverse=True)
    return matches
