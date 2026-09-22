"""
Unit tests for SmartSense MQTT client lifecycle and message dispatching.
"""

import json
import unittest
from unittest.mock import MagicMock, patch

from src.mqtt_client import SmartSenseMQTTClient


class TestMQTTClient(unittest.TestCase):
    def setUp(self):
        self.client = SmartSenseMQTTClient(
            host="localhost",
            port=1883,
            client_id="test-client-unit",
        )

    def tearDown(self):
        self.client.stop()

    def test_client_initialization(self):
        """Verify client configuration properties."""
        self.assertEqual(self.client.host, "localhost")
        self.assertEqual(self.client.port, 1883)
        self.assertEqual(self.client.client_id, "test-client-unit")
        self.assertFalse(self.client.is_connected)

    def test_on_connect_callback_handling(self):
        """Verify on_connect sets is_connected flag and calls user hook."""
        callback_called = False

        def on_connect():
            nonlocal callback_called
            callback_called = True

        self.client.on_connect_callback = on_connect
        # Simulate broker connect callback with rc=0
        self.client._handle_connect(None, None, None, 0)
        self.assertTrue(self.client.is_connected)
        self.assertTrue(callback_called)

    def test_on_disconnect_callback_handling(self):
        """Verify on_disconnect resets is_connected flag."""
        self.client.is_connected = True
        self.client._handle_disconnect(None, None, 1)
        self.assertFalse(self.client.is_connected)

    def test_publish_telemetry_when_disconnected_fails(self):
        """Publish should fail safely and return False when not connected."""
        self.client.is_connected = False
        res = self.client.publish_telemetry("smartsense/room1/sensors", {"test": 123})
        self.assertFalse(res)

    def test_publish_telemetry_when_connected(self):
        """Publish should serialize dict to JSON and dispatch over MQTT."""
        self.client.is_connected = True
        mock_publish_info = MagicMock()
        mock_publish_info.rc = 0
        self.client._client.publish = MagicMock(return_value=mock_publish_info)

        payload = {
            "deviceId": "smartsense-pi-01",
            "room": "Room 1",
            "temperature": 25.0,
            "humidity": 60.0,
            "distance": 45.0,
            "motion": False,
            "sound": False,
            "touch": False,
            "timestamp": "2026-09-21T12:00:00.000Z",
        }

        res = self.client.publish_telemetry("smartsense/room1/sensors", payload)
        self.assertTrue(res)
        self.client._client.publish.assert_called_once()
        args, kwargs = self.client._client.publish.call_args
        self.assertEqual(args[0], "smartsense/room1/sensors")
        published_json = json.loads(args[1])
        self.assertEqual(published_json["deviceId"], "smartsense-pi-01")


if __name__ == "__main__":
    unittest.main()
