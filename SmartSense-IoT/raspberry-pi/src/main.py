"""
SmartSense IoT - Raspberry Pi 4B Main Application
Coordinates sensor data acquisition, payload synthesis, validation, and MQTT publication.
"""

import sys
import os
import time
import signal
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Add project root to sys.path for direct script execution
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import load_config, AppConfig
from src.utils.logger import logger
from src.utils.validation import validate_telemetry
from src.mqtt_client import SmartSenseMQTTClient
from src.sensors.dht22 import DHT22Sensor, run_local_test as run_dht22_test
from src.sensors.ultrasonic import UltrasonicSensor, run_local_test as run_ultrasonic_test
from src.sensors.pir import PIRSensor, run_local_test as run_pir_test
from src.sensors.sound import SoundSensor, run_local_test as run_sound_test
from src.sensors.touch import TouchSensor, run_local_test as run_touch_test


class SmartSenseHardwareApp:
    """
    Orchestrates the Raspberry Pi 4B hardware layer:
    Acquires synchronized sensor samples, enforces contract schema, and publishes telemetry.
    """

    def __init__(self, config: AppConfig, dry_run: bool = False):
        self.config = config
        self.dry_run = dry_run
        self.running = False

        # Initialize physical sensor drivers
        self.dht22 = DHT22Sensor(pin=config.dht22_pin)
        self.ultrasonic = UltrasonicSensor(
            trig_pin=config.hcsr04_trig_pin,
            echo_pin=config.hcsr04_echo_pin,
            timeout_ms=config.hcsr04_timeout_ms,
        )
        self.pir = PIRSensor(pin=config.pir_pin)
        self.sound = SoundSensor(pin=config.sound_pin, active_high=config.sound_active_high)
        self.touch = TouchSensor(pin=config.touch_pin, active_high=config.touch_active_high)

        # Initialize MQTT client if not dry-run
        self.mqtt_client = None
        if not self.dry_run:
            self.mqtt_client = SmartSenseMQTTClient(
                host=config.mqtt_host,
                port=config.mqtt_port,
                client_id=config.mqtt_client_id,
                username=config.mqtt_username,
                password=config.mqtt_password,
            )

    def print_consolidated_reading(self, payload: dict) -> None:
        """Displays sensor readings in the project standard consolidated format."""
        print("=" * 52)
        print("SMARTSENSE PI -- SENSOR DATA")
        print("=" * 52)
        print(f"Temperature: {payload['temperature']:.1f} °C")
        print(f"Humidity:    {payload['humidity']:.1f} %")
        print(f"Distance:    {payload['distance']:.1f} cm")
        print(f"Motion:      {payload['motion']}")
        print(f"Sound:       {payload['sound']}")
        print(f"Touch:       {payload['touch']}")
        print()
        print(f"Device:      {payload['deviceId']}")
        print(f"Room:        {payload['room']}")
        print(f"Timestamp:   {payload['timestamp']}")
        print("=" * 52)

    def read_all_sensors(self) -> dict | None:
        """
        Executes a single coordinated read across all 5 hardware sensors.
        Returns validated telemetry payload dictionary or None if critical read fails.
        """
        # 1. Read DHT22 (Temperature & Humidity)
        dht_reading = self.dht22.read()
        if dht_reading is not None:
            temp, hum = dht_reading
            logger.info("DHT22 OK")
        elif self.dht22.last_valid_reading is not None:
            temp, hum = self.dht22.last_valid_reading
            logger.warning("DHT22 READ FAILED -- Using last known valid reading")
        else:
            logger.error("DHT22 READ FAILED -- No valid temperature/humidity reading available")
            return None

        # 2. Read HC-SR04 (Ultrasonic Distance)
        dist = self.ultrasonic.read_distance()
        if dist is not None:
            logger.info("HC-SR04 OK")
        elif self.ultrasonic.last_valid_reading is not None:
            dist = self.ultrasonic.last_valid_reading
            logger.warning("HC-SR04 TIMEOUT -- Using last known distance")
        else:
            dist = 50.0  # Safe nominal fallback if never obtained
            logger.warning("HC-SR04 TIMEOUT -- Using nominal default (50.0 cm)")

        # 3. Read PIR Motion Sensor
        motion = self.pir.read_motion()
        logger.info("PIR OK")

        # 4. Read Sound Sensor
        sound = self.sound.read_sound()
        logger.info("SOUND OK")

        # 5. Read Touch / SOS Sensor
        touch = self.touch.read_touch()
        logger.info("TOUCH OK")

        # 6. Synthesize ISO 8601 UTC timestamp
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        payload = {
            "deviceId": self.config.device_id,
            "room": self.config.room,
            "temperature": temp,
            "humidity": hum,
            "distance": dist,
            "motion": motion,
            "sound": sound,
            "touch": touch,
            "timestamp": timestamp,
        }

        # 7. Validate contract schema before publishing
        is_valid, errors = validate_telemetry(payload)
        if not is_valid:
            logger.error(f"Telemetry contract violation: {'; '.join(errors)}")
            return None

        return payload

    def start(self) -> None:
        """Starts the coordinated sampling and publishing loop."""
        self.running = True
        logger.info("Starting SmartSense IoT Raspberry Pi Hardware Service...")
        logger.info(f"Device: {self.config.device_id} | Room: {self.config.room}")
        logger.info(f"Target MQTT: {self.config.mqtt_host}:{self.config.mqtt_port} -> {self.config.mqtt_topic}")

        if not self.dry_run and self.mqtt_client:
            self.mqtt_client.start()
            # Allow brief window for connection handshake
            time.sleep(1.0)

        interval = self.config.sampling_interval_seconds

        try:
            while self.running:
                loop_start = time.time()

                payload = self.read_all_sensors()
                if payload is not None:
                    if self.dry_run:
                        self.print_consolidated_reading(payload)
                    elif self.mqtt_client and self.mqtt_client.is_connected:
                        self.mqtt_client.publish_telemetry(self.config.mqtt_topic, payload)

                # Compensate for sensor sampling duration to maintain stable ~2s period
                elapsed = time.time() - loop_start
                sleep_time = max(0.1, interval - elapsed)
                time.sleep(sleep_time)

        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received. Initiating graceful shutdown...")
        finally:
            self.shutdown()

    def shutdown(self) -> None:
        """Releases GPIO pins and closes MQTT connection safely."""
        self.running = False
        logger.info("Cleaning up hardware and network resources...")

        if self.mqtt_client:
            self.mqtt_client.stop()

        self.dht22.cleanup()
        self.ultrasonic.cleanup()
        self.pir.cleanup()
        self.sound.cleanup()
        self.touch.cleanup()

        logger.info("SmartSense Hardware Service stopped safely.")


