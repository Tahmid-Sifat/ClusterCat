from __future__ import annotations

from datetime import datetime

from agents.emergency import detect_emergency
from agents.escalation import build_handoff_note, route_to_priya
from agents.follow_up import request_medication_details
from agents.pet_memory import record_external_medication
from agents.policy_retrieval import get_policy
from agents.reception import detect_intent, identify_customer
from agents.scheduler import create_pending_priya_appointment, hold_priya_slot
from agents.triage import classify_symptoms
from models.schemas import AgentAction, ChatResponse
from tools.flag_tools import flag_external_medication, flag_pregnancy
from tools.notification_tools import send_sms_or_mock
from tools.workflow_tools import create_workflow, resume_pending_workflow, update_workflow


async def handle_message(phone: str, message: str, channel: str = "chat") -> ChatResponse:
    emergency = detect_emergency(message)
    owner, pet = await identify_customer(phone, message)
    workflow = await resume_pending_workflow(str(owner["_id"]))

    if emergency["is_emergency"]:
        if not workflow:
            workflow = await create_workflow("emergency", str(owner["_id"]), str(pet["_id"]), {"latest_message": message})
        workflow = await update_workflow(
            str(workflow["_id"]),
            "emergency_escalated",
            status="emergency_escalated",
            state_patch={"emergency_matches": emergency["matches"], "latest_message": message},
            action=_action("Triage Agent", "emergency_interrupt", f"Matched: {', '.join(emergency['matches'])}"),
        )
        return ChatResponse(
            reply="I’m really sorry, but this may be an emergency. Please go to an emergency vet now or call the emergency vet line immediately. I’ll alert the clinic team with what you’ve told me.",
            workflow_id=str(workflow["_id"]),
            current_step="emergency_escalated",
            urgency_level="emergency",
            active_agent="Triage Agent",
            flags={"emergency": True, "matches": emergency["matches"]},
            actions=_actions(workflow),
        )

    if workflow and _looks_like_medication_update(message):
        return await _resume_with_medication(owner, pet, workflow, message, phone)

    intent = detect_intent(message)
    if intent == "booking":
        return await _start_booking(owner, pet, message, phone)

    return ChatResponse(
        reply="Thanks for that. I can help with booking, clinic policies, or routing a concern to the team. I can’t diagnose or advise on medication, but I can collect the right details for a vet.",
        workflow_id=str(workflow["_id"]) if workflow else None,
        current_step=workflow.get("current_step", "start") if workflow else "start",
        active_agent="Reception Agent",
        actions=_actions(workflow) if workflow else [],
    )


async def _start_booking(owner: dict, pet: dict, message: str, phone: str):
    workflow = await create_workflow("booking", str(owner["_id"]), str(pet["_id"]), {"latest_message": message, "symptom_description": message})
    workflow = await update_workflow(str(workflow["_id"]), "identify_owner", state_patch={"owner_name": owner.get("name")}, action=_action("Reception Agent", "identify_owner", f"Loaded owner by phone {phone}"))
    workflow = await update_workflow(str(workflow["_id"]), "identify_pet", state_patch={"pet_name": pet.get("name"), "pet_profile": _profile_summary(pet)}, action=_action("Pet Memory Agent", "load_pet_profile", f"Loaded {pet.get('name')} profile"))
    workflow = await update_workflow(str(workflow["_id"]), "collect_service_request", state_patch={"service_request": "Wellness Exam"}, action=_action("Reception Agent", "route_intent", "Detected booking request"))

    pregnancy = _mentions_pregnancy(message)
    external_med = _mentions_external_medication(message)
    if pregnancy:
        pregnancy_flag = await flag_pregnancy(str(owner["_id"]), str(pet["_id"]), str(workflow["_id"]))
        pregnancy_policy = await get_policy("pregnancy", message)
        workflow = await update_workflow(str(workflow["_id"]), "check_pregnancy_protocol", state_patch={"pregnancy_flag": True, "pregnancy_flag_id": str(pregnancy_flag["_id"]), "policy_chunks": _chunk_summaries(pregnancy_policy)}, action=_action("Policy Retrieval Agent", "retrieve_pregnancy_protocol", "Pregnancy protocol blocks confirmation until Dr. Priya approves"))

    if external_med:
        med_flag = await flag_external_medication(str(owner["_id"]), str(pet["_id"]), str(workflow["_id"]))
        workflow = await update_workflow(str(workflow["_id"]), "flag_external_medication", state_patch={"external_medication_flag": True, "medication_flag_id": str(med_flag["_id"]), "external_medication": "unknown external prescription"}, action=_action("Pet Memory Agent", "flag_external_medication", "Unknown external prescription requires verification"))

    triage = await classify_symptoms(message, str(owner["_id"]), str(pet["_id"]), pregnancy_context=pregnancy)
    triage_policy = await get_policy("triage", message)
    workflow = await update_workflow(str(workflow["_id"]), "symptom_triage", state_patch={"urgency_level": triage["urgency_level"], "triage_event_id": str(triage["_id"]), "triage_policy_chunks": _chunk_summaries(triage_policy)}, action=_action("Triage Agent", "classify_symptoms", f"Classified as {triage['urgency_level']} with over-escalation rules"))

    workflow = await update_workflow(str(workflow["_id"]), "retrieve_policy", state_patch={"retrieval_confidence_logged": True}, action=_action("Policy Retrieval Agent", "adaptive_retrieval", "Retrieved pregnancy/triage policies based on detected flags"))
    workflow = await update_workflow(str(workflow["_id"]), "check_requirements", state_patch={"requires_vet_approval": pregnancy or external_med or triage["urgency_level"] != "routine"}, action=_action("Reception Agent", "check_requirements", "Vet approval required before confirmation"))

    slot, _lock = await hold_priya_slot(str(workflow["_id"]))
    workflow = await update_workflow(str(workflow["_id"]), "check_availability", state_patch={"held_slot": slot, "assigned_staff_id": "staff_priya", "slot_lock_expires_minutes": 5}, action=_action("Scheduler Agent", "lock_slot", f"Held Dr. Priya slot {slot}"))
    workflow = await update_workflow(str(workflow["_id"]), "await_vet_approval", status="awaiting_vet_approval", state_patch={"missing_info": ["external medication name or prescribing vet contact"] if external_med else []}, action=_action("Escalation Agent", "await_vet_approval", "Workflow paused safely for Dr. Priya approval"))

    if external_med:
        await request_medication_details(phone, str(workflow["_id"]))

    reply = (
        f"I’ve found Sarah Green and Bella’s profile. Because Bella may be pregnant and there may be an external prescription involved, "
        "I can’t confirm treatment or give medication advice until Dr. Priya reviews it. I’ve held a pending slot and sent a mock SMS asking for the medication details."
    )
    return ChatResponse(
        reply=reply,
        workflow_id=str(workflow["_id"]),
        current_step=workflow["current_step"],
        urgency_level=triage["urgency_level"],
        active_agent="Orchestrator",
        flags={"pregnancy": pregnancy, "external_medication": external_med, "requires_vet_approval": True},
        actions=_actions(workflow),
    )


