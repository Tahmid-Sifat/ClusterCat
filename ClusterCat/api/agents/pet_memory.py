from tools.pet_tools import add_pet_medication_for_review, update_pet_memory


async def record_external_medication(pet_id: str, medication_description: str):
    return await add_pet_medication_for_review(pet_id, medication_description, "external")


async def update_pet_profile(pet_id: str, patch: dict):
    return await update_pet_memory(pet_id, patch)
