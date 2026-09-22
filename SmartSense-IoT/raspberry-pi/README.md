# SmartSense IoT — Raspberry Pi 4B Hardware Integration

This directory contains the Python hardware acquisition service for the **Raspberry Pi 4B**, interfacing directly with physical sensors and publishing synchronized telemetry payloads over MQTT to the SmartSense pipeline.

---

## 1. Raspberry Pi 4B Requirements

- **Target Board:** Raspberry Pi 4 Model B (2GB, 4GB, or 8GB)
- **Power Supply:** Official Raspberry Pi 5.1V / 3.0A USB-C Power Supply (adequate current is critical to prevent brownouts when driving ultrasonic pulses and multiple sensors simultaneously)
- **Connectivity:** Local Area Network (Wi-Fi or Gigabit Ethernet) connected to the same subnet as the SmartSense MQTT Broker

---

## 2. Raspberry Pi OS Requirements

- **Operating System:** Raspberry Pi OS (64-bit), Debian 12 (Bookworm) or Debian 11 (Bullseye)
- **Architecture:** `aarch64` / `arm64`
- **System Packages:**
  ```bash
  sudo apt update
  sudo apt install -y python3 python3-pip python3-venv python3-libgpiod
  ```

---

## 3. Python Version

- **Recommended:** Python 3.10, 3.11, or 3.12 (standard on Raspberry Pi OS Bookworm / Bullseye)
- Verify version with:
  ```bash
  python3 --version
  ```

---

## 4. Required Packages

Install Python dependencies using a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Key dependencies:
- `paho-mqtt>=2.0.0`: MQTT 3.1.1 / 5.0 client wrapper
- `python-dotenv>=1.0.0`: Environment variable configuration
- `adafruit-circuitpython-dht>=4.0.0`: DHT22 hardware driver
- `RPi.GPIO>=0.7.1` or `gpiozero>=2.0.0`: GPIO pin control and edge detection

---

## 5. Wiring Overview

```
                        ┌────────────────────────┐
                        │   Raspberry Pi 4B      │
                        │   40-Pin Header        │
                        └───────────┬────────────┘
                                    │
       ┌──────────────┬─────────────┼──────────────┬──────────────┐
       │              │             │              │              │
       ▼              ▼             ▼              ▼              ▼
   ┌───────┐     ┌─────────┐   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ DHT22 │     │ HC-SR04 │   │ HC-SR501│    │  Sound  │    │  Touch  │
   │ Temp/ │     │Distance │   │   PIR   │    │ Sensor  │    │ (TTP223)│
   │ Humid │     │         │   │ Motion  │    │Acoustic │    │   SOS   │
   └───────┘     └─────────┘   └─────────┘    └─────────┘    └─────────┘
```

---

## 6. Complete GPIO Pin Mapping (BCM Pinout)

All GPIO numbers correspond to **Broadcom (BCM)** pin numbering:

| Sensor Module | Function | Sensor Pin | Pi 4B Pin Name | Physical Header Pin | Electrical Requirements |
|---|---|---|---|---|---|
| **DHT22** | Temp & Humidity | DATA | GPIO 4 | Pin 7 | 3.3V or 5V VCC, 4.7kΩ pull-up to 3.3V |
| **DHT22** | Power & Ground | VCC / GND | 3.3V / GND | Pin 1 / Pin 9 | Connect GND to Pi common ground |
| **HC-SR04** | Ultrasonic Trigger | TRIG | GPIO 23 | Pin 16 | 3.3V CMOS logic drive from Pi |
| **HC-SR04** | Ultrasonic Echo | ECHO | GPIO 24 | Pin 18 | **MUST use voltage divider** (5V -> 3.3V) |
| **HC-SR04** | Power & Ground | VCC / GND | 5V / GND | Pin 2 / Pin 20 | HC-SR04 requires 5V supply |
| **HC-SR501** | PIR Motion Detect | OUT | GPIO 27 | Pin 13 | 3.3V digital output from sensor |
| **HC-SR501** | Power & Ground | VCC / GND | 5V / GND | Pin 4 / Pin 14 | Module has internal 3.3V regulator |
| **Sound** | Acoustic Spike | Digital OUT | GPIO 22 | Pin 15 | 3.3V supply, configurable polarity |
| **Sound** | Power & Ground | VCC / GND | 3.3V / GND | Pin 17 / Pin 25| Common Ground |
| **Touch** | Capacitive SOS Key | OUT | GPIO 18 | Pin 12 | 3.3V digital output (HIGH on touch) |
| **Touch** | Power & Ground | VCC / GND | 3.3V / GND | Pin 1 / Pin 6 | Common Ground |

