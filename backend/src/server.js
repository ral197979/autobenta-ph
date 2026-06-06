require('dotenv').config();

// ─── Environment validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const dealerRoutes = require('./routes/dealers');
const inquiryRoutes = require('./routes/inquiries');
const offerRoutes = require('./routes/offers');
const reviewRoutes = require('./routes/reviews');
const disputeRoutes = require('./routes/disputes');
const newsletterRoutes = require('./routes/newsletter');
const newCarRoutes = require('./routes/newCars');
const bookingRoutes = require('./routes/bookings');
const valuationRoutes = require('./routes/valuation');
const favoriteRoutes = require('./routes/favorites');
const inspectionRoutes = require('./routes/inspections');
const financingRoutes = require('./routes/financing');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const moderationRoutes = require('./routes/moderation');
const fraudRoutes = require('./routes/fraud');
const dealerAnalyticsRoutes = require('./routes/dealerAnalytics');
const dealerIntegrationsRoutes = require('./routes/dealerIntegrations');
const savedSearchRoutes = require('./routes/savedSearches');
const aiVisionRoutes = require('./routes/aiVision');
const verificationRoutes = require('./routes/verifications');
const dealerNetworkRoutes = require('./routes/dealerNetwork');
const v8atlasWebhookRoutes = require('./routes/v8atlasWebhooks');
const analyticsRoutes = require('./routes/analytics');
const dealerApplicationRoutes = require('./routes/dealerApplication');
const billingRoutes = require('./routes/billing');
const featuredRoutes = require('./routes/featured');
const creditsRoutes = require('./routes/credits');
const prospectsRoutes = require('./routes/prospects');
const demoBookingsRoutes = require('./routes/demoBookings');
const growthAdminRoutes = require('./routes/growthAdmin');
const feedbackRoutes = require('./routes/feedback');
const closingRoutes = require('./routes/closing');
const proposalRoutes = require('./routes/proposals');
const agreementRoutes = require('./routes/agreements');
const invoicesClosingRoutes = require('./routes/invoices');
const successScoreRoutes = require('./routes/successScores');
const churnRiskRoutes = require('./routes/churnRisk');
const dealerSuccessRoutes = require('./routes/dealerSuccess');
const adoptionMetricsRoutes = require('./routes/adoptionMetrics');
const csTasksRoutes = require('./routes/csTasks');
const renewalReadinessRoutes = require('./routes/renewalReadiness');
const valueProofRoutes = require('./routes/valueProof');
const apiKeysRoutes   = require('./routes/apiKeys');
const publicApiRoutes = require('./routes/publicApi');
const webhooksRoutes  = require('./routes/webhooks');

// Register V8Atlas providers if enabled
require('./services/v8atlas/V8AtlasAdapter').registerV8AtlasProviders();

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
// Public uploads (listing photos only)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
// Confidential documents require authentication — served via /api/documents/:filename
// DO NOT serve uploads/documents as static (verification IDs, business permits, etc.)

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
app.get('/api/health', async (req, res) => {
  const startMs = Date.now();
  const checks = {};
  let overall = 'ok';

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (err) {
    checks.database = { status: 'error', error: 'Database unreachable' };
    overall = 'error';
  }

  // Queue stats (only if DB is ok)
  if (checks.database.status === 'ok') {
    try {
      const { getStats } = require('./services/queue/jobQueue');
      const stats = await getStats();
      checks.queue = {
        status: stats.dead > 10 ? 'degraded' : 'ok',
        pending: stats.pending,
        processing: stats.processing,
        dead: stats.dead,
      };
      if (stats.dead > 10 && overall === 'ok') overall = 'degraded';
    } catch {
      checks.queue = { status: 'unknown' };
    }
  }

  // V8Atlas connectivity (if enabled)
  if (process.env.V8ATLAS_ENABLED === 'true' && process.env.V8ATLAS_BASE_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const r = await fetch(`${process.env.V8ATLAS_BASE_URL}/health`, {
        signal: controller.signal,
        headers: { 'x-api-key': process.env.V8ATLAS_API_KEY || '' },
      });
      clearTimeout(timeout);
      checks.v8atlas = { status: r.ok ? 'ok' : 'degraded', httpStatus: r.status };
      if (!r.ok && overall === 'ok') overall = 'degraded';
    } catch {
      checks.v8atlas = { status: 'degraded', error: 'V8Atlas unreachable' };
      if (overall === 'ok') overall = 'degraded';
    }
  }

  // Storage write check
  try {
    const fs = require('fs');
    const testPath = require('path').join(__dirname, '../../uploads/.health');
    fs.writeFileSync(testPath, '1');
    fs.unlinkSync(testPath);
    checks.storage = { status: 'ok' };
  } catch {
    checks.storage = { status: 'error', error: 'Upload directory not writable' };
    if (overall === 'ok') overall = 'degraded';
  }

  const httpStatus = overall === 'error' ? 503 : 200;

  res.status(httpStatus).json({
    status: overall,
    service: 'AutoBenta PH API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    requestId: req.id,
    responseTimeMs: Date.now() - startMs,
    checks,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/new-cars', newCarRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/valuation', valuationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/financing', financingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/moderation', moderationRoutes);
app.use('/api/admin/fraud', fraudRoutes);
app.use('/api/dealer/analytics', dealerAnalyticsRoutes);
app.use('/api/dealer/integrations', dealerIntegrationsRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/ai-vision', aiVisionRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/dealer-network/v1', dealerNetworkRoutes);
app.use('/api/webhooks/v8atlas', v8atlasWebhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dealers', dealerApplicationRoutes);
app.use('/api', billingRoutes);
app.use('/api', featuredRoutes);
app.use('/api', creditsRoutes);
app.use('/api', prospectsRoutes);
app.use('/api', demoBookingsRoutes);
app.use('/api', growthAdminRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', closingRoutes);
app.use('/api', proposalRoutes);
app.use('/api', agreementRoutes);
app.use('/api', invoicesClosingRoutes);
app.use('/api', successScoreRoutes);
app.use('/api', churnRiskRoutes);
app.use('/api', dealerSuccessRoutes);
app.use('/api', adoptionMetricsRoutes);
app.use('/api', csTasksRoutes);
app.use('/api', renewalReadinessRoutes);
app.use('/api', valueProofRoutes);
app.use('/api/dealer/api-keys',  apiKeysRoutes);
app.use('/api/dealer/webhooks',  webhooksRoutes);
app.use('/api/v1',               publicApiRoutes);  // third-party: /api/v1/inventory/batch, /api/v1/leads

// ─── Job queue poll loop ──────────────────────────────────────────────────────
const { startPolling } = require('./services/queue/jobQueue');
startPolling(10_000);

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
