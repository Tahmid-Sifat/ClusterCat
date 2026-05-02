from fastapi import APIRouter

from models.schemas import MedicationFlagRequest, PregnancyFlagRequest
from routes.util import clean
from tools.flag_tools import flag_external_medication, flag_pregnancy

router = APIRouter(prefix="/flags", tags=["flags"])


@router.post("/medication")
async def medication(request: MedicationFlagRequest):
    return clean(await flag_external_medication(request.owner_id, request.pet_id, request.workflow_id, request.medication_description))


@router.post("/pregnancy")
async def pregnancy(request: PregnancyFlagRequest):
    return clean(await flag_pregnancy(request.owner_id, request.pet_id, request.workflow_id))
