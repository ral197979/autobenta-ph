const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { runFraudRulesEngine } = require('../services/fraud/fraudRulesEngine');
const { auditFromReq } = require('../services/audit/auditLogger');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/fraud — high-risk listings
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, minScore = 25, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      fraudScore: { gte: parseInt(minScore) },
      ...(status ? { status } : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.vehicleListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fraudScore: 'desc' },
        include: {
          seller: { select: { id: true, name: true, email: true } },
          photos: { where: { isPrimary: true }, take: 1 },
          fraudFlagRecords: { where: { isResolved: false } },
          sellerRiskProfile: true,
        },
      }),
      prisma.vehicleListing.count({ where }),
    ]);

    res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/fraud/:listingId/analyze — re-run fraud engine
router.post('/:listingId/analyze', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await runFraudRulesEngine(req.params.listingId);
    await auditFromReq(req, 'fraud.analyze', 'VehicleListing', req.params.listingId, { fraudScore: result.fraudScore });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/fraud/flags/:flagId/resolve — resolve a flag
router.patch('/flags/:flagId/resolve', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { resolveNote } = req.body;
    const flag = await prisma.fraudFlag.update({
      where: { id: req.params.flagId },
      data: {
        isResolved: true,
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
        resolveNote,
      },
    });

    // Recompute fraud score after resolving a flag
    const SEVERITY_SCORES = { low: 5, medium: 15, high: 30, critical: 50 };
    const unresolvedFlags = await prisma.fraudFlag.findMany({
      where: { listingId: flag.listingId, isResolved: false },
    });
    const fraudScore = Math.min(
      unresolvedFlags.reduce((sum, f) => sum + (SEVERITY_SCORES[f.severity] || 0), 0),
      100
    );
    await prisma.vehicleListing.update({
      where: { id: flag.listingId },
      data: { fraudScore },
    });

    await auditFromReq(req, 'fraud.flag.resolve', 'FraudFlag', req.params.flagId, { resolveNote });

    res.json({ flag, newFraudScore: fraudScore });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/fraud/sellers — high-risk seller profiles
router.get('/sellers', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, minRisk = 'medium' } = req.query;
    const riskOrder = ['low', 'medium', 'high', 'critical'];
    const minIdx = riskOrder.indexOf(minRisk);
    const riskLevels = riskOrder.slice(minIdx >= 0 ? minIdx : 1);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [profiles, total] = await Promise.all([
      prisma.sellerRiskProfile.findMany({
        where: { riskLevel: { in: riskLevels } },
        skip,
        take: parseInt(limit),
        orderBy: { riskScore: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, isSuspended: true } } },
      }),
      prisma.sellerRiskProfile.count({ where: { riskLevel: { in: riskLevels } } }),
    ]);

    res.json({ profiles, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
