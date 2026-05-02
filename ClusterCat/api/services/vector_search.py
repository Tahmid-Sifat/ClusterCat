from __future__ import annotations

from db import collections_db as collections
from services.embeddings import embed_text
from tools.retrieval_tools import retrieve_policy


async def atlas_vector_search(query: str, intent: str, limit: int = 3):
    embedding = await embed_text(query)
    if not embedding:
        return await retrieve_policy(query, intent)
    pipeline = [
        {
            "$vectorSearch": {
                "index": "knowledge_chunks_vector_index",
                "path": "embedding",
                "queryVector": embedding,
                "numCandidates": 50,
                "limit": limit,
            }
        },
        {"$project": {"content": 1, "tags": 1, "source": 1, "score": {"$meta": "vectorSearchScore"}}},
    ]
    cursor = collections.knowledge_chunks.aggregate(pipeline)
    return await cursor.to_list(limit)
