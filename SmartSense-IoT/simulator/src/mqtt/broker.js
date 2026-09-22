import { createServer } from 'node:net';
import { Aedes } from 'aedes';

const PORT = parseInt(process.env.MQTT_PORT || '1883', 10);
const aedes = await Aedes.createBroker();
const server = createServer(aedes.handle);

server.listen(PORT, function () {
  console.log('====================================================');
  console.log('  SMARTSENSE LOCAL MQTT BROKER (DEVELOPMENT)');
  console.log('====================================================');
  console.log(`Port    : ${PORT}`);
  console.log(`Protocol: mqtt://localhost:${PORT}`);
  console.log('----------------------------------------------------');
  console.log('MQTT Broker is live and ready for publishers/subscribers.');
  console.log('(You can also use external Mosquitto on port 1883)');
  console.log('Press Ctrl+C to stop broker.\n');
});

// Client connection events
aedes.on('client', function (client) {
  console.log(`[BROKER] Client Connected    : \x1b[36m${client ? client.id : 'unknown'}\x1b[0m`);
});

aedes.on('clientDisconnect', function (client) {
  console.log(`[BROKER] Client Disconnected : \x1b[33m${client ? client.id : 'unknown'}\x1b[0m`);
});

aedes.on('subscribe', function (subscriptions, client) {
  const topics = subscriptions.map((s) => s.topic).join(', ');
  console.log(`[BROKER] Subscription added   : \x1b[32m${topics}\x1b[0m by ${client ? client.id : 'unknown'}`);
});

function shutdown() {
  console.log('\n[BROKER] Stopping MQTT Broker...');
  aedes.close(() => {
    server.close(() => {
      console.log('[BROKER] Stopped cleanly.');
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
