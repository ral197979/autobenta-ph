const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Valid EventType values (must match schema enum)
const VALID_EVENT_TYPES = new Set([
  'LISTING_VIEW', 'LISTING_SAVE', 'LISTING_SHARE', 'SELLER_CONTACT',
  'FINANCING_REQUEST', 'INSPECTION_REQUEST', 'TRANSFER_CHECKLIST_STARTED',
  'TRANSFER_CHECKLIST_COMPLETED', 'VEHICLE_HISTORY_VIEWED', 'SAFE_BUYING_VIEWED',
  'VERIFICATION_VIEWED', 'LEAD_CREATED', 'LEAD_CONVERTED', 'DEALER_PAGE_VIEW',
  'SEARCH_PERFORMED', 'FILTER_APPLIED', 'SALE_RECORDED',
]);

function calcListingScore(m) {
  return Math.min(100, Math.round(
    m.viewCount * 0.5 +
    m.saveCount * 3 +
    m.shareCount * 2 +
    m.inquiryCount * 10 +
    m.financingCount * 8 +
    m.inspectionCount * 8
  ));
}

// POST /api/analytics/events — idempotent event ingestion
router.post('/events', optionalAuth, async (req, res, next) => {
  try {
    const { eventType, sessionId, listingId, dealerId, source, device, referrer, meta, idempotencyKey } = req.body;

    if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
      return res.status(400).json({ error: 'Invalid or missing eventType' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const userId = req.user?.id || null;

    const eventData = {
      eventType,
      sessionId,
      listingId: listingId || null,
      dealerId: dealerId || null,
      userId,
      source: source || null,
      device: device || null,
      referrer: referrer || null,
      meta: meta || null,
    };

    if (idempotencyKey) {
      await prisma.marketplaceEvent.upsert({
        where: { idempotencyKey },
        update: {},
        create: { ...eventData, idempotencyKey },
      });
    } else {
      await prisma.marketplaceEvent.create({ data: eventData });
    }

    // Increment counters on ListingMetrics
    if (listingId) {
      let increment = null;
      if (eventType === 'LISTING_VIEW') increment = { viewCount: { increment: 1 } };
      else if (eventType === 'LISTING_SAVE') increment = { saveCount: { increment: 1 } };
      else if (eventType === 'LISTING_SHARE') increment = { shareCount: { increment: 1 } };
      else if (eventType === 'SELLER_CONTACT' || eventType === 'LEAD_CREATED') increment = { inquiryCount: { increment: 1 } };
      else if (eventType === 'FINANCING_REQUEST') increment = { financingCount: { increment: 1 } };
      else if (eventType === 'INSPECTION_REQUEST') increment = { inspectionCount: { increment: 1 } };

      if (increment) {
        const updated = await prisma.listingMetrics.upsert({
          where: { listingId },
          update: { ...increment, lastCalculatedAt: new Date() },
          create: {
            listingId,
            viewCount: increment.viewCount ? 1 : 0,
            saveCount: increment.saveCount ? 1 : 0,
            shareCount: increment.shareCount ? 1 : 0,
            inquiryCount: increment.inquiryCount ? 1 : 0,
            financingCount: increment.financingCount ? 1 : 0,
            inspectionCount: increment.inspectionCount ? 1 : 0,
          },
        });
        const score = calcListingScore(updated);
        await prisma.listingMetrics.update({
          where: { listingId },
          data: { performanceScore: score },
        });
      }
    }

    // Increment DealerMetrics for DEALER_PAGE_VIEW
    if (eventType === 'DEALER_PAGE_VIEW' && dealerId) {
      await prisma.dealerMetrics.upsert({
        where: { dealerId },
        update: { totalViews: { increment: 1 } },
        create: { dealerId, totalViews: 1 },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/marketplace — admin only
router.get('/marketplace', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const now = new Date();
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    const [
      totalListings,
      activeListings,
      verifiedListings,
      transferReadyListings,
      totalDealers,
      verifiedDealers,
      totalLeads,
      last30dLeads,
      totalInspections,
      last30dInspections,
      totalFinancing,
      last30dFinancing,
      events24h,
      events7d,
      events30d,
      topEventTypes,
    ] = await Promise.all([
      prisma.vehicleListing.count(),
      prisma.vehicleListing.count({ where: { status: 'active' } }),
      prisma.vehicleListing.count({ where: { sellerVerified: true } }),
      prisma.vehicleListing.count({ where: { transferReady: true } }),
      prisma.dealer.count(),
      prisma.dealer.count({ where: { isVerified: true } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: last30d } } }),
      prisma.inspectionRequest.count(),
      prisma.inspectionRequest.count({ where: { createdAt: { gte: last30d } } }),
      prisma.financingRequest.count(),
      prisma.financingRequest.count({ where: { createdAt: { gte: last30d } } }),
      prisma.marketplaceEvent.count({ where: { createdAt: { gte: last24h } } }),
      prisma.marketplaceEvent.count({ where: { createdAt: { gte: last7d } } }),
      prisma.marketplaceEvent.count({ where: { createdAt: { gte: last30d } } }),
      prisma.marketplaceEvent.groupBy({
        by: ['eventType'],
        where: { createdAt: { gte: last30d } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      listings: { total: totalListings, active: activeListings, verified: verifiedListings, transferReady: transferReadyListings },
      dealers: { total: totalDealers, verified: verifiedDealers },
      leads: { total: totalLeads, last30Days: last30dLeads },
      inspections: { total: totalInspections, last30Days: last30dInspections },
      financing: { total: totalFinancing, last30Days: last30dFinancing },
      events: { last24h: events24h, last7d: events7d, last30d: events30d },
      topEventTypes: topEventTypes.map(e => ({ eventType: e.eventType, count: e._count.id })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/funnel — admin only
router.get('/funnel', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [visitors, searches, listingViews, inquiries, inspections, financing, transfers, sales] = await Promise.all([
      prisma.marketplaceEvent.groupBy({ by: ['sessionId'], where: { createdAt: { gte: since } } }).then(r => r.length),
      prisma.marketplaceEvent.count({ where: { eventType: 'SEARCH_PERFORMED', createdAt: { gte: since } } }),
      prisma.marketplaceEvent.count({ where: { eventType: 'LISTING_VIEW', createdAt: { gte: since } } }),
      prisma.marketplaceEvent.count({ where: { eventType: { in: ['SELLER_CONTACT', 'LEAD_CREATED'] }, createdAt: { gte: since } } }),
      prisma.marketplaceEvent.count({ where: { eventType: 'INSPECTION_REQUEST', createdAt: { gte: since } } }),
      prisma.marketplaceEvent.count({ where: { eventType: 'FINANCING_REQUEST', createdAt: { gte: since } } }),
      prisma.marketplaceEvent.count({ where: { eventType: { in: ['TRANSFER_CHECKLIST_STARTED', 'TRANSFER_CHECKLIST_COMPLETED'] }, createdAt: { gte: since } } }),
      prisma.marketplaceEvent.count({ where: { eventType: 'SALE_RECORDED', createdAt: { gte: since } } }),
    ]);

    const stages = [
      { stage: 'Visitors', count: visitors },
      { stage: 'Searches', count: searches },
      { stage: 'Listing Views', count: listingViews },
      { stage: 'Inquiries', count: inquiries },
      { stage: 'Inspections', count: inspections },
      { stage: 'Financing', count: financing },
      { stage: 'Transfers', count: transfers },
      { stage: 'Sales', count: sales },
    ];

    const dropOff = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const from = stages[i];
      const to = stages[i + 1];
      const rate = from.count > 0 ? Math.round((1 - to.count / from.count) * 100) : 0;
      dropOff.push({ from: from.stage, to: to.stage, rate });
    }

    res.json({ period: '30d', stages, dropOff });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/trust-impact — admin only
router.get('/trust-impact', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const trustFields = [
      { key: 'sellerVerified', field: 'sellerVerified' },
      { key: 'ownershipVerified', field: 'ownershipVerified' },
      { key: 'transferReady', field: 'transferReady' },
      { key: 'financingEligible', field: 'financingEligible' },
      { key: 'vehicleHistory', field: 'vehicleHistoryAvailable' },
    ];

    const results = {};

    await Promise.all(trustFields.map(async ({ key, field }) => {
      const [withBadge, withoutBadge] = await Promise.all([
        prisma.vehicleListing.findMany({
          where: { [field]: true },
          select: { id: true },
        }),
        prisma.vehicleListing.findMany({
          where: { [field]: false },
          select: { id: true },
        }),
      ]);

      const withIds = withBadge.map(l => l.id);
      const withoutIds = withoutBadge.map(l => l.id);

      const [withMetrics, withoutMetrics] = await Promise.all([
        withIds.length > 0
          ? prisma.listingMetrics.aggregate({ where: { listingId: { in: withIds } }, _avg: { inquiryCount: true } })
          : { _avg: { inquiryCount: 0 } },
        withoutIds.length > 0
          ? prisma.listingMetrics.aggregate({ where: { listingId: { in: withoutIds } }, _avg: { inquiryCount: true } })
          : { _avg: { inquiryCount: 0 } },
      ]);

      const avgWith = withMetrics._avg.inquiryCount || 0;
      const avgWithout = withoutMetrics._avg.inquiryCount || 0;
      const uplift = avgWithout > 0 ? Math.round(((avgWith - avgWithout) / avgWithout) * 100) : 0;

      results[key] = {
        withBadge: { avgInquiries: Math.round((avgWith || 0) * 100) / 100, count: withIds.length },
        withoutBadge: { avgInquiries: Math.round((avgWithout || 0) * 100) / 100, count: withoutIds.length },
        uplift,
      };
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/search-trends — admin only
router.get('/search-trends', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.marketplaceEvent.findMany({
      where: { eventType: 'SEARCH_PERFORMED', createdAt: { gte: since } },
      select: { meta: true },
    });

    const queryCounts = {};
    const makeCounts = {};
    const modelCounts = {};
    let zeroResultCount = 0;

    for (const e of events) {
      const m = e.meta;
      if (!m || typeof m !== 'object') continue;
      if (m.query) {
        const q = String(m.query).toLowerCase().trim();
        queryCounts[q] = (queryCounts[q] || 0) + 1;
      }
      if (m.make) {
        const mk = String(m.make).toLowerCase().trim();
        makeCounts[mk] = (makeCounts[mk] || 0) + 1;
      }
      if (m.model) {
        const mod = String(m.model).toLowerCase().trim();
        modelCounts[mod] = (modelCounts[mod] || 0) + 1;
      }
      if (m.zeroResults === true) zeroResultCount++;
    }

    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    const topMakes = Object.entries(makeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([make, count]) => ({ make, count }));

    const topModels = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([model, count]) => ({ model, count }));

    res.json({ topQueries, topMakes, topModels, zeroResultCount });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/listing/:id/performance — authenticated, owner or admin
router.get('/listing/:id/performance', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: req.params.id },
      select: { id: true, sellerId: true, dealerId: true },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const isOwner = listing.sellerId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Also allow the dealer who owns the listing
    let isDealerOwner = false;
    if (!isOwner && !isAdmin && listing.dealerId) {
      const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
      isDealerOwner = dealer?.id === listing.dealerId;
    }

    if (!isOwner && !isAdmin && !isDealerOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const metrics = await prisma.listingMetrics.findUnique({ where: { listingId: req.params.id } });

    if (!metrics) {
      return res.json({
        listingId: req.params.id,
        metrics: null,
        scoreBreakdown: { viewCount: 0, saveCount: 0, shareCount: 0, inquiryCount: 0, financingCount: 0, inspectionCount: 0 },
        performanceScore: 0,
      });
    }

    res.json({
      listingId: req.params.id,
      metrics,
      scoreBreakdown: {
        viewCount: metrics.viewCount,
        saveCount: metrics.saveCount,
        shareCount: metrics.shareCount,
        inquiryCount: metrics.inquiryCount,
        financingCount: metrics.financingCount,
        inspectionCount: metrics.inspectionCount,
      },
      performanceScore: metrics.performanceScore,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/exports/dealer/:dealerId — admin or that dealer
router.get('/exports/dealer/:dealerId', authenticate, async (req, res, next) => {
  try {
    const { dealerId } = req.params;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
      if (!dealer || dealer.id !== dealerId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const leads = await prisma.lead.findMany({
      where: { dealerId },
      select: {
        buyerName: true,
        status: true,
        createdAt: true,
        listing: { select: { make: true, model: true, year: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = [
      ['buyerName', 'status', 'listingTitle', 'createdAt'],
      ...leads.map(l => [
        l.buyerName,
        l.status,
        l.listing ? `${l.listing.year} ${l.listing.make} ${l.listing.model}` : '',
        l.createdAt.toISOString(),
      ]),
    ];

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dealer_${dealerId}_leads.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/revenue — admin revenue dashboard metrics
router.get('/revenue', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalDealers,
      activeSubs,
      planBreakdown,
      paidInvoicesThisMonth,
      paidInvoicesLastMonth,
      featuredListings,
      creditTransactions,
    ] = await Promise.all([
      prisma.dealer.count(),
      prisma.dealerSubscription.count({ where: { status: 'active', plan: { not: 'free' } } }),
      prisma.dealerSubscription.groupBy({ by: ['plan'], _count: { id: true } }),
      prisma.invoice.aggregate({ where: { status: 'paid', paidAt: { gte: monthStart } }, _sum: { amount: true }, _count: { id: true } }),
      prisma.invoice.aggregate({ where: { status: 'paid', paidAt: { gte: lastMonthStart, lt: monthStart } }, _sum: { amount: true } }),
      prisma.featuredListing.aggregate({ where: { status: 'active' }, _count: { id: true }, _sum: { pricePhp: true } }),
      prisma.creditTransaction.aggregate({ where: { type: 'purchase', createdAt: { gte: monthStart } }, _sum: { credits: true }, _count: { id: true } }),
    ]);

    const mrr = Number(paidInvoicesThisMonth._sum.amount || 0);
    const lastMrr = Number(paidInvoicesLastMonth._sum.amount || 0);
    const arpu = activeSubs > 0 ? mrr / activeSubs : 0;
    const mrrGrowth = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0;

    res.json({
      mrr,
      lastMrr,
      mrrGrowth: Math.round(mrrGrowth * 10) / 10,
      arpu: Math.round(arpu),
      totalDealers,
      activePaidDealers: activeSubs,
      planBreakdown: planBreakdown.reduce((acc, p) => { acc[p.plan] = p._count.id; return acc; }, {}),
      featuredRevenue: Number(featuredListings._sum.pricePhp || 0),
      activeFeatured: featuredListings._count.id,
      creditRevenue: creditTransactions._count.id,
      invoicesThisMonth: paidInvoicesThisMonth._count.id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
