import sys
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Fix Python path for local imports
API_DIR = Path(__file__).resolve().parent
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

# Local imports
from db import collections_db as collections
from db.indexes import create_indexes
from db.seed import seed
from routes import (
    appointments,
    chat,
    dashboard,
    flags,
    knowledge,
    pets,
    sms,
    triage,
    voice,
    workflows
)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting ClusterCat API...")
    try:
        await create_indexes()
        print("[INFO] Database indexes created.")
    except Exception as e:
        print(f"[WARN] Index creation failed: {e}")
    try:
        await seed()
        print("[INFO] Database seeded.")
    except Exception as e:
        print(f"[WARN] Seeding failed: {e}")
    yield
    print("Shutting down ClusterCat API...")


# FastAPI app
app = FastAPI(title="ClusterCat API", version="0.1.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

# Routers
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


# Health checks
@app.get("/health")
async def health():
    return {"ok": True, "service": "clustercat-api"}


@app.get(f"{API_PREFIX}/health")
async def api_health():
    return await health()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
