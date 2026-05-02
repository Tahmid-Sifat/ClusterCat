from fastapi import APIRouter

from agents.orchestrator import handle_message
from db import collections
from models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    response = await handle_message(request.phone, request.message, request.channel)
    await collections.conversations.insert_one({
        "channel": request.channel,
        "transcript": [{"role": "owner", "content": request.message}, {"role": "assistant", "content": response.reply}],
        "summary": response.reply[:240],
        "owner_id": None,
        "pet_id": None,
    })
    return response
