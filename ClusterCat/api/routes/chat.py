from __future__ import annotations

import logging
import os
from uuid import uuid4

from fastapi import APIRouter
from openai import AsyncOpenAI

log = logging.getLogger("clustercat.chat")

from agents.orchestrator import handle_message
from db import collections_db as collections
from models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

_SYSTEM_PROMPT = (
    "You are the virtual receptionist at Islington Animal Hospital in London. "
    "You are warm, professional, and concise. Help pet owners with bookings, "
    "clinic policies, and routing concerns to the right vet or team member. "
    "You cannot diagnose conditions or advise on medication dosages. "
    "Always ask for the owner's name, pet's name, and reason for the visit if not already provided. "
    "Keep replies short — two to three sentences unless more detail is clearly needed."
)

# Use Fireworks (OpenAI-compatible) when available, fall back to OpenAI
_FIREWORKS_KEY = os.getenv("FIREWORKS_API_KEY")
_FIREWORKS_URL = os.getenv("FIREWORKS_BASE_URL", "https://api.fireworks.ai/inference/v1")
_FIREWORKS_MODEL = os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/llama-v3p1-8b-instruct")

if _FIREWORKS_KEY:
    _llm = AsyncOpenAI(api_key=_FIREWORKS_KEY, base_url=_FIREWORKS_URL)
    _MODEL = _FIREWORKS_MODEL
else:
    _llm = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    _MODEL = "gpt-4o-mini"

# In-memory conversation history keyed by conversation_id
_sessions: dict[str, list[dict[str, str]]] = {}


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.conversation_id or str(uuid4())
    history = _sessions.setdefault(session_id, [])

    # Run orchestrator — handles emergency detection and booking workflows
    orchestrated = await handle_message(request.phone, request.message, request.channel)

    # Detect the generic fallback path: orchestrator found no emergency or booking intent
    # (active_agent stays "Reception Agent" and no urgency is set on the general fallback branch)
    is_general = orchestrated.active_agent == "Reception Agent" and orchestrated.urgency_level is None

    if is_general:
        # Live conversational reply via GPT with full session history
        history.append({"role": "user", "content": request.message})
        reply = await _gpt_reply(history)
        history.append({"role": "assistant", "content": reply})
        response = orchestrated.model_copy(update={"reply": reply, "response": reply})
    else:
        # Structured workflow response (emergency / booking / medication follow-up)
        history.append({"role": "user", "content": request.message})
        history.append({"role": "assistant", "content": orchestrated.reply})
        response = orchestrated

    await collections.conversations.insert_one({
        "_id": str(uuid4()),
        "conversation_id": session_id,
        "channel": request.channel,
        "transcript": [
            {"role": "owner", "content": request.message},
            {"role": "assistant", "content": response.reply},
        ],
        "summary": response.reply[:240],
        "owner_id": None,
        "pet_id": None,
    })
    return response


async def _gpt_reply(history: list[dict[str, str]]) -> str:
    messages: list[dict[str, str]] = [{"role": "system", "content": _SYSTEM_PROMPT}] + history[-20:]
    try:
        completion = await _llm.chat.completions.create(
            model=_MODEL,
            messages=messages,
            max_tokens=300,
            temperature=0.7,
        )
        return completion.choices[0].message.content.strip()
    except Exception as exc:
        log.exception("GPT reply failed: %s", exc)
        return "I'm sorry, I'm having a momentary issue. Could you please try again?"
