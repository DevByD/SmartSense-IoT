"""
Unit tests for SmartSense telemetry payload schema and validation.
"""

import unittest
from datetime import datetime, timezone

from src.utils.validation import validate_telemetry


class TestPayloadValidation(unittest.TestCase):
    def setUp(self):
        self.valid_payload = {
            "deviceId": "smartsense-pi-01",
            "room": "Room 1",
            "temperature": 27.5,
            "humidity": 62.6,
            "distance": 47.6,
            "motion": False,
            "sound": False,
            "touch": False,
            "timestamp": "2026-09-21T17:00:00.000Z",
        }

    def test_valid_payload_passes(self):
        """Standard telemetry payload should pass with 0 errors."""
        is_valid, errors = validate_telemetry(self.valid_payload)
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)

    def test_missing_or_empty_device_id(self):
        """Missing or whitespace deviceId must be rejected."""
        payload = dict(self.valid_payload)
        payload["deviceId"] = ""
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)
        self.assertTrue(any("deviceId" in e for e in errors))

        del payload["deviceId"]
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)

    def test_missing_or_empty_room(self):
        """Missing or whitespace room must be rejected."""
        payload = dict(self.valid_payload)
        payload["room"] = "   "
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)
        self.assertTrue(any("room" in e for e in errors))

    def test_temperature_validation(self):
        """Temperature must be numeric; non-numeric values must be rejected."""
        payload = dict(self.valid_payload)
        payload["temperature"] = "27.5"  # String instead of float
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)
        self.assertTrue(any("temperature" in e for e in errors))

        payload["temperature"] = True  # Boolean should not be accepted as number
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)

    def test_humidity_range_validation(self):
        """Humidity must be a number between 0.0 and 100.0."""
        payload = dict(self.valid_payload)
        payload["humidity"] = 105.0  # Out of range (>100)
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)
        self.assertTrue(any("humidity" in e for e in errors))

        payload["humidity"] = -2.0  # Negative humidity
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)

    def test_distance_non_negative_validation(self):
        """Distance must be non-negative."""
        payload = dict(self.valid_payload)
        payload["distance"] = -5.0
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)
        self.assertTrue(any("distance" in e for e in errors))

        payload["distance"] = 0.0  # Zero distance is valid
        is_valid, _ = validate_telemetry(payload)
        self.assertTrue(is_valid)

    def test_boolean_sensor_types(self):
        """Motion, sound, and touch must be booleans (not numbers or strings)."""
        for field in ["motion", "sound", "touch"]:
            payload = dict(self.valid_payload)
            payload[field] = 1  # Integer instead of boolean
            is_valid, errors = validate_telemetry(payload)
            self.assertFalse(is_valid)
            self.assertTrue(any(field in e for e in errors))

            payload[field] = "true"  # String instead of boolean
            is_valid, errors = validate_telemetry(payload)
            self.assertFalse(is_valid)

    def test_iso_timestamp_validation(self):
        """Timestamp must be a valid ISO 8601 string."""
        payload = dict(self.valid_payload)
        payload["timestamp"] = "not-a-timestamp"
        is_valid, errors = validate_telemetry(payload)
        self.assertFalse(is_valid)
        self.assertTrue(any("timestamp" in e for e in errors))

        # Valid ISO with milliseconds and Z
        payload["timestamp"] = datetime.now(timezone.utc).isoformat()
        is_valid, errors = validate_telemetry(payload)
        self.assertTrue(is_valid)

    def test_reject_null_or_primitive_payload(self):
        """Payload must be a non-null dictionary."""
        self.assertFalse(validate_telemetry(None)[0])
        self.assertFalse(validate_telemetry("string")[0])
        self.assertFalse(validate_telemetry([1, 2, 3])[0])


if __name__ == "__main__":
    unittest.main()
