from fastapi import APIRouter
from uuid import uuid4

from agents.orchestrator import handle_message
from db import collections_db as collections
from models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    response = await handle_message(request.phone, request.message, request.channel)
    await collections.conversations.insert_one({
        "_id": str(uuid4()),
        "channel": request.channel,
        "transcript": [{"role": "owner", "content": request.message}, {"role": "assistant", "content": response.reply}],
        "summary": response.reply[:240],
        "owner_id": None,
        "pet_id": None,
    })
    return response
