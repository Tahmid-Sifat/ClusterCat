from fastapi import APIRouter

from agents.orchestrator import handle_message
from db import collections
from models.schemas import WorkflowResumeRequest
from routes.util import clean

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.get("")
async def workflows():
    return clean(await collections.agent_workflows.find({}).sort("updated_at", -1).to_list(100))


@router.post("/{workflow_id}/resume")
async def resume_workflow(workflow_id: str, request: WorkflowResumeRequest):
    return await handle_message(request.phone, request.message, "chat")
