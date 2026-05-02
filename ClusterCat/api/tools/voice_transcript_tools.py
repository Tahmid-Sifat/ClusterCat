from datetime import datetime
from uuid import uuid4

from db import collections_db as collections


async def create_voice_conversation(conversation_id: str, room_name: str):
    doc = {
        "_id": conversation_id,
        "channel": "voice",
        "room_name": room_name,
        "transcript": [],
        "summary": "",
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await collections.conversations.update_one(
        {"_id": conversation_id},
        {"$setOnInsert": doc},
        upsert=True,
    )
    return doc


async def save_transcript_turn(conversation_id: str, role: str, content: str):
    turn = {
        "_id": str(uuid4()),
        "role": role,
        "content": content,
        "created_at": datetime.utcnow(),
    }
    await collections.conversations.update_one(
        {"_id": conversation_id},
        {
            "$push": {"transcript": turn},
            "$set": {"updated_at": datetime.utcnow()},
        },
        upsert=True,
    )
    return turn


async def close_voice_conversation(conversation_id: str):
    conversation = await collections.conversations.find_one({"_id": conversation_id})
    transcript = conversation.get("transcript", []) if conversation else []
    summary = _summarize(transcript)
    await collections.conversations.update_one(
        {"_id": conversation_id},
        {
            "$set": {
                "status": "completed",
                "summary": summary,
                "ended_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )
    return summary


def _summarize(transcript: list[dict]):
    if not transcript:
        return "Voice call ended without transcript."
    snippets = [f"{turn.get('role')}: {turn.get('content')}" for turn in transcript[-6:]]
    return " | ".join(snippets)[:500]
