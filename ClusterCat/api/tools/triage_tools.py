from datetime import datetime

from db import collections


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
        "owner_id": owner_id,
        "pet_id": pet_id,
        "symptom_description": symptom_description,
        "urgency_level": urgency,
        "escalated": urgency in ["urgent", "emergency"],
        "created_at": datetime.utcnow(),
    }
    result = await collections.triage_events.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc
