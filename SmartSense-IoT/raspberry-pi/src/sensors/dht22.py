"""
SmartSense IoT - DHT22 Temperature and Humidity Sensor Driver
Interfaces with physical DHT22 (AM2302) on Raspberry Pi 4B GPIO 4.
"""

import sys
import time
from typing import Optional, Tuple

# Try importing hardware libraries
_HARDWARE_AVAILABLE = False
_dht_device = None

try:
    import board
    import adafruit_dht
    _HARDWARE_AVAILABLE = True
except (ImportError, NotImplementedError):
    _HARDWARE_AVAILABLE = False


class DHT22Sensor:
    """
    Hardware driver for DHT22 Temperature & Humidity sensor.
    Operates on BCM GPIO 4 by default.
    """

    def __init__(self, pin: int = 4):
        self.pin = pin
        self.last_valid_reading: Optional[Tuple[float, float]] = None
        self.consecutive_errors: int = 0
        self.device = None

        if _HARDWARE_AVAILABLE:
            try:
                # Map BCM pin integer to board pin
                pin_attr = f"D{self.pin}"
                if hasattr(board, pin_attr):
                    board_pin = getattr(board, pin_attr)
                    self.device = adafruit_dht.DHT22(board_pin)
            except Exception as e:
                self.device = None
                print(f"[WARN] Failed to initialize adafruit_dht on GPIO {self.pin}: {e}")

    @property
    def is_hardware_ready(self) -> bool:
        """Returns True if the underlying physical hardware driver is initialized."""
        return _HARDWARE_AVAILABLE and self.device is not None

    def read(self) -> Optional[Tuple[float, float]]:
        """
        Reads temperature (°C) and humidity (%) from DHT22.
        Returns:
            Tuple of (temperature, humidity) rounded to 1 decimal place,
            or None if reading fails.
        """
        if not self.is_hardware_ready:
            return None

        try:
            temp_c = self.device.temperature
            humidity = self.device.humidity

            if temp_c is None or humidity is None:
                self.consecutive_errors += 1
                return None

            # Validate physical boundaries of DHT22 sensor
            if not (-40.0 <= temp_c <= 80.0) or not (0.0 <= humidity <= 100.0):
                self.consecutive_errors += 1
                return None

            temp_rounded = round(float(temp_c), 1)
            hum_rounded = round(float(humidity), 1)

            self.last_valid_reading = (temp_rounded, hum_rounded)
            self.consecutive_errors = 0
            return (temp_rounded, hum_rounded)

        except RuntimeError as err:
            # DHT sensors frequently throw checksum/timing errors; this is expected behavior
            self.consecutive_errors += 1
            return None
        except Exception as e:
            self.consecutive_errors += 1
            return None

    def cleanup(self) -> None:
        """Releases the DHT sensor hardware resource."""
        if self.device is not None:
            try:
                self.device.exit()
            except Exception:
                pass
            self.device = None


def run_local_test(iterations: int = 5, pin: int = 4) -> None:
    """Executes a standalone acceptance test for DHT22."""
    print("=" * 52)
    print("LOCAL SENSOR TEST: DHT22 (Temperature & Humidity)")
    print(f"Target GPIO Pin: {pin}")
    print("=" * 52)

    sensor = DHT22Sensor(pin=pin)
    if not sensor.is_hardware_ready:
        print("RESULT: NOT TESTED -- HARDWARE REQUIRED")
        print("Reason: adafruit_dht/board hardware libraries or Raspberry Pi hardware not detected.")
        print("=" * 52)
        return

    print("Reading physical sensor (sampling every 2 seconds)...")
    success_count = 0
    for i in range(1, iterations + 1):
        reading = sensor.read()
        if reading is not None:
            temp, hum = reading
            print(f"Reading {i}/{iterations}: Temperature = {temp:.1f} °C | Humidity = {hum:.1f} % [OK]")
            success_count += 1
        else:
            print(f"Reading {i}/{iterations}: Read timeout or checksum failure [RETRYING]")
        time.sleep(2.0)

    sensor.cleanup()
    print("=" * 52)
    if success_count > 0:
        print(f"TEST RESULT: PASS ({success_count}/{iterations} successful reads)")
    else:
        print("TEST RESULT: FAIL (0 valid readings received)")
    print("=" * 52)


if __name__ == "__main__":
    run_local_test()
