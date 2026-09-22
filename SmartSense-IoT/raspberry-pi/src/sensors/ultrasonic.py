"""
SmartSense IoT - HC-SR04 Ultrasonic Distance Sensor Driver
Measures distance in centimeters with timeout protection and input level safety.
"""

import time
from typing import Optional

# Try importing RPi.GPIO or mock
_GPIO_AVAILABLE = False
try:
    import RPi.GPIO as GPIO
    _GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    _GPIO_AVAILABLE = False


class UltrasonicSensor:
    """
    Hardware driver for HC-SR04 Ultrasonic Distance Sensor.
    TRIG: Output to trigger ultrasonic ping (GPIO 23).
    ECHO: Input to measure pulse width (GPIO 24, via voltage divider).
    """

    def __init__(self, trig_pin: int = 23, echo_pin: int = 24, timeout_ms: int = 35):
        self.trig_pin = trig_pin
        self.echo_pin = echo_pin
        self.timeout_s = timeout_ms / 1000.0
        self.last_valid_reading: Optional[float] = None
        self._initialized = False

        if _GPIO_AVAILABLE:
            try:
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(self.trig_pin, GPIO.OUT, initial=GPIO.LOW)
                GPIO.setup(self.echo_pin, GPIO.IN)
                self._initialized = True
            except Exception as e:
                print(f"[WARN] Failed to configure Ultrasonic GPIO pins ({self.trig_pin}/{self.echo_pin}): {e}")

    @property
    def is_hardware_ready(self) -> bool:
        """Returns True if physical GPIO is configured."""
        return _GPIO_AVAILABLE and self._initialized

    def read_distance(self) -> Optional[float]:
        """
        Triggers a 10µs pulse and measures the echo response duration.
        Returns:
            Distance in centimeters rounded to 1 decimal place,
            or None if measurement times out or is out of range.
        """
        if not self.is_hardware_ready:
            return None

        try:
            # 1. Ensure trigger is low for a clean start
            GPIO.output(self.trig_pin, GPIO.LOW)
            time.sleep(0.000002)  # 2 microseconds

            # 2. Emit 10µs ultrasonic trigger pulse
            GPIO.output(self.trig_pin, GPIO.HIGH)
            time.sleep(0.00001)  # 10 microseconds
            GPIO.output(self.trig_pin, GPIO.LOW)

            # 3. Wait for echo pin to go HIGH (pulse start) with timeout
            start_wait = time.perf_counter()
            pulse_start = start_wait
            while GPIO.input(self.echo_pin) == GPIO.LOW:
                pulse_start = time.perf_counter()
                if pulse_start - start_wait > self.timeout_s:
                    return None  # Timeout waiting for echo start

            # 4. Wait for echo pin to go LOW (pulse end) with timeout
            pulse_end = pulse_start
            while GPIO.input(self.echo_pin) == GPIO.HIGH:
                pulse_end = time.perf_counter()
                if pulse_end - pulse_start > self.timeout_s:
                    return None  # Timeout waiting for echo completion

            # 5. Calculate distance: speed of sound = 343 m/s = 34,300 cm/s
            pulse_duration = pulse_end - pulse_start
            distance_cm = (pulse_duration * 34300.0) / 2.0

            # 6. Boundary validation (HC-SR04 operational range: 2.0cm - 400.0cm)
            if distance_cm < 2.0 or distance_cm > 400.0:
                return None

            distance_rounded = round(distance_cm, 1)
            self.last_valid_reading = distance_rounded
            return distance_rounded

        except Exception as e:
            return None

    def cleanup(self) -> None:
        """Cleans up sensor GPIO pins."""
        if _GPIO_AVAILABLE and self._initialized:
            try:
                GPIO.cleanup((self.trig_pin, self.echo_pin))
            except Exception:
                pass
            self._initialized = False


def run_local_test(iterations: int = 5, trig_pin: int = 23, echo_pin: int = 24) -> None:
    """Executes a standalone acceptance test for HC-SR04."""
    print("=" * 52)
    print("LOCAL SENSOR TEST: HC-SR04 (Ultrasonic Distance)")
    print(f"Target GPIO Pins: TRIG={trig_pin}, ECHO={echo_pin}")
    print("=" * 52)

    sensor = UltrasonicSensor(trig_pin=trig_pin, echo_pin=echo_pin)
    if not sensor.is_hardware_ready:
        print("RESULT: NOT TESTED -- HARDWARE REQUIRED")
        print("Reason: RPi.GPIO library or Raspberry Pi hardware not detected.")
        print("=" * 52)
        return

    print("Measuring distance (place object at near / medium / far positions)...")
    success_count = 0
    for i in range(1, iterations + 1):
        dist = sensor.read_distance()
        if dist is not None:
            print(f"Reading {i}/{iterations}: Distance = {dist:.1f} cm [OK]")
            success_count += 1
        else:
            print(f"Reading {i}/{iterations}: Echo Timeout or Range Exceeded [OUT OF RANGE]")
        time.sleep(1.0)

    sensor.cleanup()
    print("=" * 52)
    if success_count > 0:
        print(f"TEST RESULT: PASS ({success_count}/{iterations} valid measurements)")
    else:
        print("TEST RESULT: FAIL (0 valid measurements received)")
    print("=" * 52)


if __name__ == "__main__":
    run_local_test()
