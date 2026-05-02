from fastapi import APIRouter

from db import collections_db as collections
from models.schemas import TriageRequest
from routes.util import clean
from tools.triage_tools import triage_symptom

router = APIRouter(prefix="/triage", tags=["triage"])


@router.post("")
async def triage(request: TriageRequest):
    return clean(await triage_symptom(request.symptom_description, request.owner_id, request.pet_id))


@router.get("/events")
async def events():
    return clean(await collections.triage_events.find({}).sort("created_at", -1).to_list(100))
