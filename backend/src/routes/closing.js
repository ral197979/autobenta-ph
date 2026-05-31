const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /admin/closing/summary — pipeline summary
router.get('/admin/closing/summary', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const prospects = await prisma.dealerProspect.findMany({
      where: { closingStage: { not: null } },
      select: { closingStage: true, expectedMrr: true, closeProbability: true },
    });

    const totalPipeline = prospects.reduce((sum, p) => sum + (p.expectedMrr || 0), 0);
    const avgCloseProbability = prospects.length
      ? Math.round(prospects.reduce((sum, p) => sum + (p.closeProbability || 0), 0) / prospects.length)
      : 0;

    const stageMap = {};
    for (const p of prospects) {
      const stage = p.closingStage;
      if (!stageMap[stage]) stageMap[stage] = { stage, count: 0, totalMrr: 0 };
      stageMap[stage].count++;
      stageMap[stage].totalMrr += p.expectedMrr || 0;
    }
    const byStage = Object.values(stageMap);

    res.json({ totalPipeline, avgCloseProbability, byStage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/closing — list prospects with closingStage set
router.get('/admin/closing', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const prospects = await prisma.dealerProspect.findMany({
      where: { closingStage: { not: null } },
      include: {
        proposals: { select: { id: true, status: true, agreement: { select: { id: true, invoice: { select: { id: true } } } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(prospects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/closing/:id — update closing fields
router.patch('/admin/closing/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { closingStage, expectedMrr, closeProbability, nextAction, riskFlags, ownedBy } = req.body;
    const data = {};
    if (closingStage !== undefined) data.closingStage = closingStage;
    if (expectedMrr !== undefined) data.expectedMrr = expectedMrr;
    if (closeProbability !== undefined) data.closeProbability = closeProbability;
    if (nextAction !== undefined) data.nextAction = nextAction;
    if (riskFlags !== undefined) data.riskFlags = riskFlags;
    if (ownedBy !== undefined) data.ownedBy = ownedBy;

    const prospect = await prisma.dealerProspect.update({
      where: { id: req.params.id },
      data,
    });
    res.json(prospect);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Prospect not found' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
