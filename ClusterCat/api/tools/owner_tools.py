from datetime import datetime

from db import collections


async def find_or_create_owner(phone: str, name: str | None = None, email: str | None = None):
    owner = await collections.owners.find_one({"phone": phone})
    if owner:
        return owner
    doc = {"name": name or "Unknown owner", "phone": phone, "email": email, "created_at": datetime.utcnow()}
    result = await collections.owners.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc
