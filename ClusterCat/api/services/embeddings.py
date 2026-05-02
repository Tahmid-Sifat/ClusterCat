from __future__ import annotations

import os


async def embed_text(text: str) -> list[float]:
    """Swappable embedding provider; returns [] in local demo mode."""
    if not os.getenv("OPENAI_API_KEY"):
        return []
    try:
        from openai import AsyncOpenAI
    except Exception:
        return []
    client = AsyncOpenAI()
    response = await client.embeddings.create(model="text-embedding-ada-002", input=text)
    return response.data[0].embedding
