import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

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

// Health check — register first so Cloud Run can reach it before DB-dependent routes load
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'seller-service', 
    timestamp: new Date().toISOString() 
  });
});

// Start server immediately so Cloud Run sees the port (required for startup probe)
const PORT = parseInt(process.env.PORT || '4002');
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Seller service listening on ${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);

  // Mount DB-dependent routes after we are already listening (avoids blocking startup)
  Promise.all([
    import('./routes/onboarding'),
    import('./routes/seller'),
    import('./routes/product'),
    import('./routes/settlement'),
    import('./routes/rating'),
    import('./routes/support'),
    import('./routes/notifications'),
    import('./middleware/error-handler'),
    import('./middleware/not-found'),
  ])
    .then(([
      { onboardingRouter },
      { sellerRouter },
      { productRouter },
      { settlementRouter },
      { ratingRouter },
      { supportRouter },
      { notificationRouter },
      { errorHandler },
      { notFoundHandler },
    ]) => {
      app.use('/api/sellers/onboarding', onboardingRouter);
      app.use('/api/sellers', sellerRouter);
      app.use('/api/sellers/products', productRouter);
      app.use('/api/sellers/settlements', settlementRouter);
      app.use('/api/sellers/ratings', ratingRouter);
      app.use('/api/sellers/support', supportRouter);
      app.use('/api/sellers/notifications', notificationRouter);
      app.use(notFoundHandler);
      app.use(errorHandler);
      logger.info('API routes mounted');
    })
    .catch((err) => {
      logger.error({ err }, 'Failed to mount routes');
      process.exitCode = 1;
    });
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
