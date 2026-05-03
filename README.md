# ClusterCat

ClusterCat is a multi-agent AI receptionist and operations workflow system for veterinary clinics. It was built for the MongoDB Agentic Evolution Hackathon around a realistic clinic scenario: an owner wants to book Bella for a wellness exam, mentions ambiguous symptoms, an external prescription, and possible pregnancy. Instead of giving unsafe advice, ClusterCat coordinates specialist agents, persists every workflow step, escalates risky cases, and gives staff an auditable dashboard.

## What It Does

- Accepts owner requests through chat and real-time voice.
- Identifies the owner and pet profile.
- Detects emergencies before normal workflow routing.
- Flags pregnancy and external medication risk.
- Retrieves relevant clinic policy.
- Classifies symptom urgency.
- Holds an appointment slot without unsafe confirmation.
- Pauses workflows for vet approval.
- Resumes the same workflow when missing information arrives later.
- Logs every agent action to MongoDB for dashboard visibility and judging.

## AI Agent System

ClusterCat is designed as a modular agent workflow rather than a single stateless chatbot.

| Agent | File | Role |
| --- | --- | --- |
| Orchestrator | `api/agents/orchestrator.py` | Main state machine. Routes each message through the right specialist agents and persists workflow transitions. |
| Emergency Agent | `api/agents/emergency.py` | Runs first and interrupts normal flow for symptoms like seizure, collapse, poisoning, or difficulty breathing. |
| Reception Agent | `api/agents/reception.py` | Identifies owner and pet, then detects intent such as booking or medication update. |
| Pet Memory Agent | `api/agents/pet_memory.py` | Loads pet profile and records external medication requiring vet review. |
| Policy Retrieval Agent | `api/agents/policy_retrieval.py` | Retrieves relevant clinic policy chunks for pregnancy, triage, and safety checks. |
| Triage Agent | `api/agents/triage.py` | Classifies urgency as `routine`, `urgent`, or `emergency`. |
| Scheduler Agent | `api/agents/scheduler.py` | Finds and locks a Dr. Priya appointment slot. |
| Escalation Agent | `api/agents/escalation.py` | Creates staff handoff notes and routes unsafe cases to Dr. Priya. |
| Follow-Up Agent | `api/agents/follow_up.py` | Requests missing details and sends mock SMS follow-up messages. |

### How The Agents Are Built

- Agents are plain Python modules with focused responsibilities.
- The orchestrator calls specialist agents in sequence based on workflow state, user intent, and safety flags.
- Tools are separated from agents so database writes and side effects are explicit.
- Every agent action is recorded with an agent name, action, detail, and timestamp.
- Workflow state is persisted in MongoDB after each transition.
- Pending workflows are resumed by owner phone number, so the system can continue after a customer supplies missing information.

## Architecture

```text
Owner chat or voice
  -> FastAPI API
  -> Emergency interrupt
  -> Reception Agent
  -> Pet Memory Agent
  -> Policy Retrieval Agent
  -> Triage Agent
  -> Scheduler Agent
  -> Escalation / Follow-Up Agents
  -> MongoDB collections
  -> Next.js staff dashboard
```

## Tech Stack

- Backend: FastAPI, Pydantic, Uvicorn
- Database: MongoDB with Motor async driver
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Voice transport: LiveKit
- Voice activity detection: Silero VAD
- Speech-to-text: local Whisper through `faster-whisper`
- Text-to-speech: local Piper TTS
- Optional hosted LLM provider: Fireworks configuration is included
- Realtime dashboard: Next.js polling backend dashboard routes

## MongoDB Collections

ClusterCat persists operational state across these collections:

- `owners`
- `pets`
- `services`
- `staff`
- `appointments`
- `conversations`
- `agent_workflows`
- `knowledge_chunks`
- `agent_memories`
- `retrieval_feedback`
- `triage_events`
- `medication_flags`
- `slot_locks`
- `staff_handoffs`
- `mock_sms`

MongoDB is central to the project because it stores every workflow transition, agent action, flag, appointment, handoff, and mock notification.

