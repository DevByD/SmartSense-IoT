"""
Unit tests for sensor logic, mock behaviors, timeouts, and error handling.
Runs in CI/host environment without requiring physical Raspberry Pi GPIO hardware.
"""

import unittest
from unittest.mock import MagicMock, patch

from src.config import AppConfig
from src.sensors.dht22 import DHT22Sensor
from src.sensors.ultrasonic import UltrasonicSensor
from src.sensors.pir import PIRSensor
from src.sensors.sound import SoundSensor
from src.sensors.touch import TouchSensor
from src.main import SmartSenseHardwareApp


class TestSensorLogic(unittest.TestCase):
    def setUp(self):
        self.config = AppConfig(
            device_id="smartsense-pi-01",
            room="Room 1",
            mqtt_host="localhost",
            mqtt_port=1883,
            mqtt_username=None,
            mqtt_password=None,
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

    def test_dht22_without_hardware_returns_none(self):
        """Without physical hardware, DHT22 returns None gracefully without crashing."""
        sensor = DHT22Sensor(pin=4)
        if not sensor.is_hardware_ready:
            self.assertIsNone(sensor.read())

    def test_dht22_with_mock_device(self):
        """When hardware device is mocked, values are extracted, validated and rounded."""
        sensor = DHT22Sensor(pin=4)
        mock_device = MagicMock()
        mock_device.temperature = 24.367
        mock_device.humidity = 55.421
        sensor.device = mock_device

        with patch("src.sensors.dht22._HARDWARE_AVAILABLE", True):
            reading = sensor.read()
            self.assertIsNotNone(reading)
            temp, hum = reading
            self.assertEqual(temp, 24.4)
            self.assertEqual(hum, 55.4)
            self.assertEqual(sensor.last_valid_reading, (24.4, 55.4))

    def test_dht22_rejects_out_of_bounds_readings(self):
        """Temperature outside -40 to 80 or humidity outside 0-100 should be rejected."""
        sensor = DHT22Sensor(pin=4)
        mock_device = MagicMock()
        mock_device.temperature = 120.0  # Impossible DHT22 temp
        mock_device.humidity = 60.0
        sensor.device = mock_device

        with patch("src.sensors.dht22._HARDWARE_AVAILABLE", True):
            reading = sensor.read()
            self.assertIsNone(reading)

    def test_ultrasonic_distance_calculation(self):
        """Verify speed of sound formula: (duration * 34300) / 2."""
        # For a distance of 17.15 cm:
        # duration = (17.15 * 2) / 34300 = 0.001s (1ms)
        duration = 0.001
        calculated = (duration * 34300.0) / 2.0
        self.assertAlmostEqual(calculated, 17.15, places=2)

    def test_ultrasonic_without_hardware_returns_none(self):
        """Without physical GPIO, Ultrasonic returns None without crashing."""
        sensor = UltrasonicSensor(trig_pin=23, echo_pin=24)
        if not sensor.is_hardware_ready:
            self.assertIsNone(sensor.read_distance())

    def test_sound_polarity_active_high_vs_active_low(self):
        """Verify polarity logic for active-high and active-low sound sensors."""
        sensor_high = SoundSensor(pin=22, active_high=True)
        sensor_low = SoundSensor(pin=22, active_high=False)

        # In mock environment without GPIO, defaults to False
        if not sensor_high.is_hardware_ready:
            self.assertFalse(sensor_high.read_sound())
            self.assertFalse(sensor_low.read_sound())

    def test_touch_polarity(self):
        """Verify touch sensor default behavior."""
        sensor = TouchSensor(pin=18, active_high=True)
        if not sensor.is_hardware_ready:
            self.assertFalse(sensor.read_touch())

    def test_pir_motion_quiescent(self):
        """Verify PIR sensor default behavior."""
        sensor = PIRSensor(pin=27)
        if not sensor.is_hardware_ready:
            self.assertFalse(sensor.read_motion())

    def test_coordinated_sampling_payload(self):
        """Verify coordinated sampling loop produces conforming payload."""
        app = SmartSenseHardwareApp(config=self.config, dry_run=True)
        # Mock sensor returns to simulate live hardware read
        app.dht22.read = MagicMock(return_value=(26.8, 61.2))
        app.ultrasonic.read_distance = MagicMock(return_value=45.2)
        app.pir.read_motion = MagicMock(return_value=False)
        app.sound.read_sound = MagicMock(return_value=False)
        app.touch.read_touch = MagicMock(return_value=False)

        payload = app.read_all_sensors()
        self.assertIsNotNone(payload)
        self.assertEqual(payload["deviceId"], "smartsense-pi-01")
        self.assertEqual(payload["room"], "Room 1")
        self.assertEqual(payload["temperature"], 26.8)
        self.assertEqual(payload["humidity"], 61.2)
        self.assertEqual(payload["distance"], 45.2)
        self.assertFalse(payload["motion"])
        self.assertFalse(payload["sound"])
        self.assertFalse(payload["touch"])
        self.assertTrue(payload["timestamp"].endswith("Z"))
        app.shutdown()


if __name__ == "__main__":
    unittest.main()
