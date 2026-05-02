from tools.booking_tools import create_appointment, first_available_slot, lock_slot


async def hold_priya_slot(workflow_id: str):
    slot = await first_available_slot("staff_priya")
    lock = await lock_slot("staff_priya", slot, workflow_id)
    return slot, lock


async def create_pending_priya_appointment(owner_id: str, pet_id: str, slot: str, notes: str):
    return await create_appointment(
        owner_id=owner_id,
        pet_id=pet_id,
        service_id="wellness_exam",
        staff_id="staff_priya",
        slot=slot,
        notes=notes,
        status="pending_vet_approval",
    )