## API Surface

Main backend routes live in `api/routes`:

- `GET /api/health` - backend health check
- `POST /api/chat` - main agent orchestration endpoint
- `GET /api/dashboard` - staff dashboard summary data
- `GET /api/workflows` - persisted workflow records
- `POST /api/triage` - triage support route
- `POST /api/voice/session` - LiveKit room and token creation
- Additional routes for appointments, pets, flags, knowledge, SMS, and utilities

## Repository Layout

```text
ClusterCat/
  api/
    agents/          # Specialist AI agent modules
    db/              # MongoDB connection, collections, indexes, seed data
    models/          # Pydantic schemas
    routes/          # FastAPI route modules
    services/        # Embeddings, vector search, provider helpers
    tools/           # Agent tools for DB writes, booking, retrieval, flags, SMS
    voice/           # LiveKit voice worker, local Whisper, local Piper
    main.py          # FastAPI app entrypoint
  apps/web/
    src/app/         # Next.js pages
    src/components/  # Dashboard and demo UI components
    src/hooks/       # API polling and chat hooks
    src/lib/         # API client and shared types
  docs/              # Architecture, demo script, voice setup, judge Q&A
  docker-compose.yml
```

## Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- Docker Desktop
- MongoDB via Docker Compose
- LiveKit credentials for real-time voice rooms
- Piper ONNX voice model for local text-to-speech
- Whisper model download on first voice-worker run

## Environment Setup

Create the backend environment file:

```powershell
cd F:\ClusterCat\ClusterCat
copy api\.env.example api\.env
```

Minimum local backend values:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=clustercat
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Voice requires these additional values:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
VOICE_STT_PROVIDER=whisper
WHISPER_MODEL_SIZE=base
VOICE_TTS_PROVIDER=piper
PIPER_MODEL_PATH=F:\path\to\voice.onnx
PIPER_CONFIG_PATH=F:\path\to\voice.onnx.json
```

`PIPER_CONFIG_PATH` can be omitted when the config JSON sits beside the ONNX model using Piper's expected filename.

## Dependency Setup

### Backend Python Environment

Create and activate a virtual environment before installing the backend and voice dependencies:

```powershell
cd F:\ClusterCat\ClusterCat\api
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

The backend requirements install the multi-agent API plus the voice stack:

- `fastapi`, `uvicorn`, `pydantic` for the API.
- `motor`, `python-dotenv` for MongoDB and environment loading.
- `livekit-agents`, `livekit-plugins-silero`, `livekit-plugins-deepgram`, `livekit-plugins-openai` for real-time voice worker support.
- `faster-whisper` for local Whisper speech-to-text.
- `piper-tts` for local Piper text-to-speech.
- `openai`, `anthropic`, `httpx` for optional hosted model integrations.

### Whisper Setup

ClusterCat uses `faster-whisper` through `api/voice/local_whisper.py`.

Set the model size in `api/.env`:

```env
VOICE_STT_PROVIDER=whisper
WHISPER_MODEL_SIZE=base
```

The first time the voice worker starts, `faster-whisper` downloads the selected model automatically. Use `tiny` or `base` for lightweight local demos, and larger models only if the machine has enough CPU/GPU capacity.

### Piper Setup

ClusterCat uses Piper through `api/voice/local_piper.py`.

Set the Piper model paths in `api/.env`:

```env
VOICE_TTS_PROVIDER=piper
PIPER_MODEL_PATH=F:\ClusterCat\ClusterCat\models\piper\en_GB-southern_english_female-low.onnx
PIPER_CONFIG_PATH=F:\ClusterCat\ClusterCat\models\piper\en_GB-southern_english_female-low.onnx.json
```

If you use a different Piper voice, place both files somewhere stable and update the paths:

- `your-voice.onnx`
- `your-voice.onnx.json`

Piper does not download voices automatically. The `.onnx` model and matching `.onnx.json` config must exist before starting the voice worker.

### LiveKit Setup

Create a LiveKit Cloud project or run your own LiveKit server, then add credentials to `api/.env`:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

