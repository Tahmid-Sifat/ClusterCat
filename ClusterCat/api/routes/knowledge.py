from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter

from db import collections_db as collections
from models.schemas import KnowledgeChunkCreate
from routes.util import clean
from services.vector_search import atlas_vector_search

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("")
async def search(q: str = "", intent: str = "faq"):
    return clean(await atlas_vector_search(q, intent))


@router.post("")
async def create(chunk: KnowledgeChunkCreate):
    doc = chunk.model_dump()
    doc["_id"] = str(uuid4())
    doc["embedding"] = []
    doc["created_at"] = datetime.utcnow()
    await collections.knowledge_chunks.insert_one(doc)
    return clean(doc)


@router.post("/seed")
async def seed():
    """Re-seed knowledge chunks with embeddings."""
    from db.seed import POLICIES
    from services.embeddings import embed_text

    await collections.knowledge_chunks.delete_many({})
    for content, tags in POLICIES:
        embedding = await embed_text(content)
        await collections.knowledge_chunks.insert_one({
            "content": content,
            "embedding": embedding,
            "tags": tags,
            "source": "seed_with_embeddings",
            "created_at": datetime.utcnow(),
        })
    return {"status": "seeded", "count": len(POLICIES)}
