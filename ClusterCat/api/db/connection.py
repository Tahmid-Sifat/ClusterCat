from __future__ import annotations

import os
import uuid
from copy import deepcopy
from datetime import datetime
from typing import Any

from dotenv import load_dotenv

load_dotenv()


class InsertOneResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, modified_count: int = 1):
        self.modified_count = modified_count


class AsyncCursor:
    def __init__(self, docs: list[dict[str, Any]]):
        self.docs = docs

    def sort(self, key: str, direction: int):
        reverse = direction < 0
        self.docs.sort(key=lambda doc: doc.get(key) or datetime.min, reverse=reverse)
        return self

    def limit(self, count: int):
        self.docs = self.docs[:count]
        return self

    async def to_list(self, length: int | None = None):
        return deepcopy(self.docs if length is None else self.docs[:length])


class MemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self.docs: list[dict[str, Any]] = []

    async def create_index(self, *args, **kwargs):
        return None

    async def delete_many(self, query: dict[str, Any]):
        self.docs = [doc for doc in self.docs if not _matches(doc, query)]
        return UpdateResult()

    async def insert_one(self, document: dict[str, Any]):
        doc = deepcopy(document)
        doc.setdefault("_id", str(uuid.uuid4()))
        self.docs.append(doc)
        return InsertOneResult(doc["_id"])

    async def find_one(self, query: dict[str, Any], sort: list[tuple[str, int]] | None = None):
        docs = [doc for doc in self.docs if _matches(doc, query)]
        if sort:
            key, direction = sort[0]
            docs.sort(key=lambda doc: doc.get(key) or datetime.min, reverse=direction < 0)
        return deepcopy(docs[0]) if docs else None

    def find(self, query: dict[str, Any] | None = None):
        query = query or {}
        return AsyncCursor([deepcopy(doc) for doc in self.docs if _matches(doc, query)])

    async def count_documents(self, query: dict[str, Any]):
        return len([doc for doc in self.docs if _matches(doc, query)])

    def aggregate(self, pipeline: list[dict[str, Any]]):
        limit = 100
        for stage in pipeline:
            if "$limit" in stage:
                limit = stage["$limit"]
            if "$vectorSearch" in stage:
                limit = stage["$vectorSearch"].get("limit", limit)
        return AsyncCursor([deepcopy(doc) for doc in self.docs[:limit]])

    async def update_one(self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False):
        doc = await self.find_one(query)
        if doc is None and upsert:
            doc = deepcopy(query)
            doc["_id"] = str(uuid.uuid4())
            self.docs.append(doc)
        if doc is None:
            return UpdateResult(0)
        stored = next(item for item in self.docs if item["_id"] == doc["_id"])
        _apply_update(stored, update)
        return UpdateResult(1)

    async def find_one_and_update(
        self,
        query: dict[str, Any],
        update: dict[str, Any],
        upsert: bool = False,
        return_document: bool = True,
    ):
        await self.update_one(query, update, upsert=upsert)
        return await self.find_one(query)


class MemoryDatabase:
    def __init__(self):
        self._collections: dict[str, MemoryCollection] = {}

    def __getitem__(self, name: str):
        if name not in self._collections:
            self._collections[name] = MemoryCollection(name)
        return self._collections[name]


def _matches(doc: dict[str, Any], query: dict[str, Any]) -> bool:
    for key, expected in query.items():
        actual = _get_nested(doc, key)
        if isinstance(expected, dict):
            if "$in" in expected and actual not in expected["$in"]:
                return False
            if "$gt" in expected and not (actual and actual > expected["$gt"]):
                return False
            if "$gte" in expected and not (actual and actual >= expected["$gte"]):
                return False
            if "$lt" in expected and not (actual and actual < expected["$lt"]):
                return False
            if "$lte" in expected and not (actual and actual <= expected["$lte"]):
                return False
            if "$ne" in expected and actual == expected["$ne"]:
                return False
        elif actual != expected:
            return False
    return True


def _get_nested(doc: dict[str, Any], key: str):
    current: Any = doc
    for part in key.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _apply_update(doc: dict[str, Any], update: dict[str, Any]):
    for key, value in update.get("$set", {}).items():
        doc[key] = value
    for key, value in update.get("$setOnInsert", {}).items():
        doc.setdefault(key, value)
    for key, value in update.get("$push", {}).items():
        doc.setdefault(key, []).append(value)
    for key, value in update.get("$addToSet", {}).items():
        doc.setdefault(key, [])
        if value not in doc[key]:
            doc[key].append(value)


try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from pymongo import ReturnDocument
except Exception:  # pragma: no cover
    AsyncIOMotorClient = None
    ReturnDocument = None


MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "clustercat")

client = AsyncIOMotorClient(MONGODB_URI) if MONGODB_URI and AsyncIOMotorClient else None
db = client[MONGODB_DB_NAME] if client else MemoryDatabase()
RETURN_DOCUMENT_AFTER = ReturnDocument.AFTER if ReturnDocument else True
