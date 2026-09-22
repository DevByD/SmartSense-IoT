"""
SmartSense IoT - Raspberry Pi Configuration Loader
Reads configuration from environment variables and .env file with rigorous validation.
"""

import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load .env relative to raspberry-pi project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def _get_bool(env_var: str, default: bool) -> bool:
    val = os.getenv(env_var)
    if val is None:
        return default
    return val.strip().lower() in ("true", "1", "yes", "t", "y")


def _get_int(env_var: str, default: int) -> int:
    val = os.getenv(env_var)
    if val is None or val.strip() == "":
        return default
    try:
        return int(val.strip())
    except ValueError:
        raise ValueError(f"Environment variable {env_var} must be an integer, got: '{val}'")


def _get_float(env_var: str, default: float) -> float:
    val = os.getenv(env_var)
    if val is None or val.strip() == "":
        return default
    try:
        return float(val.strip())
    except ValueError:
        raise ValueError(f"Environment variable {env_var} must be a valid number, got: '{val}'")


@dataclass(frozen=True)
class AppConfig:
    # Device Identification
    device_id: str
    room: str

    # MQTT Settings
    mqtt_host: str
    mqtt_port: int
    mqtt_username: Optional[str]
    mqtt_password: Optional[str]
    mqtt_topic: str
    mqtt_client_id: str

    # Timing
    sampling_interval_seconds: float

    # GPIO BCM Pins
    dht22_pin: int
    hcsr04_trig_pin: int
    hcsr04_echo_pin: int
    pir_pin: int
    sound_pin: int
    touch_pin: int

    # Sensor Electrical Polarities
    sound_active_high: bool
    touch_active_high: bool
    hcsr04_timeout_ms: int

    def validate(self) -> None:
        """Validates configuration parameters to guarantee fail-fast behavior."""
        if not self.device_id or not self.device_id.strip():
            raise ValueError("DEVICE_ID cannot be empty")
        if not self.room or not self.room.strip():
            raise ValueError("ROOM cannot be empty")
        if not self.mqtt_host or not self.mqtt_host.strip():
            raise ValueError("MQTT_HOST cannot be empty")
        if not (1 <= self.mqtt_port <= 65535):
            raise ValueError(f"MQTT_PORT must be between 1 and 65535, got: {self.mqtt_port}")
        if not self.mqtt_topic or not self.mqtt_topic.strip():
            raise ValueError("MQTT_TOPIC cannot be empty")
        if self.sampling_interval_seconds <= 0.1:
            raise ValueError(f"SAMPLING_INTERVAL_SECONDS must be > 0.1s, got: {self.sampling_interval_seconds}")

        # GPIO pin validation (BCM standard range 0-27 on Raspberry Pi 4B)
        pins = {
            "DHT22_PIN": self.dht22_pin,
            "HCSR04_TRIG_PIN": self.hcsr04_trig_pin,
            "HCSR04_ECHO_PIN": self.hcsr04_echo_pin,
            "PIR_PIN": self.pir_pin,
            "SOUND_PIN": self.sound_pin,
            "TOUCH_PIN": self.touch_pin,
        }
        for name, pin in pins.items():
            if not (0 <= pin <= 27):
                raise ValueError(f"{name} must be a valid BCM pin (0-27), got: {pin}")

        # Ensure TRIG and ECHO pins are distinct
        if self.hcsr04_trig_pin == self.hcsr04_echo_pin:
            raise ValueError("HCSR04 TRIG and ECHO pins must be different GPIO pins")

    def to_safe_dict(self) -> dict:
        """Returns dictionary representation without sensitive credentials."""
        return {
            "device_id": self.device_id,
            "room": self.room,
            "mqtt_host": self.mqtt_host,
            "mqtt_port": self.mqtt_port,
            "mqtt_username": self.mqtt_username or "(none)",
            "mqtt_password": "***" if self.mqtt_password else "(none)",
            "mqtt_topic": self.mqtt_topic,
            "mqtt_client_id": self.mqtt_client_id,
            "sampling_interval_seconds": self.sampling_interval_seconds,
            "gpio_pins": {
                "dht22": self.dht22_pin,
                "hcsr04_trig": self.hcsr04_trig_pin,
                "hcsr04_echo": self.hcsr04_echo_pin,
                "pir": self.pir_pin,
                "sound": self.sound_pin,
                "touch": self.touch_pin,
            },
            "sensor_settings": {
                "sound_active_high": self.sound_active_high,
                "touch_active_high": self.touch_active_high,
                "hcsr04_timeout_ms": self.hcsr04_timeout_ms,
            },
        }


def load_config() -> AppConfig:
    """Instantiates and validates the application configuration from environment."""
    config = AppConfig(
        device_id=os.getenv("DEVICE_ID", "smartsense-pi-01").strip(),
        room=os.getenv("ROOM", "Room 1").strip(),
        mqtt_host=os.getenv("MQTT_HOST", "localhost").strip(),
        mqtt_port=_get_int("MQTT_PORT", 1883),
        mqtt_username=os.getenv("MQTT_USERNAME", "").strip() or None,
        mqtt_password=os.getenv("MQTT_PASSWORD", "").strip() or None,
        mqtt_topic=os.getenv("MQTT_TOPIC", "smartsense/room1/sensors").strip(),
        mqtt_client_id=os.getenv("MQTT_CLIENT_ID", "smartsense-pi-01-hardware").strip(),
        sampling_interval_seconds=_get_float("SAMPLING_INTERVAL_SECONDS", 2.0),
        dht22_pin=_get_int("DHT22_PIN", 4),
        hcsr04_trig_pin=_get_int("HCSR04_TRIG_PIN", 23),
        hcsr04_echo_pin=_get_int("HCSR04_ECHO_PIN", 24),
        pir_pin=_get_int("PIR_PIN", 27),
        sound_pin=_get_int("SOUND_PIN", 22),
        touch_pin=_get_int("TOUCH_PIN", 18),
        sound_active_high=_get_bool("SOUND_ACTIVE_HIGH", True),
        touch_active_high=_get_bool("TOUCH_ACTIVE_HIGH", True),
        hcsr04_timeout_ms=_get_int("HCSR04_TIMEOUT_MS", 35),
    )
    config.validate()
    return config
