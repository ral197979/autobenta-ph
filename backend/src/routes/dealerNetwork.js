/**
 * Dealer Network API — v1
 * Internal API layer for DMS integrations (V8Atlas, future partners).
 * Versioned at /api/dealer-network/v1/
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { distributeLeadToProviders } = require('../services/dealerNetwork/LeadProvider');
const { broadcastTrustUpdate } = require('../services/dealerNetwork/TrustProvider');
const { computeReadinessScore } = require('../services/verification/readinessEngine');
const { auditLog } = require('../services/audit/auditLogger');

const router = express.Router();
const prisma = new PrismaClient();

// All dealer-network routes require authentication + dealer/admin
router.use(authenticate, requireRole('dealer', 'admin'));

// ─── POST /inventory ──────────────────────────────────────────────────────────
// Upsert a vehicle listing from an external DMS (inventory sync inbound)

router.post('/inventory', async (req, res, next) => {
  try {
    const {
      externalVehicleId, make, model, year, price, mileage, status,
      photos, location, city, region, fuelType, transmission, color,
      bodyType, description, condition, ownershipVerified, hasOrCr,
    } = req.body;

    // Find dealer for this user
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    // Check subscription listing limit
    const { canAddListing } = require('../services/dealerNetwork/subscriptionEntitlements');
    const sub = await prisma.dealerSubscription.findUnique({ where: { dealerId: dealer.id } });
    const currentCount = await prisma.vehicleListing.count({
      where: { dealerId: dealer.id, status: { notIn: ['archived', 'rejected'] } },
    });
    if (!canAddListing(sub?.plan || 'free', currentCount)) {
      return res.status(403).json({ error: 'Listing limit reached for your plan', upgradeUrl: '/dealer/subscription' });
    }

    // Upsert — find by externalVehicleId stored in aiDraftData
    const existing = await prisma.vehicleListing.findFirst({
      where: { dealerId: dealer.id, aiDraftData: { path: ['externalVehicleId'], equals: externalVehicleId } },
    });

    const listingData = {
      make, model, year: parseInt(year), price: parseFloat(price), mileage: parseInt(mileage),
      status: status || 'active', location: location || city, city, region: region || 'NCR',
      fuelType: fuelType || 'gasoline', transmission: transmission || 'automatic',
      color, bodyType, description, condition: condition || 'good',
      hasOrCr: !!hasOrCr, ownershipVerified: !!ownershipVerified,
      aiDraftData: { externalVehicleId, syncedAt: new Date().toISOString(), source: 'dealer_network_api' },
    };

    let listing;
    if (existing) {
      listing = await prisma.vehicleListing.update({ where: { id: existing.id }, data: listingData });
    } else {
      listing = await prisma.vehicleListing.create({
        data: { ...listingData, sellerId: req.user.id, dealerId: dealer.id, sellerType: 'dealer' },
      });
    }

    // Sync photos if provided
    if (photos?.length > 0) {
      await prisma.vehiclePhoto.deleteMany({ where: { listingId: listing.id } });
      await prisma.vehiclePhoto.createMany({
        data: photos.map((url, i) => ({ listingId: listing.id, url, isPrimary: i === 0, sortOrder: i })),
      });
    }

    await auditLog({ userId: req.user.id, action: 'dealer_network_inventory_sync', entityType: 'listing', entityId: listing.id, details: { externalVehicleId, source: 'dealer_network_api' } });

    res.json({ id: listing.id, created: !existing, externalVehicleId });
  } catch (err) {
    next(err);
  }
});

// ─── POST /leads ──────────────────────────────────────────────────────────────
// Inbound lead from external DMS or push outbound lead to DMS

router.post('/leads', async (req, res, next) => {
  try {
    const { listingId, buyerName, buyerEmail, buyerPhone, message, source = 'api', direction = 'inbound' } = req.body;

    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    if (direction === 'outbound') {
      // Push existing lead to registered providers
      const lead = await prisma.lead.findFirst({ where: { id: req.body.leadId, dealerId: dealer.id }, include: { listing: true } });
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const sub = await prisma.dealerSubscription.findUnique({ where: { dealerId: dealer.id } });
      if (sub?.plan === 'enterprise') {
        const results = await distributeLeadToProviders(
          { ...lead, message: lead.inquiry?.message },
          ['v8atlas']
        );
        return res.json({ synced: results });
      }
      return res.status(403).json({ error: 'Lead sync requires Enterprise plan' });
    }

    // Inbound: create lead from external source
    const listing = await prisma.vehicleListing.findFirst({ where: { id: listingId, dealerId: dealer.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found or not owned by this dealer' });

    const lead = await prisma.lead.create({
      data: {
        dealerId: dealer.id,
        listingId,
        buyerName,
        buyerEmail,
        buyerPhone,
        source,
        status: 'new',
      },
    });

    // Update dealer lifecycle
    if (!dealer.firstLeadAt) {
      await prisma.dealer.update({ where: { id: dealer.id }, data: { firstLeadAt: new Date() } });
    }

    await auditLog({ userId: req.user.id, action: 'dealer_network_lead_created', entityType: 'lead', entityId: lead.id, details: { source, listingId } });

    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

// ─── POST /dealers ────────────────────────────────────────────────────────────
// Register or update dealer profile via network API (admin only)

router.post('/dealers', requireRole('admin'), async (req, res, next) => {
  try {
    const { userId, businessName, address, city, tier, subscriptionPlan } = req.body;

    const dealer = await prisma.dealer.upsert({
      where: { userId },
      create: { userId, businessName, address, city, tier: tier || 'basic' },
      update: { businessName, address, city, tier: tier || undefined },
    });

    if (subscriptionPlan) {
      const { PLAN_FEATURES } = require('../services/dealerNetwork/subscriptionEntitlements');
      await prisma.dealerSubscription.upsert({
        where: { dealerId: dealer.id },
        create: { dealerId: dealer.id, plan: subscriptionPlan, features: PLAN_FEATURES[subscriptionPlan] },
        update: { plan: subscriptionPlan, features: PLAN_FEATURES[subscriptionPlan] },
      });
    }

    res.json(dealer);
  } catch (err) {
    next(err);
  }
});

// ─── GET /trust ───────────────────────────────────────────────────────────────
// Get trust state for a dealer's listing (used by integrated DMS)

router.get('/trust', async (req, res, next) => {
  try {
    const { listingId, dealerId: queryDealerId } = req.query;

    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    const targetDealerId = req.user.role === 'admin' ? queryDealerId : dealer?.id;
    if (!targetDealerId) return res.status(404).json({ error: 'Dealer not found' });

    const listings = await prisma.vehicleListing.findMany({
      where: {
        dealerId: targetDealerId,
        ...(listingId && { id: listingId }),
      },
      select: {
        id: true, make: true, model: true, year: true,
        ownershipVerified: true, transferReady: true, sellerVerified: true,
        vehicleHistoryAvailable: true, financingEligible: true,
        readinessScore: true, readinessReason: true, readinessEvaluatedAt: true,
      },
    });

    res.json({ dealerId: targetDealerId, listings });
  } catch (err) {
    next(err);
  }
});

// ─── GET /analytics ───────────────────────────────────────────────────────────
// Aggregate analytics for dealer (plan-gated)

router.get('/analytics', async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: { userId: req.user.id },
      include: { subscription: true },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { hasFeature } = require('../services/dealerNetwork/subscriptionEntitlements');
    if (!hasFeature(dealer.subscription?.plan || 'free', 'analytics') && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Analytics requires Pro plan', upgradeUrl: '/dealer/subscription' });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [listingStats, leadStats, recentLeads] = await Promise.all([
      prisma.vehicleListing.groupBy({
        by: ['status'],
        where: { dealerId: dealer.id },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { dealerId: dealer.id },
        _count: true,
      }),
      prisma.lead.count({ where: { dealerId: dealer.id, createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    const totalLeads = leadStats.reduce((s, r) => s + r._count, 0);
    const wonLeads = leadStats.find(r => r.status === 'closed_won')?._count || 0;

    res.json({
      dealerId: dealer.id,
      plan: dealer.subscription?.plan || 'free',
      listings: listingStats.reduce((acc, r) => { acc[r.status] = r._count; return acc; }, {}),
      leads: {
        total: totalLeads,
        byStatus: leadStats.reduce((acc, r) => { acc[r.status] = r._count; return acc; }, {}),
        new30Days: recentLeads,
        winRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
