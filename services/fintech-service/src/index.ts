import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { priceRouter } from './routes/price';
import { priceLockRouter } from './routes/price-lock';
import { alertRouter } from './routes/alert';
import { priceHistoryRouter } from './routes/price-history';
import { multiMetalRouter } from './routes/multi-metal';
import { currencyConverterRouter } from './routes/currency-converter';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { setupWebSocket } from './websocket';
import { PriceScheduler } from './services/price-scheduler';

// Create logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
});

// Create Express app
const app = express();
const server = createServer(app);

// Setup WebSocket for real-time price updates
setupWebSocket(server);

// Security middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(pinoHttp({ logger }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'fintech-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/fintech/price', priceRouter);
app.use('/api/fintech/price-lock', priceLockRouter);
app.use('/api/fintech/alerts', alertRouter);
app.use('/api/fintech/price', priceHistoryRouter);
app.use('/api/fintech/metals', multiMetalRouter);
app.use('/api/fintech/currency', currencyConverterRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start price scheduler
const priceScheduler = new PriceScheduler();
priceScheduler.start();

// Start server
const PORT = parseInt(process.env.PORT || '4003');
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  logger.info(`Fintech service started on ${HOST}:${PORT}`);
  logger.info(`WebSocket server running on ws://${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  priceScheduler.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception — shutting down');
  priceScheduler.stop();
  server.close(() => process.exit(1));
});

export { app, server };
