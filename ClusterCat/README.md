# ClusterCat

ClusterCat is a self-improving AI receptionist and operations agent for Islington Animal Hospital, built for the MongoDB Agentic Evolution Hackathon.

The first demo target is a text-chat workflow that:

- identifies an owner and pet
- detects emergency symptoms before every workflow transition
- persists prolonged workflow state in MongoDB
- flags pregnancy and external prescriptions
- retrieves clinic policy
- creates pending appointments and staff handoff notes
- exposes live dashboard data for the staff UI

## Backend

```bash
cd ClusterCat/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Seed the demo data:

```bash
python -m db.seed
```

If `MONGODB_URI` is omitted, the API uses an in-memory demo store so the chat flow can still be tested locally.
