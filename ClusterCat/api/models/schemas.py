from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


WorkflowStep = Literal[
    "start",
    "identify_owner",
    "identify_pet",
    "collect_service_request",
    "symptom_triage",
    "retrieve_policy",
    "flag_external_medication",
    "check_pregnancy_protocol",
    "check_requirements",
    "check_availability",
    "await_missing_info",
    "await_vet_approval",
    "confirm_booking",
    "create_appointment",
    "notify_customer",
    "generate_staff_note",
    "completed",
    "escalated",
    "emergency_escalated",
    "failed",
]


class ChatRequest(BaseModel):
    message: str
    phone: str = Field(default="+44 7700 900001")
    channel: Literal["chat", "voice", "sms"] = "chat"


class AgentAction(BaseModel):
    agent: str
    action: str
    detail: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatResponse(BaseModel):
    reply: str
    workflow_id: str | None = None
    current_step: str
    urgency_level: Literal["routine", "urgent", "emergency"] | None = None
    active_agent: str
    flags: dict[str, Any] = Field(default_factory=dict)
    actions: list[AgentAction] = Field(default_factory=list)


class WorkflowResumeRequest(BaseModel):
    message: str
    phone: str


class KnowledgeChunkCreate(BaseModel):
    content: str
    tags: list[str] = Field(default_factory=list)
    source: str = "admin"


class MedicationFlagRequest(BaseModel):
    owner_id: str
    pet_id: str
    workflow_id: str
    medication_description: str
    source: str = "external"


class PregnancyFlagRequest(BaseModel):
    owner_id: str
    pet_id: str
    workflow_id: str


class TriageRequest(BaseModel):
    symptom_description: str
    owner_id: str | None = None
    pet_id: str | None = None
