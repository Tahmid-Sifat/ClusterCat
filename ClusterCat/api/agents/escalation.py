from tools.notification_tools import create_staff_handoff


def build_handoff_note(pet_name: str, medication: str | None, symptom: str, pregnancy: bool):
    lines = []
    if pregnancy:
        lines.append(f"{pet_name} may be pregnant; pregnancy protocol applies.")
    if medication:
        lines.append(f"External prescription: {medication}, source unknown, requires verification.")
    lines.append(f"Presenting symptom/request: {symptom}")
    lines.append("Assign to Dr. Priya Mehta for approval before appointment confirmation or medication guidance.")
    return " ".join(lines)


async def route_to_priya(owner_id: str, pet_id: str, workflow_id: str, note: str):
    return await create_staff_handoff(owner_id, pet_id, workflow_id, note, assigned_staff_id="staff_priya")
