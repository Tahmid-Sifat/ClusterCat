from fastapi import APIRouter, HTTPException

from db import collections_db as collections
from routes.util import clean

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("/{pet_id}")
async def pet(pet_id: str):
    doc = await collections.pets.find_one({"_id": pet_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Pet not found")
    return clean(doc)
