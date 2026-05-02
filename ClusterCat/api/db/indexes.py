from db import collections_db as collections


async def create_indexes():
    await collections.owners.create_index("phone", unique=True)
    await collections.pets.create_index("owner_id")
    await collections.appointments.create_index([("staff_id", 1), ("slot", 1)], unique=True)
    await collections.agent_workflows.create_index([("owner_id", 1), ("status", 1), ("updated_at", -1)])
    await collections.knowledge_chunks.create_index("tags")
    await collections.retrieval_feedback.create_index("created_at")
    await collections.triage_events.create_index("created_at")
    await collections.medication_flags.create_index("workflow_id")
