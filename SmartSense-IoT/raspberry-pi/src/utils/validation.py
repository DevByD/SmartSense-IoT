"""
SmartSense IoT - Telemetry Payload Validation
Enforces 100% strict contract conformance with Simulator and Node-RED ingestion schemas.
"""

import math
from datetime import datetime
from typing import Any, Dict, List, Tuple


def validate_telemetry(data: Any) -> Tuple[bool, List[str]]:
    """
    Validates a telemetry dictionary against the required SmartSense contract.

    Returns:
        (is_valid, list_of_errors)
    """
    errors: List[str] = []

    if not isinstance(data, dict):
        return False, ["Payload must be a non-null dictionary/JSON object"]

    # 1. deviceId: string
    device_id = data.get("deviceId")
    if not isinstance(device_id, str) or not device_id.strip():
        errors.append("deviceId must be a non-empty string")

    # 2. room: string
    room = data.get("room")
    if not isinstance(room, str) or not room.strip():
        errors.append("room must be a non-empty string")

    # 3. temperature: number
    temperature = data.get("temperature")
    if not isinstance(temperature, (int, float)) or isinstance(temperature, bool) or math.isnan(temperature) or math.isinf(temperature):
        errors.append("temperature must be a valid number")

    # 4. humidity: number
    humidity = data.get("humidity")
    if not isinstance(humidity, (int, float)) or isinstance(humidity, bool) or math.isnan(humidity) or math.isinf(humidity):
        errors.append("humidity must be a valid number")
    elif humidity < 0.0 or humidity > 100.0:
        errors.append("humidity must be between 0.0 and 100.0")

    # 5. distance: non-negative number
    distance = data.get("distance")
    if not isinstance(distance, (int, float)) or isinstance(distance, bool) or math.isnan(distance) or math.isinf(distance):
        errors.append("distance must be a valid number")
    elif distance < 0.0:
        errors.append("distance must be a non-negative number")

    # 6. motion: boolean
    motion = data.get("motion")
    if not isinstance(motion, bool):
        errors.append("motion must be a boolean")

    # 7. sound: boolean
    sound = data.get("sound")
    if not isinstance(sound, bool):
        errors.append("sound must be a boolean")

    # 8. touch: boolean
    touch = data.get("touch")
    if not isinstance(touch, bool):
        errors.append("touch must be a boolean")

    # 9. timestamp: valid ISO 8601 string
    timestamp = data.get("timestamp")
    if not isinstance(timestamp, str) or not timestamp.strip():
        errors.append("timestamp must be an ISO 8601 string")
    else:
        try:
            # Parse ISO 8601 string (handles 'Z' or offset)
            clean_ts = timestamp.replace("Z", "+00:00")
            datetime.fromisoformat(clean_ts)
        except Exception:
            errors.append(f"timestamp '{timestamp}' is not a valid ISO 8601 format")

    return len(errors) == 0, errors
