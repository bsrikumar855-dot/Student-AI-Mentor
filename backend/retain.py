"""
Spaced Repetition Module: Run SM-2 spacing algorithm to calculate next review times for student learning topics.
"""

import math
from datetime import datetime, timedelta
from typing import List, Dict, Any
from backend.models import TopicMemory, StudentState

def apply_sm2(topic: TopicMemory, quality: int, today: datetime = None) -> TopicMemory:
    """
    Updates a topic's spaced repetition parameters using the SM-2 algorithm.
    """
    if today is None:
        today = datetime.now()
        
    reps = topic.reps
    interval = topic.interval
    ef = topic.ef

    if quality < 3:
        reps = 0
        interval = 1
    else:
        reps += 1
        if reps == 1:
            interval = 1
        elif reps == 2:
            interval = 6
        else:
            interval = round(interval * ef)
            
    ef = max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    next_review = today + timedelta(days=interval)
    
    return TopicMemory(
        topic=topic.topic,
        learned_on=topic.learned_on,
        ef=ef,
        reps=reps,
        interval=interval,
        next_review=next_review
    )

def recall_estimate(topic: TopicMemory, today: datetime = None) -> float:
    """
    Calculates estimated recall probability using a forgetting curve.
    """
    if today is None:
        today = datetime.now()
        
    days_since_learned = (today - topic.learned_on).days
    days_since_learned = max(0, days_since_learned)
    interval = max(topic.interval, 1)
    return math.exp(-days_since_learned / (interval * 1.4))

def due_topics(state: StudentState, today: datetime = None) -> List[Dict[str, Any]]:
    """
    Finds topics where next_review <= today OR recall < 0.6, sorted weakest-recall first.
    Returns: [{topic, next_review, reps, why}]
    """
    if today is None:
        today = datetime.now()
        
    due = []
    for t in state.topics:
        recall = recall_estimate(t, today)
        is_overdue = t.next_review <= today
        is_low_recall = recall < 0.6
        
        if is_overdue or is_low_recall:
            days_since_learned = (today - t.learned_on).days
            days_since_learned = max(0, days_since_learned)
            due.append({
                "topic": t.topic,
                "next_review": t.next_review,
                "reps": t.reps,
                "recall": recall, # Keep recall internally for sorting
                "why": f"Estimated recall of {recall*100:.0f}% after {days_since_learned} days since topic was learned."
            })
            
    # Sort weakest-recall first
    due.sort(key=lambda x: x["recall"])
    
    # Strip recall before returning to match expected keys exactly
    for d in due:
        d.pop("recall", None)
        
    return due
