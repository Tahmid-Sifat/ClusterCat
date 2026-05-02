from fastapi import APIRouter

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/session")
async def voice_session():
    return {"status": "not_configured", "detail": "LiveKit is a bonus integration after chat and dashboard are solid."}
