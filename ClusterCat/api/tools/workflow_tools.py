from datetime import datetime
from typing import Any

from db import collections

PENDING_STATUSES = ["pending", "awaiting_customer", "awaiting_vet_approval"]


async def create_workflow(workflow_type: str, owner_id: str, pet_id: str | None, state: dict[str, Any] | None = None):
    now = datetime.utcnow()
    doc = {
        "workflow_type": workflow_type,
        "status": "pending",
        "current_step": "start",
        "state": state or {},
        "owner_id": owner_id,
        "pet_id": pet_id,
        "agent_actions": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await collections.agent_workflows.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_workflow(workflow_id: str, step: str, status: str | None = None, state_patch: dict[str, Any] | None = None, action: dict[str, Any] | None = None):
    workflow = await collections.agent_workflows.find_one({"_id": workflow_id})
    state = dict(workflow.get("state", {})) if workflow else {}
    state.update(state_patch or {})
    update = {
        "$set": {
            "current_step": step,
            "state": state,
            "updated_at": datetime.utcnow(),
        }
    }
    if status:
        update["$set"]["status"] = status
    if action:
        action.setdefault("created_at", datetime.utcnow())
        update["$push"] = {"agent_actions": action}
    await collections.agent_workflows.update_one({"_id": workflow_id}, update)
    return await collections.agent_workflows.find_one({"_id": workflow_id})


async def resume_pending_workflow(owner_id: str):
    return await collections.agent_workflows.find_one(
        {"owner_id": owner_id, "status": {"$in": PENDING_STATUSES}},
        sort=[("updated_at", -1)],
    )
