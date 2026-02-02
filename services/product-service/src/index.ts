import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { productRouter } from './routes/product';
import { collectionRouter } from './routes/collection';
import { searchRouter } from './routes/search';
import { wishlistRouter } from './routes/wishlist';
import { reviewRouter } from './routes/review';
import { recentlyViewedRouter } from './routes/recently-viewed';
import { comparisonRouter } from './routes/comparison';
import { qaRouter } from './routes/qa';
import { bundleRouter } from './routes/bundle';
import { influencerRouter } from './routes/influencer';
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
    service: 'product-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/products/compare', comparisonRouter);
app.use('/api/products', productRouter);
app.use('/api/products', qaRouter);
app.use('/api/bundles', bundleRouter);
app.use('/api/collections', collectionRouter);
app.use('/api/search', searchRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/recently-viewed', recentlyViewedRouter);
app.use('/api/influencers', influencerRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '4005');

app.listen(PORT, () => {
  logger.info(`Product service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  process.exit(0);
});

export { app };
