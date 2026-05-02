from datetime import datetime
from uuid import uuid4

from db import collections_db as collections


async def triage_symptom(symptom_description: str, owner_id: str | None = None, pet_id: str | None = None, pregnancy_context: bool = False):
    text = symptom_description.lower()
    emergency_terms = ["not moving", "difficulty breathing", "seizure", "collapse", "not eating 24", "severe vomiting", "poison"]
    if any(term in text for term in emergency_terms):
        urgency = "emergency"
    elif pregnancy_context or any(term in text for term in ["off", "scratching", "unknown", "vomit", "pain", "letharg"]):
        urgency = "urgent"
    else:
        urgency = "routine"
    doc = {
        "_id": str(uuid4()),
        "owner_id": owner_id,
        "pet_id": pet_id,
        "symptom_description": symptom_description,
        "urgency_level": urgency,
        "escalated": urgency in ["urgent", "emergency"],
        "created_at": datetime.utcnow(),
    }
    await collections.triage_events.insert_one(doc)
    return doc
