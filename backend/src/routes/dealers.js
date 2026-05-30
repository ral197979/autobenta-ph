const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const dealers = await prisma.dealer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dealers);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        listings: {
          where: { status: 'active' },
          include: { photos: { where: { isPrimary: true }, take: 1 } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { listings: true, leads: true } },
      },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
    res.json(dealer);
  } catch (err) {
    next(err);
  }
});

router.post('/register', authenticate, [
  body('businessName').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const existing = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (existing) return res.status(409).json({ error: 'Dealer profile already exists' });

    const { businessName, description, address, city, logoUrl, website, licenseNumber } = req.body;
    const dealer = await prisma.dealer.create({
      data: { userId: req.user.id, businessName, description, address, city, logoUrl, website, licenseNumber },
    });

    await prisma.user.update({ where: { id: req.user.id }, data: { role: 'dealer' } });

    res.status(201).json(dealer);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    const { businessName, description, address, city, website } = req.body;
    const updated = await prisma.dealer.update({
      where: { id: dealer.id },
      data: { businessName, description, address, city, website },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/me/leads', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { status } = req.query;
    const where = { dealerId: dealer.id };
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        listing: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
        inquiry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leads);
  } catch (err) {
    next(err);
  }
});

router.patch('/me/leads/:leadId', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.leadId, dealerId: dealer?.id },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { status, notes } = req.body;

    // Track first sale lifecycle
    if (status === 'closed_won' && dealer && !dealer.firstSaleAt) {
      await prisma.dealer.update({ where: { id: dealer.id }, data: { firstSaleAt: new Date() } });
    }

    const updated = await prisma.lead.update({
      where: { id: req.params.leadId },
      data: { ...(status && { status }), ...(notes !== undefined && { notes }) },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── GET /me/profile ──────────────────────────────────────────────────────────

router.get('/me/profile', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: { userId: req.user.id },
      include: {
        subscription: true,
        branches: { where: { isActive: true }, orderBy: { isMain: 'desc' } },
        members: { where: { isActive: true }, include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        _count: { select: { listings: true, leads: true } },
      },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });
    res.json(dealer);
  } catch (err) {
    next(err);
  }
});

// ─── GET /me/subscription ─────────────────────────────────────────────────────

router.get('/me/subscription', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const sub = await prisma.dealerSubscription.findUnique({ where: { dealerId: dealer.id } });
    const { PLAN_FEATURES } = require('../services/dealerNetwork/subscriptionEntitlements');
    const plan = sub?.plan || 'free';

    res.json({
      plan,
      status: sub?.status || 'active',
      features: PLAN_FEATURES[plan],
      startedAt: sub?.startedAt,
      expiresAt: sub?.expiresAt,
      trialEndsAt: sub?.trialEndsAt,
      allPlans: Object.entries(PLAN_FEATURES).map(([p, f]) => ({ plan: p, features: f })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /me/branches ────────────────────────────────────────────────────────

router.post('/me/branches', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: { userId: req.user.id },
      include: { subscription: true },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { hasFeature } = require('../services/dealerNetwork/subscriptionEntitlements');
    if (!hasFeature(dealer.subscription?.plan || 'free', 'multiBranch')) {
      return res.status(403).json({ error: 'Multi-branch requires Enterprise plan', upgradeUrl: '/dealer/subscription' });
    }

    const { name, address, city, region, phone, isMain } = req.body;
    const branch = await prisma.dealerBranch.create({
      data: { dealerId: dealer.id, name, address, city, region: region || 'NCR', phone, isMain: !!isMain },
    });
    res.status(201).json(branch);
  } catch (err) {
    next(err);
  }
});

// ─── GET /me/branches ─────────────────────────────────────────────────────────

router.get('/me/branches', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
    const branches = await prisma.dealerBranch.findMany({ where: { dealerId: dealer.id }, orderBy: { isMain: 'desc' } });
    res.json(branches);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
