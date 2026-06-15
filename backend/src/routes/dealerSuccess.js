const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');


function daysSince(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function renewalProbability(score) {
  if (score === null || score === undefined) return null;
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'critical';
}

async function enrichDealer(dealer) {
  const [listingCount, leadCount, crmUsage, supportTickets, latestChurn] = await Promise.all([
    prisma.vehicleListing.count({ where: { dealerId: dealer.id } }),
    prisma.lead.count({ where: { dealerId: dealer.id } }),
    prisma.lead.count({ where: { dealerId: dealer.id, activities: { some: {} } } }),
    prisma.supportTicket.count({ where: { dealerId: dealer.id, status: 'open' } }),
    prisma.churnRisk.findFirst({ where: { dealerId: dealer.id, status: 'open' }, orderBy: { createdAt: 'desc' } }),
  ]);

  const healthScore = dealer.successScore?.totalScore ?? null;

  return {
    dealer: { id: dealer.id, businessName: dealer.businessName, plan: dealer.subscription?.plan ?? null, isVerified: dealer.isVerified, createdAt: dealer.createdAt },
    mrr: 3599,
    daysSinceSignup: daysSince(dealer.createdAt),
    onboardingPercent: 0,
    listings: listingCount,
    leads: leadCount,
    crmUsage,
    avgResponseTime: null,
    healthScore,
    renewalProbability: renewalProbability(healthScore),
    supportTickets,
    riskFlags: latestChurn?.triggers ?? [],
    timeToValue: dealer.timeToValue ?? null,
    renewalReadiness: dealer.renewalReadiness ?? null,
  };
}

// GET /admin/dealer-success
router.get('/admin/dealer-success', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const dealers = await prisma.dealer.findMany({
      where: { user: { isSuspended: false } },
      include: { successScore: true, subscription: true, timeToValue: true, renewalReadiness: true },
    });
    const results = await Promise.all(dealers.map(enrichDealer));
    results.sort((a, b) => b.daysSinceSignup - a.daysSinceSignup);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/dealer-success/:dealerId
router.get('/admin/dealer-success/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.dealerId },
      include: { successScore: true, subscription: true, timeToValue: true, renewalReadiness: true },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
    res.json(await enrichDealer(dealer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/dealer-success/:dealerId/ttv
router.patch('/admin/dealer-success/:dealerId/ttv', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { dealerId } = req.params;
    const fields = ['agreementSignedAt', 'invoicePaidAt', 'firstLoginAt', 'firstListingAt', 'firstLeadAt', 'firstResponseAt', 'firstQualifiedLeadAt', 'firstSaleAt'];
    const data = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f] ? new Date(req.body[f]) : null;
    }

    const base = data.invoicePaidAt ?? data.agreementSignedAt ?? null;
    if (base) {
      if (data.firstLoginAt) data.daysToFirstLogin = Math.floor((new Date(data.firstLoginAt) - new Date(base)) / 86400000);
      if (data.firstListingAt) data.daysToFirstListing = Math.floor((new Date(data.firstListingAt) - new Date(base)) / 86400000);
      if (data.firstLeadAt) data.daysToFirstLead = Math.floor((new Date(data.firstLeadAt) - new Date(base)) / 86400000);
      if (data.firstResponseAt) data.daysToFirstResponse = Math.floor((new Date(data.firstResponseAt) - new Date(base)) / 86400000);
      if (data.firstSaleAt) data.daysToFirstSale = Math.floor((new Date(data.firstSaleAt) - new Date(base)) / 86400000);
    }

    const milestones = ['firstLoginAt', 'firstListingAt', 'firstLeadAt', 'firstResponseAt', 'firstSaleAt'];
    const existing = await prisma.timeToValue.findUnique({ where: { dealerId } });
    const merged = { ...existing, ...data };
    let bottleneck = null;
    for (const m of milestones) {
      if (!merged[m]) { bottleneck = m; break; }
    }
    data.bottleneck = bottleneck;

    const ttv = await prisma.timeToValue.upsert({ where: { dealerId }, update: data, create: { dealerId, ...data } });
    res.json(ttv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
