/**
 * Node-RED Runtime Settings for SmartSense IoT
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from nodered/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  // Web UI & Admin port
  uiPort: process.env.PORT || 1880,
  uiHost: '0.0.0.0',

  // Flow file location
  flowFile: 'flows/smartsense-flows.json',
  flowFilePretty: true,

  // User directory
  userDir: path.resolve(__dirname, '..'),

  // Logging configuration
  logging: {
    console: {
      level: 'info',
      metrics: false,
      audit: false,
    },
  },

  // Editor settings
  editorTheme: {
    page: {
      title: 'SmartSense Node-RED IoT Gateway',
    },
    header: {
      title: 'SmartSense Stream Processor & Alert Engine',
    },
  },

  // Global Context definitions (Firebase & threshold parameters)
  functionGlobalContext: {
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || 'http://localhost:9000',
    FIREBASE_DATABASE_SECRET: process.env.FIREBASE_DATABASE_SECRET || '',
    TEMP_WARNING_THRESHOLD: parseFloat(process.env.TEMPERATURE_WARNING || '32.0'),
    TEMP_CRITICAL_THRESHOLD: parseFloat(process.env.TEMPERATURE_CRITICAL || '35.0'),
    DISTANCE_ALERT_THRESHOLD: parseFloat(process.env.DISTANCE_ALERT || '15.0'),
    HUMIDITY_WARNING_THRESHOLD: parseFloat(process.env.HUMIDITY_WARNING || '75.0'),
    ALERT_COOLDOWN_MS: 10000,
  },
};
