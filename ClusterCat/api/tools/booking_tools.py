from datetime import datetime, timedelta
from uuid import uuid4

from db.connection import RETURN_DOCUMENT_AFTER
from db import collections_db as collections


async def lock_slot(staff_id: str, slot: str, workflow_id: str):
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    lock = await collections.slot_locks.find_one_and_update(
        {"staff_id": staff_id, "slot": slot},
        {"$setOnInsert": {"staff_id": staff_id, "slot": slot, "workflow_id": workflow_id, "expires_at": expires_at, "created_at": datetime.utcnow()}},
        upsert=True,
        return_document=RETURN_DOCUMENT_AFTER,
    )
    return lock


async def create_appointment(owner_id: str, pet_id: str, service_id: str, staff_id: str, slot: str, notes: str, status: str = "pending_vet_approval"):
    doc = {
        "_id": str(uuid4()),
        "owner_id": owner_id,
        "pet_id": pet_id,
        "service_id": service_id,
        "staff_id": staff_id,
        "slot": slot,
        "status": status,
        "notes": notes,
        "created_at": datetime.utcnow(),
    }
    await collections.appointments.insert_one(doc)
    return doc


async def first_available_slot(staff_id: str = "staff_priya"):
    staff = await collections.staff.find_one({"_id": staff_id})
    slots = staff.get("available_slots", []) if staff else []
    return slots[0] if slots else (datetime.utcnow() + timedelta(days=1)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat()
