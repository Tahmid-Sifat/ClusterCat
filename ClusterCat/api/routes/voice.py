import datetime
import os
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from livekit.api import LiveKitAPI
from livekit.api.access_token import AccessToken, VideoGrants
from livekit.protocol.room import CreateRoomRequest, ListRoomsRequest


class VoiceSessionResponse(BaseModel):
    url: str
    token: str
    room: str
    identity: str
    expires_at: str


router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/session", response_model=VoiceSessionResponse)
async def voice_session():
    livekit_url = os.getenv("LIVEKIT_URL")
    if not livekit_url:
        raise HTTPException(status_code=500, detail="LiveKit URL is not configured")

    room_name = f"clustercat-voice-{uuid.uuid4().hex[:8]}"
    identity = f"visitor-{uuid.uuid4().hex[:8]}"

    try:
        async with LiveKitAPI() as lkapi:
            existing_rooms = await lkapi.room.list_rooms(ListRoomsRequest(names=[room_name]))
            if not existing_rooms.rooms:
                await lkapi.room.create_room(CreateRoomRequest(name=room_name, empty_timeout=60 * 60))

        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        token = (
            AccessToken()
            .with_identity(identity)
            .with_name("ClusterCat Visitor")
            .with_grants(
                VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=False,
                )
            )
            .with_ttl(datetime.timedelta(hours=1))
            .to_jwt()
        )

        return {
            "url": livekit_url,
            "token": token,
            "room": room_name,
            "identity": identity,
            "expires_at": expires_at.isoformat(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LiveKit session creation failed: {exc}")
