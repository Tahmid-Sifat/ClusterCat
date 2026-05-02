from fastapi import APIRouter

from db import collections
from routes.util import clean

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def dashboard():
    return clean({
        "workflows": await collections.agent_workflows.find({}).sort("updated_at", -1).limit(10).to_list(10),
        "triage_events": await collections.triage_events.find({}).sort("created_at", -1).limit(10).to_list(10),
        "medication_flags": await collections.medication_flags.find({}).sort("created_at", -1).limit(10).to_list(10),
        "retrieval_feedback": await collections.retrieval_feedback.find({}).sort("created_at", -1).limit(10).to_list(10),
        "appointments": await collections.appointments.find({}).sort("created_at", -1).limit(10).to_list(10),
        "staff_handoffs": await collections.staff_handoffs.find({}).sort("created_at", -1).limit(10).to_list(10),
        "mock_sms": await collections.mock_sms.find({}).sort("created_at", -1).limit(10).to_list(10),
    })
