import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { inventoryRouter } from './routes/inventory';
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
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

const limiter = rateLimit({
  windowMs: 60000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/inventory', inventoryRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4008');

app.listen(PORT, () => {
  logger.info(`Inventory service started on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  process.exit(0);
});

export { app };
