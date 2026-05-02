from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

from db import collections
from db.indexes import create_indexes


POLICIES = [
    ("All pets must have up-to-date vaccination records before any non-emergency appointment", ["booking", "vaccination"]),
    ("Pregnant animals require senior vet approval before any treatment, procedure, or prescription", ["pregnancy", "approval"]),
    ("Dogs with known allergies must be flagged; any medication needs vet approval before use", ["allergy", "medication"]),
    ("External prescriptions must be noted and verified before the animal is treated", ["external_medication", "verification"]),
    ("Aggressive behaviour must be escalated to senior staff immediately", ["behaviour", "escalation"]),
    ("Medical emergencies must be escalated immediately; no medical advice or assessment", ["emergency", "safety"]),
    ("Any ambiguous or potentially serious symptom must be escalated; always over-escalate", ["triage", "safety"]),
    ("Out-of-hours medical queries must be directed to the emergency vet line", ["out_of_hours", "emergency"]),
    ("Slot locking is required; no two appointments can be confirmed for the same vet at the same time", ["booking", "slot_lock"]),
]


async def seed():
    await create_indexes()
    for collection in [
        collections.owners,
        collections.pets,
        collections.services,
        collections.staff,
        collections.knowledge_chunks,
    ]:
        await collection.delete_many({})

    now = datetime.utcnow()
    staff_docs = [
        {"_id": "staff_priya", "name": "Dr. Priya Mehta", "role": "senior vet", "specialisms": ["allergies", "pregnancy", "complex cases"], "available_slots": _slots(now, 2)},
        {"_id": "staff_james", "name": "Dr. James Osei", "role": "vet", "specialisms": ["general practice", "wellness exams", "vaccinations"], "available_slots": _slots(now, 3)},
        {"_id": "staff_fatima", "name": "Nurse Fatima", "role": "nurse", "specialisms": ["triage support", "post-visit follow-ups"], "available_slots": _slots(now, 4)},
        {"_id": "staff_claire", "name": "Reception Manager Claire", "role": "reception manager", "specialisms": ["human escalations", "complaints", "out-of-hours callbacks"], "available_slots": _slots(now, 5)},
    ]
    for doc in staff_docs:
        await collections.staff.insert_one(doc)

    services = [
        "Wellness Exam",
        "Vaccination Check",
        "Skin Allergy Consultation",
        "Pregnancy Assessment",
        "Post-Surgery Follow-Up",
        "Dental Check",
        "Emergency Triage Slot",
        "Senior Pet Health Screen",
        "Parasite and Flea Treatment",
        "Microchipping",
    ]
    for name in services:
        await collections.services.insert_one({
            "_id": name.lower().replace(" ", "_").replace("-", "_"),
            "name": name,
            "duration_minutes": 30 if name != "Emergency Triage Slot" else 15,
            "assigned_staff_ids": ["staff_priya"] if "Pregnancy" in name or "Emergency" in name else ["staff_james", "staff_priya"],
            "description": f"{name} at Islington Animal Hospital",
        })

    await collections.owners.insert_one({"_id": "owner_sarah", "name": "Sarah Green", "phone": "+44 7700 900001", "email": "sarah.green@example.com"})
    await collections.pets.insert_one({
        "_id": "pet_bella",
        "name": "Bella",
        "breed": "Labrador",
        "age": "3-year-old",
        "weight": None,
        "sex": "female",
        "owner_id": "owner_sarah",
        "allergies": ["chicken protein"],
        "current_medications": [],
        "previous_diagnoses": ["skin allergy history"],
        "temperament_notes": "",
        "visit_history": [],
    })
    await collections.owners.insert_one({"_id": "owner_marcus", "name": "Marcus Obi", "phone": "+44 7700 900002", "email": "marcus.obi@example.com"})
    await collections.pets.insert_one({
        "_id": "pet_archie",
        "name": "Archie",
        "breed": "Border Collie",
        "age": "8-year-old",
        "weight": None,
        "sex": "male",
        "owner_id": "owner_marcus",
        "allergies": [],
        "current_medications": [{"name": "Metacam", "source": "Islington Animal Hospital"}],
        "previous_diagnoses": ["mild arthritis"],
        "temperament_notes": "",
        "visit_history": [],
    })

    for content, tags in POLICIES:
        await collections.knowledge_chunks.insert_one({
            "content": content,
            "embedding": [],
            "tags": tags,
            "source": "seed_policy",
            "created_at": now,
        })


def _slots(now: datetime, offset: int):
    base = now + timedelta(days=1)
    return [(base.replace(hour=9 + offset + i, minute=0, second=0, microsecond=0)).isoformat() for i in range(3)]


if __name__ == "__main__":
    asyncio.run(seed())
