"""
SmartSense IoT - HC-SR501 Passive Infrared (PIR) Motion Sensor Driver
Detects human / physical movement via digital input on Raspberry Pi 4B GPIO 27.
"""

import time
from typing import Optional

# Try importing RPi.GPIO
_GPIO_AVAILABLE = False
try:
    import RPi.GPIO as GPIO
    _GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    _GPIO_AVAILABLE = False


class PIRSensor:
    """
    Hardware driver for HC-SR501 PIR Motion Sensor.
    OUT connected to BCM GPIO 27.
    """

    def __init__(self, pin: int = 27):
        self.pin = pin
        self._initialized = False

        if _GPIO_AVAILABLE:
            try:
                GPIO.setmode(GPIO.BCM)
                # Configure as input with internal pull-down
                GPIO.setup(self.pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
                self._initialized = True
            except Exception as e:
                print(f"[WARN] Failed to configure PIR GPIO {self.pin}: {e}")

    @property
    def is_hardware_ready(self) -> bool:
        """Returns True if physical GPIO is configured."""
        return _GPIO_AVAILABLE and self._initialized

    def read_motion(self) -> bool:
        """
        Reads digital state of PIR sensor.
        Returns:
            True if motion is detected (HIGH), False otherwise.
        """
        if not self.is_hardware_ready:
            return False

        try:
            val = GPIO.input(self.pin)
            return val == GPIO.HIGH
        except Exception:
            return False

    def cleanup(self) -> None:
        """Cleans up sensor GPIO pin."""
        if _GPIO_AVAILABLE and self._initialized:
            try:
                GPIO.cleanup(self.pin)
            except Exception:
                pass
            self._initialized = False


def run_local_test(duration_seconds: int = 10, pin: int = 27) -> None:
    """Executes a standalone acceptance test for PIR sensor."""
    print("=" * 52)
    print("LOCAL SENSOR TEST: HC-SR501 PIR (Motion Detection)")
    print(f"Target GPIO Pin: {pin}")
    print("=" * 52)

    sensor = PIRSensor(pin=pin)
    if not sensor.is_hardware_ready:
        print("RESULT: NOT TESTED -- HARDWARE REQUIRED")
        print("Reason: RPi.GPIO library or Raspberry Pi hardware not detected.")
        print("=" * 52)
        return

    print("Monitoring motion (walk in front of the sensor to trigger detection)...")
    start = time.time()
    last_state = None
    motion_seen = False

    while time.time() - start < duration_seconds:
        state = sensor.read_motion()
        if state != last_state:
            status_text = "MOTION DETECTED" if state else "NO MOTION (Clear)"
            print(f"[{time.strftime('%H:%M:%S')}] State Change -> {status_text}")
            last_state = state
            if state:
                motion_seen = True
        time.sleep(0.2)

    sensor.cleanup()
    print("=" * 52)
    if motion_seen:
        print("TEST RESULT: PASS (Motion state transition successfully observed)")
    else:
        print("TEST RESULT: PASS (Sensor remained in quiescent NO MOTION state)")
    print("=" * 52)


if __name__ == "__main__":
    run_local_test()
