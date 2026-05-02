from datetime import datetime

from db import collections


async def send_sms_or_mock(phone: str, body: str, workflow_id: str | None = None):
    doc = {"phone": phone, "body": body, "workflow_id": workflow_id, "status": "mock_sent", "created_at": datetime.utcnow()}
    result = await collections.mock_sms.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def create_staff_handoff(owner_id: str, pet_id: str, workflow_id: str, note: str, assigned_staff_id: str = "staff_priya"):
    doc = {
        "owner_id": owner_id,
        "pet_id": pet_id,
        "workflow_id": workflow_id,
        "assigned_staff_id": assigned_staff_id,
        "note": note,
        "status": "open",
        "created_at": datetime.utcnow(),
    }
    result = await collections.staff_handoffs.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc
