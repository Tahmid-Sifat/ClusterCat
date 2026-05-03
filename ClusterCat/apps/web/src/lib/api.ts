import type {
  AgentName,
  Appointment,
  ChatRequest,
  ChatResponse,
  DashboardData,
  KnowledgeChunk,
  KnowledgeSearchResponse,
  Owner,
  Pet,
  RetrievedPolicy,
  TriageLevel,
  WorkflowState,
  WorkflowStatus,
  VoiceSessionResponse
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Chat request failed");
  return normalizeChatResponse(await response.json());
}

export async function createVoiceSession(): Promise<VoiceSessionResponse> {
  const response = await fetch(`${API_BASE}/api/voice/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Voice session failed: ${detail}`);
  }
  return await response.json();
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE}/api/dashboard`, { cache: "no-store" });
  if (!response.ok) throw new Error("Dashboard request failed");
  return normalizeDashboard(await response.json());
}

export async function searchKnowledge(query: string, tags: string[] = []): Promise<KnowledgeSearchResponse> {
  const response = await fetch(`${API_BASE}/api/knowledge/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, tags })
  });
  if (response.ok) return normalizeKnowledgeResponse(await response.json());

  const fallback = await fetch(`${API_BASE}/api/knowledge?q=${encodeURIComponent(query)}&intent=${encodeURIComponent(tags[0] ?? "faq")}`);
  if (!fallback.ok) throw new Error("Knowledge search failed");
  return normalizeKnowledgeResponse(await fallback.json());
}

export async function getKnowledge(): Promise<KnowledgeChunk[]> {
  const response = await fetch(`${API_BASE}/api/knowledge`, { cache: "no-store" });
  if (!response.ok) throw new Error("Knowledge request failed");
  return normalizeKnowledgeResponse(await response.json()).chunks;
}

function normalizeChatResponse(raw: unknown): ChatResponse {
  const record = asRecord(raw);
  const workflow = asRecord(record.workflow_state ?? {});
  const flags = asRecord(record.flags ?? {});
  const owner = asRecord(record.owner ?? {});
  const pet = asRecord(record.pet ?? {});
  const appointment = asRecord(record.appointment ?? {});

  const state: WorkflowState = {
    status: asWorkflowStatus(workflow.status ?? inferStatus(record.current_step)),
    current_step: asString(workflow.current_step ?? record.current_step, "start"),
    workflow_type: asString(workflow.workflow_type, "booking"),
    pregnancy_flag: asBoolean(workflow.pregnancy_flag ?? flags.pregnancy),
    external_medication_flag: asBoolean(workflow.external_medication_flag ?? flags.external_medication),
    owner_id: asNullableString(workflow.owner_id),
    pet_id: asNullableString(workflow.pet_id),
    missing_info: asStringArray(workflow.missing_info)
  };

  return {
    response: asString(record.response ?? record.reply, ""),
    workflow_state: state,
    active_agent: asAgentName(record.active_agent),
    retrieved_policy: normalizePolicy(record.retrieved_policy, record),
    triage_level: asTriageLevel(record.triage_level ?? record.urgency_level),
    next_action: asString(record.next_action, nextActionFor(state)),
    handoff_note: asNullableString(record.handoff_note),
    owner: owner.name ? normalizeOwner(owner) : demoOwner(state.owner_id),
    pet: pet.name ? normalizePet(pet) : demoPet(state.pet_id, state.external_medication_flag),
    appointment: appointment.service_name ? normalizeAppointment(appointment) : null
  };
}

function normalizeDashboard(raw: unknown): DashboardData {
  const record = asRecord(raw);
  const workflows = asArray(record.pending_workflows ?? record.workflows).map((item) => {
    const workflow = asRecord(item);
    const state = asRecord(workflow.state ?? {});
    return {
      _id: asString(workflow._id, cryptoFallback()),
      workflow_type: asString(workflow.workflow_type, "booking"),
      status: asString(workflow.status, "pending"),
      current_step: asString(workflow.current_step, "start"),
      pregnancy_flag: asBoolean(workflow.pregnancy_flag ?? state.pregnancy_flag),
      external_medication_flag: asBoolean(workflow.external_medication_flag ?? state.external_medication_flag),
      created_at: asString(workflow.created_at, new Date().toISOString()),
      updated_at: asString(workflow.updated_at, new Date().toISOString())
    };
  });

  const appointments = asArray(record.todays_appointments ?? record.appointments).map((item) => {
    const appointment = asRecord(item);
    return {
      pet_name: asString(appointment.pet_name, "Bella"),
      owner_name: asString(appointment.owner_name, "Sarah Green"),
      service_name: asString(appointment.service_name ?? appointment.service_id, "Wellness Exam"),
      staff_name: asString(appointment.staff_name ?? appointment.staff_id, "Dr. Priya Mehta"),
      slot: asString(appointment.slot, ""),
      status: asString(appointment.status, "pending")
    };
  });

  const triageEvents = asArray(record.triage_events).map((item) => {
    const event = asRecord(item);
    return {
      symptom_description: asString(event.symptom_description, ""),
      urgency_level: asString(event.urgency_level, "urgent"),
      escalated: asBoolean(event.escalated),
      created_at: asString(event.created_at, new Date().toISOString())
    };
  });

  const medicationFlags = asArray(record.medication_flags).map((item) => {
    const flag = asRecord(item);
    return {
      medication_description: asString(flag.medication_description, "Unknown medication from external clinic"),
      source: asString(flag.source, "external"),
      status: asString(flag.status, "requires_verification"),
      created_at: asString(flag.created_at, new Date().toISOString())
    };
  });

  const pregnancyFlags = asArray(record.pregnancy_flags).map((item) => {
    const flag = asRecord(item);
    return {
      pet_id: asString(flag.pet_id, "pet_bella"),
      status: asString(flag.status, "awaiting_vet_approval"),
      created_at: asString(flag.created_at, new Date().toISOString())
    };
  });

  const stats = asRecord(record.stats ?? {});
  return {
    pending_workflows: workflows,
    todays_appointments: appointments,
    triage_events: triageEvents,
    medication_flags: medicationFlags,
    pregnancy_flags: pregnancyFlags,
    stats: {
      total_conversations_today: asNumber(stats.total_conversations_today, 0),
      pending_workflows: asNumber(stats.pending_workflows, workflows.filter((workflow) => workflow.status !== "completed").length),
      appointments_today: asNumber(stats.appointments_today, appointments.length),
      escalations_today: asNumber(stats.escalations_today, triageEvents.filter((event) => event.escalated).length)
    }
  };
}

