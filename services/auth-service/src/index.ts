import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

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

// Health check — register first so Cloud Run can reach it before DB-dependent routes load
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Start server immediately so Cloud Run sees the port (required for startup probe)
const PORT = parseInt(process.env.PORT || '4001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Auth service listening on ${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);

  // Mount DB-dependent routes after we are already listening (avoids blocking startup)
  Promise.all([
    import('./routes/auth'),
    import('./routes/user'),
    import('./routes/mfa'),
    import('./routes/oauth'),
    import('./routes/session'),
    import('./routes/roles'),
    import('./routes/admin'),
    import('./routes/audit-logs'),
    import('./middleware/error-handler'),
    import('./middleware/not-found'),
  ])
    .then(([
      { authRouter },
      { userRouter },
      { mfaRouter },
      { oauthRouter },
      { sessionRouter },
      { rolesRouter },
      { adminRouter },
      { auditLogsRouter },
      { errorHandler },
      { notFoundHandler },
    ]) => {
      const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts' } },
      });
      app.use('/api/auth', authLimiter, authRouter);
      app.use('/api/auth/oauth', oauthRouter);
      app.use('/api/user', userRouter);
      app.use('/api/mfa', mfaRouter);
      app.use('/api/sessions', sessionRouter);
      app.use('/api/roles', rolesRouter);
      app.use('/api/admin', adminRouter);
      app.use('/api/audit-logs', auditLogsRouter);
      app.use(notFoundHandler);
      app.use(errorHandler);
      logger.info('API routes mounted');
    })
    .catch((err) => {
      logger.error({ err }, 'Failed to mount routes');
      process.exitCode = 1;
    });
});

// In production, DATABASE_URL must be set (e.g. from Secret Manager)
const dbUrl = process.env.DATABASE_URL || '';
if (process.env.NODE_ENV === 'production' && (!dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
  logger.warn('DATABASE_URL is not set or points to localhost. Login and other DB operations will fail with 500.');
}

// Graceful shutdown & crash handlers
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

export { app, server };
