import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { orderRouter } from './routes/order';
import { cartRouter } from './routes/cart';
import { checkoutRouter } from './routes/checkout';
import { trackingRouter } from './routes/tracking';
import { modificationRouter } from './routes/modification';
import { invoiceRouter } from './routes/invoice';
import { returnRouter } from './routes/return';
import { clickCollectRouter } from './routes/click-collect';
import { consultationRouter } from './routes/consultation';
import { notificationsRouter } from './routes/notifications';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { veilResponseMiddleware } from './middleware/veil';
import { startAbandonedCartCron } from './jobs/abandoned-cart-cron';

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'order-service', 
    timestamp: new Date().toISOString() 
  });
});

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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4004');

app.listen(PORT, () => {
  logger.info(`Order service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  startAbandonedCartCron();
});

export { app };
