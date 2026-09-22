import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to simulator root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  // Device metadata
  deviceId: process.env.DEVICE_ID || 'smartsense-pi-01',
  room: process.env.ROOM || 'Room 1',
  intervalMs: parseInt(process.env.SIMULATION_INTERVAL_MS || '2000', 10),

  // Temperature parameters
  baseTemperature: parseFloat(process.env.BASE_TEMPERATURE || '27.5'),
  minTemperature: 20.0,
  maxTemperature: 38.0,
  tempAlertThreshold: parseFloat(process.env.TEMP_ALERT_THRESHOLD || '32.0'),

  // Humidity parameters
  baseHumidity: parseFloat(process.env.BASE_HUMIDITY || '62.0'),
  minHumidity: 40.0,
  maxHumidity: 80.0,

  // Ultrasonic parameters
  baseDistance: parseFloat(process.env.BASE_DISTANCE || '55.0'),
  minDistance: 5.0,
  maxDistance: 400.0,
  distanceAlertThreshold: parseFloat(process.env.DISTANCE_ALERT_THRESHOLD || '15.0'),

  // MQTT Broker & Topic Configuration
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  mqttSensorTopic: process.env.MQTT_SENSOR_TOPIC || 'smartsense/room1/sensors',
  mqttAlertTopic: process.env.MQTT_ALERT_TOPIC || 'smartsense/room1/alerts',
  mqttStatusTopic: process.env.MQTT_STATUS_TOPIC || 'smartsense/room1/status',
  mqttClientId: process.env.MQTT_CLIENT_ID || `smartsense-sim-${Math.random().toString(16).substring(2, 8)}`,
  mqttReconnectPeriod: 3000,
  mqttConnectTimeout: 5000,
};

export default config;
