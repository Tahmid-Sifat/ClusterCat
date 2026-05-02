import datetime
import os
import uuid
from urllib.parse import urlparse, urlunparse

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from livekit.api import LiveKitAPI
from livekit.api.access_token import AccessToken, VideoGrants
from livekit.protocol.room import CreateRoomRequest


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
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    if not livekit_url or not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="LiveKit URL/API key/API secret must be configured")

    parsed = urlparse(livekit_url)
    if parsed.scheme in ("wss", "ws"):
        api_host = urlunparse(("https" if parsed.scheme == "wss" else "http", parsed.netloc, parsed.path, "", "", ""))
    else:
        api_host = livekit_url

    room_name = f"clustercat-voice-{uuid.uuid4().hex[:8]}"
    identity = f"visitor-{uuid.uuid4().hex[:8]}"

    try:
        async with LiveKitAPI(api_host, api_key, api_secret) as lkapi:
            await lkapi.room.create_room(CreateRoomRequest(name=room_name, empty_timeout=60 * 60, max_participants=20))

        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        token = (
            AccessToken(api_key, api_secret)
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
