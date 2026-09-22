import config from './config.js';
import { TelemetryGenerator } from './simulator/generator.js';
import { logTelemetry, logEvent } from './utils/logger.js';
import { MqttPublisher } from './mqtt/publisher.js';

// Parse command line arguments (e.g., --scenario motion)
function parseScenarioArg() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario' && args[i + 1]) {
      return args[i + 1].toUpperCase();
    }
    if (args[i].startsWith('--scenario=')) {
      return args[i].split('=')[1].toUpperCase();
    }
  }
  return 'NORMAL';
}

const scenario = parseScenarioArg();
const generator = new TelemetryGenerator();
const publisher = new MqttPublisher();

if (scenario !== 'NORMAL') {
  generator.setScenario(scenario);
}

console.log('====================================================');
console.log('  SMARTSENSE IoT – SENSOR SIMULATOR & MQTT SENDER');
console.log('====================================================');
console.log(`Device ID    : ${config.deviceId}`);
console.log(`Room         : ${config.room}`);
console.log(`Interval     : ${config.intervalMs} ms`);
console.log(`Scenario     : ${scenario}`);
console.log(`MQTT Broker  : ${config.mqttBrokerUrl}`);
console.log(`Sensor Topic : ${config.mqttSensorTopic}`);
console.log('----------------------------------------------------');
console.log('Press Ctrl+C to stop simulation cleanly.\n');

// Connect to MQTT Broker in background (resilient, non-blocking)
publisher.connect();

let timer = null;
let readingCount = 0;

function tick() {
  try {
    readingCount++;
    const telemetry = generator.generateTelemetry();

    // Check for highlight events
    let eventNotice = null;
    if (telemetry.touch) {
      logEvent('SOS', `Touch sensor activated in ${telemetry.room}!`);
    } else if (telemetry.motion) {
      logEvent('MOTION', `PIR detected movement in ${telemetry.room}.`);
    } else if (telemetry.temperature >= config.tempAlertThreshold) {
      logEvent('HIGH_TEMP', `Temperature ${telemetry.temperature} °C exceeds threshold (${config.tempAlertThreshold} °C).`);
    } else if (telemetry.distance <= config.distanceAlertThreshold) {
      logEvent('CLOSE_OBJECT', `Obstruction at ${telemetry.distance} cm is below threshold (${config.distanceAlertThreshold} cm).`);
    } else if (telemetry.sound) {
      logEvent('SOUND', `Acoustic trigger detected in ${telemetry.room}.`);
    }

    // Display telemetry in console
    logTelemetry(telemetry, eventNotice);

    // Publish telemetry over MQTT (if broker connected)
    publisher.publishTelemetry(telemetry);
  } catch (error) {
    console.error('Simulation error:', error.message);
  }
}

// Initial reading
tick();

// Start recurring interval
timer = setInterval(tick, config.intervalMs);

// Graceful cleanup on termination
async function shutdown() {
  console.log('\n\n[SIMULATOR] Stopping sensor telemetry simulator gracefully...');
  if (timer) clearInterval(timer);
  console.log(`[SIMULATOR] Total telemetry packets processed: ${readingCount}`);
  await publisher.disconnect();
  console.log('[SIMULATOR] Shutdown complete. Goodbye!');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Decoupled export for external consumption
export { generator, publisher, config };
export const generateTelemetry = () => generator.generateTelemetry();
