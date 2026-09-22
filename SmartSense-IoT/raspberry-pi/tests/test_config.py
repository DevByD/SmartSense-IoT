"""
Unit tests for Raspberry Pi configuration loader and validation.
"""

import os
import unittest
from unittest.mock import patch

from src.config import AppConfig, load_config


class TestConfig(unittest.TestCase):
    def test_default_configuration(self):
        """Verify default configuration values match project standard."""
        with patch.dict(os.environ, {}, clear=True):
            config = load_config()
            self.assertEqual(config.device_id, "smartsense-pi-01")
            self.assertEqual(config.room, "Room 1")
            self.assertEqual(config.mqtt_host, "localhost")
            self.assertEqual(config.mqtt_port, 1883)
            self.assertEqual(config.mqtt_topic, "smartsense/room1/sensors")
            self.assertEqual(config.sampling_interval_seconds, 2.0)
            self.assertEqual(config.dht22_pin, 4)
            self.assertEqual(config.hcsr04_trig_pin, 23)
            self.assertEqual(config.hcsr04_echo_pin, 24)
            self.assertEqual(config.pir_pin, 27)
            self.assertEqual(config.sound_pin, 22)
            self.assertEqual(config.touch_pin, 18)
            self.assertTrue(config.sound_active_high)
            self.assertTrue(config.touch_active_high)

    def test_custom_environment_overrides(self):
        """Verify environment variables properly override defaults."""
        custom_env = {
            "DEVICE_ID": "smartsense-pi-custom",
            "ROOM": "Office Lab",
            "MQTT_HOST": "192.168.1.50",
            "MQTT_PORT": "18883",
            "MQTT_TOPIC": "smartsense/custom/sensors",
            "SAMPLING_INTERVAL_SECONDS": "3.5",
            "SOUND_ACTIVE_HIGH": "false",
            "TOUCH_ACTIVE_HIGH": "false",
        }
        with patch.dict(os.environ, custom_env, clear=True):
            config = load_config()
            self.assertEqual(config.device_id, "smartsense-pi-custom")
            self.assertEqual(config.room, "Office Lab")
            self.assertEqual(config.mqtt_host, "192.168.1.50")
            self.assertEqual(config.mqtt_port, 18883)
            self.assertEqual(config.mqtt_topic, "smartsense/custom/sensors")
            self.assertEqual(config.sampling_interval_seconds, 3.5)
            self.assertFalse(config.sound_active_high)
            self.assertFalse(config.touch_active_high)

    def test_invalid_device_id_raises(self):
        """Verify empty DEVICE_ID triggers validation error."""
        with patch.dict(os.environ, {"DEVICE_ID": "   "}, clear=True):
            with self.assertRaises(ValueError):
                load_config()

    def test_invalid_mqtt_port_raises(self):
        """Verify port out of range triggers validation error."""
        with patch.dict(os.environ, {"MQTT_PORT": "70000"}, clear=True):
            with self.assertRaises(ValueError):
                load_config()

    def test_invalid_pin_raises(self):
        """Verify pin out of BCM range (0-27) triggers validation error."""
        with patch.dict(os.environ, {"DHT22_PIN": "35"}, clear=True):
            with self.assertRaises(ValueError):
                load_config()

    def test_trig_echo_pin_collision_raises(self):
        """Verify error if TRIG and ECHO share the same pin."""
        with patch.dict(os.environ, {"HCSR04_TRIG_PIN": "23", "HCSR04_ECHO_PIN": "23"}, clear=True):
            with self.assertRaises(ValueError):
                load_config()

    def test_password_masked_in_safe_dict(self):
        """Verify sensitive credentials are never exposed in dictionary representation."""
        config = AppConfig(
            device_id="smartsense-pi-01",
            room="Room 1",
            mqtt_host="localhost",
            mqtt_port=1883,
            mqtt_username="iot-user",
            mqtt_password="super-secret-password",
            mqtt_topic="smartsense/room1/sensors",
            mqtt_client_id="test-client",
            sampling_interval_seconds=2.0,
            dht22_pin=4,
            hcsr04_trig_pin=23,
            hcsr04_echo_pin=24,
            pir_pin=27,
            sound_pin=22,
            touch_pin=18,
            sound_active_high=True,
            touch_active_high=True,
            hcsr04_timeout_ms=35,
        )
        safe = config.to_safe_dict()
        self.assertEqual(safe["mqtt_password"], "***")
        self.assertNotIn("super-secret-password", str(safe))


if __name__ == "__main__":
    unittest.main()
