import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { chatRouter } from './routes/chat';
import { visualSearchRouter } from './routes/visual-search';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

const limiter = rateLimit({
  windowMs: 60000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/ai/chat', chatRouter);
app.use('/api/ai/visual-search', visualSearchRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4009');

app.listen(PORT, () => {
  logger.info(`AI service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export { app };
