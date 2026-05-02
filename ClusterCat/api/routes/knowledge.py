from datetime import datetime

from fastapi import APIRouter

from db import collections
from models.schemas import KnowledgeChunkCreate
from routes.util import clean
from tools.retrieval_tools import retrieve_policy

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("")
async def search(q: str = "", intent: str = "faq"):
    return clean(await retrieve_policy(q, intent))


@router.post("")
async def create(chunk: KnowledgeChunkCreate):
    doc = chunk.model_dump()
    doc["embedding"] = []
    doc["created_at"] = datetime.utcnow()
    result = await collections.knowledge_chunks.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return clean(doc)
