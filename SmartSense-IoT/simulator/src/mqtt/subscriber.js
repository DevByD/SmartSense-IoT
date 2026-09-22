import mqtt from 'mqtt';
import config from '../config.js';

const brokerUrl = config.mqttBrokerUrl;
const topic = config.mqttSensorTopic;
const clientId = `smartsense-sub-${Math.random().toString(16).substring(2, 8)}`;

console.log('====================================================');
console.log('  SMARTSENSE MQTT SUBSCRIBER (TEST CLIENT)');
console.log('====================================================');
console.log(`Broker   : ${brokerUrl}`);
console.log(`Topic    : ${topic}`);
console.log(`Client ID: ${clientId}`);
console.log('----------------------------------------------------');
console.log('Waiting for MQTT telemetry messages... (Ctrl+C to exit)\n');

const client = mqtt.connect(brokerUrl, {
  clientId,
  clean: true,
  connectTimeout: 5000,
  reconnectPeriod: 3000,
});

client.on('connect', () => {
  console.log('\x1b[32m[MQTT SUBSCRIBER] Connected to broker successfully.\x1b[0m');
  client.subscribe(topic, { qos: 0 }, (err) => {
    if (err) {
      console.error(`[MQTT SUBSCRIBER] Subscription error on ${topic}:`, err.message);
    } else {
      console.log(`\x1b[36m[MQTT SUBSCRIBER] Subscribed to topic: ${topic}\x1b[0m\n`);
    }
  });
});

client.on('message', (receivedTopic, message) => {
  const timestamp = new Date().toLocaleTimeString();
  let parsedPayload = null;

  try {
    parsedPayload = JSON.parse(message.toString());
  } catch (e) {
    parsedPayload = message.toString();
  }

  console.log('----------------------------------------------------');
  console.log(`\x1b[32m[${timestamp}] [MQTT RECEIVED]\x1b[0m`);
  console.log(`Topic: \x1b[36m${receivedTopic}\x1b[0m`);
  console.log('Payload:');
  console.log(JSON.stringify(parsedPayload, null, 2));
  console.log('----------------------------------------------------\n');
});

client.on('error', (err) => {
  console.warn(`[MQTT SUBSCRIBER WARNING] Broker error (${err.code || err.message}). Reconnecting...`);
});

client.on('offline', () => {
  console.log('[MQTT SUBSCRIBER] Broker offline.');
});

function shutdown() {
  console.log('\n[MQTT SUBSCRIBER] Disconnecting and closing subscriber...');
  client.end(false, () => {
    console.log('[MQTT SUBSCRIBER] Disconnected cleanly.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
