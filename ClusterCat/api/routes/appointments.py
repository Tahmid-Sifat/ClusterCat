from fastapi import APIRouter

from db import collections_db as collections
from models.schemas import AppointmentCreate
from routes.util import clean
from tools.booking_tools import create_appointment

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("")
async def appointments():
    return clean(await collections.appointments.find({}).sort("created_at", -1).to_list(100))


@router.post("")
async def create(request: AppointmentCreate):
    return clean(await create_appointment(
        request.owner_id,
        request.pet_id,
        request.service_id,
        request.staff_id,
        request.slot,
        request.notes
    ))
