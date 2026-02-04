import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { mfaRouter } from './routes/mfa';
import { oauthRouter } from './routes/oauth';
import { sessionRouter } from './routes/session';
import { rolesRouter } from './routes/roles';
import { adminRouter } from './routes/admin';
import { auditLogsRouter } from './routes/audit-logs';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';

// Create logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
});

// Create Express app
const app = express();

// Trust proxy (for Cloud Run)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(pinoHttp({ logger }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts' } },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/auth/oauth', oauthRouter);
app.use('/api/user', userRouter);
app.use('/api/mfa', mfaRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/audit-logs', auditLogsRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '4001');

// In production, DATABASE_URL must be set (e.g. from Secret Manager). Otherwise DB calls fail with 500.
const dbUrl = process.env.DATABASE_URL || '';
if (process.env.NODE_ENV === 'production' && (!dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
  logger.warn('DATABASE_URL is not set or points to localhost. Login and other DB operations will fail with 500. Set DATABASE_URL on Cloud Run (e.g. from Secret Manager).');
}

app.listen(PORT, () => {
  logger.info(`Auth service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export { app };
