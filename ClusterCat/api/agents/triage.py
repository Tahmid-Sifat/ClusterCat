from tools.triage_tools import triage_symptom


async def classify_symptoms(message: str, owner_id: str, pet_id: str, pregnancy_context: bool):
    return await triage_symptom(message, owner_id=owner_id, pet_id=pet_id, pregnancy_context=pregnancy_context)