---

## 7. HC-SR04 Level-Shifting Warning (CRITICAL SAFETY)

> [!CAUTION]
> **Raspberry Pi GPIOs are 3.3V tolerant only!**
> The HC-SR04 operates at 5V VCC and emits a **5V pulse** on its ECHO pin. Connecting the ECHO pin directly to GPIO 24 will damage or destroy the Raspberry Pi SoC pin controller.
>
> You **MUST** attenuate the 5V ECHO signal to ~3.3V using a two-resistor voltage divider:
>
> ```
> HC-SR04 ECHO (5V) ────[ R1: 1.0 kΩ ]────┬──── GPIO 24 (3.3V Input)
>                                          │
>                                    [ R2: 2.0 kΩ ]
>                                          │
>                                         GND (Common)
> ```
>
> Calculation: `V_out = 5.0V * (2.0kΩ / (1.0kΩ + 2.0kΩ)) = 3.33V`

---

## 8. Environment Configuration

Copy the example configuration:
```bash
cp .env.example .env
```

Edit `.env` to match your local setup:
```ini
DEVICE_ID=smartsense-pi-01
ROOM=Room 1
MQTT_HOST=192.168.1.100       # IP of machine running the MQTT broker
MQTT_PORT=1883
MQTT_TOPIC=smartsense/room1/sensors
SAMPLING_INTERVAL_SECONDS=2.0
```

---

## 9. MQTT Configuration

- **Topic:** `smartsense/room1/sensors` (Exact same topic consumed by Node-RED)
- **Port:** `1883` (Default MQTT)
- **Payload Schema:**
  ```json
  {
    "deviceId": "smartsense-pi-01",
    "room": "Room 1",
    "temperature": 27.5,
    "humidity": 62.6,
    "distance": 47.6,
    "motion": false,
    "sound": false,
    "touch": false,
    "timestamp": "2026-09-21T17:00:00.000Z"
  }
  ```

---

## 10. Installation

1. Transfer the `SmartSense-IoT/raspberry-pi` directory to your Raspberry Pi:
   ```bash
   scp -r SmartSense-IoT/raspberry-pi pi@<PI_IP>:~/smartsense-hardware
   ```
2. On the Raspberry Pi:
   ```bash
   cd ~/smartsense-hardware
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

---

## 11. Running the Program

Run the main live telemetry publishing service:
```bash
python3 src/main.py
```

Run in dry-run mode (acquire and print telemetry without publishing):
```bash
python3 src/main.py --dry-run
```

---

## 12. Testing Each Sensor (Sensor-by-Sensor Guide)

Do NOT connect all sensors at once. Connect and test sensors sequentially in the following order:

### Test 1: DHT22 (Temperature & Humidity)
Connect DHT22 on GPIO 4. Run:
```bash
python3 src/main.py --test-sensor dht22
```
*Acceptance Criteria:* Multiple readings output realistic temperature (~20–35°C) and humidity (~40–80%).

### Test 2: HC-SR04 (Ultrasonic Distance)
Connect TRIG to GPIO 23, ECHO to GPIO 24 via voltage divider. Run:
```bash
python3 src/main.py --test-sensor ultrasonic
```
*Acceptance Criteria:* Place an obstacle at near (~10cm), medium (~40cm), and far (~100cm) distances and verify reported distance updates accurately.

### Test 3: HC-SR501 (PIR Motion)
Connect OUT to GPIO 27. Run:
```bash
python3 src/main.py --test-sensor pir
```
*Acceptance Criteria:* Stand still (verify `NO MOTION`), then wave hand or walk in front of sensor (verify `MOTION DETECTED`).

### Test 4: Sound Sensor (Acoustic Trigger)
Connect Digital OUT to GPIO 22. Run:
```bash
python3 src/main.py --test-sensor sound
```
*Acceptance Criteria:* In quiet ambient conditions, verify `NORMAL`. Clap hands near microphone and verify `SOUND DETECTED`.

### Test 5: Touch Sensor (TTP223 SOS Key)
Connect OUT to GPIO 18. Run:
```bash
python3 src/main.py --test-sensor touch
```
*Acceptance Criteria:* Untouched state reports `NORMAL`. Touch capacitive pad and verify `TOUCH DETECTED (SOS ACTIVE)`. Release pad and verify return to `NORMAL`.

---

## 13. Running All Sensors Together

Once individual sensors pass, run the consolidated all-sensors read:
```bash
python3 src/main.py --test-all-sensors
```

Expected output:
```
====================================================
SMARTSENSE PI -- SENSOR DATA
====================================================
Temperature: 27.5 °C
Humidity:    62.6 %
Distance:    47.6 cm
Motion:      False
Sound:       False
Touch:       False

Device:      smartsense-pi-01
Room:        Room 1
Timestamp:   2026-09-21T17:00:00.000Z
====================================================
```

---

## 14. MQTT Troubleshooting

- **Connection Refused (`ECONNREFUSED`):**
  Ensure the MQTT broker machine allows connections on port 1883 and is reachable via `ping <MQTT_HOST>`.
- **Publisher Timeout:**
  Verify firewall permits port 1883 between the Pi and the host.
- **Malformed Topic:**
  Ensure `.env` defines `MQTT_TOPIC=smartsense/room1/sensors`.

---

## 15. GPIO Troubleshooting

- **Permission Denied accessing `/dev/gpiomem`:**
  Ensure the user belongs to the `gpio` group:
  ```bash
  sudo usermod -a -G gpio $USER
  ```
- **DHT22 Checksum Errors:**
  Ensure a 4.7kΩ pull-up resistor is installed between DATA and 3.3V. DHT22 timing is sensitive to CPU load.
- **HC-SR04 Distance Zero or Timeout:**
  Check voltage divider wiring. Ensure ECHO is connected to the center junction between R1 and R2, and GND is securely grounded.

---

## 16. Safe Shutdown

- The application traps `SIGINT` (Ctrl+C) and `SIGTERM`.
- Automatically calls `GPIO.cleanup()` on all registered pins to release pins into a high-impedance safe state.
- Gracefully disconnects from the MQTT broker without dropping packets.

---

## 17. Simulator vs Raspberry Pi Architecture

```
SOFTWARE TESTING MODE (Phases 1–10)
  ┌───────────────────────────┐
  │ Sensor Simulator (Node.js)│ ────┐
  └───────────────────────────┘     │
                                    │      ┌─────────────┐      ┌──────────┐      ┌─────────┐
                                    ├────► │ MQTT Broker │ ───► │ Node-RED │ ───► │Database │ ───► Express API / Apps
                                    │      │  (Port 1883)│      │          │      └─────────┘
  ┌───────────────────────────┐     │      └─────────────┘      └──────────┘
  │ Raspberry Pi 4B (Python)  │ ────┘
  │ Physical GPIO & Sensors   │
  └───────────────────────────┘
HARDWARE TESTING MODE (Phase 11)
```

Both telemetry producers output the identical JSON schema to the identical MQTT topic (`smartsense/room1/sensors`), allowing instantaneous switching between simulated and physical telemetry with zero changes required in Node-RED, the Database, the Express API, the Web Dashboard, or the Mobile App.
