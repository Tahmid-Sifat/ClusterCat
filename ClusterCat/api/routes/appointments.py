from fastapi import APIRouter

from db import collections
from routes.util import clean

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.get("")
async def appointments():
    return clean(await collections.appointments.find({}).sort("created_at", -1).to_list(100))
