# Architecture

ClusterCat uses FastAPI as the orchestration API, MongoDB as the system of record, and a Next.js dashboard for the live demo.

```text
Owner chat
  -> POST /api/chat
  -> Emergency interrupt
  -> Reception Agent
  -> Pet Memory Agent
  -> Policy Retrieval Agent
  -> Triage Agent
  -> Scheduler Agent
  -> Escalation / Follow-Up Agents
  -> MongoDB collections
  -> Staff dashboard polling /api/dashboard
```

The state machine is implemented in `api/agents/orchestrator.py`. Workflow state is persisted in `agent_workflows` at every step transition.
