const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { city, verified, q } = req.query;
    const where = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (verified === 'true') where.isVerified = true;
    if (q) where.businessName = { contains: q, mode: 'insensitive' };

    const dealers = await prisma.dealer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { listings: true } },
      },
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
    });

    // Attach rating aggregates (reviews are keyed by the dealer's owner userId).
    const userIds = dealers.map((d) => d.userId);
    const grouped = userIds.length
      ? await prisma.review.groupBy({ by: ['sellerId'], where: { sellerId: { in: userIds } }, _avg: { rating: true }, _count: { rating: true } })
      : [];
    const ratingByUser = Object.fromEntries(grouped.map((g) => [g.sellerId, { avg: Math.round((g._avg.rating || 0) * 10) / 10, count: g._count.rating }]));
    const withRatings = dealers.map((d) => ({ ...d, rating: ratingByUser[d.userId] || { avg: 0, count: 0 } }));

    res.json(withRatings);
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

    const { status, notes, assignedUserId, nextFollowUpAt, leadScore, lostReason } = req.body;

    // Track first sale lifecycle
    if (status === 'closed_won' && dealer && !dealer.firstSaleAt) {
      await prisma.dealer.update({ where: { id: dealer.id }, data: { firstSaleAt: new Date() } });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;
    if (nextFollowUpAt !== undefined) updateData.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    if (leadScore !== undefined) updateData.leadScore = leadScore;
    if (lostReason !== undefined) updateData.lostReason = lostReason;

    const updated = await prisma.lead.update({
      where: { id: req.params.leadId },
      data: updateData,
    });

    // Log status change activity
    if (status && status !== lead.status) {
      await prisma.dealerActivity.create({
        data: {
          dealerId: dealer.id,
          leadId: lead.id,
          actorId: req.user.id,
          type: 'lead_updated',
          description: `Status changed to ${status}`,
        },
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── POST /me/leads/:leadId/activities ───────────────────────────────────────

const ALLOWED_ACTIVITY_TYPES = new Set([
  'call_made', 'sms_sent', 'email_sent', 'meeting_held',
  'test_drive_completed', 'note_added', 'manual_note',
]);

router.post('/me/leads/:leadId/activities', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const lead = await prisma.lead.findFirst({ where: { id: req.params.leadId, dealerId: dealer.id } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { type, description, metadata } = req.body;
    if (!type || !ALLOWED_ACTIVITY_TYPES.has(type)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }
    if (!description) return res.status(400).json({ error: 'description is required' });

    const activity = await prisma.dealerActivity.create({
      data: {
        dealerId: dealer.id,
        leadId: lead.id,
        actorId: req.user.id,
        type,
        description,
        metadata: metadata || null,
      },
    });
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
});

// ─── GET /me/leads/:leadId/activities ─────────────────────────────────────────

router.get('/me/leads/:leadId/activities', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const lead = await prisma.lead.findFirst({ where: { id: req.params.leadId, dealerId: dealer.id } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const activities = await prisma.dealerActivity.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

// ─── GET /me/customers ────────────────────────────────────────────────────────

router.get('/me/customers', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const leads = await prisma.lead.findMany({
      where: { dealerId: dealer.id },
      include: { listing: { select: { year: true, make: true, model: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Group by buyerEmail (preferred) or buyerPhone
    const customerMap = new Map();
    for (const lead of leads) {
      const key = lead.buyerEmail || lead.buyerPhone || `unknown-${lead.id}`;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          buyerName: lead.buyerName,
          buyerEmail: lead.buyerEmail,
          buyerPhone: lead.buyerPhone,
          leadCount: 0,
          wonLeads: 0,
          lastContactAt: lead.createdAt,
          vehicles: [],
        });
      }
      const customer = customerMap.get(key);
      customer.leadCount++;
      if (lead.status === 'closed_won') customer.wonLeads++;
      if (lead.createdAt > customer.lastContactAt) customer.lastContactAt = lead.createdAt;
      if (lead.listing) {
        customer.vehicles.push({ year: lead.listing.year, make: lead.listing.make, model: lead.listing.model });
      }
    }

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.lastContactAt - a.lastContactAt)
      .slice(0, 100);

    res.json(customers);
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
    const { getTrialStatus } = require('../services/trial');
    res.json({ ...dealer, trial: getTrialStatus(dealer.subscription) });
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
