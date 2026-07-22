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
    
    # Return updated topic memory
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
    recall = exp(-days_since_learned / (max(interval, 1) * 1.4))
    """
    if today is None:
        today = datetime.now()
        
    days_since_learned = (today - topic.learned_on).days
    # If the learned_on is in the future, days_since_learned might be negative. Let's clamp to >= 0
    days_since_learned = max(0, days_since_learned)
    
    interval = max(topic.interval, 1)
    return math.exp(-days_since_learned / (interval * 1.4))

def due_topics(state: StudentState, today: datetime = None) -> List[Dict[str, Any]]:
    """
    Finds topics where next_review <= today OR recall < 0.6, sorted weakest-recall first.
    Returns: list of {"topic": str, "recall": float, "why": str}
    """
    if today is None:
        today = datetime.now()
        
    due = []
    for t in state.topics:
        recall = recall_estimate(t, today)
        is_overdue = t.next_review <= today
        is_low_recall = recall < 0.6
        
        if is_overdue or is_low_recall:
            why_reasons = []
            if is_overdue:
                why_reasons.append("next review is overdue")
            if is_low_recall:
                why_reasons.append(f"estimated recall is low ({recall*100:.1f}%)")
            due.append({
                "topic": t.topic,
                "recall": recall,
                "why": f"Topic '{t.topic}' requires review because " + " and ".join(why_reasons) + "."
            })
            
    # Sort weakest-recall first
    due.sort(key=lambda x: x["recall"])
    return due
