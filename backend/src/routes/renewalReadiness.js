const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

function calcScore(data) {
  let score = 0;
  if (data.healthReviewDone)   score += 20;
  if (data.usageReviewDone)    score += 20;
  if (data.roiReviewDone)      score += 20;
  if (data.expansionOpportunity) score += 15;
  if (data.renewalProposalSent) score += 15;
  if (data.renewalConfirmed)   score += 10;
  return score;
}

// POST /admin/renewal-readiness/:dealerId
router.post('/admin/renewal-readiness/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { renewalDate, healthReviewDone, usageReviewDone, roiReviewDone, expansionOpportunity, renewalProposalSent, renewalConfirmed, notes } = req.body;

    const existing = await prisma.renewalReadiness.findUnique({ where: { dealerId } });
    const merged = {
      ...(existing ?? {}),
      ...(renewalDate !== undefined && { renewalDate: renewalDate ? new Date(renewalDate) : null }),
      ...(healthReviewDone !== undefined && { healthReviewDone }),
      ...(usageReviewDone !== undefined && { usageReviewDone }),
      ...(roiReviewDone !== undefined && { roiReviewDone }),
      ...(expansionOpportunity !== undefined && { expansionOpportunity }),
      ...(renewalProposalSent !== undefined && { renewalProposalSent }),
      ...(renewalConfirmed !== undefined && { renewalConfirmed }),
      ...(notes !== undefined && { notes }),
    };

    const rd = merged.renewalDate ? new Date(merged.renewalDate) : null;
    const daysUntilRenewal = rd ? Math.floor((rd.getTime() - Date.now()) / 86400000) : null;
    const readinessScore = calcScore(merged);

    const data = { ...merged, daysUntilRenewal, readinessScore };
    delete data.id; delete data.createdAt; delete data.updatedAt; delete data.dealerId;

    const record = await prisma.renewalReadiness.upsert({
      where: { dealerId },
      update: { ...data },
      create: { dealerId, ...data },
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/renewal-readiness
router.get('/admin/renewal-readiness', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const records = await prisma.renewalReadiness.findMany({
      include: { dealer: { select: { id: true, businessName: true } } },
      orderBy: { daysUntilRenewal: 'asc' },
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/renewal-readiness/:dealerId
router.get('/admin/renewal-readiness/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const record = await prisma.renewalReadiness.findUnique({
      where: { dealerId: req.params.dealerId },
      include: { dealer: { select: { id: true, businessName: true } } },
    });
    if (!record) return res.status(404).json({ error: 'Renewal readiness not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
