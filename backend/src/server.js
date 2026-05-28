require('dotenv').config();

// ─── Environment validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { randomUUID } = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const dealerRoutes = require('./routes/dealers');
const inquiryRoutes = require('./routes/inquiries');
const favoriteRoutes = require('./routes/favorites');
const inspectionRoutes = require('./routes/inspections');
const financingRoutes = require('./routes/financing');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const moderationRoutes = require('./routes/moderation');
const fraudRoutes = require('./routes/fraud');
const dealerAnalyticsRoutes = require('./routes/dealerAnalytics');
const savedSearchRoutes = require('./routes/savedSearches');
const aiVisionRoutes = require('./routes/aiVision');

const { apiLimiter, authLimiter } = require('./middleware/rateLimiters');

// ─── Logger ───────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(isDev && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Request ID ───────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  _res.setHeader('x-request-id', req.id);
  next();
});

// ─── HTTP logging ─────────────────────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AutoBenta PH API',
      version: '2.0.0',
      description: 'Philippine used car marketplace REST API',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AutoBenta PH API',
    version: '2.0.0',
    requestId: req.id,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/financing', financingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/moderation', moderationRoutes);
app.use('/api/admin/fraud', fraudRoutes);
app.use('/api/dealer/analytics', dealerAnalyticsRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/ai-vision', aiVisionRoutes);

// ─── Frontend (production only) ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../public');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error({ err, requestId: req.id }, 'Unhandled error');
  }
  res.status(status).json({
    error: err.message || 'Internal server error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Server startup + graceful shutdown ──────────────────────────────────────
// Only bind to a port when run directly (not when require()d by tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'AutoBenta PH API started');
  });

  function shutdown(signal) {
    logger.info({ signal }, 'Shutdown signal received');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
