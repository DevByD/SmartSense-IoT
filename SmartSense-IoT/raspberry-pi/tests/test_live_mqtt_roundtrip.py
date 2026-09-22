"""
Optional Live MQTT round-trip integration test.
Connects to MQTT broker if running on localhost:1883, publishes a valid payload,
and verifies receipt by subscriber. Skips cleanly if broker is not reachable.
"""

import json
import time
import socket
import unittest
import paho.mqtt.client as mqtt

from src.config import load_config
from src.utils.validation import validate_telemetry


def is_broker_online(host="localhost", port=1883, timeout=1.0) -> bool:
    """Checks if MQTT broker TCP port is accepting connections."""
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.close()
        return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


class TestLiveMQTTRoundtrip(unittest.TestCase):
    def setUp(self):
        self.config = load_config()
        self.broker_online = is_broker_online(self.config.mqtt_host, self.config.mqtt_port)

    def test_broker_roundtrip_if_online(self):
        """If broker is online, verify payload publish and subscription roundtrip."""
        if not self.broker_online:
            self.skipTest(f"MQTT Broker at {self.config.mqtt_host}:{self.config.mqtt_port} is not running.")

        received_messages = []

        def on_sub_connect(client, userdata, flags, rc, properties=None):
            client.subscribe(self.config.mqtt_topic)

        def on_message(client, userdata, msg):
            received_messages.append(json.loads(msg.payload.decode("utf-8")))

        # Create subscriber client
        sub_client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2 if hasattr(mqtt, "CallbackAPIVersion") else "sub-test",
            client_id="sub-test-listener"
        )
        sub_client.on_connect = on_sub_connect
        sub_client.on_message = on_message
        sub_client.connect(self.config.mqtt_host, self.config.mqtt_port, 60)
        sub_client.loop_start()

        time.sleep(0.5)

        # Create publisher client
        pub_client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2 if hasattr(mqtt, "CallbackAPIVersion") else "pub-test",
            client_id="pub-test-sender"
        )
        pub_client.connect(self.config.mqtt_host, self.config.mqtt_port, 60)
        pub_client.loop_start()

        time.sleep(0.5)

        # Publish test telemetry
        test_payload = {
            "deviceId": "smartsense-pi-hw-test",
            "room": self.config.room,
            "temperature": 27.5,
            "humidity": 62.6,
            "distance": 47.6,
            "motion": False,
            "sound": False,
            "touch": False,
            "timestamp": "2026-09-21T17:00:00.000Z",
        }
        pub_client.publish(self.config.mqtt_topic, json.dumps(test_payload), qos=0)

        # Wait for receipt of our specific test message
        timeout = time.time() + 4.0
        hw_msg = None
        while time.time() < timeout:
            for m in received_messages:
                if m.get("deviceId") == "smartsense-pi-hw-test":
                    hw_msg = m
                    break
            if hw_msg:
                break
            time.sleep(0.1)

        pub_client.loop_stop()
        pub_client.disconnect()
        sub_client.loop_stop()
        sub_client.disconnect()

        self.assertIsNotNone(hw_msg, "Subscriber failed to receive smartsense-pi-hw-test message within timeout")
        self.assertEqual(hw_msg["deviceId"], "smartsense-pi-hw-test")
        self.assertEqual(hw_msg["room"], self.config.room)
        self.assertEqual(hw_msg["temperature"], 27.5)
        self.assertEqual(hw_msg["humidity"], 62.6)
        self.assertEqual(hw_msg["distance"], 47.6)
        is_valid, errors = validate_telemetry(hw_msg)
        self.assertTrue(is_valid, f"Received payload failed schema: {errors}")


if __name__ == "__main__":
    unittest.main()
