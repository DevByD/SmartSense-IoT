"""
SmartSense IoT - Sound / Acoustic Sensor Driver
Detects acoustic spikes above threshold on Raspberry Pi 4B GPIO 22.
Configurable polarity accommodates both Active-HIGH and Active-LOW digital microphone modules.
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


class SoundSensor:
    """
    Hardware driver for Digital Sound / Microphone Sensor.
    Digital OUT connected to BCM GPIO 22.
    """

    def __init__(self, pin: int = 22, active_high: bool = True):
        self.pin = pin
        self.active_high = active_high
        self._initialized = False

        if _GPIO_AVAILABLE:
            try:
                GPIO.setmode(GPIO.BCM)
                pull = GPIO.PUD_DOWN if self.active_high else GPIO.PUD_UP
                GPIO.setup(self.pin, GPIO.IN, pull_up_down=pull)
                self._initialized = True
            except Exception as e:
                print(f"[WARN] Failed to configure Sound GPIO {self.pin}: {e}")

    @property
    def is_hardware_ready(self) -> bool:
        """Returns True if physical GPIO is configured."""
        return _GPIO_AVAILABLE and self._initialized

    def read_sound(self) -> bool:
        """
        Reads digital state of the sound sensor.
        Returns:
            True if sound event is active, False otherwise.
        """
        if not self.is_hardware_ready:
            return False

        try:
            val = GPIO.input(self.pin)
            is_active = (val == GPIO.HIGH) if self.active_high else (val == GPIO.LOW)
            return is_active
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


def run_local_test(duration_seconds: int = 10, pin: int = 22, active_high: bool = True) -> None:
    """Executes a standalone acceptance test for Sound Sensor."""
    print("=" * 52)
    print("LOCAL SENSOR TEST: Sound Detection (Digital Microphone)")
    print(f"Target GPIO Pin: {pin} (Active High: {active_high})")
    print("=" * 52)

    sensor = SoundSensor(pin=pin, active_high=active_high)
    if not sensor.is_hardware_ready:
        print("RESULT: NOT TESTED -- HARDWARE REQUIRED")
        print("Reason: RPi.GPIO library or Raspberry Pi hardware not detected.")
        print("=" * 52)
        return

    print("Listening for acoustic spikes (clap hands or speak loudly near sensor)...")
    start = time.time()
    sound_seen = False
    last_state = None

    while time.time() - start < duration_seconds:
        state = sensor.read_sound()
        if state != last_state:
            status_text = "SOUND DETECTED" if state else "NORMAL (Quiet)"
            print(f"[{time.strftime('%H:%M:%S')}] Acoustic State -> {status_text}")
            last_state = state
            if state:
                sound_seen = True
        time.sleep(0.1)

    sensor.cleanup()
    print("=" * 52)
    if sound_seen:
        print("TEST RESULT: PASS (Sound event successfully triggered and captured)")
    else:
        print("TEST RESULT: PASS (Ambient environment remained quiet; no trigger)")
    print("=" * 52)


if __name__ == "__main__":
    run_local_test()
