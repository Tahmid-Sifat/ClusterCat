from datetime import datetime
from typing import Any


def clean(value: Any):
    if isinstance(value, list):
        return [clean(item) for item in value]
    if isinstance(value, dict):
        return {key: clean(val) for key, val in value.items()}
    if isinstance(value, datetime):
        return value.isoformat()
    if not isinstance(value, (str, int, float, bool, type(None))):
        return str(value)
    return value
