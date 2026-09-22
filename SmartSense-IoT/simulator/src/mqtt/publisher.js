import mqtt from 'mqtt';
import config from '../config.js';
import { getFormattedTime } from '../utils/logger.js';

export class MqttPublisher {
  constructor(customConfig = {}) {
    this.config = { ...config, ...customConfig };
    this.client = null;
    this.isConnected = false;
    this.hasLoggedInitialError = false;
  }

  /**
   * Connect to the MQTT Broker
   */
  connect() {
    return new Promise((resolve) => {
      const options = {
        clientId: this.config.mqttClientId,
        clean: true,
        connectTimeout: this.config.mqttConnectTimeout,
        reconnectPeriod: this.config.mqttReconnectPeriod,
      };

      try {
        this.client = mqtt.connect(this.config.mqttBrokerUrl, options);

        this.client.on('connect', () => {
          this.isConnected = true;
          this.hasLoggedInitialError = false;

          console.log('\n====================================================');
          console.log('SMARTSENSE MQTT PUBLISHER');
          console.log('====================================================');
          console.log(`Broker: ${this.config.mqttBrokerUrl}`);
          console.log(`Topic : ${this.config.mqttSensorTopic}`);
          console.log('Status: CONNECTED');
          console.log('====================================================\n');

          // Publish an initial online status payload
          this.publishStatus({
            deviceId: this.config.deviceId,
            room: this.config.room,
            status: 'online',
            timestamp: new Date().toISOString(),
          });

          resolve(true);
        });

        this.client.on('reconnect', () => {
          // Silent or dim notice on reconnect attempts
        });

        this.client.on('offline', () => {
          this.isConnected = false;
        });

        this.client.on('error', (err) => {
          this.isConnected = false;
          if (!this.hasLoggedInitialError) {
            console.warn(`\n[MQTT WARNING] Broker unreachable at ${this.config.mqttBrokerUrl} (${err.code || err.message}).`);
            console.warn('[MQTT WARNING] Simulator continuing in local standalone mode. Will auto-reconnect when broker is available.\n');
            this.hasLoggedInitialError = true;
          }
          resolve(false);
        });

        this.client.on('close', () => {
          this.isConnected = false;
        });
      } catch (err) {
        console.warn(`[MQTT WARNING] Connection initialization error: ${err.message}`);
        resolve(false);
      }
    });
  }

  /**
   * Publish sensor telemetry payload to smartsense/room1/sensors
   */
  publishTelemetry(telemetry) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    const topic = this.config.mqttSensorTopic;
    const payload = JSON.stringify(telemetry);

    this.client.publish(topic, payload, { qos: 0 }, (err) => {
      if (err) {
        console.error(`[MQTT ERROR] Failed to publish telemetry to ${topic}:`, err.message);
      } else {
        const time = getFormattedTime(new Date(telemetry.timestamp));
        console.log(`\x1b[32m[${time}] MQTT PUBLISHED\x1b[0m Topic: \x1b[36m${topic}\x1b[0m (${payload.length} bytes)`);
      }
    });

    return true;
  }

  /**
   * Publish device status payload to smartsense/room1/status
   */
  publishStatus(statusData) {
    if (!this.isConnected || !this.client) return false;

    const topic = this.config.mqttStatusTopic;
    const payload = JSON.stringify(statusData);

    this.client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
      if (!err) {
        const time = getFormattedTime();
        console.log(`\x1b[35m[${time}] MQTT STATUS PUBLISHED\x1b[0m Topic: ${topic}`);
      }
    });

    return true;
  }

  /**
   * Publish alert notification to smartsense/room1/alerts (prepared for Node-RED in Phase 5)
   */
  publishAlert(alertData) {
    if (!this.isConnected || !this.client) return false;

    const topic = this.config.mqttAlertTopic;
    const payload = JSON.stringify(alertData);

    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (!err) {
        const time = getFormattedTime();
        console.log(`\x1b[31m[${time}] MQTT ALERT PUBLISHED\x1b[0m Topic: ${topic}`);
      }
    });

    return true;
  }

  /**
   * Gracefully disconnect from broker
   */
  disconnect() {
    return new Promise((resolve) => {
      if (this.client) {
        // Publish offline status before closing if connected
        if (this.isConnected) {
          try {
            this.publishStatus({
              deviceId: this.config.deviceId,
              room: this.config.room,
              status: 'offline',
              timestamp: new Date().toISOString(),
            });
          } catch (e) {
            // Ignore on shutdown
          }
        }

        this.client.end(false, () => {
          this.isConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default MqttPublisher;