def main():
    parser = argparse.ArgumentParser(description="SmartSense IoT Raspberry Pi 4B Hardware Integration")
    parser.add_argument(
        "--run",
        action="store_true",
        help="Run live telemetry acquisition and MQTT publication loop (default)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Acquire and display sensor telemetry without publishing to MQTT",
    )
    parser.add_argument(
        "--test-sensor",
        type=str,
        choices=["dht22", "ultrasonic", "pir", "sound", "touch"],
        help="Run standalone local acceptance test for an individual sensor",
    )
    parser.add_argument(
        "--test-all-sensors",
        action="store_true",
        help="Run consolidated local test reading all 5 sensors together once",
    )

    args = parser.parse_args()

    try:
        config = load_config()
    except Exception as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)

    # 1. Handle individual sensor testing mode
    if args.test_sensor:
        if args.test_sensor == "dht22":
            run_dht22_test(iterations=5, pin=config.dht22_pin)
        elif args.test_sensor == "ultrasonic":
            run_ultrasonic_test(iterations=5, trig_pin=config.hcsr04_trig_pin, echo_pin=config.hcsr04_echo_pin)
        elif args.test_sensor == "pir":
            run_pir_test(duration_seconds=10, pin=config.pir_pin)
        elif args.test_sensor == "sound":
            run_sound_test(duration_seconds=10, pin=config.sound_pin, active_high=config.sound_active_high)
        elif args.test_sensor == "touch":
            run_touch_test(duration_seconds=10, pin=config.touch_pin, active_high=config.touch_active_high)
        return

    # 2. Handle consolidated test mode
    app = SmartSenseHardwareApp(config=config, dry_run=True)

    # Setup OS signal handlers for graceful exit
    def sig_handler(sig, frame):
        app.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, sig_handler)
    signal.signal(signal.SIGTERM, sig_handler)

    if args.test_all_sensors:
        print("Running consolidated all-sensors read...")
        payload = app.read_all_sensors()
        if payload is not None:
            app.print_consolidated_reading(payload)
            print("Consolidated read successful.")
        else:
            print("Consolidated read encountered errors (hardware not connected or read failure).")
        app.shutdown()
        return

    # 3. Default: run coordinated publishing loop
    app.dry_run = args.dry_run
    app.start()


if __name__ == "__main__":
    main()
