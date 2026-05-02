# Judge Q&A

## Why is MongoDB central?

Every owner, pet, workflow, triage event, medication flag, retrieval feedback record, appointment, handoff, and mock SMS is written through Mongo-backed tool functions. The orchestrator persists every workflow transition with `update_workflow`.

## Where is prolonged coordination?

`agents/orchestrator.py` resumes pending workflows by owner phone number and continues from MongoDB state. The demo intentionally pauses at `awaiting_vet_approval`, then resumes when the customer supplies the missing medication.

## Where is multi-agent collaboration?

Specialist modules live in `api/agents`: Reception, Scheduler, Pet Memory, Policy Retrieval, Triage, Escalation, and Follow-Up. Each action is logged into the workflow and shown in the dashboard.

## Where is adaptive retrieval?

`tools/retrieval_tools.py` retrieves policy chunks by intent and logs confidence to `retrieval_feedback`. `services/vector_search.py` is ready to use Atlas `$vectorSearch` when embeddings are configured.

## How is medical safety enforced?

`agents/emergency.py` runs before orchestration decisions. The orchestrator never diagnoses, never recommends medication, escalates ambiguous symptoms, blocks pregnancy-related confirmation, and flags external prescriptions.
