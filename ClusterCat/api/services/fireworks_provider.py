from __future__ import annotations

import os

from openai import AsyncOpenAI


def fireworks_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=os.getenv("FIREWORKS_API_KEY"),
        base_url=os.getenv("FIREWORKS_BASE_URL", "https://api.fireworks.ai/inference/v1"),
    )


async def fireworks_chat(messages: list[dict[str, str]], model: str | None = None) -> str:
    response = await fireworks_client().chat.completions.create(
        model=model or os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/glm-5"),
        messages=messages,
        temperature=0.2,
        max_tokens=350,
    )
    return response.choices[0].message.content or ""
