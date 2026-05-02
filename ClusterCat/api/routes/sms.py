from pydantic import BaseModel
from fastapi import APIRouter

from routes.util import clean
from tools.notification_tools import send_sms_or_mock

router = APIRouter(prefix="/sms", tags=["sms"])


class MockSmsRequest(BaseModel):
    phone: str
    body: str
    workflow_id: str | None = None


@router.post("/mock")
async def mock_sms(request: MockSmsRequest):
    return clean(await send_sms_or_mock(request.phone, request.body, request.workflow_id))
