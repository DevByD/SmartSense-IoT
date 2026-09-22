import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/env.js';
import sensorsRoutes from './routes/sensors.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import devicesRoutes from './routes/devices.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration - allow FRONTEND_URL in production, allow localhost in development
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, tests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clean development logging (does NOT log secrets or sensitive payloads)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  return sendSuccess(
    res,
    {
      status: 'UP',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    },
    200,
    { message: 'SmartSense API is running' }
  );
});

// Mount modular API routes
app.use('/api/sensors', sensorsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
