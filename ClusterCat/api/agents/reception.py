from tools.owner_tools import find_or_create_owner
from tools.pet_tools import find_or_create_pet


async def identify_customer(phone: str, message: str):
    owner = await find_or_create_owner(phone)
    requested_pet = "Bella" if "bella" in message.lower() else None
    pet = await find_or_create_pet(str(owner["_id"]), requested_pet)
    return owner, pet


def detect_intent(message: str):
    text = message.lower()
    if any(word in text for word in ["book", "appointment", "exam", "check"]):
        return "booking"
    if any(word in text for word in ["apoquel", "prescription", "medication", "medicine"]):
        return "medication_update"
    return "general"