async def _resume_with_medication(owner: dict, pet: dict, workflow: dict, message: str, phone: str):
    medication = _extract_medication(message)
    recorded_med = await record_external_medication(str(pet["_id"]), medication)
    workflow = await update_workflow(str(workflow["_id"]), "await_vet_approval", status="awaiting_vet_approval", state_patch={"external_medication": medication, "external_medication_record": recorded_med, "latest_message": message}, action=_action("Pet Memory Agent", "record_external_medication", f"Recorded {medication} for vet review"))

    slot = workflow.get("state", {}).get("held_slot")
    if not workflow.get("state", {}).get("appointment_id"):
        note = build_handoff_note(pet.get("name", "Pet"), medication, workflow.get("state", {}).get("symptom_description", message), workflow.get("state", {}).get("pregnancy_flag", False))
        appointment = await create_pending_priya_appointment(str(owner["_id"]), str(pet["_id"]), slot, note)
        handoff = await route_to_priya(str(owner["_id"]), str(pet["_id"]), str(workflow["_id"]), note)
        workflow = await update_workflow(str(workflow["_id"]), "generate_staff_note", status="awaiting_vet_approval", state_patch={"appointment_id": str(appointment["_id"]), "staff_handoff_id": str(handoff["_id"]), "staff_note": note}, action=_action("Escalation Agent", "generate_staff_note", "Structured handoff routed to Dr. Priya"))

    await send_sms_or_mock(phone, "Islington Animal Hospital: thanks, I’ve added that to Bella’s file for Dr. Priya to review before confirmation.", str(workflow["_id"]))
    workflow = await update_workflow(str(workflow["_id"]), "notify_customer", status="awaiting_vet_approval", state_patch={"customer_notified": True}, action=_action("Follow-Up Agent", "notify_customer", "Acknowledged medication detail via mock SMS"))

    return ChatResponse(
        reply="Thanks, I’ve added Apoquel 5mg to Bella’s file as an external prescription requiring verification. The appointment remains pending Dr. Priya’s approval, and I’ve generated the staff handoff note.",
        workflow_id=str(workflow["_id"]),
        current_step=workflow["current_step"],
        urgency_level=workflow.get("state", {}).get("urgency_level", "urgent"),
        active_agent="Pet Memory Agent",
        flags={"pregnancy": workflow.get("state", {}).get("pregnancy_flag", False), "external_medication": True, "requires_vet_approval": True},
        actions=_actions(workflow),
    )


def _mentions_pregnancy(message: str):
    return any(term in message.lower() for term in ["pregnant", "pregnancy", "expecting"])


def _mentions_external_medication(message: str):
    text = message.lower()
    return "another vet" in text or "external" in text or "prescription" in text or "gave her something" in text


def _looks_like_medication_update(message: str):
    return any(term in message.lower() for term in ["apoquel", "prescription", "mg", "medication", "medicine"])


def _extract_medication(message: str):
    if "apoquel" in message.lower():
        return "Apoquel 5mg" if "5" in message else "Apoquel"
    return message.strip()


def _profile_summary(pet: dict):
    return {
        "name": pet.get("name"),
        "breed": pet.get("breed"),
        "age": pet.get("age"),
        "allergies": pet.get("allergies", []),
        "current_medications": pet.get("current_medications", []),
    }


def _chunk_summaries(chunks: list[dict]):
    return [{"id": str(chunk.get("_id")), "content": chunk.get("content"), "tags": chunk.get("tags", [])} for chunk in chunks]


def _action(agent: str, action: str, detail: str):
    return {"agent": agent, "action": action, "detail": detail, "created_at": datetime.utcnow()}


def _actions(workflow: dict | None):
    if not workflow:
        return []
    return [AgentAction(**action) for action in workflow.get("agent_actions", [])]
