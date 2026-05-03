import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

_NAMES = frozenset([
    "owners", "pets", "services", "staff", "appointments", "conversations",
    "agent_workflows", "knowledge_chunks", "agent_memories", "retrieval_feedback",
    "triage_events", "medication_flags", "slot_locks", "staff_handoffs", "mock_sms",
])

# One Motor db instance per event loop so voice worker threads don't share
# the main thread's Motor client (which would cause "Future attached to a
# different loop" errors in LiveKit's per-job thread event loops).
_db_per_loop: dict = {}


def _db():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        loop = asyncio.get_running_loop()
        lid = id(loop)
        if lid not in _db_per_loop:
            uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            db_name = os.getenv("MONGODB_DB_NAME", "clustercat")
            _db_per_loop[lid] = AsyncIOMotorClient(uri)[db_name]
        return _db_per_loop[lid]
    except RuntimeError:
        # No running event loop (e.g. import-time) — use the shared module-level db
        from db.connection import db
        return db


def __getattr__(name: str):
    if name in _NAMES:
        return _db()[name]
    raise AttributeError(f"module 'db.collections_db' has no attribute '{name}'")
