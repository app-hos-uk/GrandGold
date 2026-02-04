import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { paymentRouter } from './routes/payment';
import { stripeRouter } from './routes/stripe';
import { razorpayRouter } from './routes/razorpay';
import { webhookRouter } from './routes/webhook';
import { refundRouter } from './routes/refund';
import { emiBnplRouter } from './routes/emi-bnpl';
import { savedPaymentRouter } from './routes/saved-payments';
import { paypalRouter } from './routes/paypal';
import { splitPaymentRouter } from './routes/split-payment';
import { fraudRouter } from './routes/fraud';
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

// Webhook routes need raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

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
    service: 'payment-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/payments', paymentRouter);
app.use('/api/payments/stripe', stripeRouter);
app.use('/api/payments/razorpay', razorpayRouter);
app.use('/api/payments/webhook', webhookRouter);
app.use('/api/payments', emiBnplRouter);
app.use('/api/payments', savedPaymentRouter);
app.use('/api/payments', paypalRouter);
app.use('/api/payments', splitPaymentRouter);
app.use('/api/payments', fraudRouter);
app.use('/api/payments/refunds', refundRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4005');

app.listen(PORT, () => {
  logger.info(`Payment service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export { app };
