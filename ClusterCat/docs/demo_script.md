# ClusterCat Demo Script

## Start

1. Open the chat demo.
2. Send:

```text
Hi, I need to book Bella for a wellness exam. She's been scratching a lot and seems a bit off. She was also at another vet last week and they gave her something but I can't remember what it was. Oh - and I think she might be pregnant.
```

## Expected Result

- Reception Agent identifies Sarah Green by phone and loads Bella.
- Emergency interrupt runs first.
- Pregnancy is flagged and blocks confirmation.
- External medication is flagged as unknown.
- Triage classifies the case as urgent because symptoms are ambiguous and pregnancy is mentioned.
- Policy Retrieval Agent retrieves pregnancy and triage policy chunks.
- Scheduler Agent locks a Dr. Priya slot for 5 minutes.
- Workflow is persisted as `awaiting_vet_approval`.
- Mock SMS asks for medication details.
- Dashboard shows workflow state, agent actions, flags, retrieval feedback, triage event, and SMS log.

## Resume

Send:

```text
I found the prescription - it was Apoquel 5mg
```

## Expected Resume Result

- Existing pending workflow resumes by phone number.
- Apoquel 5mg is stored as an external medication requiring vet review.
- Appointment is created as `pending_vet_approval`.
- Staff handoff note is generated for Dr. Priya.
- Customer is notified by mock SMS.
