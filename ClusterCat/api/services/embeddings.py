from __future__ import annotations

import os


async def embed_text(text: str) -> list[float]:
    """Swappable embedding provider; returns [] in local demo mode."""
    if not os.getenv("VOYAGE_API_KEY"):
        return []
    try:
        import httpx
    except Exception:
        return []

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.voyageai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {os.getenv('VOYAGE_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "input": text,
                "model": "voyage-3-lite",
            },
        )
        if response.status_code == 200:
            data = response.json()
            return data["data"][0]["embedding"]
        return []
