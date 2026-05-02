EMERGENCY_KEYWORDS = [
    "not moving",
    "difficulty breathing",
    "seizure",
    "collapse",
    "not eating 24",
    "not eating for 24",
    "severe vomiting",
    "suspected poisoning",
    "poison",
]


def detect_emergency(message: str):
    text = message.lower()
    matches = [keyword for keyword in EMERGENCY_KEYWORDS if keyword in text]
    return {"is_emergency": bool(matches), "matches": matches}