function normalizeKnowledgeResponse(raw: unknown): KnowledgeSearchResponse {
  const record = asRecord(raw);
  const chunks = asArray(record.chunks ?? raw).map((item) => {
    const chunk = asRecord(item);
    return {
      content: asString(chunk.content, ""),
      score: asNumber(chunk.score ?? chunk.success_score, 0.82),
      tags: asStringArray(chunk.tags)
    };
  });
  return { chunks };
}

function normalizePolicy(policy: unknown, parent: Record<string, unknown>): RetrievedPolicy | null {
  const direct = asRecord(policy);
  if (direct.content) {
    return { content: asString(direct.content, ""), score: asNumber(direct.score, 0.88), tags: asStringArray(direct.tags) };
  }
  const flags = asRecord(parent.flags ?? {});
  if (asBoolean(flags.pregnancy)) {
    return {
      content: "Pregnant animals require senior vet approval before any treatment, procedure, or prescription.",
      score: 0.91,
      tags: ["pregnancy", "approval"]
    };
  }
  return null;
}

function nextActionFor(state: WorkflowState): string {
  if (state.status === "emergency_escalated") return "Direct owner to emergency vet immediately";
  if (state.pregnancy_flag) return "Waiting for Dr. Priya to confirm pregnancy protocol";
  if (state.external_medication_flag) return "Verify external prescription before confirmation";
  return "Continue collecting booking details";
}

function normalizeOwner(owner: Record<string, unknown>): Owner {
  return {
    name: asString(owner.name, "Sarah Green"),
    phone: asString(owner.phone, "+44 7700 900001"),
    email: asString(owner.email, "sarah.green@example.com")
  };
}

function normalizePet(pet: Record<string, unknown>): Pet {
  return {
    name: asString(pet.name, "Bella"),
    breed: asString(pet.breed, "Labrador"),
    age: asString(pet.age, "3"),
    weight: pet.weight === null ? null : asNumber(pet.weight, 0),
    allergies: asStringArray(pet.allergies),
    current_medications: asStringArray(pet.current_medications),
    previous_diagnoses: asStringArray(pet.previous_diagnoses)
  };
}

function normalizeAppointment(appointment: Record<string, unknown>): Appointment {
  return {
    service_name: asString(appointment.service_name, "Wellness Exam"),
    staff_name: asString(appointment.staff_name, "Dr. Priya Mehta"),
    slot: asString(appointment.slot, ""),
    status: asString(appointment.status, "pending_vet_approval"),
    calendly_url: asNullableString(appointment.calendly_url) ?? calendlyUrl()
  };
}

export function calendlyUrl(): string {
  return process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com/alvifaizan695/new-meeting";
}

function demoOwner(ownerId: string | null): Owner | null {
  return ownerId ? { name: "Sarah Green", phone: "+44 7700 900001", email: "sarah.green@example.com" } : null;
}

function demoPet(petId: string | null, hasMedication: boolean): Pet | null {
  return petId
    ? {
        name: "Bella",
        breed: "Labrador",
        age: "3",
        weight: null,
        allergies: ["chicken protein"],
        current_medications: hasMedication ? ["Unknown external medication"] : [],
        previous_diagnoses: ["skin allergy history"]
      }
    : null;
}

function inferStatus(step: unknown): WorkflowStatus {
  const value = asString(step, "start");
  if (value === "emergency_escalated") return "emergency_escalated";
  if (value === "completed") return "completed";
  if (value === "start") return "active";
  return "pending";
}

function asAgentName(value: unknown): AgentName {
  const label = asString(value, "Reception").replace(" Agent", "");
  const allowed: AgentName[] = ["Reception", "Triage", "Scheduler", "Pet Memory", "Policy Retrieval", "Escalation"];
  return allowed.includes(label as AgentName) ? (label as AgentName) : "Reception";
}

function asTriageLevel(value: unknown): TriageLevel | null {
  return value === "routine" || value === "urgent" || value === "emergency" ? value : null;
}

function asWorkflowStatus(value: unknown): WorkflowStatus {
  return value === "pending" || value === "active" || value === "completed" || value === "escalated" || value === "emergency_escalated" ? value : "pending";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => (typeof item === "string" ? item : asString(asRecord(item).description ?? asRecord(item).name, ""))).filter(Boolean) : [];
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function cryptoFallback(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}`;
}
