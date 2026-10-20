const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');


function calcQualification(data) {
  let score = 0;

  // Monthly vehicles (0-20 pts)
  const vol = data.monthlyVehiclesSold || 0;
  if (vol >= 20) score += 20;
  else if (vol >= 10) score += 15;
  else if (vol >= 5) score += 10;
  else if (vol > 0) score += 5;

  // Pain level (0-25 pts): 1-5 scale × 5
  if (data.painLevel) score += Math.min(data.painLevel, 5) * 5;

  // Buying timeline (0-20 pts)
  const tl = { immediate: 20, '1_month': 15, '3_months': 10, '6_months': 5, unknown: 0 };
  score += tl[data.buyingTimeline] || 0;

  // Decision maker access (0-20 pts)
  if (data.decisionMakerAccess) score += 20;

  // Budget range (0-15 pts)
  const bud = { confirmed: 15, likely: 10, unknown: 5, constrained: 0 };
  score += bud[data.budgetRange] || 0;

  const qualificationScore = score;
  const qualificationTier =
    score >= 70 ? 'hot' :
    score >= 40 ? 'warm' :
    score >= 20 ? 'cold' : 'unqualified';

  return { qualificationScore, qualificationTier };
}

const qualFields = ['monthlyVehiclesSold','salesTeamSize','currentDms','currentLeadProcess',
  'painLevel','buyingTimeline','decisionMakerAccess','budgetRange'];

// GET /admin/prospects
router.get('/admin/prospects', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { stage, search } = req.query;

    const where = {};
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { dealerName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const prospects = await prisma.dealerProspect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: { select: { demoBookings: true } },
      },
    });

    res.json(prospects);
  } catch (err) {
    next(err);
  }
});

// POST /admin/prospects
router.post('/admin/prospects', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      dealerName, contactName, phone, email, location, branches,
      inventorySize, currentSystem, source, stage, owner,
      expectedMrr, closeProbability, notes,
      monthlyVehiclesSold, salesTeamSize, currentDms, currentLeadProcess,
      painLevel, buyingTimeline, decisionMakerAccess, budgetRange,
    } = req.body;

    if (!dealerName) return res.status(400).json({ error: 'dealerName is required' });
    if (!contactName) return res.status(400).json({ error: 'contactName is required' });

    const hasQualData = qualFields.some(f => req.body[f] !== undefined && req.body[f] !== null);
    const qualCalc = hasQualData ? calcQualification(req.body) : {};

    const prospect = await prisma.dealerProspect.create({
      data: {
        dealerName,
        contactName,
        phone,
        email,
        location,
        branches: branches || 1,
        inventorySize,
        currentSystem,
        source,
        stage: stage || 'prospect',
        owner,
        expectedMrr,
        closeProbability: closeProbability ?? 10,
        notes,
        monthlyVehiclesSold,
        salesTeamSize,
        currentDms,
        currentLeadProcess,
        painLevel,
        buyingTimeline,
        decisionMakerAccess: decisionMakerAccess ?? false,
        budgetRange,
        ...qualCalc,
        activities: {
          create: {
            type: 'stage_changed',
            content: `Prospect created at stage: ${stage || 'prospect'}`,
            createdBy: req.user?.id,
          },
        },
      },
      include: { activities: true },
    });

    res.status(201).json(prospect);
  } catch (err) {
    next(err);
  }
});

// GET /admin/prospects/:id
router.get('/admin/prospects/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const prospect = await prisma.dealerProspect.findUnique({
      where: { id: req.params.id },
      include: {
        activities: { orderBy: { createdAt: 'desc' } },
        demoBookings: { orderBy: { scheduledAt: 'desc' } },
      },
    });

    if (!prospect) return res.status(404).json({ error: 'Not found' });
    res.json(prospect);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/prospects/:id
router.patch('/admin/prospects/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const existing = await prisma.dealerProspect.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const {
      dealerName, contactName, phone, email, location, branches,
      inventorySize, currentSystem, source, stage, owner,
      expectedMrr, closeProbability, notes, lostReason,
      nextFollowUpAt, status,
      monthlyVehiclesSold, salesTeamSize, currentDms, currentLeadProcess,
      painLevel, buyingTimeline, decisionMakerAccess, budgetRange,
    } = req.body;

    const updates = {};
    if (dealerName !== undefined) updates.dealerName = dealerName;
    if (contactName !== undefined) updates.contactName = contactName;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (location !== undefined) updates.location = location;
    if (branches !== undefined) updates.branches = branches;
    if (inventorySize !== undefined) updates.inventorySize = inventorySize;
    if (currentSystem !== undefined) updates.currentSystem = currentSystem;
    if (source !== undefined) updates.source = source;
    if (owner !== undefined) updates.owner = owner;
    if (expectedMrr !== undefined) updates.expectedMrr = expectedMrr;
    if (closeProbability !== undefined) updates.closeProbability = closeProbability;
    if (notes !== undefined) updates.notes = notes;
    if (lostReason !== undefined) updates.lostReason = lostReason;
    if (nextFollowUpAt !== undefined) updates.nextFollowUpAt = new Date(nextFollowUpAt);
    if (status !== undefined) updates.status = status;
    if (monthlyVehiclesSold !== undefined) updates.monthlyVehiclesSold = monthlyVehiclesSold;
    if (salesTeamSize !== undefined) updates.salesTeamSize = salesTeamSize;
    if (currentDms !== undefined) updates.currentDms = currentDms;
    if (currentLeadProcess !== undefined) updates.currentLeadProcess = currentLeadProcess;
    if (painLevel !== undefined) updates.painLevel = painLevel;
    if (buyingTimeline !== undefined) updates.buyingTimeline = buyingTimeline;
    if (decisionMakerAccess !== undefined) updates.decisionMakerAccess = decisionMakerAccess;
    if (budgetRange !== undefined) updates.budgetRange = budgetRange;

    const qualFieldsUpdated = qualFields.some(f => updates[f] !== undefined);
    if (qualFieldsUpdated) {
      const merged = { ...existing, ...updates };
      Object.assign(updates, calcQualification(merged));
    }

    const activityCreates = [];

    if (stage !== undefined && stage !== existing.stage) {
      updates.stage = stage;
      activityCreates.push({
        type: 'stage_changed',
        content: `Stage changed from ${existing.stage} to ${stage}`,
        createdBy: req.user?.id,
      });
      if (stage === 'won' && !existing.wonAt) {
        updates.wonAt = new Date();
      }
    }

    const prospect = await prisma.dealerProspect.update({
      where: { id: req.params.id },
      data: {
        ...updates,
        ...(activityCreates.length > 0 && {
          activities: { create: activityCreates },
        }),
      },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });

    res.json(prospect);
  } catch (err) {
    next(err);
  }
});

// POST /admin/prospects/:id/activities
router.post('/admin/prospects/:id/activities', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { type, content } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    if (!content) return res.status(400).json({ error: 'content is required' });

    const exists = await prisma.dealerProspect.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    const [activity] = await prisma.$transaction([
      prisma.prospectActivity.create({
        data: {
          prospectId: req.params.id,
          type,
          content,
          createdBy: req.user?.id,
        },
      }),
      prisma.dealerProspect.update({
        where: { id: req.params.id },
        data: { lastContactAt: new Date() },
      }),
    ]);

    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/prospects/:id
router.delete('/admin/prospects/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const exists = await prisma.dealerProspect.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    await prisma.dealerProspect.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
