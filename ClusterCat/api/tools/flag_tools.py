from datetime import datetime

from db import collections


async def flag_external_medication(owner_id: str, pet_id: str, workflow_id: str, medication_description: str = "unknown external prescription"):
    doc = {
        "owner_id": owner_id,
        "pet_id": pet_id,
        "workflow_id": workflow_id,
        "medication_description": medication_description,
        "source": "external",
        "status": "requires_verification",
        "created_at": datetime.utcnow(),
    }
    result = await collections.medication_flags.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def flag_pregnancy(owner_id: str, pet_id: str, workflow_id: str):
    doc = {
        "owner_id": owner_id,
        "pet_id": pet_id,
        "workflow_id": workflow_id,
        "memory_type": "pregnancy_flag",
        "content": "Possible pregnancy mentioned by owner; senior vet approval required before confirmation.",
        "created_at": datetime.utcnow(),
    }
    result = await collections.agent_memories.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc
