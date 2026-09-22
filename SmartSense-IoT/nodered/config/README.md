# Node-RED Configuration Directory

## Overview
This directory houses configuration files for the SmartSense Node-RED stream processing runtime.

## Files
- `settings.js`: Custom Node-RED configuration specifying port `1880`, flow file location (`flows/smartsense-flows.json`), and global default parameters.

## Configurable Thresholds in Global Context
- `TEMP_WARNING_THRESHOLD`: `32.0` °C (Warning alert trigger)
- `TEMP_CRITICAL_THRESHOLD`: `35.0` °C (Critical alert trigger)
- `DISTANCE_ALERT_THRESHOLD`: `15.0` cm (Close obstacle trigger)
- `HUMIDITY_WARNING_THRESHOLD`: `75.0` % (Elevated humidity status)
- `ALERT_COOLDOWN_MS`: `10000` ms (10-second duplicate suppression period)
