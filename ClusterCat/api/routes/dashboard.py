from datetime import datetime, timedelta

from fastapi import APIRouter

from db import collections_db as collections
from routes.util import clean

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def dashboard():
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    # Get active conversations (recent ones)
    active_conversations = await collections.conversations.find({}).sort("created_at", -1).limit(5).to_list(5)

    # Get pending workflows
    pending_workflows = await collections.agent_workflows.find({
        "status": {"$in": ["pending", "awaiting_customer", "awaiting_vet_approval"]}
    }).sort("updated_at", -1).limit(10).to_list(10)

    # Get today's appointments
    todays_appointments = await collections.appointments.find({
        "created_at": {"$gte": today_start, "$lt": today_end}
    }).sort("created_at", -1).to_list(50)

    # Get triage events
    triage_events = await collections.triage_events.find({}).sort("created_at", -1).limit(10).to_list(10)

    # Get medication flags
    medication_flags = await collections.medication_flags.find({}).sort("created_at", -1).limit(10).to_list(10)

    # Get pregnancy flags (from workflows that have pregnancy_flag: true)
    pregnancy_flags = []
    workflows_with_pregnancy = await collections.agent_workflows.find({
        "state.pregnancy_flag": True
    }).sort("updated_at", -1).limit(10).to_list(10)
    for wf in workflows_with_pregnancy:
        pregnancy_flags.append({
            "workflow_id": str(wf.get("_id")),
            "owner_id": wf.get("owner_id"),
            "pet_id": wf.get("pet_id"),
            "created_at": wf.get("created_at") or wf.get("updated_at")
        })

    # Get stats
    total_workflows = await collections.agent_workflows.count_documents({})
    pending_count = await collections.agent_workflows.count_documents({
        "status": {"$in": ["pending", "awaiting_customer", "awaiting_vet_approval"]}
    })
    emergency_count = await collections.agent_workflows.count_documents({
        "status": "emergency_escalated"
    })

    stats = {
        "total_workflows": total_workflows,
        "pending_workflows": pending_count,
        "emergency_escalations": emergency_count,
        "todays_appointments": len(todays_appointments)
    }

    return clean({
        "active_conversations": active_conversations,
        "pending_workflows": pending_workflows,
        "todays_appointments": todays_appointments,
        "triage_events": triage_events,
        "medication_flags": medication_flags,
        "pregnancy_flags": pregnancy_flags,
        "stats": stats
    })
