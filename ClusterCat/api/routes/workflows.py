from fastapi import APIRouter, HTTPException

from agents.orchestrator import handle_message
from db import collections_db as collections
from models.schemas import WorkflowResumeRequest
from routes.util import clean
from tools.workflow_tools import find_workflow_by_id

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("")
async def workflows():
    return clean(await collections.agent_workflows.find({}).sort("updated_at", -1).to_list(100))


@router.post("/{workflow_id}/resume")
async def resume_workflow(workflow_id: str, request: WorkflowResumeRequest):
    # Verify workflow exists and belongs to the phone number
    workflow = await find_workflow_by_id(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    owner = await collections.owners.find_one({"phone": request.phone})
    if not owner or str(owner["_id"]) != workflow["owner_id"]:
        raise HTTPException(status_code=403, detail="Workflow does not belong to this phone number")

    return await handle_message(request.phone, request.message, "chat")
