from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import collections_db as collections
from db.indexes import create_indexes
from db.seed import seed
from routes import appointments, chat, dashboard, flags, knowledge, pets, sms, triage, voice, workflows

app = FastAPI(title="ClusterCat API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

app.include_router(chat.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(workflows.router, prefix=API_PREFIX)
app.include_router(pets.router, prefix=API_PREFIX)
app.include_router(appointments.router, prefix=API_PREFIX)
app.include_router(knowledge.router, prefix=API_PREFIX)
app.include_router(triage.router, prefix=API_PREFIX)
app.include_router(flags.router, prefix=API_PREFIX)
app.include_router(sms.router, prefix=API_PREFIX)
app.include_router(voice.router, prefix=API_PREFIX)


@app.on_event("startup")
async def startup():
    await create_indexes()
    if not await collections.owners.find_one({"phone": "+44 7700 900001"}):
        await seed()


@app.get("/health")
async def health():
    return {"ok": True, "service": "clustercat-api"}


@app.get(f"{API_PREFIX}/health")
async def api_health():
    return await health()
