import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { Aedes } from 'aedes';
import mqtt from 'mqtt';

import config from '../src/config.js';
import { MqttPublisher } from '../src/mqtt/publisher.js';
import { TelemetryGenerator } from '../src/simulator/generator.js';

test('MQTT configuration loads valid topics and broker URL', () => {
  assert.strictEqual(typeof config.mqttBrokerUrl, 'string');
  assert.ok(config.mqttBrokerUrl.startsWith('mqtt://'));

  assert.strictEqual(config.mqttSensorTopic, 'smartsense/room1/sensors');
  assert.strictEqual(config.mqttAlertTopic, 'smartsense/room1/alerts');
  assert.strictEqual(config.mqttStatusTopic, 'smartsense/room1/status');
});

test('Publisher handles offline broker gracefully without throwing', async () => {
  const offlinePublisher = new MqttPublisher({
    mqttBrokerUrl: 'mqtt://127.0.0.1:19999', // Non-existent port
    mqttConnectTimeout: 500,
    mqttReconnectPeriod: 0,
  });

  const success = await offlinePublisher.connect();
  assert.strictEqual(success, false);

  // Calling publishTelemetry while disconnected must not throw
  const generator = new TelemetryGenerator();
  const telemetry = generator.generateTelemetry();
  const published = offlinePublisher.publishTelemetry(telemetry);
  assert.strictEqual(published, false);

  await offlinePublisher.disconnect();
});

test('End-to-End MQTT Publish and Subscribe verification', async () => {
  const TEST_PORT = 18883;
  const TEST_BROKER_URL = `mqtt://127.0.0.1:${TEST_PORT}`;
  const TEST_TOPIC = 'smartsense/room1/sensors';

  // 1. Start ephemeral in-memory test broker
  const aedes = await Aedes.createBroker();
  const server = createServer(aedes.handle);

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  // 2. Setup Subscriber
  let receivedMessage = null;
  const subscriber = mqtt.connect(TEST_BROKER_URL, { clientId: 'test-sub' });

  await new Promise((resolve) => {
    subscriber.on('connect', () => {
      subscriber.subscribe(TEST_TOPIC, () => resolve());
    });
  });

  const messagePromise = new Promise((resolve) => {
    subscriber.on('message', (topic, payload) => {
      receivedMessage = JSON.parse(payload.toString());
      resolve();
    });
  });

  // 3. Setup Publisher & publish a telemetry packet
  const publisher = new MqttPublisher({
    mqttBrokerUrl: TEST_BROKER_URL,
    mqttSensorTopic: TEST_TOPIC,
    mqttClientId: 'test-pub',
  });

  await publisher.connect();

  const generator = new TelemetryGenerator();
  const testPayload = generator.generateTelemetry();

  const published = publisher.publishTelemetry(testPayload);
  assert.strictEqual(published, true);

  // 4. Wait for subscriber reception
  await messagePromise;

  // 5. Verify payload content matches exactly
  assert.ok(receivedMessage !== null);
  assert.strictEqual(receivedMessage.deviceId, testPayload.deviceId);
  assert.strictEqual(receivedMessage.room, testPayload.room);
  assert.strictEqual(receivedMessage.temperature, testPayload.temperature);
  assert.strictEqual(receivedMessage.humidity, testPayload.humidity);
  assert.strictEqual(receivedMessage.distance, testPayload.distance);
  assert.strictEqual(receivedMessage.motion, testPayload.motion);
  assert.strictEqual(receivedMessage.sound, testPayload.sound);
  assert.strictEqual(receivedMessage.touch, testPayload.touch);
  assert.strictEqual(receivedMessage.timestamp, testPayload.timestamp);

  // 6. Clean cleanup
  await publisher.disconnect();
  await new Promise((resolve) => subscriber.end(true, resolve));
  await new Promise((resolve) => {
    aedes.close(() => {
      server.close(resolve);
    });
  });
});
