export type AgentAction = {
  agent: string;
  action: string;
  detail: string;
  created_at: string;
};

export type ChatResponse = {
  reply: string;
  workflow_id: string | null;
  current_step: string;
  urgency_level: "routine" | "urgent" | "emergency" | null;
  active_agent: string;
  flags: Record<string, unknown>;
  actions: AgentAction[];
};

export type Dashboard = {
  workflows: any[];
  triage_events: any[];
  medication_flags: any[];
  retrieval_feedback: any[];
  appointments: any[];
  staff_handoffs: any[];
  mock_sms: any[];
};
