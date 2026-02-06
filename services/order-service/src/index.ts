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
app.use(express.json({ limit: '10mb' }));
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
    service: 'order-service', 
    timestamp: new Date().toISOString() 
  });
});

// Start server immediately so Cloud Run sees the port (required for startup probe)
const PORT = parseInt(process.env.PORT || '4004');
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Order service listening on ${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);

  // Mount DB-dependent routes after we are already listening (avoids blocking startup)
  Promise.all([
    import('./routes/order'),
    import('./routes/cart'),
    import('./routes/checkout'),
    import('./routes/tracking'),
    import('./routes/modification'),
    import('./routes/invoice'),
    import('./routes/return'),
    import('./routes/click-collect'),
    import('./routes/consultation'),
    import('./routes/notifications'),
    import('./routes/support'),
    import('./routes/shipping'),
    import('./middleware/error-handler'),
    import('./middleware/not-found'),
    import('./middleware/veil'),
    import('./jobs/abandoned-cart-cron'),
  ])
    .then(([
      { orderRouter },
      { cartRouter },
      { checkoutRouter },
      { trackingRouter },
      { modificationRouter },
      { invoiceRouter },
      { returnRouter },
      { clickCollectRouter },
      { consultationRouter },
      { notificationsRouter },
      { supportRouter },
      { shippingRouter },
      { errorHandler },
      { notFoundHandler },
      { veilResponseMiddleware },
      { startAbandonedCartCron },
    ]) => {
      // API routes (with metadata stripping for cart/order responses)
      app.use('/api/orders', veilResponseMiddleware(), orderRouter);
      app.use('/api/orders', modificationRouter);
      app.use('/api/orders', invoiceRouter);
      app.use('/api/orders', returnRouter);
      app.use('/api/cart', veilResponseMiddleware(), cartRouter);
      app.use('/api/checkout', checkoutRouter);
      app.use('/api/tracking', trackingRouter);
      app.use('/api/click-collect', clickCollectRouter);
      app.use('/api/consultation', consultationRouter);
      app.use('/api/notifications', notificationsRouter);
      app.use('/api/support', supportRouter);
      app.use('/api/shipping', shippingRouter);
      app.use(notFoundHandler);
      app.use(errorHandler);
      logger.info('API routes mounted');
      startAbandonedCartCron();
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
