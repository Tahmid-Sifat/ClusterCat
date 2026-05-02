from datetime import datetime
from uuid import uuid4

from db import collections_db as collections


async def send_sms_or_mock(phone: str, body: str, workflow_id: str | None = None):
    doc = {"_id": str(uuid4()), "phone": phone, "body": body, "workflow_id": workflow_id, "status": "mock_sent", "created_at": datetime.utcnow()}
    await collections.mock_sms.insert_one(doc)
    return doc


async def create_staff_handoff(owner_id: str, pet_id: str, workflow_id: str, note: str, assigned_staff_id: str = "staff_priya"):
    doc = {
        "_id": str(uuid4()),
        "owner_id": owner_id,
        "pet_id": pet_id,
        "workflow_id": workflow_id,
        "assigned_staff_id": assigned_staff_id,
        "note": note,
        "status": "open",
        "created_at": datetime.utcnow(),
    }
    await collections.staff_handoffs.insert_one(doc)
    return doc
