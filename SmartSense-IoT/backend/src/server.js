import app from './app.js';
import config from './config/env.js';

const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log('  SmartSense IoT - Node.js Express Backend API');
  console.log('====================================================');
  console.log(`  Port:             ${config.port}`);
  console.log(`  Environment:      ${config.nodeEnv}`);
  console.log(`  Frontend URL:     ${config.frontendUrl}`);
  console.log(`  Firebase URL:     ${config.firebase.databaseUrl}`);
  console.log(`  Database Mode:    ${config.useMockFirebase ? 'Local / Mock Mode' : 'Firebase Admin SDK'}`);
  console.log(`  Health Check:     http://localhost:${config.port}/api/health`);
  console.log(`  Sensors Latest:   http://localhost:${config.port}/api/sensors/latest`);
  console.log(`  Alerts:           http://localhost:${config.port}/api/alerts`);
  console.log(`  Devices:          http://localhost:${config.port}/api/devices`);
  console.log('====================================================');
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[API] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[API] HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default server;
