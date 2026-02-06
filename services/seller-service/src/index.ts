import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { onboardingRouter } from './routes/onboarding';
import { sellerRouter } from './routes/seller';
import { productRouter } from './routes/product';
import { settlementRouter } from './routes/settlement';
import { ratingRouter } from './routes/rating';
import { supportRouter } from './routes/support';
import { notificationRouter } from './routes/notifications';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
});

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '50mb' })); // Larger limit for file uploads
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

const limiter = rateLimit({
  windowMs: 60000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'seller-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/sellers/onboarding', onboardingRouter);
app.use('/api/sellers', sellerRouter);
app.use('/api/sellers/products', productRouter);
app.use('/api/sellers/settlements', settlementRouter);
app.use('/api/sellers/ratings', ratingRouter);
app.use('/api/sellers/support', supportRouter);
app.use('/api/sellers/notifications', notificationRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4002');
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Seller service started on ${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception — shutting down');
  server.close(() => process.exit(1));
});

export { app };
