const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /admin/growth
router.get('/admin/growth', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const [
      totalProspects,
      prospectsByStage,
      totalDemos,
      completedDemos,
      pendingDemos,
      noShowDemos,
      activeProspects,
      wonProspects,
      lostProspects,
    ] = await Promise.all([
      prisma.dealerProspect.count(),
      prisma.dealerProspect.groupBy({ by: ['stage'], _count: { id: true } }),
      prisma.demoBooking.count(),
      prisma.demoBooking.count({ where: { status: 'completed' } }),
      prisma.demoBooking.count({ where: { status: 'pending' } }),
      prisma.demoBooking.count({ where: { status: 'no_show' } }),
      prisma.dealerProspect.findMany({
        where: { status: 'active' },
        select: { expectedMrr: true, closeProbability: true },
      }),
      prisma.dealerProspect.count({ where: { stage: 'won' } }),
      prisma.dealerProspect.findMany({
        where: { stage: 'lost' },
        select: { lostReason: true },
      }),
    ]);

    // Build byStage map
    const byStage = {};
    for (const row of prospectsByStage) {
      byStage[row.stage] = row._count.id;
    }

    // Pipeline totals
    let totalValue = 0;
    let weightedValue = 0;
    for (const p of activeProspects) {
      const mrr = p.expectedMrr || 0;
      const prob = p.closeProbability || 0;
      totalValue += mrr;
      weightedValue += mrr * (prob / 100);
    }

    // Conversion
    const closeRate = totalProspects > 0 ? (wonProspects / totalProspects) * 100 : 0;
    const demoToClose = completedDemos > 0 ? (wonProspects / completedDemos) * 100 : 0;

    // Lost reasons
    const lostReasonCounts = {};
    for (const p of lostProspects) {
      const reason = p.lostReason || 'unknown';
      lostReasonCounts[reason] = (lostReasonCounts[reason] || 0) + 1;
    }
    const lostReasons = Object.entries(lostReasonCounts).map(([reason, count]) => ({ reason, count }));

    // Expected MRR from won prospects
    const wonMrrData = await prisma.dealerProspect.aggregate({
      where: { stage: 'won' },
      _sum: { expectedMrr: true },
    });

    res.json({
      prospects: { total: totalProspects, byStage },
      demos: { total: totalDemos, completed: completedDemos, pending: pendingDemos, noShow: noShowDemos },
      pipeline: { totalValue, weightedValue },
      conversion: { closeRate: Math.round(closeRate * 10) / 10, demoToClose: Math.round(demoToClose * 10) / 10 },
      dealers: { won: wonProspects, lost: lostProspects.length, lostReasons },
      mrr: { expected: wonMrrData._sum.expectedMrr || 0, active: 0 },
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/competitors
router.get('/admin/competitors', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const competitors = await prisma.competitorProfile.findMany({ orderBy: { name: 'asc' } });
    res.json(competitors);
  } catch (err) {
    next(err);
  }
});

// POST /admin/competitors
router.post('/admin/competitors', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, category, pricing, strengths, weaknesses, objections, positioning, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!category) return res.status(400).json({ error: 'category is required' });

    const competitor = await prisma.competitorProfile.create({
      data: {
        name,
        category,
        pricing,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
        objections: objections || [],
        positioning,
        notes,
      },
    });
    res.status(201).json(competitor);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/competitors/:id
router.patch('/admin/competitors/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const exists = await prisma.competitorProfile.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    const { name, category, pricing, strengths, weaknesses, objections, positioning, notes } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (pricing !== undefined) updates.pricing = pricing;
    if (strengths !== undefined) updates.strengths = strengths;
    if (weaknesses !== undefined) updates.weaknesses = weaknesses;
    if (objections !== undefined) updates.objections = objections;
    if (positioning !== undefined) updates.positioning = positioning;
    if (notes !== undefined) updates.notes = notes;

    const competitor = await prisma.competitorProfile.update({ where: { id: req.params.id }, data: updates });
    res.json(competitor);
  } catch (err) {
    next(err);
  }
});

// GET /admin/feature-requests
router.get('/admin/feature-requests', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const requests = await prisma.featureRequest.findMany({
      where,
      orderBy: { frequency: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/feature-requests/:id
router.patch('/admin/feature-requests/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const exists = await prisma.featureRequest.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    const { status, priority, revenueImpact } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (revenueImpact !== undefined) updates.revenueImpact = revenueImpact;

    const request = await prisma.featureRequest.update({ where: { id: req.params.id }, data: updates });
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// GET /admin/support/tickets
router.get('/admin/support/tickets', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/support/tickets/:id
router.patch('/admin/support/tickets/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const exists = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    const { status, resolution } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (resolution !== undefined) updates.resolution = resolution;

    const ticket = await prisma.supportTicket.update({ where: { id: req.params.id }, data: updates });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// GET /admin/success-plans
router.get('/admin/success-plans', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const plans = await prisma.dealerSuccessPlan.findMany({
      include: { dealer: { select: { id: true, businessName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

// GET /admin/success-plans/:dealerId
router.get('/admin/success-plans/:dealerId', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const plan = await prisma.dealerSuccessPlan.findUnique({
      where: { dealerId: req.params.dealerId },
      include: { dealer: { select: { id: true, businessName: true } } },
    });
    if (!plan) return res.status(404).json({ error: 'Not found' });
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

// PUT /admin/success-plans/:dealerId — upsert
router.put('/admin/success-plans/:dealerId', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { dealerId } = req.params;

    const dealerExists = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealerExists) return res.status(404).json({ error: 'Dealer not found' });

    const {
      inventoryImported, firstListingLive, firstLeadReceived, firstLeadResponded,
      firstSaleReported, subscriptionActive, crmAdoptionRate, renewalLikelihood,
      riskLevel, thirtyDayScore, notes,
    } = req.body;

    const data = {};
    if (inventoryImported !== undefined) data.inventoryImported = inventoryImported;
    if (firstListingLive !== undefined) data.firstListingLive = firstListingLive;
    if (firstLeadReceived !== undefined) data.firstLeadReceived = firstLeadReceived;
    if (firstLeadResponded !== undefined) data.firstLeadResponded = firstLeadResponded;
    if (firstSaleReported !== undefined) data.firstSaleReported = firstSaleReported;
    if (subscriptionActive !== undefined) data.subscriptionActive = subscriptionActive;
    if (crmAdoptionRate !== undefined) data.crmAdoptionRate = crmAdoptionRate;
    if (renewalLikelihood !== undefined) data.renewalLikelihood = renewalLikelihood;
    if (riskLevel !== undefined) data.riskLevel = riskLevel;
    if (thirtyDayScore !== undefined) data.thirtyDayScore = thirtyDayScore;
    if (notes !== undefined) data.notes = notes;

    const plan = await prisma.dealerSuccessPlan.upsert({
      where: { dealerId },
      create: { dealerId, ...data },
      update: data,
      include: { dealer: { select: { id: true, businessName: true } } },
    });

    res.json(plan);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
