from datetime import datetime

from db import collections


async def find_or_create_pet(owner_id: str, name: str | None = None):
    if name:
        pet = await collections.pets.find_one({"owner_id": owner_id, "name": name})
        if pet:
            return pet
    pet = await collections.pets.find_one({"owner_id": owner_id})
    if pet:
        return pet
    doc = {
        "owner_id": owner_id,
        "name": name or "Unknown pet",
        "breed": None,
        "age": None,
        "weight": None,
        "allergies": [],
        "current_medications": [],
        "previous_diagnoses": [],
        "temperament_notes": "",
        "visit_history": [],
        "created_at": datetime.utcnow(),
    }
    result = await collections.pets.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_pet_memory(pet_id: str, update: dict):
    await collections.pets.update_one({"_id": pet_id}, {"$set": update})
    return await collections.pets.find_one({"_id": pet_id})


async def add_pet_medication_for_review(pet_id: str, medication_description: str, source: str):
    medication = {
        "description": medication_description,
        "source": source,
        "status": "requires_vet_review",
        "created_at": datetime.utcnow(),
    }
    await collections.pets.update_one({"_id": pet_id}, {"$addToSet": {"current_medications": medication}})
    return medication
