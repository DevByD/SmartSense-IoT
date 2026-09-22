import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  defaultDeviceId: process.env.DEFAULT_DEVICE_ID || 'smartsense-pi-01',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  useMockFirebase: process.env.USE_MOCK_FIREBASE === 'true' || (!process.env.FIREBASE_PRIVATE_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS),
  firebase: {
    databaseUrl: process.env.FIREBASE_DATABASE_URL || 'http://localhost:9000',
    projectId: process.env.FIREBASE_PROJECT_ID || 'smartsense-iot',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  },
};

export default config;
