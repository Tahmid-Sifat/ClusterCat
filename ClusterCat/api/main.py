from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import collections
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

app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(workflows.router)
app.include_router(pets.router)
app.include_router(appointments.router)
app.include_router(knowledge.router)
app.include_router(triage.router)
app.include_router(flags.router)
app.include_router(sms.router)
app.include_router(voice.router)


@app.on_event("startup")
async def startup():
    await create_indexes()
    if not await collections.owners.find_one({"phone": "+44 7700 900001"}):
        await seed()


@app.get("/health")
async def health():
    return {"ok": True, "service": "clustercat-api"}
