import mqtt from 'mqtt';
import config from '../config/env.js';

let client = null;

let latestSensorData = {
  deviceId: config.defaultDeviceId,
  room: 'Room 1',
  temperature: null,
  humidity: null,
  distance: null,
  motion: false,
  sound: false,
  touch: false,
  timestamp: null,
};

/**
 * Get the latest sensor data received from Raspberry Pi through MQTT.
 */
export function getLatestMqttSensorData(
  deviceId = config.defaultDeviceId
) {
  if (latestSensorData.deviceId !== deviceId) {
    return null;
  }

  return latestSensorData;
}

/**
 * Connect backend directly to HiveMQ Cloud.
 */
export function connectMqtt() {
  if (!config.mqtt.brokerUrl) {
    console.log('[MQTT] Broker URL not configured. MQTT disabled.');
    return;
  }

  console.log('[MQTT] Connecting to HiveMQ...');

  client = mqtt.connect(config.mqtt.brokerUrl, {
    username: config.mqtt.username,
    password: config.mqtt.password,

    clientId: `smartsense-backend-${Date.now()}`,

    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 10000,

    // HiveMQ Cloud uses TLS
    rejectUnauthorized: true,
  });

  // MQTT connected
  client.on('connect', () => {
    console.log('[MQTT] Connected to HiveMQ Cloud');

    client.subscribe(
      config.mqtt.sensorTopic,
      { qos: 0 },
      (error) => {
        if (error) {
          console.error(
            '[MQTT] Subscription failed:',
            error.message
          );
          return;
        }

        console.log(
          `[MQTT] Subscribed to: ${config.mqtt.sensorTopic}`
        );
      }
    );
  });

  // MQTT message received
  client.on('message', (topic, message) => {
    try {
      const rawMessage = message.toString();

      // Show the raw message for testing
      console.log('[MQTT RAW]', topic, rawMessage);

      const data = JSON.parse(rawMessage);

      latestSensorData = {
        ...latestSensorData,
        ...data,
        deviceId: data.deviceId || latestSensorData.deviceId,
        room: data.room || latestSensorData.room,
        timestamp:
          data.timestamp || new Date().toISOString(),
      };

      console.log(
        `[MQTT] Sensor data received: ` +
        `${latestSensorData.temperature}°C | ` +
        `${latestSensorData.humidity}% | ` +
        `${latestSensorData.distance}cm | ` +
        `Motion: ${latestSensorData.motion} | ` +
        `Sound: ${latestSensorData.sound} | ` +
        `Touch: ${latestSensorData.touch}`
      );

    } catch (error) {
      console.error(
        '[MQTT] Invalid sensor message:',
        error.message
      );
    }
  });

  // MQTT error
  client.on('error', (error) => {
    console.error(
      '[MQTT] Connection error:',
      error.message
    );
  });

  // MQTT reconnecting
  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting to HiveMQ...');
  });

  // MQTT offline
  client.on('offline', () => {
    console.log('[MQTT] Offline');
  });

  // MQTT connection closed
  client.on('close', () => {
    console.log('[MQTT] Connection closed');
  });
}

/**
 * Disconnect MQTT cleanly.
 */
export function disconnectMqtt() {
  if (client) {
    console.log('[MQTT] Disconnecting...');

    client.end();

    client = null;
  }
}