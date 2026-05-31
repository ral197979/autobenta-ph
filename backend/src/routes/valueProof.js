const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /admin/value-proof/:dealerId
router.get('/admin/value-proof/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { dealerId } = req.params;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      include: { successScore: true },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const listingIds = await prisma.vehicleListing.findMany({
      where: { dealerId },
      select: { id: true },
    });
    const ids = listingIds.map(l => l.id);

    const [leadsGenerated, totalLeads, listingsPublished, leadsUpdated, inspectionRequests] = await Promise.all([
      prisma.lead.count({ where: { listingId: { in: ids }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { dealerId } }),
      prisma.vehicleListing.count({ where: { dealerId, status: 'active' } }),
      prisma.lead.count({ where: { dealerId, status: { not: 'new' } } }),
      prisma.lead.count({ where: { dealerId, inquiry: { message: { contains: 'inspection', mode: 'insensitive' } } } }),
    ]);

    const proposal = await prisma.proposal.findFirst({
      where: { dealerProspect: { dealer: { id: dealerId } } },
      select: { avgGrossProfit: true },
    }).catch(() => null);

    const avgGross = proposal?.avgGrossProfit ?? 50000;
    const crmAdoptionRate = totalLeads > 0 ? Math.round((leadsUpdated / totalLeads) * 100) : 0;
    const avgLeadsPerListing = listingsPublished > 0 ? +(totalLeads / listingsPublished).toFixed(2) : 0;
    const estimatedRevenueImpact = leadsGenerated * 0.15 * avgGross;
    const timeSavedHours = +(leadsGenerated * 0.5).toFixed(1);

    res.json({
      leadsGenerated,
      totalLeads,
      listingsPublished,
      crmAdoptionRate,
      avgLeadsPerListing,
      estimatedRevenueImpact,
      inspectionRequests,
      timeSavedHours,
      responseImprovement: 'N/A',
      healthStatus: dealer.successScore?.healthStatus ?? 'unknown',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
