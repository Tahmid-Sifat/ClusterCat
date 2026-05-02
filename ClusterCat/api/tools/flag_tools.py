from datetime import datetime
from uuid import uuid4

from db import collections_db as collections


async def flag_external_medication(owner_id: str, pet_id: str, workflow_id: str, medication_description: str = "unknown external prescription"):
    doc = {
        "_id": str(uuid4()),
        "owner_id": owner_id,
        "pet_id": pet_id,
        "workflow_id": workflow_id,
        "medication_description": medication_description,
        "source": "external",
        "status": "requires_verification",
        "created_at": datetime.utcnow(),
    }
    await collections.medication_flags.insert_one(doc)
    return doc


async def flag_pregnancy(owner_id: str, pet_id: str, workflow_id: str):
    doc = {
        "_id": str(uuid4()),
        "owner_id": owner_id,
        "pet_id": pet_id,
        "workflow_id": workflow_id,
        "memory_type": "pregnancy_flag",
        "content": "Possible pregnancy mentioned by owner; senior vet approval required before confirmation.",
        "created_at": datetime.utcnow(),
    }
    await collections.agent_memories.insert_one(doc)
    return doc
