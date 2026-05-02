from datetime import datetime

from db import collections_db as collections


async def retrieve_policy(query: str, intent: str):
    terms = set((query + " " + intent).lower().replace("-", " ").split())
    chunks = await collections.knowledge_chunks.find({}).to_list(100)
    ranked = []
    for chunk in chunks:
        haystack = " ".join([chunk.get("content", ""), " ".join(chunk.get("tags", []))]).lower()
        score = sum(1 for term in terms if term in haystack)
        if score:
            ranked.append((score, chunk))
    ranked.sort(key=lambda item: item[0], reverse=True)
    results = [chunk for _, chunk in ranked[:3]] or chunks[:3]
    feedback = {
        "query": query,
        "intent": intent,
        "chunks_returned": [str(chunk.get("_id")) for chunk in results],
        "success_score": 1.0 if ranked else 0.35,
        "created_at": datetime.utcnow(),
    }
    await collections.retrieval_feedback.insert_one(feedback)
    return results


async def log_retrieval_feedback(query: str, chunks_returned: list[str], success_score: float):
    await collections.retrieval_feedback.insert_one({
        "query": query,
        "chunks_returned": chunks_returned,
        "success_score": success_score,
        "created_at": datetime.utcnow(),
    })
