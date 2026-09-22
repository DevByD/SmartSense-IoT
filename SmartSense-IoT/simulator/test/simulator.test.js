import test from 'node:test';
import assert from 'node:assert/strict';

import TemperatureSensor from '../src/sensors/temperature.js';
import HumiditySensor from '../src/sensors/humidity.js';
import UltrasonicSensor from '../src/sensors/ultrasonic.js';
import MotionSensor from '../src/sensors/motion.js';
import SoundSensor from '../src/sensors/sound.js';
import TouchSensor from '../src/sensors/touch.js';
import { TelemetryGenerator } from '../src/simulator/generator.js';

test('Temperature Sensor generates values within limits', () => {
  const sensor = new TemperatureSensor({ minTemperature: 20, maxTemperature: 38, baseTemperature: 28 });
  for (let i = 0; i < 50; i++) {
    const val = sensor.next();
    assert.strictEqual(typeof val, 'number');
    assert.ok(val >= 20 && val <= 38, `Temperature ${val} out of bounds`);
  }
});

test('Humidity Sensor generates values within limits', () => {
  const sensor = new HumiditySensor({ minHumidity: 40, maxHumidity: 80, baseHumidity: 60 });
  for (let i = 0; i < 50; i++) {
    const val = sensor.next();
    assert.strictEqual(typeof val, 'number');
    assert.ok(val >= 40 && val <= 80, `Humidity ${val} out of bounds`);
  }
});

test('Ultrasonic Sensor distance is always positive and non-negative', () => {
  const sensor = new UltrasonicSensor({ minDistance: 5, maxDistance: 400, baseDistance: 60 });
  for (let i = 0; i < 50; i++) {
    const val = sensor.next();
    assert.strictEqual(typeof val, 'number');
    assert.ok(val > 0, `Distance ${val} must be positive`);
    assert.ok(val <= 400, `Distance ${val} exceeds max range`);
  }
});

test('Motion Sensor outputs boolean values', () => {
  const sensor = new MotionSensor();
  for (let i = 0; i < 20; i++) {
    const val = sensor.next();
    assert.strictEqual(typeof val, 'boolean');
  }
});

test('Sound Sensor outputs boolean values', () => {
  const sensor = new SoundSensor();
  for (let i = 0; i < 20; i++) {
    const val = sensor.next();
    assert.strictEqual(typeof val, 'boolean');
  }
});

test('Touch / SOS Sensor outputs boolean values', () => {
  const sensor = new TouchSensor();
  for (let i = 0; i < 20; i++) {
    const val = sensor.next();
    assert.strictEqual(typeof val, 'boolean');
  }
});

test('Telemetry Generator produces valid schema and contract', () => {
  const generator = new TelemetryGenerator();
  const data = generator.generateTelemetry();

  // Field existence and types
  assert.strictEqual(typeof data.deviceId, 'string');
  assert.ok(data.deviceId.length > 0);

  assert.strictEqual(typeof data.room, 'string');
  assert.ok(data.room.length > 0);

  assert.strictEqual(typeof data.temperature, 'number');
  assert.ok(!isNaN(data.temperature));

  assert.strictEqual(typeof data.humidity, 'number');
  assert.ok(!isNaN(data.humidity));

  assert.strictEqual(typeof data.distance, 'number');
  assert.ok(data.distance >= 0);

  assert.strictEqual(typeof data.motion, 'boolean');
  assert.strictEqual(typeof data.sound, 'boolean');
  assert.strictEqual(typeof data.touch, 'boolean');

  assert.strictEqual(typeof data.timestamp, 'string');
  const parsedDate = new Date(data.timestamp);
  assert.ok(!isNaN(parsedDate.getTime()), 'timestamp must be a valid ISO date');
});

test('Telemetry validation catches malformed payloads', () => {
  const invalidPayload = {
    deviceId: '',
    room: 'Room 1',
    temperature: 'not-a-number',
    distance: -5,
  };
  const result = TelemetryGenerator.validateTelemetry(invalidPayload);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.length > 0);
});

test('Scenarios activate correct sensor states', () => {
  const generator = new TelemetryGenerator();

  // Test SOS scenario
  generator.setScenario('SOS');
  const sosData = generator.generateTelemetry();
  assert.strictEqual(sosData.touch, true);

  // Test Motion scenario
  generator.setScenario('MOTION');
  const motionData = generator.generateTelemetry();
  assert.strictEqual(motionData.motion, true);

  // Test Sound scenario
  generator.setScenario('SOUND');
  const soundData = generator.generateTelemetry();
  assert.strictEqual(soundData.sound, true);
});
