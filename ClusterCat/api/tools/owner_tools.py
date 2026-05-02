from datetime import datetime
from uuid import uuid4

from db import collections_db as collections


async def find_or_create_owner(phone: str, name: str | None = None, email: str | None = None):
    owner = await collections.owners.find_one({"phone": phone})
    if owner:
        return owner
    doc = {"_id": str(uuid4()), "name": name or "Unknown owner", "phone": phone, "email": email, "created_at": datetime.utcnow()}
    await collections.owners.insert_one(doc)
    return doc