The backend route `POST /api/voice/session` creates a LiveKit room and returns a browser token. The separate voice worker joins the room, listens to caller audio, sends transcribed text into the orchestrator, and publishes Piper speech back to the caller.

### Frontend Dependencies

Install the Next.js dashboard dependencies:

```powershell
cd F:\ClusterCat\ClusterCat\apps\web
npm install
```

The frontend uses:

- `next`, `react`, `react-dom` for the web app.
- `livekit-client` for browser voice-room connection.
- `lucide-react` for dashboard icons.
- `tailwindcss`, `typescript`, and React types for UI development.

### MongoDB Setup

Start MongoDB with Docker Compose:

```powershell
cd F:\ClusterCat\ClusterCat
docker compose up -d mongo
```

Use these backend environment values for local MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=clustercat
```

On API startup, ClusterCat creates indexes and seeds the demo owner, pet, service, staff, and policy data when needed.

## Install And Run

### 1. Start MongoDB

```powershell
cd F:\ClusterCat\ClusterCat
docker compose up -d mongo
```

### 2. Install backend dependencies

```powershell
cd F:\ClusterCat\ClusterCat\api
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Run the backend

```powershell
cd F:\ClusterCat\ClusterCat\api
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

Expected response:

```json
{
  "ok": true,
  "service": "clustercat-api"
}
```

### 4. Install frontend dependencies

Open a new terminal:

```powershell
cd F:\ClusterCat\ClusterCat\apps\web
npm install
```

### 5. Run the frontend

```powershell
cd F:\ClusterCat\ClusterCat\apps\web
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

## Run The Voice Worker

Open another terminal:

```powershell
cd F:\ClusterCat\ClusterCat
py api\voice\agent.py dev
```

Voice mode uses:

- LiveKit for real-time room transport
- local Whisper for transcription
- Silero for voice activity detection
- Piper for speaker output
- the same `OrchestratorBridge` and backend agent workflow used by chat

## Safety Model

ClusterCat is intentionally conservative for veterinary workflows:

- Emergency detection runs before normal orchestration.
- The system does not diagnose.
- The system does not recommend medication.
- Pregnancy blocks automatic confirmation.
- External prescriptions require vet review.
- Ambiguous symptoms are over-escalated for safety.
- Staff handoff notes are generated for risky cases.
- Every decision is traceable through `agent_actions`.

## Demo Scenario

Initial user message:

```text
Hi, I need to book Bella for a wellness exam. She's been scratching a lot and seems a bit off. She was also at another vet last week and they gave her something but I can't remember what it was. Oh - and I think she might be pregnant.
```

Expected result:

- Sarah Green and Bella are identified.
- Pregnancy is flagged.
- External medication is flagged.
- Triage marks the case as urgent.
- Policy Retrieval logs pregnancy and triage policy checks.
- Scheduler holds a Dr. Priya slot.
- Escalation pauses the workflow at `awaiting_vet_approval`.
- Follow-up requests the missing medication detail.

Resume message:

```text
I found the prescription - it was Apoquel 5mg
```

Expected result:

- Existing workflow resumes by phone number.
- Apoquel 5mg is stored as external medication requiring vet review.
- Appointment remains pending vet approval.
- Staff handoff note is generated.
- Mock SMS follow-up is logged.

## Why This Is Agentic

- The system coordinates multiple specialist agents, not one generic chatbot response.
- It uses durable MongoDB state to pause, resume, and audit workflows.
- It separates agent reasoning from tool execution.
- It produces visible agent action traces for staff and judges.
- It integrates chat and voice into the same orchestration layer.
- It enforces domain-specific safety rules before completing operational tasks.

## Useful Links

- Dashboard: `http://localhost:3000/dashboard`
- Admin: `http://localhost:3000/admin`
- API health: `http://127.0.0.1:8000/api/health`
- Voice setup notes: `ClusterCat/docs/voice_setup.md`
- Demo script: `ClusterCat/docs/demo_script.md`
- Judge Q&A: `ClusterCat/docs/judge_qa.md`
