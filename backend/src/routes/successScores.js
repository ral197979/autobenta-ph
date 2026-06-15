const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');


async function computeScore(dealerId) {
  const now = new Date();
  const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    include: {
      leads: true,
      listings: { include: { photos: true } },
    },
  });
  if (!dealer) throw new Error('Dealer not found');

  // loginFrequency proxy
  const loginFrequency = dealer.updatedAt > day7 ? 10 : 0;

  // listingsAdded last 30 days
  const recentListings = dealer.listings.filter(l => l.createdAt > day30).length;
  const listingsAdded = recentListings >= 10 ? 25 : recentListings >= 5 ? 20 : recentListings >= 1 ? 10 : 0;

  // leadResponseRate
  const totalLeads = dealer.leads.length;
  const respondedLeads = dealer.leads.filter(l => l.status !== 'new').length;
  const responseRate = totalLeads > 0 ? respondedLeads / totalLeads : 0;
  const leadResponseRate = responseRate >= 0.8 ? 25 : responseRate >= 0.5 ? 15 : responseRate > 0 ? 10 : 0;

  // crmUsageScore — leads with activities / total * 100
  const leadsWithActivities = await prisma.lead.count({ where: { dealerId, activities: { some: {} } } });
  const crmUsageScore = totalLeads > 0 ? Math.min(Math.round((leadsWithActivities / totalLeads) * 100), 100) : 0;

  // inventoryQuality — listings with photos / total * 100
  const totalListings = dealer.listings.length;
  const listingsWithPhotos = dealer.listings.filter(l => l.photos.length > 0).length;
  const inventoryQuality = totalListings > 0 ? Math.min(Math.round((listingsWithPhotos / totalListings) * 100), 100) : 80;

  // supportRequests penalty
  const openTickets = await prisma.supportTicket.count({ where: { dealerId, status: { in: ['open', 'in_progress'] } } });
  const supportPenalty = openTickets === 0 ? 0 : openTickets === 1 ? 5 : 10;
  const supportRequests = openTickets;

  const raw = loginFrequency + listingsAdded + leadResponseRate + Math.round(crmUsageScore / 4) + Math.round(inventoryQuality / 4) - supportPenalty;
  const totalScore = Math.max(0, Math.min(100, raw));
  const healthStatus = totalScore >= 75 ? 'healthy' : totalScore >= 50 ? 'watch' : totalScore >= 25 ? 'at_risk' : 'critical';

  return { loginFrequency, listingsAdded, leadResponseRate, crmUsageScore, inventoryQuality, supportRequests, totalScore, healthStatus, calculatedAt: now };
}

// POST /admin/success-scores/:dealerId/calculate
router.post('/admin/success-scores/:dealerId/calculate', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const scores = await computeScore(req.params.dealerId);
    const result = await prisma.dealerSuccessScore.upsert({
      where: { dealerId: req.params.dealerId },
      update: scores,
      create: { dealerId: req.params.dealerId, ...scores },
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/success-scores
router.get('/admin/success-scores', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const scores = await prisma.dealerSuccessScore.findMany({
      include: { dealer: { select: { id: true, businessName: true } } },
      orderBy: { totalScore: 'asc' },
    });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/success-scores/:dealerId
router.get('/admin/success-scores/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const score = await prisma.dealerSuccessScore.findUnique({
      where: { dealerId: req.params.dealerId },
      include: { dealer: { select: { id: true, businessName: true } } },
    });
    if (!score) return res.status(404).json({ error: 'Score not found' });
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
