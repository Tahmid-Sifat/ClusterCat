from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


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
    conversation_id: str | None = None
    session_state: dict | None = None


class AgentAction(BaseModel):
    agent: str
    action: str
    detail: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatResponse(BaseModel):
    response: str = Field(default="")
    reply: str = ""  # For backward compatibility
    workflow_state: dict[str, Any] = Field(default_factory=dict)
    workflow_id: str | None = None
    current_step: str = "start"
    urgency_level: Literal["routine", "urgent", "emergency"] | None = None
    triage_level: Literal["routine", "urgent", "emergency"] | None = None
    active_agent: str = "Reception Agent"
    flags: dict[str, Any] = Field(default_factory=dict)
    actions: list[AgentAction] = Field(default_factory=list)
    retrieved_policy: dict[str, Any] | None = None
    next_action: str = ""
    handoff_note: str | None = None
    owner: dict[str, Any] | None = None
    pet: dict[str, Any] | None = None
    appointment: dict[str, Any] | None = None

    @model_validator(mode="before")
    def populate_response_from_reply(cls, data):
        """Populate response field from reply if not already set"""
        if isinstance(data, dict):
            if "response" not in data or not data["response"]:
                if "reply" in data and data["reply"]:
                    data["response"] = data["reply"]
            # Ensure reply is set for backward compatibility
            if "reply" not in data or not data["reply"]:
                if "response" in data and data["response"]:
                    data["reply"] = data["response"]
        return data


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


class AppointmentCreate(BaseModel):
    owner_id: str
    pet_id: str
    service_id: str
    staff_id: str
    slot: str
    notes: str = ""
