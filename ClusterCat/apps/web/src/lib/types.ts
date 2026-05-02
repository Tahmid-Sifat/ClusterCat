export type WorkflowStatus = "pending" | "active" | "completed" | "escalated" | "emergency_escalated";
export type AgentName = "Reception" | "Triage" | "Scheduler" | "Pet Memory" | "Policy Retrieval" | "Escalation";
export type TriageLevel = "routine" | "urgent" | "emergency";
export type MessageRole = "user" | "agent";

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
}

export interface WorkflowState {
  status: WorkflowStatus;
  current_step: string;
  workflow_type: string;
  pregnancy_flag: boolean;
  external_medication_flag: boolean;
  owner_id: string | null;
  pet_id: string | null;
  missing_info: string[];
}

export interface RetrievedPolicy {
  content: string;
  score: number;
  tags: string[];
}

export interface Owner {
  name: string;
  phone: string;
  email: string;
}

export interface Pet {
  name: string;
  breed: string;
  age: number | string;
  weight: number | null;
  allergies: string[];
  current_medications: string[];
  previous_diagnoses: string[];
}

export interface Appointment {
  service_name: string;
  staff_name: string;
  slot: string;
  status: string;
  calendly_url: string | null;
}

export interface ChatResponse {
  response: string;
  workflow_state: WorkflowState;
  active_agent: AgentName;
  retrieved_policy: RetrievedPolicy | null;
  triage_level: TriageLevel | null;
  next_action: string;
  handoff_note: string | null;
  owner: Owner | null;
  pet: Pet | null;
  appointment: Appointment | null;
}

export interface ChatRequest {
  message: string;
  conversation_id: string;
  session_state: WorkflowState | Record<string, never>;
}

export interface PendingWorkflow {
  _id: string;
  workflow_type: string;
  status: string;
  current_step: string;
  pregnancy_flag: boolean;
  external_medication_flag: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardAppointment {
  pet_name: string;
  owner_name: string;
  service_name: string;
  staff_name: string;
  slot: string;
  status: string;
}

export interface DashboardTriageEvent {
  symptom_description: string;
  urgency_level: string;
  escalated: boolean;
  created_at: string;
}

export interface DashboardMedicationFlag {
  medication_description: string;
  source: string;
  status: string;
  created_at: string;
}

export interface DashboardPregnancyFlag {
  pet_id: string;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  total_conversations_today: number;
  pending_workflows: number;
  appointments_today: number;
  escalations_today: number;
}

export interface DashboardData {
  pending_workflows: PendingWorkflow[];
  todays_appointments: DashboardAppointment[];
  triage_events: DashboardTriageEvent[];
  medication_flags: DashboardMedicationFlag[];
  pregnancy_flags: DashboardPregnancyFlag[];
  stats: DashboardStats;
}

export interface KnowledgeChunk {
  content: string;
  score: number;
  tags: string[];
}

export interface KnowledgeSearchResponse {
  chunks: KnowledgeChunk[];
}
